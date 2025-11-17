// src/data/userProfile.js

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/* ---------------------------------------------
   REFERENCE
--------------------------------------------- */
export function userDocRef(uid) {
  return doc(db, "users", uid);
}

/* ---------------------------------------------
   FETCH USER PROFILE
--------------------------------------------- */
export async function fetchUserProfile(uid) {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

/* ---------------------------------------------
   SAVE USER PROFILE (MERGE-SAFE)
--------------------------------------------- */
export async function saveUserProfile(uid, data) {
  if (!uid) throw new Error("Missing uid for profile update");

  await setDoc(
    userDocRef(uid),
    {
      ...data,
      profileUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ---------------------------------------------
   DASHBOARD DATA (STATIC)
--------------------------------------------- */
export const defaultClientDashboard = {
  recentUpdates: [
    { id: "update-1", icon: "🔔", text: "New consultant added: Schala Battle" },
    { id: "update-2", icon: "📅", text: "Consultation with Robert Layng confirmed." },
    { id: "update-3", icon: "💬", text: "You have 2 unread messages in chat." }
  ],
  upcoming: [
    {
      id: "client-1",
      consultant: "Jeremy Foster",
      topic: "Community Energy",
      date: "10/20/2025"
    },
    {
      id: "client-2",
      consultant: "Sara Calvert",
      topic: "Environmental Policy",
      date: "10/24/2025"
    }
  ]
};

export const defaultConsultantDashboard = {
  metrics: {
    engagements: 4,
    openProposals: 5,
    unreadMessages: 2,
    upcomingSessions: 3
  },
  pipeline: [
    {
      id: "pipeline-1",
      title: "Infrastructure Resilience RFP",
      status: "Proposal due 11/02",
      value: "$120k"
    },
    {
      id: "pipeline-2",
      title: "Community Solar Deployment",
      status: "Intro call scheduled",
      value: "$45k"
    }
  ],
  upcoming: [
    {
      id: "consultant-1",
      client: "Coastal Resilience Org",
      topic: "Energy Transition Strategy",
      date: "Oct 20"
    },
    {
      id: "consultant-2",
      client: "Global Health Alliance",
      topic: "Climate & Health Workshop",
      date: "Oct 24"
    }
  ]
};

/* ---------------------------------------------
   ONLY CLIENT DEFAULT FIELDS UPDATED
--------------------------------------------- */
const clientProfileDefaults = {
  jobTitle: "",
  organizationName: "",
  organizationType: "",
  primaryIndustry: "",
  country: "",
  websiteUrl: "",

  supportSelections: [],   // e.g. ["MEL (Advisory)"]

  timeZone: "",
  contactMethods: [],       // ["Email", "Phone", "WhatsApp"]
  phoneNumber: "",
  whatsappNumber: "",
};

/* ---------------------------------------------
   CONSULTANT DEFAULTS — DO NOT TOUCH
--------------------------------------------- */
const consultantProfileDefaults = {
  pronouns: "",
  timeZone: "",
  oneLinerBio: "",
  about: "",
  totalYearsExperience: "",
  linkedinUrl: "",
  industries: [],
  languages: [],
  dailyRate: "",
  availability: "",
  openToTravel: false,
  regions: [],
  donorExperience: [],
  skills: [],
  highestDegree: "",
  institution: "",
  resumeFile: null,
  additionalFiles: []
};

/* ---------------------------------------------
   DEFAULT USER DATA BUILDER
--------------------------------------------- */
export function buildDefaultUserData(accountType) {
  const data = {};

  if (accountType === "client") {
    data.profile = { ...clientProfileDefaults };
    data.dashboardClient = JSON.parse(JSON.stringify(defaultClientDashboard));
  }

  if (accountType === "consultant") {
    data.profile = { ...consultantProfileDefaults }; // untouched
    data.dashboardConsultant = JSON.parse(JSON.stringify(defaultConsultantDashboard));
  }

  // Always include hiddenChats
  data.hiddenChats = {};

  return data;
}
