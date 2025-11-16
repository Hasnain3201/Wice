import { useState } from "react";
import SectionDropdown from "../componentsPB/SectionDropdown";

export default function ClientProfileBuilder2Comp({
  lightData = {},
  fullData = {},
  onBack,
  onSubmit,
}) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="section">
      <h2>Final Review &amp; Confirmation</h2>

      <div className="summary-card">
        <h3>Review your full profile before submitting.</h3>

        {/* === Light Profile Fields === */}
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

        {/* === Full Profile Fields === */}
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
      </div>

      {/* Confirmation Checkbox */}
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
          onClick={() => isChecked && onSubmit && onSubmit()}
        >
          Submit Full Profile
        </button>
      </div>
    </div>
  );
}
