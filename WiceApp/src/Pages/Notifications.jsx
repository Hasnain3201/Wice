import React, { useState } from "react";
import NotificationCard from "../Components/NotificationCard.jsx";
import "./Notifications.css";

export default function Notifications() {
  // include an "index" property for each notification
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "opportunity",
      title: "New Consulting Opportunity",
      description:
        "A company is looking for sustainability consultants to help with an upcoming project.",
      postedDate: "Oct 22, 2025",
      closingDate: "Nov 10, 2025",
      viewed: false,
      index: 0,
    },
    {
      id: 2,
      type: "grant",
      title: "Agritech Grant Open",
      description:
        "A $25,000 grant is available for startups focused on agriculture innovation.",
      postedDate: "Oct 20, 2025",
      closingDate: "Dec 1, 2025",
      viewed: false,
      index: 1,
    },
    {
      id: 3,
      type: "milestone",
      title: "Project Milestone Reached",
      description:
        "Your team completed the data collection phase for the GreenFuture project.",
      postedDate: "Oct 19, 2025",
      viewed: false,
      index: 2,
    },
    {
      id: 4,
      type: "saved",
      title: "Saved Project Reminder",
      description:
        "You saved the ‘Clean Water Initiative’ grant for later — don’t forget to apply before it closes!",
      postedDate: "Oct 18, 2025",
      closingDate: "Nov 5, 2025",
      viewed: false,
      index: 3,
    },
  ]);

  // Toggle viewed and reorder accordingly
  const handleViewedChange = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, viewed: !n.viewed } : n
      );

      // Sort logic:
      // 1️⃣ Unviewed (false) stay at top in their original order (index)
      // 2️⃣ Viewed (true) go to bottom, also in their original order
      return [...updated].sort((a, b) => {
        if (a.viewed === b.viewed) {
          return a.index - b.index; // maintain original order within groups
        }
        return a.viewed - b.viewed; // false (0) before true (1)
      });
    });
  };

  return (
    <div className="notifications-page">
      <h1 className="notifications-title">Notifications</h1>
      <div className="notifications-list">
        {notifications.map((n) => (
          <NotificationCard
            key={n.id}
            {...n}
            onViewedChange={() => handleViewedChange(n.id)}
          />
        ))}
      </div>
    </div>
  );
}
