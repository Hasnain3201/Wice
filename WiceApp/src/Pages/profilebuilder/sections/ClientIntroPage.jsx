import React from "react";
import { useNavigate } from "react-router-dom";
import "../profileBuilder.css";

export default function ClientIntroPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/client/profile-builder");
  };

  return (
    <div className="intro-wrapper">
      <div className="intro-inner">
        <h1 className="intro-title">Build Your Profile</h1>

        <p className="intro-subtext">
          This step helps us understand your project goals and preferences.
        </p>

        <p className="intro-description">
          Start with a quick <strong>Light Profile</strong> to activate your account.{" "}
          <strong>This takes less than 2 minutes.</strong> After that, you can
          complete your Full Profile to share more details.
        </p>

        <button type="button" className="next" onClick={handleStart}>
          Start
        </button>
      </div>
    </div>
  );
}
