import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Settings() {
  const { role, user } = useAuth();

  if (!user) {
    return (
      <div className="settings-page" style={{ padding: "24px" }}>
        <h1>Settings</h1>
        <p>Please log in to view your personalized settings.</p>
      </div>
    );
  }

  return (
    <div className="settings-page" style={{ padding: "24px" }}>
      <h1>{user.name ? `${user.name}'s Settings` : "Settings"}</h1>
      <p>Email: {user.email || "Not provided"}</p>
      <p>Role: {role}</p>

      {role === "consultant" ? (
        <>
          <h2>Consultant Preferences</h2>
          <form className="settings-form">
            <label>
              Availability:
              <select>
                <option>Available</option>
                <option>Busy</option>
                <option>Offline</option>
              </select>
            </label>
            <label>
              Payment Method:
              <input type="text" placeholder="Enter payout details" />
            </label>
            <label>
              Email Alerts:
              <input type="checkbox" /> Receive client notifications
            </label>
          </form>
        </>
      ) : (
        <>
          <h2>Client Preferences</h2>
          <form className="settings-form">
            <label>
              Display Name:
              <input type="text" placeholder="Enter display name" />
            </label>
            <label>
              Email Updates:
              <input type="checkbox" /> Receive consultant updates
            </label>
            <label>
              Project Visibility:
              <select>
                <option>Private</option>
                <option>Public</option>
              </select>
            </label>
          </form>
        </>
      )}
    </div>
  );
}
