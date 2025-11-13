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

  const metricEntries =
    Object.keys(metrics).length === 0
      ? [
          {
            key: "placeholder",
            label: "Metrics coming soon",
            value: "—",
            hint: "Connect your pipeline to see live stats.",
            icon: Briefcase,
          },
        ]
      : Object.entries(METRIC_LABELS).map(([metricKey, label]) => ({
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
        }));

  const upcomingList =
    upcomingConsultations.length > 0
      ? upcomingConsultations
      : [
          {
            id: "placeholder",
            date: "—",
            client: "No sessions scheduled",
            topic: "Add bookings to see them here.",
          },
        ];

  const pipelineList =
    pipeline.length > 0
      ? pipeline
      : [
          {
            id: "pipeline-placeholder",
            title: "Your pipeline is empty",
            status: "Track prospects to monitor progress.",
            value: "",
          },
        ];

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
          <ul className="consultant-list">
            {upcomingList.map((item) => (
              <li key={item.id || `${item.date}-${item.client}`}>
                <span className="consultant-date">{item.date}</span>
                <div>
                  <p className="consultant-client">{item.client}</p>
                  <p className="consultant-topic">{item.topic}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="consultant-panel">
          <h3>Pipeline Highlights</h3>
          <ul className="consultant-list">
            {pipelineList.map((lead) => (
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
