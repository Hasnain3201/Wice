import React, { useState } from "react";
import "./ClientLoginPage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ArrowLeft } from "lucide-react";
import WiceLogo from "../../assets/Wice_logo.jpg";
import LoginCard from "../../Components/login_card.jsx";

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, logout } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const username = (formData.get("username") || "").trim();
    const password = formData.get("password") || "";

    if (!username || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const { profile } = await loginWithEmail(username, password);
      const accountType = profile?.accountType || profile?.role;

      if (accountType !== "client") {
        await logout();
        setErrorMessage(
          "This account is not registered as a client. Please use the correct portal."
        );
        return;
      }

      setErrorMessage("");
      navigate("/client/home");
    } catch (err) {
      console.error("Firebase login error:", err);
      const message =
        err?.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : err?.message || "Unable to sign in right now.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-content">
        <button
          className="admin-back-btn"
          onClick={() => navigate("/")}
          aria-label="Back to login options"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <img src={WiceLogo} alt="WICE logo" className="admin-login-logo" />
        <h1 className="admin-login-title">Client Login</h1>
        <p className="admin-login-subtitle">
          Sign in below to access your WICE client portal.
        </p>

        <LoginCard
          onSubmit={handleSubmit}
          forgotPath="/client/forgot"
          identifierLabel="Email"
          identifierType="email"
          identifierName="username"
          placeholderIdentifier="client@example.com"
          errorMessage={errorMessage}
          loading={submitting}
        />
      </div>
    </div>
  );
}
