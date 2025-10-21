import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Home,
  Search,
  DollarSign,
  MessageSquare,
  Settings,
  Briefcase,
  Bell,
  Bookmark,
  Calendar,
} from "lucide-react";
import "./SideNav.css";
import { useAuth } from "../context/AuthContext.jsx";

export default function SideNav() {
  const { role } = useAuth();

  const links = useMemo(() => {
    if (role === "consultant") {
      return [
        { to: "/consultant/portal", label: "Home", icon: Home },
        { to: "/notifications", label: "Notifications", icon: Bell },
        { to: "/marketplace", label: "Marketplace", icon: LayoutDashboard },
        { to: "/granthunt", label: "GrantHunt", icon: Search },
        { to: "/saved", label: "Saved", icon: Bookmark },
        { to: "/chat", label: "Chat", icon: MessageSquare },
        { to: "/projects", label: "Projects", icon: Briefcase },
        { to: "/calendar", label: "Calendar", icon: Calendar },
        { to: "/settings", label: "Settings", icon: Settings },
        { to: "/consultant/profile", label: "Profile", icon: User },
      ];
    }

    if (role === "client") {
      return [
        { to: "/client/home", label: "Home", icon: Home },
        { to: "/notifications", label: "Notifications", icon: Bell },
        { to: "/marketplace", label: "Marketplace", icon: LayoutDashboard },
        { to: "/saved", label: "Saved", icon: Bookmark },
        { to: "/chat", label: "Chat", icon: MessageSquare },
        { to: "/projects", label: "Projects", icon: Briefcase },
        { to: "/calendar", label: "Calendar", icon: Calendar },
        { to: "/settings", label: "Settings", icon: Settings },
        { to: "/profile", label: "Profile", icon: User },
      ];
    }

    return [];
  }, [role]);

  if (!role) return null;

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
