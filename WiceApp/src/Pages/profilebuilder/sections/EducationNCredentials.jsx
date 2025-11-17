import { useState, useEffect } from "react";
import Select from "react-select";
import "../ProfileBuilder.css";

export default function EducationNCredentials({
  profileData,
  setProfileData,
  onNext,
  onBack,
}) {
  const [highestDegree, setHighestDegree] = useState(
    profileData.highestDegree || ""
  );

  const [institution, setInstitution] = useState(
    profileData.institution || ""
  );

  const [selectedCerts, setSelectedCerts] = useState(
    profileData.certifications
      ? profileData.certifications.map((c) => ({ value: c, label: c }))
      : []
  );

  // A simple list — you can expand this or load dynamically
  const certificationOptions = [
    "PMP",
    "Scrum Master",
    "Data Analytics Certificate",
    "Cybersecurity Certificate",
    "Google UX Design",
    "AWS Cloud Practitioner",
    "Certified Public Accountant (CPA)",
    "Lean Six Sigma",
  ].map((c) => ({ value: c, label: c }));

  // ⭐ Sync fields into parent state
  useEffect(() => {
    setProfileData({
      ...profileData,
      highestDegree,
      institution,
      certifications: selectedCerts.map((c) => c.value),
    });
  }, [highestDegree, institution, selectedCerts]);

  return (
    <div className="section">
      <h2>Education & Credentials</h2>
      <p>Share your academic background and professional certifications.</p>

      {/* Highest Degree */}
      <label>Highest Degree *</label>
      <select
        required
        value={highestDegree}
        onChange={(e) => setHighestDegree(e.target.value)}
      >
        <option value="">Select...</option>
        <option>Bachelor's</option>
        <option>Master's</option>
        <option>PhD</option>
        <option>Associate Degree</option>
        <option>Diploma / Certificate</option>
      </select>

      {/* Institution */}
      <label>Institution *</label>
      <input
        type="text"
        required
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
        placeholder="Enter institution name"
      />

      {/* Certifications */}
      <label>Certifications</label>
      <Select
        isMulti
        options={certificationOptions}
        value={selectedCerts}
        onChange={(val) => setSelectedCerts(val || [])}
        placeholder="Select any certifications"
      />

      <p className="selected-info">
        <span className="label-light">Selected Certifications:</span>{" "}
        {selectedCerts.length
          ? selectedCerts.map((c) => c.label).join(", ")
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
