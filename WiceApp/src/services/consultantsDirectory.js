import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const usersCollection = collection(db, "users");

function normalizeArrayField(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry?.value) return String(entry.value).trim();
        if (entry?.label) return String(entry.label).trim();
        return null;
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

const EXPERIENCE_BUCKET_MAP = {
  "Less than 2": 1,
  "2-4": 3,
  "5-7": 6,
  "8-10": 9,
  "11-14": 12,
  "15-20": 17,
  "20+": 22,
};

function parseExperienceValue(value) {
  if (typeof value === "number") return value;
  if (!value) return null;
  if (EXPERIENCE_BUCKET_MAP[value]) return EXPERIENCE_BUCKET_MAP[value];
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeConsultantRecord(snapshot) {
  const data = snapshot.data() || {};
  const profile = data.profile || {};
  const industries = normalizeArrayField(
    Array.isArray(profile.industries)
      ? profile.industries
      : profile.focusAreas
  );
  const sectors = normalizeArrayField(
    profile.sectors || profile.experienceRegions || []
  );
  const subsectors = normalizeArrayField(profile.subsectors || []);
  const functionalAreas = normalizeArrayField(
    profile.functionalAreas || profile.focusAreas || []
  );
  const functionalSkills = normalizeArrayField(
    profile.functionalSkills || profile.capabilitiesList || profile.skills || []
  );
  const languages = normalizeArrayField(profile.languages);
  const softwareTools = normalizeArrayField(profile.softwareTools || []);
  const donors = normalizeArrayField(profile.donorExperience || []);
  const certifications = normalizeArrayField(profile.certifications || []);
  const degrees = normalizeArrayField(
    profile.degrees || (profile.highestDegree ? [profile.highestDegree] : [])
  );
  const securityClearances = normalizeArrayField(
    profile.securityClearances || []
  );

  const dailyRate =
    typeof profile.dailyRate === "number"
      ? profile.dailyRate
      : Number(profile.dailyRate);

  const name =
    data.fullName ||
    profile.fullName ||
    data.displayName ||
    data.email ||
    "Consultant";

  return {
    id: snapshot.id,
    name,
    email: data.email || profile.email || "",
    location: profile.location || data.location || "",
    country: profile.country || data.country || "",
    headline: profile.oneLinerBio || data.headline || "",
    profile,
    industries,
    sectors,
    subsectors,
    functionalAreas,
    functionalSkills,
    languages,
    softwareTools,
    donorExperience: donors,
    certifications,
    degrees,
    securityClearances,
    timeZone: profile.timeZone || "",
    dailyRate: Number.isFinite(dailyRate) ? dailyRate : null,
    availability: profile.availability || "",
    yearsOfExperience: parseExperienceValue(
      profile.experienceYears || profile.experienceBucket || profile.totalYearsExperience
    ),
    experienceBucket:
      profile.experienceBucket || profile.totalYearsExperience || "",
    openToTravel:
      profile.openToTravel === true
        ? "Yes"
        : profile.openToTravel === false
        ? "No"
        : "",
    resumeUrl: profile.resumeFile || null,
  };
}

export function subscribeToConsultants(callback, onError) {
  const q = query(
    usersCollection,
    where("accountType", "==", "consultant"),
    where("phaseLightCompleted", "==", true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs
        .map(normalizeConsultantRecord)
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(entries);
    },
    onError
  );
}

export async function fetchConsultantById(id) {
  if (!id) return null;
  const ref = doc(usersCollection, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return normalizeConsultantRecord(snapshot);
}
