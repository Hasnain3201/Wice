import React, { useState } from "react";
import "../Pages/Client/ClientLoginPage.css"; // reuse existing client login styles

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
  const [showPassword, setShowPassword] = useState(false);
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
            <input
              type="checkbox"
              id="remember"
              name="remember"
              defaultChecked
            />
            Remember me
          </label>
          <a className="wice-link" href={forgotPath}>
            Forgot password?
          </a>
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
    </div>
  );
}
