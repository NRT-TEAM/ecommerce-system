import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { ShopContext } from "../../context/ShopContext";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const NewsletterPopup = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem("newsletterDismissed");
      const shown = localStorage.getItem("newsletterShown");
      if (!dismissed && !shown) {
        setShowPopup(true);
        localStorage.setItem("newsletterShown", "true");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowPopup(false);
    localStorage.setItem("newsletterDismissed", "true");
  };

  return (
    <Dialog
      open={showPopup}
      onOpenChange={(v) => !v && handleClose()}
      testId="newsletter-dialog"
    >
      <DialogContent
        onClose={handleClose}
        className="p-6 rounded-xl max-w-md bg-white text-black"
        testId="newsletter-modal"
      >
        <h2
          className="text-2xl font-bold text-center mb-2"
          data-testid="newsletter-title"
        >
          Subscribe to Our Newsletter
        </h2>
        <p className="text-gray-700 text-center mb-4">
          Get exclusive offers, product updates, and more!
        </p>
        <NewsletterPopupForm onSubscribed={handleClose} />
      </DialogContent>
    </Dialog>
  );
};

export default NewsletterPopup;

const NewsletterPopupForm = ({ onSubscribed }) => {
  const [email, setEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const { showToast } = useContext(ShopContext);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setMsg("");
    try {
      const emailValid = /.+@.+\..+/.test(email);
      if (!emailValid) throw new Error("Please enter a valid email address");
      const res = await axios.post(
        "http://localhost:5005/api/newsletter/subscribe",
        { email }
      );
      if (res?.status >= 200 && res?.status < 300) {
        setMsg("You are now subscribed.");
        setEmail("");
        onSubscribed?.();
        showToast({
          type: "success",
          title: "Newsletter",
          message: "Subscribed",
        });
      } else throw new Error("Subscription failed");
    } catch (e) {
      const m =
        e?.response?.status === 409
          ? "This email is already subscribed."
          : e?.message || "Subscription failed. Please try again.";
      setMsg(m);
      showToast({ type: "error", title: "Newsletter", message: m });
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3"
      data-testid="newsletter-form"
    >
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        testId="newsletter-input"
      />
      <Button
        type="submit"
        className="w-full bg-red-600  hover:bg-red-700 transition text-white"
        testId="newsletter-submit"
      >
        {sending ? "Subscribing..." : "Subscribe"}
      </Button>
      {msg && (
        <span className="text-xs text-center" data-testid="newsletter-msg">
          {msg}
        </span>
      )}
    </form>
  );
};
