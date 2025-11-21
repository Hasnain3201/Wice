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
  recentUpdates: [],
  upcoming: []
};

export const defaultConsultantDashboard = {
  metrics: {
    engagements: 0,
    openProposals: 0,
    unreadMessages: 0,
    upcomingSessions: 0
  },
  pipeline: [],
  upcoming: []
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
  const data = {
    phaseLightCompleted: false,
    phaseFullCompleted: false,
  };

  if (accountType === "client") {
    data.profile = { ...clientProfileDefaults };
    data.dashboardClient = JSON.parse(JSON.stringify(defaultClientDashboard));
    data.clientLightCompleted = false;
    data.clientFullCompleted = false;
  }

  if (accountType === "consultant") {
    data.profile = { ...consultantProfileDefaults }; // untouched
    data.dashboardConsultant = JSON.parse(JSON.stringify(defaultConsultantDashboard));
    data.consultantLightCompleted = false;
    data.consultantFullCompleted = false;
  }

  // Always include hiddenChats
  data.hiddenChats = {};

  return data;
}
