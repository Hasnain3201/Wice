import SectionDropdown from "../componentsPB/SectionDropdown";

export default function CompletionPage({ profileData = {}, onContinue, onSave }) {
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
      <h2>Light Profile Completed!</h2>
      <p>
        Your profile is now active at a basic level. You are discoverable and can
        receive client inquiries for relevant opportunities.
      </p>

      <div className="summary-card">
        <h3>Light Profile Inputted Information</h3>
        {/* Combined ALL SECTIONS */}
        <SectionDropdown title="Identity Basics" data={identityBasics} />
        <SectionDropdown title="Professional Identity" data={professionalIdentity} />
        <SectionDropdown title="Expertise Snapshot" data={expertiseSnapshot} />
        <SectionDropdown title="Work Preferences" data={workPreferences} />

        {/* Full Profile Sections (empty if not filled yet) */}
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

        <div className="completion-actions">
          <button className="next" onClick={onContinue}>
            Complete Full Profile Now
          </button>
          <button className="back" onClick={onSave}>
            Save and Return to Home Page
          </button>
        </div>
      </div>
    </div>
  );
}
