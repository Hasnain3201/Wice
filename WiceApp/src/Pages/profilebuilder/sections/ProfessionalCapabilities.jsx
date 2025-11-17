import { useState, useEffect } from "react";
import Select from "react-select";
import skillsData from "../../../data/skillsData";
import "../ProfileBuilder.css";

export default function ProfessionalCapabilities({
  profileData,
  setProfileData,
  onNext,
  onBack,
}) {
  // Load any previously saved capabilities
  const [selectedSkills, setSelectedSkills] = useState(
    profileData.capabilitiesList
      ? profileData.capabilitiesList.map((s) => ({ value: s, label: s }))
      : []
  );

  const skillOptions = skillsData.map((skill) => ({
    value: skill,
    label: skill,
  }));

  // ⭐ Sync into parent state
  useEffect(() => {
    setProfileData({
      ...profileData,
      capabilitiesList: selectedSkills.map((s) => s.value),
    });
  }, [selectedSkills]);

  return (
    <div className="section">
      <h2>Professional Capabilities</h2>
      <p>Select all capabilities that reflect your expertise.</p>

      {/* Capabilities Select */}
      <label>Capabilities *</label>
      <Select
        isMulti
        options={skillOptions}
        value={selectedSkills}
        onChange={setSelectedSkills}
        placeholder="Search or select capabilities..."
      />

      {/* Selected Skills Summary */}
      <p className="selected-info">
        <span className="label-light">Selected Capabilities:</span>{" "}
        {selectedSkills.length > 0
          ? selectedSkills.map((s) => s.label).join(", ")
          : "None"}
      </p>

      <div className="section-actions">
        {onBack && (
          <button className="back" onClick={onBack}>
            Back
          </button>
        )}
        
      </div>
    </div>
  );
}
