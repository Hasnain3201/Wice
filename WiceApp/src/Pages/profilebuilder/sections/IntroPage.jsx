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
          You will have the option of quickly creating a profile with basic
          information called a <strong>Light profile</strong> or taking the time
          to complete your entire profile.
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
