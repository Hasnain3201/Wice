import React, { useState } from "react";
import "../Pages/Client/ClientLoginPage.css";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

export default function LoginCard({
  onSubmit,
  forgotPath,
  identifierLabel = "Email Address",
  identifierType = "email",
  identifierName = "email",
  placeholderIdentifier = "you@example.org",
  errorMessage,
  loading = false,
}) {

  const styles = {
    forgot: {
      padding: '0.25rem 0.5rem',
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '5px',
      fontSize: '0.7rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const autoComplete =
    identifierType === "email" ? "email" : "username";

  return (
    <div className="wice-card" role="group" aria-labelledby="login-form">
      <form id="login-form" onSubmit={onSubmit} noValidate>
        <div className="wice-field">
          <label htmlFor={identifierName}>{identifierLabel}</label>
          <input
            className="wice-input"
            id={identifierName}
            name={identifierName}
            type={identifierType}
            placeholder={placeholderIdentifier}
            autoComplete={autoComplete}
            required
          />
        </div>

        <div className="wice-field">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              className="wice-input"
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="wice-row">
          <label className="wice-checkbox">
            <input type="checkbox" id="remember" name="remember" defaultChecked />
            Remember me
          </label>

          {/* Replace link with modal trigger */}
          <button
            type="button"
            style={styles.forgot}
            onClick={() => setShowForgotModal(true)}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            Forgot password?
          </button>
        </div>

        {errorMessage ? (
          <div className="wice-error" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <button className="wice-btn" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Modal at bottom */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
}