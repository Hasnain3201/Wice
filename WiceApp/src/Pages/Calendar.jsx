import React from "react";
import { Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function CalendarPage() {
  const { user, role } = useAuth();

  return (
    <div style={{ padding: "24px" }}>
      <h1>
        <Calendar size={20} style={{ verticalAlign: "middle" }} /> Calendar
      </h1>
      <p>
        {user?.name
          ? `${user.name}'s calendar`
          : "Your calendar events will appear here."}
      </p>
      <p>Role: {role}</p>
    </div>
  );
}
