import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import "../ProfileBuilder.css";
import {
  DEGREES,
  CERTIFICATIONS,
  SECURITY_CLEARANCES,
} from "../../../data/taxonomy";

const OTHER_OPTION = "Other (please specify)";

export default function EducationNCredentials({ profileData, setProfileData }) {
  const [customCertification, setCustomCertification] = useState("");
  const [otherSelected, setOtherSelected] = useState(false);

  const degreeOptions = useMemo(
    () =>
      DEGREES.map((degree) => ({
        value: degree,
        label: degree,
      })),
    []
  );

  const certificationOptions = useMemo(() => {
    const base = CERTIFICATIONS.filter((cert) => cert !== OTHER_OPTION).map(
      (cert) => ({
        value: cert,
        label: cert,
      })
    );
    return [...base, { value: OTHER_OPTION, label: OTHER_OPTION }];
  }, []);

  const securityOptions = useMemo(
    () =>
      SECURITY_CLEARANCES.map((clearance) => ({
        value: clearance,
        label: clearance,
      })),
    []
  );

  useEffect(() => {
    const custom = (profileData.certifications || []).find(
      (cert) => !CERTIFICATIONS.includes(cert)
    );
    setCustomCertification(custom || "");
    setOtherSelected(Boolean(custom));
  }, [profileData.certifications]);

  const selectedDegrees = profileData.highestDegree || "";
  const selectedInstitution = profileData.institution || "";

  const selectedCertifications = useMemo(() => {
    const certs = profileData.certifications || [];
    const mapped = certs
      .filter((cert) => CERTIFICATIONS.includes(cert))
      .map((cert) => ({ value: cert, label: cert }));
    if (certs.some((cert) => !CERTIFICATIONS.includes(cert))) {
      mapped.push({ value: OTHER_OPTION, label: OTHER_OPTION });
    }
    return mapped;
  }, [profileData.certifications]);

  const selectedClearances = (profileData.securityClearances || []).map(
    (item) => ({
      value: item,
      label: item,
    })
  );

  const additionalEducation = profileData.additionalEducation || [];

  const handleDegreeChange = (event) => {
    setProfileData((prev) => ({
      ...prev,
      highestDegree: event.target.value,
    }));
  };

  const handleInstitutionChange = (event) => {
    setProfileData((prev) => ({
      ...prev,
      institution: event.target.value,
    }));
  };

  const handleCertificationChange = (values) => {
    const nextValues = (values || []).map((opt) => opt.value);
    const hasOther = nextValues.includes(OTHER_OPTION);
    const filteredStandard = nextValues.filter((val) => val !== OTHER_OPTION);
    setOtherSelected(hasOther);
    setProfileData((prev) => ({
      ...prev,
      certifications: [
        ...filteredStandard,
        ...(hasOther && customCertification ? [customCertification] : []),
      ],
    }));
  };

  const handleCustomCertification = (value) => {
    setCustomCertification(value);
    if (!otherSelected) return;
    setProfileData((prev) => {
      const standard = (prev.certifications || []).filter((cert) =>
        CERTIFICATIONS.includes(cert)
      );
      return {
        ...prev,
        certifications: value ? [...standard, value] : standard,
      };
    });
  };

  const handleClearanceChange = (values) => {
    setProfileData((prev) => ({
      ...prev,
      securityClearances: (values || []).map((opt) => opt.value),
    }));
  };

  const handleAddEducation = () => {
    setProfileData((prev) => ({
      ...prev,
      additionalEducation: [
        ...(prev.additionalEducation || []),
        { degree: "", institution: "" },
      ],
    }));
  };

  const handleEducationFieldChange = (index, field, value) => {
    setProfileData((prev) => {
      const list = [...(prev.additionalEducation || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, additionalEducation: list };
    });
  };

  const handleRemoveEducation = (index) => {
    setProfileData((prev) => {
      const list = [...(prev.additionalEducation || [])];
      list.splice(index, 1);
      return { ...prev, additionalEducation: list };
    });
  };

  return (
    <div className="section">
      <h2>Education & Credentials</h2>
      <p>Share your academic history, certifications, and clearances.</p>

      <label>Highest Degree *</label>
      <select required value={selectedDegrees} onChange={handleDegreeChange}>
        <option value="">Select...</option>
        {degreeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label>Institution *</label>
      <input
        type="text"
        required
        value={selectedInstitution}
        onChange={handleInstitutionChange}
        placeholder="Enter the institution name"
      />

      <div className="section-divider" />

      <label>Additional Education (optional)</label>
      {additionalEducation.map((entry, idx) => (
        <div key={`edu-${idx}`} className="nested-card">
          <input
            type="text"
            value={entry.degree || ""}
            onChange={(e) => handleEducationFieldChange(idx, "degree", e.target.value)}
            placeholder="Degree or program"
          />
          <input
            type="text"
            value={entry.institution || ""}
            onChange={(e) =>
              handleEducationFieldChange(idx, "institution", e.target.value)
            }
            placeholder="Institution"
          />
          <button
            type="button"
            className="back"
            onClick={() => handleRemoveEducation(idx)}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="back" onClick={handleAddEducation}>
        + Add another education
      </button>

      <div className="section-divider" />

      <label>Certifications</label>
      <Select
        isMulti
        options={certificationOptions}
        value={selectedCertifications}
        onChange={handleCertificationChange}
        placeholder="Select certifications you hold"
      />
      {otherSelected && (
        <input
          type="text"
          value={customCertification}
          onChange={(e) => handleCustomCertification(e.target.value)}
          placeholder="Add your certification name"
        />
      )}

      <label>Security Clearances</label>
      <Select
        isMulti
        options={securityOptions}
        value={selectedClearances}
        onChange={handleClearanceChange}
        placeholder="Select any clearances you hold"
      />
    </div>
  );
}
