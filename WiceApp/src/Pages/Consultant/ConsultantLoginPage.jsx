import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Client/ClientLoginPage.css";
import WiceLogo from "../../assets/Wice_logo.jpg";
import LoginCard from "../../Components/login_card";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ConsultantLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { loginAs } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") || "").trim();
    const password = formData.get("password") || "";

    const isValidConsultant = username === "consultant" && password === "123";

    if (isValidConsultant) {
      setError("");
      loginAs("consultant");
      navigate("/consultant/portal");
    } else {
      setError("Invalid username or password. Try consultant / 123.");
    }
  };

  return (
    <main className="wice-page">
      <section className="wice-frame">
        <div className="wice-left">
          <a className="wice-back" href="/">← Back</a>

          <div className="wice-brand">
            <img src={WiceLogo} alt="WICE logo" className="wice-logo-img" />
          </div>

          <h1 className="wice-title">Consultant Login</h1>
          <p className="wice-subtitle">Access your consultant portal and tools below.</p>

          <LoginCard
            onSubmit={handleSubmit}
            forgotPath="/consultant/forgot"
            identifierLabel="Username"
            identifierType="text"
            identifierName="username"
            placeholderIdentifier="consultant"
            errorMessage={error}
          />

          <div className="wice-accent" />
        </div>

        <div className="wice-right" aria-hidden="true">
          <div className="wice-hero" style={{ backgroundImage: "url('/hero.jpg')" }} />
        </div>
      </section>
    </main>
  );
}
