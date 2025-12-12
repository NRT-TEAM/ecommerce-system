import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthPopup from "../components/AuthPopup";

const Auth = () => {
  const navigate = useNavigate();
  const { mode } = useParams();
  return (
    <AuthPopup
      open={true}
      mode={mode === "register" ? "register" : "login"}
      onClose={() => {
        if (window.history.length > 1) navigate(-1);
        else navigate("/");
      }}
    />
  );
};

export default Auth;

