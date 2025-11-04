import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import "./Heading.css";
import WiceLogo from "../assets/Wice_logo.jpg";
import { useAuth } from "../context/AuthContext.jsx";

export default function Heading() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { role, user, profile, logout } = useAuth();

  const userName =
    profile?.fullName || user?.displayName || user?.email || "User";
  const profilePath =
    role === "consultant"
      ? "/consultant/profile"
      : role === "client"
      ? "/profile"
      : "/admin/dashboard";
  const settingsPath = "/settings";

  const handleNavigate = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <header className="heading">
      <div
        className="heading-left"
        onClick={() => navigate("/")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate("/");
          }
        }}
      >
        <img src={WiceLogo} alt="WICE logo" className="heading-logo" />
        <h1 className="heading-title">Your Portal</h1>
      </div>

      <div className="heading-user">
        <button
          className="user-btn"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <span className="user-btn-label">{userName}</span>
          <ChevronDown className="user-btn-icon" aria-hidden="true" size={16} />
        </button>

        {menuOpen && (
          <ul className="user-dropdown">
            <li>
              <button type="button" onClick={() => handleNavigate(profilePath)}>
                Profile
              </button>
            </li>
            <li>
              <button type="button" onClick={() => handleNavigate(settingsPath)}>
                Settings
              </button>
            </li>
            <li>
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}
