import React from "react";

export default function AdminDashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">
          Manage users, permissions, and oversee system activity.
        </p>
      </div>

      <div className="dashboard-card">
        <h2>Admin Controls</h2>
        <p>Here you can add or remove users, view logs, and monitor activity.</p>
      </div>
    </div>
  );
}
