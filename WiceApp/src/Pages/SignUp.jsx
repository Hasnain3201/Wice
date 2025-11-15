import React, { useState, useRef } from "react";
import "./SignUp.css";
import WiceLogo from "../assets/Wice_logo.jpg";
import { ArrowLeft } from "lucide-react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildDefaultUserData } from "../services/userProfile.js";
import termsText from "../data/terms"; // ✅ Importing your formatted terms.js file

export default function SignUp() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [canAccept, setCanAccept] = useState(false);
  const termsRef = useRef(null);

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

    if (!termsAccepted) {
      setError("You must accept the Terms and Conditions before signing up.");
      return;
    }

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
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: fullName });

      const baseDoc = {
        fullName,
        email,
        role: accountType,
        accountType,
        uid: user.uid,
        createdAt: serverTimestamp(),
      };

      const defaults = buildDefaultUserData(accountType);
      await setDoc(doc(db, "users", user.uid), { ...baseDoc, ...defaults });
      await refreshProfile();

      const destination =
        accountType === "consultant"
          ? "/consultant/profile-builder"
          : "/client/home";

      navigate(destination);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTermsClick = () => {
    setShowTerms(true);
    setCanAccept(false);
  };

  const handleTermsScroll = () => {
    const div = termsRef.current;
    if (div && div.scrollTop + div.clientHeight >= div.scrollHeight - 5) {
      setCanAccept(true);
    }
  };

  const handleTermsAccept = () => {
    setShowTerms(false);
    setTermsAccepted(true);
  };

  const handleTermsDecline = () => {
    setShowTerms(false);
    setTermsAccepted(false);
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <button className="signup-back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <img src={WiceLogo} alt="WICE logo" className="signup-logo" />
        <h1 className="signup-title">Create Your WICE Account</h1>
        <p className="signup-subtitle">Join the WICE community today</p>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Account Type */}
          <div className="account-type">
            <label className="account-label">Account type</label>
            <div className="radio-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="accountType"
                  value="client"
                  defaultChecked
                  required
                />
                <span className="radio-circle"></span>
                <span className="radio-text">Client</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="accountType"
                  value="consultant"
                  required
                />
                <span className="radio-circle"></span>
                <span className="radio-text">Consultant</span>
              </label>
            </div>
          </div>

          <input
            name="fullName"
            type="text"
            placeholder="Full Name"
            required
            className="signup-input"
          />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
            className="signup-input"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="signup-input"
          />
          <p className="signup-hint">
            Password must include at least one letter and one number.
          </p>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            required
            className="signup-input"
          />

          {/* Terms */}
          <div className="signup-checkbox">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={handleTermsClick}
            />
            <label htmlFor="terms">
              I agree to the{" "}
              <span className="terms-link" onClick={handleTermsClick}>
                Terms and Conditions
              </span>
            </label>
          </div>

          {error && <p className="signup-error">{error}</p>}

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="signup-footer">
          Already have an account?{" "}
          <a href="/" className="signup-link">
            Log In
          </a>
        </p>
        {/* 🔧 Developer Test Button (for local dev only) */}
        <div style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="signup-btn"
            onClick={() => navigate("/test/profile-builder")}
          >
            Developer Test: Go to Profile Builder
          </button>
        </div>

      </div>

      {/* ✅ Terms Popup */}
      {showTerms && (
        <div className="terms-overlay">
          <div className="terms-container">
            <h3>WICE Terms of Use and Privacy Policy</h3>

            <div
              className="terms-content grey-box"
              ref={termsRef}
              onScroll={handleTermsScroll}
              dangerouslySetInnerHTML={{ __html: termsText }} // ✅ render terms.js content as HTML
            />

            <div className="terms-buttons">
              <button
                className="signup-btn"
                disabled={!canAccept}
                onClick={handleTermsAccept}
              >
                {canAccept
                  ? "I have read and agree"
                  : "Scroll to the bottom to enable"}
              </button>
              <button className="signup-cancel" onClick={handleTermsDecline}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
