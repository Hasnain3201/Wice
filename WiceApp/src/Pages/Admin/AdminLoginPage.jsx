import React, { useState } from "react";
import "./AdminLoginPage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ArrowLeft } from "lucide-react";
import WiceLogo from "../../assets/Wice_logo.jpg";
import LoginCard from "../../Components/login_card.jsx";

const TEST_ADMIN_EMAIL = import.meta.env.VITE_TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = import.meta.env.VITE_TEST_ADMIN_PASSWORD;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, logout, setTestSession } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const username = formData.get("username")?.trim() || "";
    const password = formData.get("password")?.trim() || "";

    if (!username || !password) {
      setErrorMessage("Username and password are required.");
      return;
    }

    const matchesTestCredentials =
      TEST_ADMIN_EMAIL &&
      TEST_ADMIN_PASSWORD &&
      username === TEST_ADMIN_EMAIL &&
      password === TEST_ADMIN_PASSWORD;

    if (matchesTestCredentials) {
      setSubmitting(true);
      try {
        setTestSession({
          email: username,
          fullName: "Test Admin",
        });
        setErrorMessage("");
        navigate("/admin/dashboard");
        return;
      } finally {
        setSubmitting(false);
      }
    }

    setSubmitting(true);
    try {
      const { profile } = await loginWithEmail(username, password);
      const accountType = profile?.accountType || profile?.role;

      if (accountType !== "admin") {
        await logout();
        setErrorMessage(
          "This account is not registered as an admin. Reach out to an administrator for access."
        );
        return;
      }

      setErrorMessage("");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Admin login failed:", error);
      const message =
        error?.code === "auth/invalid-credential"
          ? "Invalid username or password."
          : error?.message || "Unable to sign in right now.";
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
        <h1 className="admin-login-title">Admin Login</h1>
        <p className="admin-login-subtitle">
          Access the WICE administration portal securely.
        </p>

        <LoginCard
          onSubmit={handleSubmit}
          forgotPath="/admin/forgot-password"
          identifierLabel="Email"
          identifierType="email"
          identifierName="username"
          placeholderIdentifier={TEST_ADMIN_EMAIL || "admin@example.com"}
          errorMessage={errorMessage}
          loading={submitting}
        />
      </div>
    </div>
  );
}
