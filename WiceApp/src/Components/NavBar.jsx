import React from "react";
import { Link, useNavigate } from "react-router-dom";
import WiceLogo from "../assets/Wice_logo.jpg";

export default function NavBar() {
  const navigate = useNavigate();
  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src={WiceLogo}
          alt="WICE"
          style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover" }}
        />
        <span className="navbar-title">WICE Consultant Marketplace</span>
      </div>

      <div className="navbar-actions" style={{ display: "flex", gap: 16 }}>
        <Link to="/marketplace">Browse</Link>
        <a
          href="https://wice.org"
          target="_blank"
          rel="noreferrer"
          title="WICE Website"
        >
          Help
        </a>
        <button onClick={() => navigate("/")}>Log out</button>
      </div>
    </header>
  );
}
