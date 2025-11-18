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

export default function CompletionConfirmation({
  profileData,
  onBack,
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // ⭐ SAVE FULL PROFILE + SHOW POPUP + REDIRECT
  async function handleSubmitProfile() {
    const uid = user?.uid;
    if (!uid) return;

    const industries = normalizeList(profileData.industries);
    const sectors = normalizeList(profileData.sectors);
    const languages = normalizeList(profileData.languages);
    const donorExperience = normalizeList(profileData.donorExperience);
    const capabilities = normalizeList(profileData.capabilitiesList);
    const certifications = normalizeList(profileData.certifications);
    const softwareTools = normalizeList(profileData.softwareTools);
    const securityClearances = normalizeList(profileData.securityClearances);
    const experienceYears = parseExperienceBucket(
      profileData.totalYearsExperience
    );
    const dailyRateNumber = Number(profileData.dailyRate);
    const additionalEducation = profileData.additionalEducation || [];
    const additionalFiles = profileData.additionalFiles || [];

  const payload = {
      fullName: profileData.fullName?.trim() || "",
      location: profileData.location || "",
      country: profileData.country || "",
      headline: profileData.oneLinerBio || "",
      profile: {
        fullName: profileData.fullName?.trim() || "",
        pronouns: profileData.pronouns || "",
        timeZone: profileData.timeZone || "",
        location: profileData.location || "",
        country: profileData.country || "",
        oneLinerBio: profileData.oneLinerBio || "",
        about: profileData.about || "",
        totalYearsExperience: profileData.totalYearsExperience || "",
        experienceBucket: profileData.totalYearsExperience || "",
        experienceYears,
        linkedinUrl: profileData.linkedinUrl || "",
        industries,
        sectors,
        sectorsByIndustry: profileData.sectorsByIndustry || {},
        subsectorsBySector: profileData.subsectorsBySector || {},
        languages,
        currency: profileData.currency || "USD",
        dailyRate: Number.isFinite(dailyRateNumber) ? dailyRateNumber : null,
        openToTravel:
          profileData.openToTravel === "Yes"
            ? true
            : profileData.openToTravel === "No"
            ? false
            : profileData.openToTravel,
        experienceRegions: profileData.experienceRegions || [],
        experienceCountries: profileData.experienceCountries || [],
        donorExperience,
        functionalExpertise: profileData.functionalExpertise || [],
        capabilitiesList: capabilities,
        technicalSkillsByExpertise:
          profileData.technicalSkillsByExpertise || {},
        softwareTools,
        highestDegree: profileData.highestDegree || "",
        institution: profileData.institution || "",
        certifications,
        securityClearances,
        additionalEducation,
        resumeFile: profileData.resumeFile || "",
        resumeFileName: profileData.resumeFileName || "",
        resumeStoragePath: profileData.resumeStoragePath || "",
        additionalFiles,
      },
      phaseLightCompleted: true,
      phaseFullCompleted: true,
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
