import React from "react";
import "./ConsultantPortal.css";
import { CalendarDays, Briefcase, MessageSquare, Target } from "lucide-react";

const upcoming = [
  { id: 1, date: "Oct 20", client: "Coastal Resilience Org", topic: "Energy Transition Strategy" },
  { id: 2, date: "Oct 24", client: "Global Health Alliance", topic: "Climate & Health Workshop" },
];

const leads = [
  { id: 1, title: "Infrastructure Resilience RFP", status: "Proposal due 11/02", value: "$120k" },
  { id: 2, title: "Community Solar Deployment", status: "Intro call scheduled", value: "$45k" },
];

export default function ConsultantPortal() {
  return (
    <div className="consultant-portal">
      <header className="consultant-header">
        <h2>Consultant Workspace</h2>
        <p>Track your engagements, opportunities, and workflow in one place.</p>
      </header>

      <section className="consultant-metrics">
        <MetricCard
          icon={Briefcase}
          label="Active Engagements"
          value="4"
          hint="+1 new this week"
        />
        <MetricCard
          icon={CalendarDays}
          label="Upcoming Sessions"
          value="3"
          hint="Next on Oct 20"
        />
        <MetricCard
          icon={Target}
          label="Open Proposals"
          value="5"
          hint="2 awaiting client review"
        />
        <MetricCard
          icon={MessageSquare}
          label="Unread Messages"
          value="2"
          hint="Follow up today"
        />
      </section>

      <div className="consultant-grid">
        <section className="consultant-panel">
          <h3>Upcoming Consultations</h3>
          <ul className="consultant-list">
            {upcoming.map((item) => (
              <li key={item.id}>
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
            {leads.map((lead) => (
              <li key={lead.id}>
                <div>
                  <p className="consultant-client">{lead.title}</p>
                  <p className="consultant-topic">{lead.status}</p>
                </div>
                <span className="consultant-value">{lead.value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="consultant-metric">
      <div className="metric-icon" aria-hidden="true">
        <Icon size={22} />
      </div>
      <div>
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        <p className="metric-hint">{hint}</p>
      </div>
    </div>
  );
}
