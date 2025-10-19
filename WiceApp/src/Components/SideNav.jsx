import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Home,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import "./SideNav.css";
import { useAuth } from "../context/AuthContext.jsx";

export default function SideNav() {
  const { role } = useAuth();

  const links = useMemo(() => {
    if (role === "consultant") {
      return [
        { to: "/consultant/portal", label: "Portal", icon: Home },
        { to: "/marketplace", label: "Marketplace", icon: LayoutDashboard },
        { to: "/granthunt", label: "GrantHunt", icon: DollarSign },
        { to: "/chat", label: "Chat", icon: MessageSquare },
        { to: "/consultant/profile", label: "Profile", icon: User },
      ];
    }
    if (role === "client") {
      return [
        { to: "/marketplace", label: "Marketplace", icon: LayoutDashboard },
        { to: "/chat", label: "Chat", icon: MessageSquare },
        { to: "/profile", label: "Profile", icon: User },
      ];
    }
    return [];
  }, [role]);

  if (!role) {
    return null;
  }

  return (
    <aside className="sidenav" aria-label="Primary navigation">
      <nav className="sidenav-links">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Icon size={18} className="nav-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
