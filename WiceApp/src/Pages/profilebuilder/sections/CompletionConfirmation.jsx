import { useState } from "react";
import SectionDropdown from "../componentsPB/SectionDropdown";

export default function CompletionConfirmation({ profileData = {}, onBack, onSubmit }) {
  const [isChecked, setIsChecked] = useState(false);

  const {
    identityBasics = {},
    professionalIdentity = {},
    expertiseSnapshot = {},
    workPreferences = {},

    experienceSnapshot = {},
    professionalCapabilities = {},
    educationAndCredentials = {},
    portfolio = {},
  } = profileData;

  return (
    <div className="section">
      <h2>Final Review & Confirmation</h2>
      <div className="summary-card">
      <h3>Review your full profile before submitting.</h3>
      {/* Combined ALL SECTIONS */}
      <SectionDropdown title="Identity Basics" data={identityBasics} />
      <SectionDropdown title="Professional Identity" data={professionalIdentity} />
      <SectionDropdown title="Expertise Snapshot" data={expertiseSnapshot} />
      <SectionDropdown title="Work Preferences" data={workPreferences} />

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
          onClick={() => isChecked && onSubmit()}
        >
          Submit Full Profile
        </button>
      </div>
    </div>
  );
}
