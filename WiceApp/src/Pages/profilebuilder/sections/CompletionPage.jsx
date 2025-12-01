// src/ProfileBuilder/sections/CompletionPage.jsx
import { useState } from "react";
import "../ProfileBuilder.css";
import SectionDropdown from "../componentsPB/SectionDropdown";
import { saveUserProfile } from "../../../services/userProfile";
import { useAuth } from "../../../context/AuthContext";

const EXPERIENCE_BUCKET_MAP = {
  "Less than 2": 1,
  "2-4": 3,
  "5-7": 6,
  "8-10": 9,
  "11-14": 12,
  "15-20": 17,
  "20+": 22,
};

function normalizeList(value) {
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

function parseExperienceBucket(bucket) {
  if (!bucket) return null;
  const normalized = EXPERIENCE_BUCKET_MAP[bucket];
  if (normalized) return normalized;
  const numeric = Number(bucket);
  return Number.isFinite(numeric) ? numeric : null;
}

function flattenMapValues(map = {}) {
  return Object.values(map)
    .flat()
    .filter(Boolean);
}

const hasContent = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  return Boolean(value);
};

const pickValue = (next, fallback) => (hasContent(next) ? next : fallback);

export default function CompletionPage({ profileData, onNextFull, onSave }) {
  const { user, refreshProfile, profile: authProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const normalizePayload = () => {
    const existingProfile = authProfile?.profile || {};
    const existingFullName = authProfile?.fullName || "";
    const existingHeadline = authProfile?.headline || "";
    const existingTitle = authProfile?.title || existingProfile.title || "";
    const existingLocation = authProfile?.location || existingProfile.location || "";

    const industriesList = normalizeList(profileData.industries);
    const industries =
      industriesList.length > 0 ? industriesList : normalizeList(existingProfile.industries);

    const sectorsMap = profileData.sectorsByIndustry || {};
    const subsectorMap = profileData.subsectorsBySector || {};
    const sectorList = flattenMapValues(sectorsMap);
    const subsectorList = flattenMapValues(subsectorMap);

    const sectors =
      sectorList.length > 0 ? sectorList : normalizeList(existingProfile.sectors);
    const subsectors =
      subsectorList.length > 0
        ? subsectorList
        : flattenMapValues(existingProfile.subsectorsBySector || {}) ||
          existingProfile.subsectors ||
          [];

    const languagesList = normalizeList(profileData.languages);
    const languages =
      languagesList.length > 0 ? languagesList : normalizeList(existingProfile.languages);

    const openToTravelValue =
      profileData.openToTravel === "Yes"
        ? true
        : profileData.openToTravel === "No"
        ? false
        : null;

    const experienceBucket =
      pickValue(
        profileData.totalYearsExperience,
        existingProfile.experienceBucket || existingProfile.totalYearsExperience || ""
      ) || "";
    const experienceYears =
      parseExperienceBucket(experienceBucket) ??
      existingProfile.experienceYears ??
      null;
    const dailyRateNumber = Number(profileData.dailyRate);

    const pronounsValue =
      profileData.pronouns === "Self describe"
        ? profileData.customPronouns || ""
        : profileData.pronouns || "";

    const normalizedFullName = pickValue(
      profileData.fullName?.trim(),
      existingFullName
    );

    const sectorsByIndustry = hasContent(sectorsMap)
      ? sectorsMap
      : existingProfile.sectorsByIndustry || {};
    const subsectorsBySector = hasContent(subsectorMap)
      ? subsectorMap
      : existingProfile.subsectorsBySector || {};

    return {
      fullName: normalizedFullName,
      title: pickValue(profileData.title, existingTitle),
      location: pickValue(profileData.location, existingLocation),
      headline: pickValue(profileData.oneLinerBio, existingHeadline),
      profile: {
        ...existingProfile,
        fullName: normalizedFullName,
        title: pickValue(profileData.title, existingProfile.title || ""),
        location: pickValue(profileData.location, existingProfile.location || ""),
        pronouns: pickValue(pronounsValue, existingProfile.pronouns || ""),
        customPronouns:
          profileData.pronouns === "Self describe"
            ? pickValue(profileData.customPronouns, existingProfile.customPronouns || "")
            : existingProfile.customPronouns || "",
        timeZone: pickValue(profileData.timeZone, existingProfile.timeZone || ""),
        oneLinerBio: pickValue(profileData.oneLinerBio, existingProfile.oneLinerBio || ""),
        about: pickValue(profileData.about, existingProfile.about || ""),
        totalYearsExperience: pickValue(
          profileData.totalYearsExperience,
          existingProfile.totalYearsExperience || ""
        ),
        experienceBucket,
        experienceYears,
        linkedinUrl: pickValue(profileData.linkedinUrl, existingProfile.linkedinUrl || ""),
        industries: industries || [],
        sectors: sectors || [],
        sectorsByIndustry,
        subsectorsBySector,
        subsectors: subsectors || [],
        languages: languages || [],
        currency: pickValue(profileData.currency, existingProfile.currency || "USD"),
        dailyRate: Number.isFinite(dailyRateNumber)
          ? dailyRateNumber
          : existingProfile.dailyRate ?? null,
        availabilityStatus: pickValue(
          profileData.availabilityStatus,
          existingProfile.availabilityStatus || ""
        ),
        availabilityNote:
          profileData.availabilityStatus === "not_currently_available"
            ? profileData.availabilityNote || ""
            : existingProfile.availabilityNote || "",
        openToTravel: openToTravelValue ?? existingProfile.openToTravel ?? null,
      },
    };
  };

  async function persistLightProfile() {
    const uid = user?.uid;
    if (!uid) {
      setError("You must be signed in to save your profile.");
      return false;
    }

    const payload = normalizePayload();
    if (!payload.fullName || !payload.profile.oneLinerBio || !payload.profile.about) {
      setError("Please complete all required sections before saving.");
      return false;
    }

    setSaving(true);
    setError("");
    try {
      await saveUserProfile(uid, {
        ...payload,
        phaseLightCompleted: true,
        consultantLightCompleted: true,
      });
      if (typeof refreshProfile === "function") {
        await refreshProfile();
      }
      return true;
    } catch (err) {
      console.error("Failed to save light profile:", err);
      setError(err?.message || "Unable to save your profile right now.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  const handleSaveAndExit = async () => {
    const ok = await persistLightProfile();
    if (ok) onSave();
  };

  const handleSaveAndContinue = async () => {
    const ok = await persistLightProfile();
    if (ok) onNextFull();
  };

  const identityBasics = {
    "Full Name": profileData.fullName,
    "Role / Title": profileData.title,
    Location: profileData.location,
    Pronouns:
      profileData.pronouns === "Self describe"
        ? profileData.customPronouns || ""
        : profileData.pronouns,
    "Time Zone": profileData.timeZone,
  };

  const professionalIdentity = {
    "Professional Headline": profileData.oneLinerBio,
    "Short Bio": profileData.about,
    "Total Years Experience": profileData.totalYearsExperience,
    "LinkedIn URL": profileData.linkedinUrl,
  };

  const sectorsGrouped = profileData.sectorsByIndustry || {};
  const sectorsSummary = Object.keys(sectorsGrouped).length
    ? Object.entries(sectorsGrouped)
        .map(
          ([industry, sectors]) =>
            `${industry}: ${(sectors || []).join(", ") || "—"}`
        )
        .join(" | ")
    : (profileData.sectors || []).join(", ");
  const flattenedSubsectors = flattenMapValues(
    profileData.subsectorsBySector || {}
  );
  const subsectorsSummary = flattenedSubsectors.length
    ? flattenedSubsectors.join(", ")
    : (profileData.subsectors || []).join(", ");

  const expertiseSnapshot = {
    Industries: profileData.industries?.join(", "),
    Sectors: sectorsSummary,
    Subsectors: subsectorsSummary,
    Languages: profileData.languages?.join(", "),
  };

  const workPreferences = {
    "Daily Rate": profileData.dailyRate
      ? `${profileData.currency} ${profileData.dailyRate}`
      : "",
    "Availability Status":
      profileData.availabilityStatus === "available_now"
        ? "Available now"
        : profileData.availabilityStatus === "not_currently_available"
        ? "Not currently available"
        : "",
    "Availability Note":
      profileData.availabilityStatus === "not_currently_available"
        ? profileData.availabilityNote || "—"
        : "",
    "Open to Travel": profileData.openToTravel,
  };

  return (
    <div className="section">
      <h2>Light Profile Completion</h2>
      <p>Review the information below. You can update anything later.</p>

      <SectionDropdown title="Identity Basics" data={identityBasics} />
      <SectionDropdown title="Professional Identity" data={professionalIdentity} />
      <SectionDropdown title="Expertise Snapshot" data={expertiseSnapshot} />
      <SectionDropdown title="Work Preferences" data={workPreferences} />

      <div className="section-actions">
        <button className="back" onClick={handleSaveAndExit} disabled={saving}>
          {saving ? "Saving…" : "Save & Return Home"}
        </button>

        <button className="next" onClick={handleSaveAndContinue} disabled={saving}>
          Continue to Full Profile
        </button>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}
    </div>
  );
}
