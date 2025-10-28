import React, { useState } from "react";
import "./SignUp.css";
import WiceLogo from "../assets/Wice_logo.jpg";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SignUp() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const accountType = form.get("accountType");
    const fullName = form.get("fullName");
    const email = form.get("email");
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Create Firebase user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Save user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName,
        email,
        accountType,
        createdAt: new Date().toISOString(),
      });

      alert("Account created successfully!");
      window.location.href = "/"; // redirect to login or home
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
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
                <input
                  type="radio"
                  name="accountType"
                  value="client"
                  defaultChecked
                  required
                />
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
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              required
            />

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          {error && <p className="error">{error}</p>}

          <p className="signup-login">
            Already have an account?{" "}
            <a href="/" className="link">
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
