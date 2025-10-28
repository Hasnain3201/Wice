import React, { useState } from "react";
import "./ClientLoginPage.css";
import LoginCard from "../../Components/login_card.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ArrowLeft } from "lucide-react";
import WiceLogo from "../../assets/Wice_logo.jpg";
import { signInWithEmailAndPassword } from "firebase/auth";  
import { auth } from "../../firebase";                      

export default function ClientLoginPage() {
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
      login("client");
      navigate("/client/home");
      return;
    } catch (err) {
      console.error("Firebase login error:", err);
    }

    if (username === "client" && password === "123") {
      setErrorMessage("");
      login("client");
      navigate("/client/home");
    } else {
      setErrorMessage("Invalid username or password. Try client / 123.");
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
        />
      </div>
    </div>
  );
}
