import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import WiceLogo from "../assets/Wice_logo.jpg";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const links = useMemo(() => {
    if (role === "consultant") {
      return [
        { to: "/consultant/portal", label: "Portal" },
        { to: "/granthunt", label: "GrantHunt" },
        { to: "/consultant/profile", label: "Profile" },
      ];
    }
    if (role === "client") {
      return [
        { to: "/marketplace", label: "Marketplace" },
        { to: "/profile", label: "Profile" },
      ];
    }
    return [];
  }, [role]);

  const Item = ({ to, children }) => (
    <Link
      to={to}
      className={`navlink ${pathname === to ? "navlink-active" : ""}`}
    >
      {children}
    </Link>
  );

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src={WiceLogo}
          alt="WICE"
          style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover" }}
        />
        <span className="navbar-title">WICE Client Portal</span>
      </div>

      <nav className="navbar-actions" style={{ display: "flex", gap: 14 }}>
        {links.map((link) => (
          <Item key={link.to} to={link.to}>
            {link.label}
          </Item>
        ))}
        {role ? (
          <button className="navbutton" onClick={handleLogout}>
            Log out
          </button>
        ) : null}
      </nav>
    </header>
  );
}
