import { useState } from "react";
import Select from "react-select";
import { Country, State } from "country-state-city";
import "../ProfileBuilder.css";

export default function ExperienceSnapshot({ onNext, onBack }) {
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedDonors, setSelectedDonors] = useState([]);
  const [error, setError] = useState("");

  // Region options (based on continents)
  const regionOptions = [
    { value: "Africa", label: "Africa" },
    { value: "Asia", label: "Asia" },
    { value: "Europe", label: "Europe" },
    { value: "North America", label: "North America" },
    { value: "South America", label: "South America" },
    { value: "Oceania", label: "Oceania" },
  ];

  // Donor experience options
  const donorOptions = [
    { value: "usaid", label: "USAID" },
    { value: "world_bank", label: "World Bank" },
    { value: "undp", label: "UNDP" },
    { value: "unicef", label: "UNICEF" },
    { value: "gates_foundation", label: "Gates Foundation" },
    { value: "dfid", label: "DFID (UK)" },
    { value: "who", label: "WHO" },
  ];

  // Dependency Logic: Filter countries based on selected regions
  const allCountries = Country.getAllCountries();
  const countriesByRegion = {
    Africa: allCountries.filter((c) => c.region === "Africa"),
    Asia: allCountries.filter((c) => c.region === "Asia"),
    Europe: allCountries.filter((c) => c.region === "Europe"),
    "North America": allCountries.filter((c) => c.region === "North America"),
    "South America": allCountries.filter((c) => c.region === "South America"),
    Oceania: allCountries.filter((c) => c.region === "Oceania"),
  };

  // When region changes
  const handleRegionChange = (regions) => {
    setSelectedRegions(regions || []);
    if (!regions || regions.length === 0) {
      setSelectedCountries([]); // Clear countries if no region selected
      return;
    }

    // Remove countries that no longer belong to selected regions
    const allowedRegions = regions.map((r) => r.value);
    const updatedCountries = selectedCountries.filter((country) =>
      allowedRegions.includes(country.region)
    );
    setSelectedCountries(updatedCountries);
  };

  // Build filtered country list
  const countryOptions = selectedRegions.flatMap((region) => {
    const countries = countriesByRegion[region.value] || [];
    return countries.map((c) => ({
      value: c.isoCode,
      label: c.name,
      region: region.value,
    }));
  });

  // Validation
  const handleNext = () => {
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
      <p>
        Select your geographic and donor experience. You can refine or add more
        details later.
      </p>

      {/* REGION SELECT */}
      <label>Regions *</label>
      <Select
        isMulti
        options={regionOptions}
        value={selectedRegions}
        onChange={handleRegionChange}
        placeholder="Select regions..."
      />
      <p className="description">
        Select at least one region. You can add more regions and countries later.
      </p>

      {/* COUNTRY SELECT (depends on region) */}
      {selectedRegions.length > 0 && (
        <>
          <label>Countries *</label>
          <Select
            isMulti
            options={countryOptions}
            value={selectedCountries}
            onChange={(val) => setSelectedCountries(val || [])}
            placeholder="Select countries..."
          />
        </>
      )}

      {/* DONOR EXPERIENCE */}
      <label>Donor Experience</label>
      <Select
        isMulti
        options={donorOptions}
        value={selectedDonors}
        onChange={setSelectedDonors}
        placeholder="Select donor organizations..."
      />

      {/* SUMMARY */}
      <div className="selected-info">
        <span className="label-light">Selected:</span>{" "}
        {selectedRegions.length === 0
          ? "None"
          : selectedRegions
              .map((r) => {
                const regionCountries = selectedCountries
                  .filter((c) => c.region === r.value)
                  .map((c) => c.label)
                  .join(", ");
                return regionCountries
                  ? `${r.label} → ${regionCountries}`
                  : `${r.label}`;
              })
              .join(" | ")}
      </div>

      {selectedDonors.length > 0 && (
        <div className="selected-info">
          <span className="label-light">Donor Experience:</span>{" "}
          {selectedDonors.map((d) => d.label).join(", ")}
        </div>
      )}

      {/* ERROR */}
      {error && <p className="error-message">{error}</p>}

      {/* NAVIGATION */}
      <div className="section-actions">
        
      </div>
    </div>
  );
}
