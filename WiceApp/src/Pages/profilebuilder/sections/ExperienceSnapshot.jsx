import { useState, useEffect } from "react";
import Select from "react-select";
import { Country } from "country-state-city";
import "../ProfileBuilder.css";

export default function ExperienceSnapshot({
  profileData,
  setProfileData,
  onNext,
  onBack,
}) {
  const [selectedRegions, setSelectedRegions] = useState(
    profileData.experienceRegions?.map((r) => ({ value: r, label: r })) || []
  );

  const [selectedCountries, setSelectedCountries] = useState(
    profileData.experienceCountries?.map((c) => ({ value: c, label: c })) || []
  );

  const [selectedDonors, setSelectedDonors] = useState(
    profileData.donorExperience?.map((d) => ({ value: d, label: d })) || []
  );

  const [error, setError] = useState("");

  // Region options
  const regionOptions = [
    { value: "Africa", label: "Africa" },
    { value: "Asia", label: "Asia" },
    { value: "Europe", label: "Europe" },
    { value: "North America", label: "North America" },
    { value: "South America", label: "South America" },
    { value: "Oceania", label: "Oceania" },
  ];

  // Donor options
  const donorOptions = [
    { value: "USAID", label: "USAID" },
    { value: "World Bank", label: "World Bank" },
    { value: "UNDP", label: "UNDP" },
    { value: "UNICEF", label: "UNICEF" },
    { value: "Gates Foundation", label: "Gates Foundation" },
    { value: "DFID", label: "DFID (UK)" },
    { value: "WHO", label: "WHO" },
  ];

  const allCountries = Country.getAllCountries();

  const countriesByRegion = {
    Africa: allCountries.filter((c) => c.region === "Africa"),
    Asia: allCountries.filter((c) => c.region === "Asia"),
    Europe: allCountries.filter((c) => c.region === "Europe"),
    "North America": allCountries.filter((c) => c.region === "Americas"),
    "South America": allCountries.filter((c) => c.region === "Americas"),
    Oceania: allCountries.filter((c) => c.region === "Oceania"),
  };

  const handleRegionChange = (selected) => {
    setSelectedRegions(selected || []);
    setSelectedCountries([]);
  };

  const regionLabels = selectedRegions.map((r) => r.label);

  const currentCountries = selectedRegions.flatMap((region) => {
    const list = countriesByRegion[region.value] || [];
    return list.map((c) => ({
      value: c.name,
      label: c.name,
    }));
  });

  // ⭐ Sync full-profile experience fields into profileData
  useEffect(() => {
    setProfileData({
      ...profileData,
      experienceRegions: selectedRegions.map((r) => r.label),
      experienceCountries: selectedCountries.map((c) => c.label),
      donorExperience: selectedDonors.map((d) => d.label),
    });
  }, [selectedRegions, selectedCountries, selectedDonors]);

  const handleNextClick = () => {
    if (selectedRegions.length === 0) {
      setError("Please select at least one region before continuing.");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="section">
      <h2>Experience Snapshot</h2>
      <p>Select the regions, countries, and donors you have worked with.</p>

      {/* Regions */}
      <label>Regions *</label>
      <Select
        isMulti
        options={regionOptions}
        value={selectedRegions}
        onChange={handleRegionChange}
      />

      {/* Countries */}
      {selectedRegions.length > 0 && (
        <>
          <label>Countries *</label>
          <Select
            isMulti
            options={currentCountries}
            value={selectedCountries}
            onChange={(val) => setSelectedCountries(val || [])}
          />
        </>
      )}

      {/* Donor Experience */}
      <label>Donor Experience</label>
      <Select
        isMulti
        options={donorOptions}
        value={selectedDonors}
        onChange={setSelectedDonors}
      />

      {error && <p className="error-message">{error}</p>}

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
