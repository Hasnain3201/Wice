// src/Pages/profilebuilder/ClientProfileBuilder1Comp.jsx

import { useNavigate } from "react-router-dom";
import SectionDropdown from "../componentsPB/SectionDropdown";
import "../profileBuilder.css";

import { saveUserProfile } from "../../../services/userProfile";
import { useAuth } from "../../../context/AuthContext";

export default function ClientProfileBuilder1Comp({
  lightData,
  onBack,
  onContinue,
}) {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const handleSaveLight = async () => {
    await saveUserProfile(user.uid, {
      profile: {
        fullName: lightData.fullName,
        jobTitle: lightData.jobTitle,
        organizationName: lightData.orgName,
        organizationType: lightData.orgType,
        primaryIndustry: lightData.primaryIndustry,
        sector: lightData.sector,
        country: lightData.country,
        contactMethods: [lightData.contactMethod],
      },
      clientLightCompleted: true,
      phaseLightCompleted: true,
    });
    await refreshProfile?.();

    alert("Your light profile has been saved!");
    navigate("/client/home");
  };

  return (
    <div className="section">
      <h2>Review Your Light Profile</h2>

      <SectionDropdown
        title="Account Holder"
        data={{
          "Full Name": lightData.fullName,
          "Job Title / Role": lightData.jobTitle,
          "Work Email": lightData.workEmail,
        }}
      />

      <SectionDropdown
        title="Organization Information"
        data={{
          "Organization Name": lightData.orgName,
          "Organization Type": lightData.orgType,
          "Primary Industry": lightData.primaryIndustry,
          Country: lightData.country,
        }}
      />

      <SectionDropdown
        title="Contact Preferences"
        data={{ "Preferred Method": lightData.contactMethod }}
      />

      <div className="completion-actions">
        <button className="back" onClick={onBack}>
          Back
        </button>

        <button className="back" onClick={handleSaveLight}>
          Save & Return to Portal
        </button>

        <button className="next" onClick={onContinue}>
          Continue to Full Profile
        </button>
      </div>
    </div>
  );
}
