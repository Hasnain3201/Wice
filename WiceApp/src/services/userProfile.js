import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export function userDocRef(uid) {
  return doc(db, "users", uid);
}

export async function fetchUserProfile(uid) {
  const ref = userDocRef(uid);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveUserProfile(uid, data) {
  if (!uid) throw new Error("Missing uid for profile update");
  const payload = {
    ...data,
    profileUpdatedAt: serverTimestamp(),
  };
  await setDoc(userDocRef(uid), payload, { merge: true });
}

const defaultClientDashboard = {
  upcoming: [
    {
      id: "client-1",
      date: "10/20/2025",
      consultant: "Jeremy Foster",
      topic: "Community Energy",
    },
    {
      id: "client-2",
      date: "10/24/2025",
      consultant: "Sara Calvert",
      topic: "Environmental Policy",
    },
  ],
  recentUpdates: [
    { id: "update-1", icon: "🔔", text: "New consultant added: Schala Battle" },
    { id: "update-2", icon: "📅", text: "Consultation with Robert Layng confirmed." },
    { id: "update-3", icon: "💬", text: "You have 2 unread messages in chat." },
  ],
};

const defaultConsultantDashboard = {
  metrics: {
    engagements: 4,
    upcomingSessions: 3,
    openProposals: 5,
    unreadMessages: 2,
  },
  upcoming: [
    {
      id: "consultant-1",
      date: "Oct 20",
      client: "Coastal Resilience Org",
      topic: "Energy Transition Strategy",
    },
    {
      id: "consultant-2",
      date: "Oct 24",
      client: "Global Health Alliance",
      topic: "Climate & Health Workshop",
    },
  ],
  pipeline: [
    {
      id: "pipeline-1",
      title: "Infrastructure Resilience RFP",
      status: "Proposal due 11/02",
      value: "$120k",
    },
    {
      id: "pipeline-2",
      title: "Community Solar Deployment",
      status: "Intro call scheduled",
      value: "$45k",
    },
  ],
};

export function buildDefaultUserData(accountType) {
  if (accountType === "client") {
    return {
      organization: "",
      location: "",
      sectors: [],
      languages: "",
      about: "",
      photoUrl: "",
      dashboardClient: {
        upcoming: [...defaultClientDashboard.upcoming],
        recentUpdates: [...defaultClientDashboard.recentUpdates],
      },
      hiddenChats: {},
    };
  }

  if (accountType === "consultant") {
    return {
      title: "",
      location: "",
      focusAreas: [],
      regions: "",
      about: "",
      photoUrl: "",
      languages: "",
      dashboardConsultant: {
        metrics: { ...defaultConsultantDashboard.metrics },
        upcoming: [...defaultConsultantDashboard.upcoming],
        pipeline: [...defaultConsultantDashboard.pipeline],
      },
      hiddenChats: {},
    };
  }

  return {};
}

export { defaultClientDashboard, defaultConsultantDashboard };
