import { useState, useEffect } from "react";
import Select from "react-select";
import ISO6391 from "iso-639-1";
import "../ProfileBuilder.css";

export default function ExpertiseSnapshot({ profileData, setProfileData, onNext }) {
  const [selectedIndustries, setSelectedIndustries] = useState(
    profileData.industries?.map((i) => ({ value: i, label: i })) || []
  );
  const [selectedSectors, setSelectedSectors] = useState(
    profileData.sectors?.map((s) => ({ value: s, label: s })) || []
  );
  const [selectedLanguages, setSelectedLanguages] = useState(
    profileData.languages?.map((l) => ({ value: l, label: l })) || []
  );

  const industries = [
    { value: "Healthcare", label: "Healthcare" },
    { value: "Finance", label: "Finance" },
    { value: "Technology", label: "Technology" },
    { value: "Education", label: "Education" },
  ];

  const sectorsByIndustry = {
    Healthcare: [
      { value: "Public Health", label: "Public Health" },
      { value: "Pharmaceuticals", label: "Pharmaceuticals" },
      { value: "Medical Devices", label: "Medical Devices" },
    ],
    Finance: [
      { value: "Banking", label: "Banking" },
      { value: "Investment Management", label: "Investment Management" },
      { value: "Insurance", label: "Insurance" },
    ],
    Technology: [
      { value: "Software", label: "Software" },
      { value: "Cybersecurity", label: "Cybersecurity" },
      { value: "Artificial Intelligence", label: "Artificial Intelligence" },
    ],
    Education: [
      { value: "Higher Education", label: "Higher Education" },
      { value: "EdTech", label: "EdTech" },
    ],
  };

  const allLanguages = ISO6391.getAllNames().map((name) => ({
    value: name,
    label: name,
  }));

  // ⭐ Sync into parent profileData
  useEffect(() => {
    setProfileData({
      ...profileData,
      industries: selectedIndustries.map((i) => i.value),
      sectors: selectedSectors.map((s) => s.value),
      languages: selectedLanguages.map((l) => l.value),
    });
  }, [selectedIndustries, selectedSectors, selectedLanguages]);

  const handleIndustryChange = (selectedOptions) => {
    setSelectedIndustries(selectedOptions || []);
    setSelectedSectors([]); // reset sectors when industries change
  };

  const currentSectors = selectedIndustries.flatMap(
    (ind) => sectorsByIndustry[ind.value] || []
  );

  return (
    <div className="section">
      <h2>Expertise Snapshot</h2>
      <p>Define your core industries, sectors, and languages of expertise.</p>

      {/* Industries */}
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

      {/* Sectors */}
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

      {/* Languages */}
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
          ? `${selectedLanguages.map((l) => l.label).join(", ")} (${
              selectedLanguages.length
            })`
          : "None"}
      </p>

      
    </div>
  );
}
