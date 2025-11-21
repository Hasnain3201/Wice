import React from "react";
import { useNavigate } from "react-router-dom";
import "./ClientHome.css";
import { CalendarDays, MessageSquare, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ClientHome() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const name = profile?.fullName || user?.displayName || "Client";
  const dashboard = profile?.dashboardClient || {};
  const upcomingConsultations = dashboard.upcoming || [];
  const recentUpdates = dashboard.recentUpdates || [];

  return (
    <div className="dashboard-page c-home-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Welcome, {name}!</h1>
        <p className="dashboard-subtitle">Your personalized WICE client dashboard</p>
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
        {upcomingConsultations.length === 0 ? (
          <p className="c-home-empty">No consultations scheduled yet.</p>
        ) : (
          <div className="c-home-table">
            <div className="c-home-row header">
              <span>Date</span>
              <span>Consultant</span>
              <span>Topic</span>
            </div>
            {upcomingConsultations.map((item) => (
              <div className="c-home-row" key={item.id || `${item.date}-${item.consultant}`}>
                <span>{item.date}</span>
                <span>{item.consultant}</span>
                <span>{item.topic}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="c-home-section">
        <h2>Recent Updates</h2>
        {recentUpdates.length === 0 ? (
          <p className="c-home-empty">Updates from your engagements will appear here.</p>
        ) : (
          <ul className="c-home-list">
            {recentUpdates.map((item) => (
              <li key={item.id || item.text}>
                {item.icon ? `${item.icon} ` : ""}
                {item.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
