import React, { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  LogOut,
} from "lucide-react";
import "./SideNav.css";
import { useAuth } from "../context/AuthContext.jsx";
import { useChat } from "../context/ChatContext.jsx";

export default function SideNav() {
  const navigate = useNavigate();
  const { role, logout } = useAuth();
  const { unreadChatIds } = useChat();
  const hasUnreadChats = unreadChatIds.length > 0;

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
        { to: "/client/billing", label: "Billing", icon: DollarSign }, // normalized
        { to: "/settings", label: "Settings", icon: Settings },
        { to: "/profile", label: "Profile", icon: User },
      ];
    }

    return [];
  }, [role]);

  if (!role) return null;

  const handleLogout = async () => {
    await logout?.();
    navigate("/");
  };

  return (
    <aside className="sidenav" aria-label="Primary navigation">
      <nav className="sidenav-links">
        {links.map(({ to, label, icon }) => {
          const isChatLink = to === "/chat";
          const showDot = isChatLink && hasUnreadChats;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              {React.createElement(icon, { size: 18, className: "nav-icon" })}
              <span className="nav-label">
                {label}
                {showDot ? (
                  <span className="nav-dot" aria-hidden="true" />
                ) : null}
              </span>
            </NavLink>
          );
        })}

        {/* Logout pinned to bottom */}
        <button
          onClick={handleLogout}
          className="nav-item logout-btn"
          style={{
            marginTop: "auto",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <LogOut size={18} className="nav-icon" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
