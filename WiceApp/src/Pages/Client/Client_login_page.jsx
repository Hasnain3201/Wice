import React from "react";
import "./Client_login_page.css";
import WiceLogo from "../../assets/Wice_logo.jpg";

export default function ClientLogin() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: auth
  };

  return (
    <main className="wice-page">
      <section className="wice-frame">
        {/* LEFT: content */}
        <div className="wice-left">
          <a className="wice-back" href="/" aria-label="Back to Welcome">
            ← Back
          </a>

          <div className="wice-brand">
            <img src={WiceLogo} alt="WICE logo" className="wice-logo-img" />
            <span className="wice-brand-name">WICE</span>
          </div>

          <h1 className="wice-title">Client Login</h1>
          <p className="wice-subtitle">Sign in below to access your WICE client portal.</p>

          <div className="wice-card" role="group" aria-labelledby="client-login-form">
            <form id="client-login-form" onSubmit={handleSubmit} noValidate>
              <div className="wice-field">
                <label htmlFor="email">Email Address</label>
                <input
                  className="wice-input"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.org"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="wice-field">
                <label htmlFor="password">Password</label>
                <input
                  className="wice-input"
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="wice-row">
                <label className="wice-checkbox">
                  <input type="checkbox" id="remember" name="remember" defaultChecked />
                  Remember me
                </label>
                <a className="wice-link" href="/client/forgot">Forgot password?</a>
              </div>

              <button className="wice-btn" type="submit">Sign In</button>
            </form>
          </div>

          <div className="wice-accent" aria-hidden="true" />
        </div>

        {/* RIGHT: hero image */}
        <div className="wice-right" aria-hidden="true">
          <div className="wice-hero" style={{ backgroundImage: "url('/hero.jpg')" }} />
        </div>
      </section>
    </main>
  );
}
