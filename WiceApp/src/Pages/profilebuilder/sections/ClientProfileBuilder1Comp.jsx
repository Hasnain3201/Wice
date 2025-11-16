import { useNavigate } from "react-router-dom";
import SectionDropdown from "../componentsPB/SectionDropdown";
import "../profileBuilder.css";

export default function ClientProfileBuilder1Comp({
  lightData = {},
  onBack,
  onContinue,
}) {
  const navigate = useNavigate();

  const handleSaveAndReturn = () => {
    // Future: Save to Firestore if needed
    navigate("/client/home");
  };

  return (
    <div className="section">
      <h2>Review Your Light Profile</h2>

      <div className="summary-card">
        <h3>Your basic profile information is ready.</h3>

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
          data={{
            "Preferred Method": lightData.contactMethod,
          }}
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="completion-actions">
        <button className="back" onClick={onBack}>
          Back
        </button>

        <button className="back" onClick={handleSaveAndReturn}>
          Save Light Profile &amp; Return to Portal
        </button>

        <button className="next" onClick={onContinue}>
          Continue to Full Profile
        </button>
      </div>
    </div>
  );
}
