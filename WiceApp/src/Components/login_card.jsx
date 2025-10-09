import React from "react";
import "../Pages/Client/Client_login_page.css"; // reuse existing styles from Client login 


export default function LoginCard({
  onSubmit,
  forgotPath,
  placeholderEmail = "you@example.org",
}) {
  return (
    <div className="wice-card" role="group" aria-labelledby="login-form">
      <form id="login-form" onSubmit={onSubmit} noValidate>
        <div className="wice-field">
          <label htmlFor="email">Email Address</label>
          <input
            className="wice-input"
            id="email"
            name="email"
            type="email"
            placeholder={placeholderEmail}
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
          <a className="wice-link" href={forgotPath}>Forgot password?</a>
        </div>

        <button className="wice-btn" type="submit">Sign In</button>
      </form>
    </div>
  );
}