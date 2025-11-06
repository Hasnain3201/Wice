import React from "react";
import { Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function CalendarPage() {
  const { user, role, profile } = useAuth();
  const name = profile?.fullName || user?.displayName || user?.email;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Calendar</h1>
        <p className="dashboard-subtitle">
          {name
            ? `${name}'s calendar`
            : "Your calendar events will appear here."}
        </p>
      </header>

      <section className="dashboard-card">
        <p><Calendar size={20} style={{ verticalAlign: "middle", marginRight: 8 }} /> Upcoming events</p>
        <p>Role: {role}</p>
        <p>Calendar integration coming soon.</p>
      </section>
    </div>
  );
}
