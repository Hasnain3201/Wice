import React from "react";
import "./SignUp.css";
import WiceLogo from "../assets/Wice_logo.jpg";

export default function SignUp() {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const accountType = form.get("accountType"); // "client" or "consultant"
    // TODO: send to backend along with the rest of the form fields
    // Example: fetch("/api/signup", { method:"POST", body: form })
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        {/* LEFT */}
        <div className="signup-left">
          <img src={WiceLogo} alt="WICE logo" className="signup-logo" />
          <h1 className="signup-title">Create Your WICE Account</h1>
          <p className="signup-subtitle">Join the community today</p>

          <form className="signup-form" onSubmit={handleSubmit}>
            {/* Account type selector */}
            <div className="account-type">
              <span className="account-label">Account type</span>
              <label className="radio">
                <input type="radio" name="accountType" value="client" defaultChecked required />
                <span>Client</span>
              </label>
              <label className="radio">
                <input type="radio" name="accountType" value="consultant" required />
                <span>Consultant</span>
              </label>
            </div>

            <input name="fullName" type="text" placeholder="Full Name" required />
            <input name="email" type="email" placeholder="Email Address" required />
            <input name="password" type="password" placeholder="Password" required />
            <input name="confirmPassword" type="password" placeholder="Confirm Password" required />

            <button type="submit" className="signup-btn">Sign Up</button>
          </form>

          <p className="signup-login">
            Already have an account? <a href="/" className="link">Log In</a>
          </p>
        </div>
      </div>
    </div>
  );
}
