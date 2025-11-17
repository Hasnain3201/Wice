import { useState } from "react";
import SectionDropdown from "../componentsPB/SectionDropdown";
import "../ProfileBuilder.css";

export default function CompletionConfirmation({
  profileData,
  onBack,
  onSubmit,
}) {
  const [isChecked, setIsChecked] = useState(false);

  // ⭐ LIGHT PROFILE SECTIONS
  const identityBasics = {
    "Full Name": profileData.fullName,
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

  // ⭐ FULL PROFILE SECTIONS
  const experienceSnapshot = {
    Regions: profileData.experienceRegions?.join(", "),
    Countries: profileData.experienceCountries?.join(", "),
    "Donor Experience": profileData.donorExperience?.join(", "),
  };

  const professionalCapabilities = {
    Capabilities: profileData.capabilitiesList?.join(", "),
  };

  const educationAndCredentials = {
    "Highest Degree": profileData.highestDegree,
    Institution: profileData.institution,
    Certifications: profileData.certifications?.join(", "),
  };

  const portfolio = {
    "Portfolio Links":
      profileData.portfolioLinks?.length > 0
        ? profileData.portfolioLinks.join("\n")
        : "",
    "Uploaded Files":
      profileData.portfolioUploads?.length > 0
        ? profileData.portfolioUploads.map((f) => f.name).join("\n")
        : "",
  };

  return (
    <div className="section">
      <h2>Full Profile Completion</h2>
      <p>Review everything below before submitting your profile.</p>

      {/* ⭐ LIGHT PROFILE */}
      <SectionDropdown title="Identity Basics" data={identityBasics} />
      <SectionDropdown title="Professional Identity" data={professionalIdentity} />
      <SectionDropdown title="Expertise Snapshot" data={expertiseSnapshot} />
      <SectionDropdown title="Work Preferences" data={workPreferences} />

      {/* ⭐ FULL PROFILE */}
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

      {/* Confirmation */}
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

      <div className="section-actions">
        <button className="back" onClick={onBack}>
          Back
        </button>

        <button
          className="next"
          disabled={!isChecked}
          onClick={() => isChecked && onSubmit()}
        >
          Submit Profile
        </button>
      </div>
    </div>
  );
}
