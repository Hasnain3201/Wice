import React, { useEffect, useState } from "react";
import "./ConsultantPortal.css";
import { 
  CalendarDays, 
  FolderKanban, 
  MessageSquare, 
  LifeBuoy,
  CalendarClock 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useChat } from "../../context/ChatContext.jsx";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";

const METRIC_ICONS = {
  openProjects: FolderKanban,
  unreadMessages: MessageSquare,
  openHelpTickets: LifeBuoy,
  upcomingMeetings: CalendarDays,
  meetingsPendingApproval: CalendarClock,
};

const METRIC_LABELS = {
  openProjects: "Open Projects",
  unreadMessages: "Unread Messages",
  openHelpTickets: "Open Help Tickets",
  upcomingMeetings: "Upcoming Meetings",
  meetingsPendingApproval: "Meetings Pending Approval",
};

const METRIC_ROUTES = {
  openProjects: "/projects",
  unreadMessages: "/chat",
  openHelpTickets: "/help",
  upcomingMeetings: "/calendar",
  meetingsPendingApproval: "/calendar",
};

export default function ConsultantPortal() {
  const { user } = useAuth();
  const { unreadChatIds } = useChat();
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState({
    openProjects: 0,
    unreadMessages: 0,
    openHelpTickets: 0,
    upcomingMeetings: 0,
    meetingsPendingApproval: 0,
  });

  // Real-time listener for open projects (where user is in members array and not archived)
  useEffect(() => {
    if (!user?.uid) return;

    const projectsQuery = query(
      collection(db, "projects"),
      where("members", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        // Filter for non-archived projects
        const activeProjects = snapshot.docs.filter(doc => {
          const data = doc.data();
          return !data.archived && data.status !== "archived";
        });
        
        setMetrics((prev) => ({
          ...prev,
          openProjects: activeProjects.length,
        }));
      },
      (error) => {
        console.error("Error listening to projects:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Real-time listener for open help tickets
  useEffect(() => {
    if (!user?.uid) return;

    const ticketsQuery = query(
      collection(db, "helpTickets"),
      where("userId", "==", user.uid),
      where("status", "==", "unsolved")
    );

    const unsubscribe = onSnapshot(
      ticketsQuery,
      (snapshot) => {
        setMetrics((prev) => ({
          ...prev,
          openHelpTickets: snapshot.size,
        }));
      },
      (error) => {
        console.error("Error listening to help tickets:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Real-time listener for upcoming confirmed meetings (within 2 weeks)
  useEffect(() => {
    if (!user?.uid) return;

    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Query for confirmed bookings where this user is the consultant
    const upcomingMeetingsQuery = query(
      collection(db, "bookings"),
      where("consultantId", "==", user.uid),
      where("confirmedAt", "!=", null) // This checks if the meeting is confirmed
    );

    const unsubscribe = onSnapshot(
      upcomingMeetingsQuery,
      (snapshot) => {
        // Filter for meetings within the next 2 weeks
        const upcomingCount = snapshot.docs.filter(doc => {
          const data = doc.data();
          
          // Convert startTime to Date if it's a Timestamp
          let startTime;
          if (data.startTime && typeof data.startTime.toDate === 'function') {
            startTime = data.startTime.toDate();
          } else if (data.startTime instanceof Date) {
            startTime = data.startTime;
          } else if (typeof data.startTime === 'number') {
            startTime = new Date(data.startTime);
          } else {
            return false;
          }
          
          // Check if meeting is within the next 2 weeks
          return startTime >= now && startTime <= twoWeeksFromNow;
        }).length;
        
        setMetrics((prev) => ({
          ...prev,
          upcomingMeetings: upcomingCount,
        }));
      },
      (error) => {
        console.error("Error listening to upcoming meetings:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Real-time listener for meetings pending approval
  useEffect(() => {
    if (!user?.uid) return;

    const pendingMeetingsQuery = query(
      collection(db, "bookings"),
      where("consultantId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      pendingMeetingsQuery,
      (snapshot) => {
        setMetrics((prev) => ({
          ...prev,
          meetingsPendingApproval: snapshot.size,
        }));
      },
      (error) => {
        console.error("Error listening to pending meetings:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Update unread messages count from ChatContext
  useEffect(() => {
    setMetrics((prev) => ({
      ...prev,
      unreadMessages: unreadChatIds?.length || 0,
    }));
  }, [unreadChatIds]);

  const metricEntries = Object.entries(METRIC_LABELS).map(
    ([metricKey, label]) => ({
      key: metricKey,
      label,
      value: metrics[metricKey] ?? 0,
      route: METRIC_ROUTES[metricKey],
      icon: METRIC_ICONS[metricKey] || FolderKanban,
    })
  );

  const handleNavigate = (route) => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="dashboard-page consultant-portal">
      <header className="dashboard-header consultant-header">
        <h2>Consultant Workspace</h2>
        <p>Track your projects, communications, and schedule in one place.</p>
      </header>

      <section className="consultant-metrics">
        {metricEntries.map(({ key, label, value, route, icon }) => (
          <MetricCard
            key={key}
            icon={icon}
            label={label}
            value={value}
            route={route}
            onNavigate={handleNavigate}
          />
        ))}
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, route, onNavigate }) {
  return (
    <div className="consultant-metric">
      <div className="metric-icon" aria-hidden="true">
        {React.createElement(icon, { size: 22 })}
      </div>
      <div className="metric-content">
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        <button 
          className="metric-button"
          onClick={() => onNavigate(route)}
          aria-label={`Go to ${label}`}
        >
          View Details
        </button>
      </div>
    </div>
  );
}