import React, { useState } from "react";
import "./SignUp.css";
import WiceLogo from "../assets/Wice_logo.jpg";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildDefaultUserData } from "../services/userProfile.js";

export default function SignUp() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const passwordIsValid = (password) => {
    if (password.length < 6) return false;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
  };

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

    if (!passwordIsValid(password)) {
      setError(
        "Password must be at least 6 characters and include both letters and numbers."
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Create Firebase user
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(user, { displayName: fullName });

      // Save user data in Firestore
      const baseDoc = {
        uid: user.uid,
        fullName,
        email,
        accountType,
        role: accountType,
        createdAt: serverTimestamp(),
      };

      const defaults = buildDefaultUserData(accountType);

      await setDoc(doc(db, "users", user.uid), { ...baseDoc, ...defaults });

      await refreshProfile();

      const destination =
        accountType === "consultant" ? "/consultant/portal" : "/client/home";

      navigate(destination);
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
            <p className="signup-password-hint">
              Password must be at least 6 characters and include letters and numbers.
            </p>
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
