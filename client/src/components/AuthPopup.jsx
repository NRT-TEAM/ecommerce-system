import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const AuthPopup = ({ open, onClose, mode = "login" }) => {
  const [view, setView] = useState(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // login
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginShow, setLoginShow] = useState(false);

  // register
  const [regUser, setRegUser] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regShow, setRegShow] = useState(false);
  const [regConfirmShow, setRegConfirmShow] = useState(false);
  const [errors, setErrors] = useState({});

  // forgot
  const [emailReset, setEmailReset] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetType, setResetType] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const { setToken } = useContext(ShopContext);

  useEffect(() => setView(mode), [mode]);

  const passwordIssues = (p) => {
    const issues = [];
    if ((p || "").length < 6) issues.push("At least 6 characters");
    if (!/[A-Z]/.test(p || "")) issues.push("At least one uppercase letter");
    if (!/[a-z]/.test(p || "")) issues.push("At least one lowercase letter");
    if (!/\d/.test(p || "")) issues.push("At least one number");
    if (!/[^A-Za-z0-9]/.test(p || "")) issues.push("At least one special character");
    return issues;
  };

  const handleLogin = async () => {
    setError("");
    setErrors({});
    const e = {};
    if (!loginUser) e.username = "Username is required";
    if (!loginPass) e.password = "Password is required";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const issues = passwordIssues(loginPass);
    if (issues.length) {
      setError(`Password requirements: ${issues.join(", ")}`);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5005/api/account/login",
        { username: loginUser, password: loginPass },
        { withCredentials: true }
      );
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        try {
          window.dispatchEvent(
            new CustomEvent("toast", {
              detail: { type: "success", title: "Login", message: "Signed in" },
            })
          );
        } catch {}
        setLoginUser("");
        setLoginPass("");
        setLoginShow(false);
        onClose();
      } else setError("Login failed");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    setErrors({});
    const e = {};
    if (!regUser) e.username = "Username is required";
    if (!regEmail) e.email = "Email is required";
    if (!regPass) e.password = "Password is required";
    if (!regConfirm) e.confirm = "Confirm your password";
    if (regPass !== regConfirm) return setError("Passwords do not match");
    const emailOk = /.+@.+\..+/.test(regEmail || "");
    if (!emailOk) return setError("Please enter a valid email address");
    const issues = passwordIssues(regPass);
    if (issues.length) return setError(`Password requirements: ${issues.join(", ")}`);

    setLoading(true);
    try {
      const regRes = await axios.post(
        "http://localhost:5005/api/account/register",
        { username: regUser, email: regEmail, password: regPass },
        { withCredentials: true }
      );
      try {
        const loginRes = await axios.post(
          "http://localhost:5005/api/account/login",
          { username: regUser, password: regPass },
          { withCredentials: true }
        );
        if (loginRes?.data?.token) {
          localStorage.setItem("token", loginRes.data.token);
          setToken(loginRes.data.token);
          setRegUser("");
          setRegEmail("");
          setRegPass("");
          setRegConfirm("");
          setRegShow(false);
          onClose();
        } else setView("login");
      } catch {
        setView("login");
      }
    } catch (e) {
      const msg = e?.response?.data?.title || "Registration failed";
      setError(msg);
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              title: "Register",
              message: msg,
            },
          })
        );
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setResetMsg("");
    setResetType("");
    const email = (emailReset || "").trim();
    if (!email) {
      setResetType("error");
      setResetMsg("Email is required");
      return;
    }
    const valid = /.+@.+\..+/.test(email);
    if (!valid) {
      setResetType("error");
      setResetMsg("Please enter a valid email address");
      return;
    }
    setResetLoading(true);
    try {
      await axios.post("http://localhost:5005/api/account/forgotPassword", {
        email,
      });
      setResetType("success");
      setResetMsg("If the email exists, a reset token was sent.");
    } catch {
      setResetType("error");
      setResetMsg("Could not send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      testId="auth-dialog"
    >
      <DialogContent
        onClose={onClose}
        className="p-6 rounded-xl max-w-md bg-white text-black"
        testId="auth-modal"
      >
        {/* ================= LOGIN ================= */}
        {view === "login" && (
          <>
            <h2
              className="text-2xl font-bold text-center mb-4"
              data-testid="auth-login-title"
            >
              Sign In
            </h2>

            <Input
              placeholder="Username"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              className="mb-2"
              testId="auth-login-username"
            />

            <div className="relative mb-2">
              <Input
                placeholder="Password"
                type={loginShow ? "text" : "password"}
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="pr-12"
                testId="auth-login-password"
              />
              <button
                type="button"
                aria-label={loginShow ? "Hide password" : "Show password"}
                onClick={() => setLoginShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center gap-1 justify-center transition"
                data-testid="password-toggle"
              >
                {loginShow ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path d="M3 3l18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.58 10.58a3 3 0 104.24 4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.46 12.12C3.9 9.5 6.74 6 12 6c3.07 0 5.5 1.34 7.22 3.02M21.54 12.12C20.1 14.74 17.26 18.24 12 18.24c-3.07 0-5.5-1.34-7.22-3.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span className="text-xs">{loginShow ? "Hide" : "Show"}</span>
              </button>
            </div>
            {errors.password && (
              <p
                className="text-xs text-red-600 mb-3"
                data-testid="auth-login-password-error"
              >
                {errors.password}
              </p>
            )}
            {errors.username && (
              <p
                className="text-xs text-red-600 mb-3"
                data-testid="auth-login-username-error"
              >
                {errors.username}
              </p>
            )}

            <Button
              disabled={loading}
              onClick={handleLogin}
              className="w-full"
              testId="auth-login-submit"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center mt-3 text-sm">
              <button
                className="text-red-600 hover:underline"
                onClick={() => setView("forgot")}
                data-testid="auth-switch-to-forgot"
              >
                Forgot password?
              </button>
            </div>

            <div className="text-center mt-4 text-sm">
              Don't have an account?{" "}
              <button
                className="text-black hover:underline"
                onClick={() => setView("register")}
                data-testid="auth-switch-to-register"
              >
                Register
              </button>
            </div>
          </>
        )}

        {/* ================= REGISTER ================= */}
        {view === "register" && (
          <>
            <h2
              className="text-2xl font-bold text-center mb-4"
              data-testid="auth-register-title"
            >
              Create Account
            </h2>

            <Input
              placeholder="Username"
              value={regUser}
              onChange={(e) => setRegUser(e.target.value)}
              className="mb-2"
              testId="auth-register-username"
            />
            {errors.username && (
              <p
                className="text-xs text-red-600 mb-1"
                data-testid="auth-register-username-error"
              >
                {errors.username}
              </p>
            )}

            <Input
              placeholder="Email"
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="mb-2"
              testId="auth-register-email"
            />
            {errors.email && (
              <p
                className="text-xs text-red-600 mb-1"
                data-testid="auth-register-email-error"
              >
                {errors.email}
              </p>
            )}

            <div className="relative mb-2">
              <Input
                placeholder="Password"
                type={regShow ? "text" : "password"}
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                className="pr-12"
                testId="auth-register-password"
              />
              <button
                type="button"
                aria-label={regShow ? "Hide password" : "Show password"}
                onClick={() => setRegShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center gap-1 justify-center transition"
                data-testid="password-toggle"
              >
                {regShow ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path d="M3 3l18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.58 10.58a3 3 0 104.24 4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.46 12.12C3.9 9.5 6.74 6 12 6c3.07 0 5.5 1.34 7.22 3.02M21.54 12.12C20.1 14.74 17.26 18.24 12 18.24c-3.07 0-5.5-1.34-7.22-3.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span className="text-xs">{regShow ? "Hide" : "Show"}</span>
              </button>
            </div>
            {errors.password && (
              <p
                className="text-xs text-red-600 mb-1"
                data-testid="auth-register-password-error"
              >
                {errors.password}
              </p>
            )}

            <div className="relative mb-4">
              <Input
                placeholder="Confirm Password"
                type={regConfirmShow ? "text" : "password"}
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                className="pr-12"
                testId="auth-register-confirm"
              />
              <button
                type="button"
                aria-label={regConfirmShow ? "Hide password" : "Show password"}
                onClick={() => setRegConfirmShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center gap-1 justify-center transition"
                data-testid="confirm-password-toggle"
              >
                {regConfirmShow ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path d="M3 3l18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.58 10.58a3 3 0 104.24 4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.46 12.12C3.9 9.5 6.74 6 12 6c3.07 0 5.5 1.34 7.22 3.02M21.54 12.12C20.1 14.74 17.26 18.24 12 18.24c-3.07 0-5.5-1.34-7.22-3.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span className="text-xs">{regConfirmShow ? "Hide" : "Show"}</span>
              </button>
            </div>
            {errors.confirm && (
              <p
                className="text-xs text-red-600 mb-2"
                data-testid="auth-register-confirm-error"
              >
                {errors.confirm}
              </p>
            )}

            <Button
              disabled={loading}
              onClick={handleRegister}
              className="w-full bg-red-600 text-white"
              testId="auth-register-submit"
            >
              {loading ? "Registering..." : "Register"}
            </Button>

            <div className="text-center mt-4 text-sm">
              Already have an account?{" "}
              <button
                className="hover:underline"
                onClick={() => setView("login")}
                data-testid="auth-switch-to-login"
              >
                Login
              </button>
            </div>
          </>
        )}

        {/* ================= FORGOT ================= */}
        {view === "forgot" && (
          <>
            <h2
              className="text-2xl font-bold text-center mb-4"
              data-testid="auth-reset-title"
            >
              Reset Password
            </h2>

            <Input
              placeholder="Email"
              type="email"
              value={emailReset}
              onChange={(e) => setEmailReset(e.target.value)}
              className="mb-3"
              testId="auth-reset-email"
            />

            <Button
              className="w-full"
              onClick={handleReset}
              disabled={resetLoading}
              testId="auth-reset-submit"
            >
              {resetLoading ? "Sending..." : "Send reset email"}
            </Button>

            {resetMsg && (
              <p
                className={`text-center text-sm mt-3 ${resetType === "error" ? "text-red-600" : "text-green-600"}`}
                data-testid="auth-reset-msg"
              >
                {resetMsg}
              </p>
            )}

            <div className="text-center mt-4 text-sm">
              <button
                className="hover:underline"
                onClick={() => setView("login")}
                data-testid="auth-reset-back"
              >
                Back to login
              </button>
            </div>
          </>
        )}

        {error && (
          <p
            className="text-center text-red-600 text-sm mt-3"
            data-testid="auth-error"
          >
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthPopup;
