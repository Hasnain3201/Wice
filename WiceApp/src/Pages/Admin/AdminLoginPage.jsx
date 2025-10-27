import React, { useState } from "react";
import "./AdminLoginPage.css";
import LoginCard from "../../Components/login_card.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ArrowLeft } from "lucide-react";
import WiceLogo from "../../assets/Wice_logo.jpg";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    // Read form values
    const formData = new FormData(event.target);
    const username = formData.get("username")?.trim() || "";
    const password = formData.get("password")?.trim() || "";

    console.log("Submitted →", username, password); // ✅ check devtools

    // Hard-coded credentials
    if (username === "admin" && password === "123") {
      console.log("✅ Correct credentials");
      login("admin");
      navigate("/admin/dashboard");
    } else {
      console.log("❌ Invalid credentials");
      setErrorMessage("Invalid credentials. Please try again.");
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
          identifierLabel="Username"
          identifierType="text"
          identifierName="username"
          placeholderIdentifier="Enter admin username"
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
