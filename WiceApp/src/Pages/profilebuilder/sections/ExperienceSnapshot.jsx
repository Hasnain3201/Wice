import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import "../ProfileBuilder.css";
import {
  GEOGRAPHIC_EXPERIENCE,
  DONOR_EXPERIENCE,
} from "../../../data/taxonomy";

export default function ExperienceSnapshot({
  profileData,
  setProfileData,
  registerValidator,
}) {
  const [error, setError] = useState("");

  const regionOptions = useMemo(
    () =>
      Object.keys(GEOGRAPHIC_EXPERIENCE).map((region) => ({
        value: region,
        label: region,
      })),
    []
  );

  const donorOptions = useMemo(
    () =>
      DONOR_EXPERIENCE.map((donor) => ({
        value: donor,
        label: donor,
      })),
    []
  );

  const selectedRegions = (profileData.experienceRegions || []).map(
    (region) => ({
      value: region,
      label: region,
    })
  );

  const selectedCountries = (profileData.experienceCountries || []).map(
    (country) => ({
      value: country,
      label: country,
    })
  );

  const selectedDonors = (profileData.donorExperience || []).map((donor) => ({
    value: donor,
    label: donor,
  }));

  const countryOptions = useMemo(() => {
    const seen = new Set();
    const rows = [];
    selectedRegions.forEach((region) => {
      (GEOGRAPHIC_EXPERIENCE[region.value] || []).forEach((country) => {
        if (seen.has(country)) return;
        seen.add(country);
        rows.push({ value: country, label: country });
      });
    });
    return rows;
  }, [selectedRegions]);

  const handleRegionChange = (values) => {
    const regions = (values || []).map((opt) => opt.value);
    setProfileData((prev) => {
      const allowedCountries = new Set(
        regions.flatMap((region) => GEOGRAPHIC_EXPERIENCE[region] || [])
      );
      const filteredCountries = (prev.experienceCountries || []).filter((country) =>
        allowedCountries.has(country)
      );
      return {
        ...prev,
        experienceRegions: regions,
        experienceCountries: filteredCountries,
      };
    });
  };

  const handleCountryChange = (values) => {
    setProfileData((prev) => ({
      ...prev,
      experienceCountries: (values || []).map((opt) => opt.value),
    }));
  };

  const handleDonorChange = (values) => {
    setProfileData((prev) => ({
      ...prev,
      donorExperience: (values || []).map((opt) => opt.value),
    }));
  };

  useEffect(() => {
    if (!registerValidator) return;
    const validator = () => {
      if (!profileData.experienceRegions?.length) {
        setError("Select at least one region.");
        return false;
      }
      if (!profileData.experienceCountries?.length) {
        setError("Select at least one country.");
        return false;
      }
      setError("");
      return true;
    };
    registerValidator(validator);
    return () => registerValidator(null);
  }, [
    registerValidator,
    profileData.experienceRegions,
    profileData.experienceCountries,
  ]);

  return (
    <div className="section">
      <h2>Experience Snapshot</h2>
      <p>
        Highlight where you have delivered work and the donor ecosystems you understand.
      </p>

      <label>Regions you have worked in *</label>
      <Select
        isMulti
        options={regionOptions}
        value={selectedRegions}
        onChange={handleRegionChange}
        placeholder="Select one or more regions"
      />
      <p className="description">
        Add at least one region—you can always refine this later.
      </p>

      {selectedRegions.length > 0 && (
        <>
          <label>Countries within those regions *</label>
          <Select
            isMulti
            options={countryOptions}
            value={selectedCountries}
            onChange={handleCountryChange}
            placeholder="Select countries you have direct experience in"
          />
        </>
      )}

      <label>Donor Experience (optional)</label>
      <Select
        isMulti
        options={donorOptions}
        value={selectedDonors}
        onChange={handleDonorChange}
        placeholder="Search donors or multilateral partners"
      />

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
