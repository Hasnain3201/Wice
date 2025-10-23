import React from "react";
import {
  Briefcase,
  Landmark,
  Bookmark,
  Search,
  Flag,
  CheckCircle,
} from "lucide-react";
import "./NotificationCard.css";

export default function NotificationCard({
  type,
  title,
  description,
  postedDate,
  closingDate,
  viewed,
  onViewedChange,
}) {
  const iconMap = {
    opportunity: <Briefcase color="#2563eb" />,
    grant: <Landmark color="#059669" />,
    saved: <Bookmark color="#9333ea" />,
    search: <Search color="#f59e0b" />,
    milestone: <Flag color="#ef4444" />,
    default: <CheckCircle color="#6b7280" />,
  };

  return (
    <div className={`notif-card ${viewed ? "viewed" : ""}`}>
      <div className="notif-left">
        <div className="notif-icon">{iconMap[type] || iconMap.default}</div>

        <div className="notif-body">
          <div className="notif-header">
            <span className="notif-type">
              {type?.charAt(0).toUpperCase() + type?.slice(1)}
            </span>
            <label className="notif-checkbox">
              <input type="checkbox" checked={viewed} onChange={onViewedChange} />
              <span>Viewed</span>
            </label>
          </div>

          <h3>{title}</h3>
          <p>{description}</p>

          <div className="notif-dates">
            <span>Posted: {postedDate}</span>
            {closingDate && <span>Closing: {closingDate}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
