// src/Pages/profilebuilder/sections/CompletionConfirmation.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionDropdown from "../componentsPB/SectionDropdown";
import "../ProfileBuilder.css";

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

function flattenList(source) {
  if (!source) return "";
  if (Array.isArray(source)) {
    return source.join(", ");
  }
  return Object.values(source)
    .flat()
    .filter(Boolean)
    .join(", ");
}

function formatEducation(entries) {
  if (!Array.isArray(entries) || !entries.length) return "";
  return entries
    .map((entry) => {
      const degree = entry?.degree?.trim();
      const institution = entry?.institution?.trim();
      if (!degree && !institution) return null;
      return [degree, institution].filter(Boolean).join(" — ");
    })
    .filter(Boolean)
    .join("; ");
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

export default function CompletionConfirmation({
  profileData,
  onBack,
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { user, refreshProfile, profile: authProfile } = useAuth();
  const navigate = useNavigate();

  // Save full profile, show confirmation, then redirect
  async function handleSubmitProfile() {
    const uid = user?.uid;
    if (!uid) return;

    const existingProfile = authProfile?.profile || {};
    const existingFullName = authProfile?.fullName || "";
    const existingTitle = authProfile?.title || existingProfile.title || "";

    const industriesList = normalizeList(profileData.industries);
    const industries =
      industriesList.length > 0
        ? industriesList
        : normalizeList(existingProfile.industries);

    const sectorsList = normalizeList(profileData.sectors);
    const sectors =
      sectorsList.length > 0 ? sectorsList : normalizeList(existingProfile.sectors);

    const languagesList = normalizeList(profileData.languages);
    const languages =
      languagesList.length > 0
        ? languagesList
        : normalizeList(existingProfile.languages);

    const donorExperienceList = normalizeList(profileData.donorExperience);
    const donorExperience =
      donorExperienceList.length > 0
        ? donorExperienceList
        : normalizeList(existingProfile.donorExperience);

    const capabilitiesList = normalizeList(profileData.capabilitiesList);
    const capabilities =
      capabilitiesList.length > 0
        ? capabilitiesList
        : normalizeList(
            existingProfile.capabilitiesList || existingProfile.capabilities
          );

    const certificationsList = normalizeList(profileData.certifications);
    const certifications =
      certificationsList.length > 0
        ? certificationsList
        : normalizeList(existingProfile.certifications);

    const softwareToolsList = normalizeList(profileData.softwareTools);
    const softwareTools =
      softwareToolsList.length > 0
        ? softwareToolsList
        : normalizeList(existingProfile.softwareTools);

    const securityClearancesList = normalizeList(profileData.securityClearances);
    const securityClearances =
      securityClearancesList.length > 0
        ? securityClearancesList
        : normalizeList(existingProfile.securityClearances);

    const experienceBucket = pickValue(
      profileData.totalYearsExperience,
      existingProfile.experienceBucket || existingProfile.totalYearsExperience || ""
    );
    const experienceYears =
      parseExperienceBucket(profileData.totalYearsExperience) ??
      existingProfile.experienceYears ??
      parseExperienceBucket(existingProfile.experienceBucket) ??
      null;
    const dailyRateNumber = Number(profileData.dailyRate);
    const dailyRateValue = Number.isFinite(dailyRateNumber)
      ? dailyRateNumber
      : existingProfile.dailyRate ?? null;

    const additionalEducation =
      pickValue(profileData.additionalEducation, existingProfile.additionalEducation || []) || [];
    const additionalFiles =
      pickValue(profileData.additionalFiles, existingProfile.additionalFiles || []) || [];

    const sectorsByIndustry = hasContent(profileData.sectorsByIndustry)
      ? profileData.sectorsByIndustry
      : existingProfile.sectorsByIndustry || {};
    const subsectorsBySector = hasContent(profileData.subsectorsBySector)
      ? profileData.subsectorsBySector
      : existingProfile.subsectorsBySector || {};

    const technicalSkillsByExpertise = hasContent(profileData.technicalSkillsByExpertise)
      ? profileData.technicalSkillsByExpertise
      : existingProfile.technicalSkillsByExpertise ||
        existingProfile.functionalSkillsByExpertise ||
        {};
    const skillsList = hasContent(profileData.skills)
      ? profileData.skills
      : hasContent(profileData.capabilitiesList)
        ? profileData.capabilitiesList
        : hasContent(profileData.softwareTools)
          ? profileData.softwareTools
          : existingProfile.skills || [];

    const experienceRegions =
      pickValue(profileData.experienceRegions, existingProfile.experienceRegions || []) || [];
    const experienceCountries =
      pickValue(profileData.experienceCountries, existingProfile.experienceCountries || []) || [];

    const openToTravelValue =
      profileData.openToTravel === "Yes"
        ? true
        : profileData.openToTravel === "No"
        ? false
        : profileData.openToTravel;
    const openToTravel =
      openToTravelValue !== undefined && openToTravelValue !== null
        ? openToTravelValue
        : existingProfile.openToTravel ?? null;

    const normalizedFullName = pickValue(
      profileData.fullName?.trim(),
      existingFullName
    );
    const normalizedTitle = pickValue(
      profileData.title,
      existingTitle
    );
    const headline = pickValue(
      profileData.oneLinerBio,
      authProfile?.headline || existingProfile.oneLinerBio || ""
    );
    const location = pickValue(
      profileData.location,
      existingProfile.location || authProfile?.location || ""
    );
    const country = pickValue(
      profileData.country,
      existingProfile.country || authProfile?.country || ""
    );

    const profilePayload = {
      ...existingProfile,
      fullName: normalizedFullName,
      title: normalizedTitle,
      pronouns: pickValue(profileData.pronouns, existingProfile.pronouns || ""),
      timeZone: pickValue(profileData.timeZone, existingProfile.timeZone || ""),
      location,
      country,
      oneLinerBio: headline,
      about: pickValue(profileData.about, existingProfile.about || ""),
      totalYearsExperience: pickValue(
        profileData.totalYearsExperience,
        existingProfile.totalYearsExperience || ""
      ),
      experienceBucket: experienceBucket || "",
      experienceYears,
      linkedinUrl: pickValue(profileData.linkedinUrl, existingProfile.linkedinUrl || ""),
      industries,
      sectors,
      sectorsByIndustry,
      subsectorsBySector,
      languages,
      currency: pickValue(profileData.currency, existingProfile.currency || "USD"),
      dailyRate: dailyRateValue,
      openToTravel,
      experienceRegions,
      experienceCountries,
      donorExperience,
      functionalExpertise: pickValue(
        profileData.functionalExpertise,
        existingProfile.functionalExpertise || []
      ),
      capabilitiesList: capabilities,
      technicalSkillsByExpertise,
      skills: skillsList,
      softwareTools,
      highestDegree: pickValue(profileData.highestDegree, existingProfile.highestDegree || ""),
      institution: pickValue(profileData.institution, existingProfile.institution || ""),
      certifications,
      securityClearances,
      additionalEducation,
      resumeFile: pickValue(profileData.resumeFile, existingProfile.resumeFile || ""),
      resumeFileName: pickValue(profileData.resumeFileName, existingProfile.resumeFileName || ""),
      resumeStoragePath: pickValue(
        profileData.resumeStoragePath,
        existingProfile.resumeStoragePath || ""
      ),
      additionalFiles,
    };

    const payload = {
      fullName: normalizedFullName,
      title: normalizedTitle,
      location,
      country,
      headline,
      profile: profilePayload,
      phaseLightCompleted: true,
      phaseFullCompleted: true,
      consultantLightCompleted: true,
      consultantFullCompleted: true,
    };

    setSaving(true);
    setError("");
    try {
      await saveUserProfile(uid, payload);
      if (typeof refreshProfile === "function") {
        await refreshProfile();
      }

      alert(
        "🎉 Your profile has been successfully saved!\n\n" +
          "You can update or edit your information anytime by visiting the Profile tab on your dashboard."
      );

      navigate("/consultant/portal");
    } catch (err) {
      console.error("Failed to submit full profile:", err);
      setError(err?.message || "Unable to submit your profile right now.");
      setSaving(false);
    }
  }

  // DISPLAY GROUPS (unchanged)
  const identityBasics = {
    "Full Name": profileData.fullName,
    "Role / Title": profileData.title,
    Country: profileData.country,
    Location: profileData.location,
    Pronouns: profileData.pronouns,
    "Time Zone": profileData.timeZone,
  };

  const professionalIdentity = {
    "One-Liner Bio": profileData.oneLinerBio,
    About: profileData.about,
    "Total Years Experience": profileData.totalYearsExperience,
    "LinkedIn URL": profileData.linkedinUrl,
  };

  const expertiseSnapshot = {
    Industries: profileData.industries?.join(", "),
    Sectors: profileData.sectors?.join(", "),
    Languages: profileData.languages?.join(", "),
  };

  const workPreferences = {
    "Daily Rate": profileData.dailyRate
      ? `${profileData.currency} ${profileData.dailyRate}`
      : "",
    "Open to Travel": profileData.openToTravel,
  };

  const experienceSnapshot = {
    Regions: profileData.experienceRegions?.join(", "),
    Countries: profileData.experienceCountries?.join(", "),
    "Donor Experience": profileData.donorExperience?.join(", "),
  };

  const professionalCapabilities = {
    "Functional Expertise": profileData.functionalExpertise?.join(", "),
    "Technical Skills": flattenList(profileData.technicalSkillsByExpertise),
    Skills: profileData.skills?.join(", "),
    "Software & Tools": profileData.softwareTools?.join(", "),
  };

  const educationAndCredentials = {
    "Highest Degree": profileData.highestDegree,
    Institution: profileData.institution,
    Certifications: profileData.certifications?.join(", "),
    "Security Clearances": profileData.securityClearances?.join(", "),
    "Additional Education": formatEducation(profileData.additionalEducation),
  };

  const portfolio = {
    Resume: profileData.resumeFileName || (profileData.resumeFile ? "Uploaded" : "Not uploaded"),
    "Supporting Documents":
      profileData.additionalFiles?.length > 0
        ? profileData.additionalFiles
            .map((file) => file.name || "Document")
            .join(", ")
        : "None",
  };

  return (
    <div className="section">
      <h2>Full Profile Completion</h2>
      <p>Review everything below before submitting your profile.</p>

      {/* LIGHT PROFILE */}
      <SectionDropdown title="Identity Basics" data={identityBasics} />
      <SectionDropdown title="Professional Identity" data={professionalIdentity} />
      <SectionDropdown title="Expertise Snapshot" data={expertiseSnapshot} />
      <SectionDropdown title="Work Preferences" data={workPreferences} />

      {/* FULL PROFILE */}
      <SectionDropdown title="Experience Snapshot" data={experienceSnapshot} />
      <SectionDropdown
        title="Professional Capabilities"
        data={professionalCapabilities}
      />
      <SectionDropdown
        title="Education & Credentials"
        data={educationAndCredentials}
      />
      <SectionDropdown title="Portfolio / Proof of Work" data={portfolio} />

      {/* CONFIRMATION CHECKBOX */}
      <div className="confirm-center">
        <input
          type="checkbox"
          id="confirmBox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
        />
        <label htmlFor="confirmBox">
          I confirm that all the information provided is accurate.
        </label>
      </div>

      {/* BUTTONS */}
      <div className="section-actions">
        <button className="back" onClick={onBack}>
          Back
        </button>

        <button
          className="next"
          disabled={!isChecked || saving}
          onClick={handleSubmitProfile}
        >
          {saving ? "Submitting…" : "Submit Profile"}
        </button>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
