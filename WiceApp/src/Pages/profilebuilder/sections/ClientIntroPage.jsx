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
          You will start by completing a quick <strong>Light Profile</strong> which is required
          to activate your account. <strong>This will take less than 2 minutes!</strong>  
          After that, you can optionally complete your Full Profile.
        </p>

        <button type="button" className="next" onClick={handleStart}>
          Start
        </button>
      </div>
    </div>
  );
}
