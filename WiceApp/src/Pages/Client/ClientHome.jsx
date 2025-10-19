import React from "react";
import "./ClientHome.css";
import { CalendarDays, MessageSquare, Search } from "lucide-react";

export default function ClientHome() {
  const userName = "Jane Doe";

  return (
    <div className="c-home-container">
      {/* Top welcome section */}
      <div className="c-home-header">
        <h1>Welcome, {userName}!</h1>
        <p>Your personalized Wice client dashboard</p>
      </div>

      {/* Action cards row */}
      <div className="c-home-tiles">
        <div className="c-home-card">
          <CalendarDays className="c-home-icon" />
          <h3>Book a Consultation</h3>
          <p>Schedule sessions with energy, climate, and health consultants.</p>
          <button className="c-home-btn">Schedule</button>
        </div>

        <div className="c-home-card">
          <MessageSquare className="c-home-icon" />
          <h3>View Messages</h3>
          <p>Stay connected with advisors through your secure chat portal.</p>
          <button className="c-home-btn">Open Chat</button>
        </div>

        <div className="c-home-card">
          <Search className="c-home-icon" />
          <h3>Explore Consultants</h3>
          <p>Browse vetted experts across environment, energy, and policy.</p>
          <button className="c-home-btn">Go to Marketplace</button>
        </div>
      </div>

      {/* Upcoming appointments / recent activity */}
      <div className="c-home-section">
        <h2>Upcoming Consultations</h2>
        <div className="c-home-table">
          <div className="c-home-row header">
            <span>Date</span>
            <span>Consultant</span>
            <span>Topic</span>
          </div>
          <div className="c-home-row">
            <span>10/20/2025</span>
            <span>Jeremy Foster</span>
            <span>Community Energy</span>
          </div>
          <div className="c-home-row">
            <span>10/24/2025</span>
            <span>Sara Calvert</span>
            <span>Environmental Policy</span>
          </div>
        </div>
      </div>

      {/* Notifications / updates */}
      <div className="c-home-section">
        <h2>Recent Updates</h2>
        <ul className="c-home-list">
          <li>🔔 New consultant added: Schala Battle</li>
          <li>📅 Consultation with Robert Layng confirmed.</li>
          <li>💬 You have 2 unread messages in chat.</li>
        </ul>
      </div>
    </div>
  );
}

