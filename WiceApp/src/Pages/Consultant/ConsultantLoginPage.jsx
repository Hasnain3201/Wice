import React, { useState } from "react";
import "../Client/ClientLoginPage.css"; // reuse same CSS for layout consistency
import LoginCard from "../../Components/login_card.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ArrowLeft } from "lucide-react";
import WiceLogo from "../../assets/Wice_logo.jpg";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

export default function ConsultantLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const username = (formData.get("username") || "").trim();
    const password = formData.get("password") || "";

    try {
      await signInWithEmailAndPassword(auth, username, password);
      setErrorMessage("");
      login("consultant");
      navigate("/consultant/portal");
      return;
    } catch (err) {
      console.error("Firebase login error:", err);
    }

    if (
      (username === "consultant" || username === "consultant@example.com") &&
      password === "123"
    ) {
      setErrorMessage("");
      login("consultant");
      navigate("/consultant/portal");
    } else {
      setErrorMessage(
        "Invalid email or password. Try consultant@example.com / 123."
      );
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
        <h1 className="admin-login-title">Consultant Login</h1>
        <p className="admin-login-subtitle">
          Access your consultant portal and tools below.
        </p>

        <LoginCard
          onSubmit={handleSubmit}
          forgotPath="/consultant/forgot"
          identifierLabel="Email"
          identifierType="email"
          identifierName="username"
          placeholderIdentifier="consultant@example.com"
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
