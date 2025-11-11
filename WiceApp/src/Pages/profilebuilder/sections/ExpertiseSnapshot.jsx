import { useState } from "react";
import Select from "react-select";
import ISO6391 from "iso-639-1";
import "../ProfileBuilder.css";

export default function ExpertiseSnapshot({ onNext }) {
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  const industries = [
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "technology", label: "Technology" },
    { value: "education", label: "Education" },
  ];

  const sectorsByIndustry = {
    healthcare: [
      { value: "public_health", label: "Public Health" },
      { value: "pharma", label: "Pharmaceuticals" },
      { value: "medical_devices", label: "Medical Devices" },
    ],
    finance: [
      { value: "banking", label: "Banking" },
      { value: "investment", label: "Investment Management" },
      { value: "insurance", label: "Insurance" },
    ],
    technology: [
      { value: "software", label: "Software Development" },
      { value: "cybersecurity", label: "Cybersecurity" },
      { value: "ai", label: "Artificial Intelligence" },
    ],
    education: [
      { value: "higher_ed", label: "Higher Education" },
      { value: "edtech", label: "EdTech" },
    ],
  };

  // Get all known languages
  const allLanguages = ISO6391.getAllNames().map((name) => ({
    value: name.toLowerCase(),
    label: name,
  }));

  // Handle industry selection limit
  const handleIndustryChange = (selectedOptions) => {
    if (selectedOptions.length <= 3) {
      setSelectedIndustries(selectedOptions);
      setSelectedSectors([]);
    }
  };

  const currentSectors = selectedIndustries.flatMap(
    (ind) => sectorsByIndustry[ind.value] || []
  );

  return (
    <div className="section">
      <h2>Expertise Snapshot</h2>
      <p>Define your core industries, sectors, and languages of expertise.</p>

      {/* INDUSTRIES */}
      <label>Industries (max 3) *</label>
      <Select
        isMulti
        options={industries}
        value={selectedIndustries}
        onChange={handleIndustryChange}
        placeholder="Select up to 3 industries"
      />
      {selectedIndustries.length >= 3 && (
        <p className="warning-text">You can select up to 3 industries only.</p>
      )}

      {/* SECTORS */}
      {selectedIndustries.length > 0 && (
        <>
          <label>Sectors *</label>
          <Select
            isMulti
            options={currentSectors}
            value={selectedSectors}
            onChange={setSelectedSectors}
            placeholder="Select sectors relevant to chosen industries"
          />
        </>
      )}

      {/* LANGUAGES */}
      <label>Languages *</label>
      <Select
        isMulti
        isSearchable
        options={allLanguages}
        value={selectedLanguages}
        onChange={setSelectedLanguages}
        placeholder="Select languages"
      />

      <p className="selected-info">
        <span className="label-light">Languages selected:</span>{" "}
        {selectedLanguages.length > 0
          ? `${selectedLanguages.map((l) => l.label).join(", ")}  (${selectedLanguages.length})`
          : "None"}
      </p>

      {/* NAV BUTTONS */}
      
    </div>
  );
}
