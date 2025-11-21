// src/Pages/profilebuilder/ClientProfileBuilder2Comp.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionDropdown from "../componentsPB/SectionDropdown";

import { saveUserProfile } from "../../../services/userProfile";
import { useAuth } from "../../../context/AuthContext";

export default function ClientProfileBuilder2Comp({
  lightData,
  fullData,
  onBack,
}) {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const handleSubmit = async () => {
    await saveUserProfile(user.uid, {
      profile: {
        fullName: lightData.fullName,
        jobTitle: lightData.jobTitle,
        organizationName: lightData.orgName,
        organizationType: lightData.orgType,
        primaryIndustry: lightData.primaryIndustry,
        country: lightData.country,
        contactMethods: [lightData.contactMethod],

        websiteUrl: fullData.website,
        supportSelections: fullData.supportAreas,
        engagementTypes: fullData.engagementTypes,
        timeZone: fullData.timezone,
        phoneNumber: fullData.phone,
        whatsappNumber: fullData.whatsapp,
      },
      clientFullCompleted: true,
      clientLightCompleted: true,
      phaseFullCompleted: true,
      phaseLightCompleted: true,
    });
    await refreshProfile?.();

    alert("Your full profile has been saved!");

    // ⭐ REDIRECT TO CLIENT HOME
    navigate("/client/home");
  };

  return (
    <div className="section">
      <h2>Final Review & Confirmation</h2>

      {/* LIGHT */}
      <SectionDropdown
        title="Account Holder"
        data={{
          fullName: lightData.fullName,
          jobTitle: lightData.jobTitle,
          workEmail: lightData.workEmail,
        }}
      />

      <SectionDropdown
        title="Organization Information"
        data={{
          orgName: lightData.orgName,
          orgType: lightData.orgType,
          primaryIndustry: lightData.primaryIndustry,
          country: lightData.country,
        }}
      />

      <SectionDropdown
        title="Contact Preferences"
        data={{
          contactMethod: lightData.contactMethod,
        }}
      />

      {/* FULL */}
      <SectionDropdown
        title="Website URL"
        data={{ website: fullData.website }}
      />

      <SectionDropdown
        title="Support Areas Needed"
        data={{ supportAreas: fullData.supportAreas }}
      />

      <SectionDropdown
        title="Engagement Types"
        data={{ engagementTypes: fullData.engagementTypes }}
      />

      <SectionDropdown
        title="Time Zone"
        data={{ timezone: fullData.timezone }}
      />

      <SectionDropdown
        title="Phone & Whatsapp"
        data={{
          phone: fullData.phone,
          whatsapp: fullData.whatsapp,
        }}
      />

      {/* CONFIRM CHECKBOX */}
      <div className="confirm-center">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
        />
        <label>I confirm the above information is accurate.</label>
      </div>

      {/* BUTTONS */}
      <div className="section-actions">
        <button className="back" onClick={onBack}>
          Back
        </button>

        <button
          className="next"
          disabled={!isChecked}
          onClick={handleSubmit}
        >
          Submit Full Profile
        </button>
      </div>
    </div>
  );
}
