import React, { useState } from "react";
import NotificationCard from "../Components/NotificationCard.jsx";
import "./Notifications.css";

export default function Notifications() {
  // include an "index" property for each notification
  const [notifications, setNotifications] = useState([]);

  // Toggle viewed and reorder accordingly
  const handleViewedChange = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, viewed: !n.viewed } : n
      );

      // Sort logic:
      // Unviewed items stay at top in their original order (index)
      // Viewed items go to bottom, also in their original order
      return [...updated].sort((a, b) => {
        if (a.viewed === b.viewed) {
          return a.index - b.index; // maintain original order within groups
        }
        return a.viewed - b.viewed; // false (0) before true (1)
      });
    });
  };

  return (
    <div className="dashboard-page notifications-page">
      <h1 className="dashboard-title">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="notifications-empty">
          You have no notifications yet. New activity will appear here.
        </p>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              {...n}
              onViewedChange={() => handleViewedChange(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
