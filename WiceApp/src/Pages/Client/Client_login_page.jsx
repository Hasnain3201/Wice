import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Client_login_page.css";
import WiceLogo from "../../assets/Wice_logo.jpg";
import LoginCard from "../../Components/login_card";


export default function ClientLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") || "").trim();
    const password = formData.get("password") || "";

    const isValidAdmin = username === "admin" && password === "123";

    if (isValidAdmin) {
      setError("");
      navigate("/marketplace");
    } else {
      setError("Invalid username or password. Try admin / 123.");
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

          <h1 className="wice-title">Client Login</h1>
          <p className="wice-subtitle">Sign in below to access your WICE client portal.</p>

          <LoginCard
            onSubmit={handleSubmit}
            forgotPath="/client/forgot"
            identifierLabel="Username"
            identifierType="text"
            identifierName="username"
            placeholderIdentifier="admin"
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
