import React, { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Users,
  Home,
  Search,
  DollarSign,
  MessageSquare,
  Settings,
  Briefcase,
  Bell,
  Bookmark,
  Calendar,
  HelpCircle,
  LogOut,
  FolderOpen,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import "./SideNav.css";
import { useAuth } from "../context/AuthContext.jsx";

export default function SideNav() {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

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
        { to: "/client/billing", label: "Billing", icon: DollarSign },
        { to: "/settings", label: "Settings", icon: Settings },
        { to: "/profile", label: "Profile", icon: User },
      ];
    }

    if (role === "admin") {
      return [
        { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin/earnings", label: "Earnings", icon: DollarSign },
        { to: "/admin/consultants", label: "Consultant Directory", icon: Users },
        { to: "/admin/open-projects", label: "Open Projects", icon: FolderOpen },
        { to: "/admin/approve-consultants", label: "Approve Consultants", icon: UserCheck },
        { to: "/admin/pending-issues", label: "Pending Issues", icon: AlertTriangle },
        { to: "/admin/settings", label: "Settings", icon: Settings },
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

        {/* Help icon link */}
        <NavLink
          to="/help"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <HelpCircle size={18} className="nav-icon" />
          <span>Help</span>
        </NavLink>

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
