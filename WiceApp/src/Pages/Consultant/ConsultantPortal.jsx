import React from "react";
import "./ConsultantPortal.css";
import { CalendarDays, Briefcase, MessageSquare, Target } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const METRIC_ICONS = {
  engagements: Briefcase,
  upcomingSessions: CalendarDays,
  openProposals: Target,
  unreadMessages: MessageSquare,
};

const METRIC_LABELS = {
  engagements: "Active Engagements",
  upcomingSessions: "Upcoming Sessions",
  openProposals: "Open Proposals",
  unreadMessages: "Unread Messages",
};

export default function ConsultantPortal() {
  const { profile, user } = useAuth();

  const name = profile?.fullName || user?.displayName || "Consultant";
  const dashboard = profile?.dashboardConsultant || {};
  const metrics = dashboard.metrics || {};
  const upcomingConsultations = dashboard.upcoming || [];
  const pipeline = dashboard.pipeline || [];

  const metricEntries = Object.entries(METRIC_LABELS).map(
    ([metricKey, label]) => ({
      key: metricKey,
      label,
      value: metrics[metricKey] ?? 0,
      hint:
        metricKey === "engagements"
          ? "+ keep nurturing client relationships"
          : metricKey === "upcomingSessions"
          ? "Check your availability"
          : metricKey === "openProposals"
          ? "Follow up with prospects"
          : "Stay responsive to requests",
      icon: METRIC_ICONS[metricKey] || Briefcase,
    })
  );

  return (
    <div className="dashboard-page consultant-portal">
      <header className="dashboard-header consultant-header">
        <h1 className="dashboard-title">Consultant Workspace</h1>
        <p>Track your engagements, opportunities, and workflow in one place.</p>
      </header>

      <section className="consultant-metrics">
        {metricEntries.map(({ key, label, value, hint, icon }) => (
          <MetricCard
            key={key}
            icon={icon}
            label={label}
            value={value}
            hint={hint}
          />
        ))}
      </section>

      <div className="consultant-grid">
        <section className="consultant-panel">
          <h3>Upcoming Consultations</h3>
          {upcomingConsultations.length === 0 ? (
            <p className="consultant-topic">
              No sessions scheduled yet. New bookings will appear here.
            </p>
          ) : (
            <ul className="consultant-list">
              {upcomingConsultations.map((item) => (
                <li key={item.id || `${item.date}-${item.client}`}>
                  <span className="consultant-date">{item.date}</span>
                  <div>
                    <p className="consultant-client">{item.client}</p>
                    <p className="consultant-topic">{item.topic}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="consultant-panel">
          <h3>Pipeline Highlights</h3>
          {pipeline.length === 0 ? (
            <p className="consultant-topic">
              No pipeline items yet. Track proposals and deals here.
            </p>
          ) : (
            <ul className="consultant-list">
              {pipeline.map((lead) => (
                <li key={lead.id || lead.title}>
                  <div>
                    <p className="consultant-client">{lead.title}</p>
                    <p className="consultant-topic">{lead.status}</p>
                  </div>
                  {lead.value ? (
                    <span className="consultant-value">{lead.value}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="consultant-footer">
        Welcome back, {name}. Keep your profile and pipeline current to match
        with the right clients faster.
      </footer>
    </div>
  );
}

function MetricCard({ icon, label, value, hint }) {
  return (
    <div className="consultant-metric">
      <div className="metric-icon" aria-hidden="true">
        {React.createElement(icon, { size: 22 })}
      </div>
      <div>
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        <p className="metric-hint">{hint}</p>
      </div>
    </div>
  );
}
