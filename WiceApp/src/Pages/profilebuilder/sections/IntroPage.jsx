import React from "react";
import "../profileBuilder.css";

export default function IntroPage({ onStart }) {
  return (
    <div className="intro-wrapper">
      <div className="intro-inner">
        <h1 className="intro-title">Build your essential profile</h1>

        <p className="intro-subtext">
          This first step takes about seven to ten minutes. You can update your
          profile at any time.
        </p>

        <p className="intro-description">
          Start with the required <strong>Light Profile</strong> to activate your account (under
          2 minutes). You can expand to your Full Profile any time.
        </p>

        <button type="button" className="next" onClick={onStart}>
          Start
        </button>

        <p className="intro-signin">
          Already have a profile?{" "}
          <a href="/consultant/login" className="signin-link">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
