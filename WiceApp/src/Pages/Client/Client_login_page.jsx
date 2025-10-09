import React from "react";
import "./Client_login_page.css";
import WiceLogo from "../../assets/Wice_logo.jpg";
import LoginCard from "../../Components/login_card"; 


export default function ClientLogin() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: client authentication
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
            placeholderEmail="you@example.org"
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
