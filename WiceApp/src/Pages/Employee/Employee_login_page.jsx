import React from "react";
import "../Client/Client_login_page.css";
import WiceLogo from "../../assets/Wice_logo.jpg";
import LoginCard from "../../Components/login_card"; // ✅ lowercase filename

export default function EmployeeLogin() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: employee authentication
  };

  return (
    <main className="wice-page">
      <section className="wice-frame">
        <div className="wice-left">
          <a className="wice-back" href="/">← Back</a>

          <div className="wice-brand">
            <img src={WiceLogo} alt="WICE logo" className="wice-logo-img" />
          </div>

          <h1 className="wice-title">Employee Login</h1>
          <p className="wice-subtitle">Sign in below to access your employee portal.</p>

          <LoginCard
            onSubmit={handleSubmit}
            forgotPath="/employee/forgot"
            identifierLabel="Work Email"
            identifierType="email"
            identifierName="email"
            placeholderIdentifier="you@wice.org"
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
