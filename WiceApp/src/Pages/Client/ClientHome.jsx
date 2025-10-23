import React from "react";
import { useNavigate } from "react-router-dom";
import "./ClientHome.css";
import { CalendarDays, MessageSquare, Search } from "lucide-react";

export default function ClientHome() {
  const userName = "Jane Doe";
  const navigate = useNavigate();

  return (
    <div className="dashboard-page c-home-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Welcome, {userName}!</h1>
        <p className="dashboard-subtitle">Your personalized Wice client dashboard</p>
      </header>

      <div className="c-home-tiles">
        <div className="c-home-card">
          <CalendarDays className="c-home-icon" />
          <h3>Book a Consultation</h3>
          <p>Schedule sessions with energy, climate, and health consultants.</p>
          <button
            className="c-home-btn"
            type="button"
            onClick={() => navigate("/calendar")}
          >
            Schedule
          </button>
        </div>

        <div className="c-home-card">
          <MessageSquare className="c-home-icon" />
          <h3>View Messages</h3>
          <p>Stay connected with advisors through your secure chat portal.</p>
          <button
            className="c-home-btn"
            type="button"
            onClick={() => navigate("/chat")}
          >
            Open Chat
          </button>
        </div>

        <div className="c-home-card">
          <Search className="c-home-icon" />
          <h3>Explore Consultants</h3>
          <p>Browse vetted experts across environment, energy, and policy.</p>
          <button
            className="c-home-btn"
            type="button"
            onClick={() => navigate("/marketplace")}
          >
            Go to Marketplace
          </button>
        </div>
      </div>

      <section className="c-home-section">
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
      </section>

      <section className="c-home-section">
        <h2>Recent Updates</h2>
        <ul className="c-home-list">
          <li>🔔 New consultant added: Schala Battle</li>
          <li>📅 Consultation with Robert Layng confirmed.</li>
          <li>💬 You have 2 unread messages in chat.</li>
        </ul>
      </section>
    </div>
  );
}
