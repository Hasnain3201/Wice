import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import "../ProfileBuilder.css";
import {
  INDUSTRY_SECTORS,
  LANGUAGES,
} from "../../../data/taxonomy";

const MAX_INDUSTRIES = 3;

function flattenSectors(map = {}) {
  return Object.values(map)
    .flat()
    .filter(Boolean);
}

function flattenSubsectors(map = {}) {
  return Object.values(map)
    .flat()
    .filter(Boolean);
}

export default function ExpertiseSnapshot({
  profileData,
  setProfileData,
  registerValidator,
}) {
  const [showAllSectors, setShowAllSectors] = useState(false);
  const [error, setError] = useState("");

  const industryOptions = useMemo(
    () =>
      Object.keys(INDUSTRY_SECTORS).map((name) => ({
        value: name,
        label: name,
      })),
    []
  );

  const sectorToIndustry = useMemo(() => {
    const lookup = {};
    Object.entries(INDUSTRY_SECTORS).forEach(([industry, sectorMap]) => {
      Object.keys(sectorMap || {}).forEach((sector) => {
        lookup[sector] = industry;
      });
    });
    return lookup;
  }, []);

  const languageOptions = useMemo(
    () =>
      LANGUAGES.map((lang) => ({
        value: lang,
        label: lang,
      })),
    []
  );

  const selectedIndustryNames = useMemo(
    () => profileData.industries || [],
    [profileData.industries]
  );
  const selectedIndustryOptions = selectedIndustryNames.map((name) => ({
    value: name,
    label: name,
  }));

  const sectorsByIndustry = useMemo(
    () => profileData.sectorsByIndustry || {},
    [profileData.sectorsByIndustry]
  );

  const selectedSectorValues = useMemo(
    () =>
      Object.entries(sectorsByIndustry).flatMap(([industry, sectors]) =>
        (sectors || []).map((sector) => ({
          value: `${industry}:::${sector}`,
          label: sector,
        }))
      ),
    [sectorsByIndustry]
  );

  const selectedSubsectorOptions = useMemo(() => {
    const entries = profileData.subsectorsBySector || {};
    return Object.fromEntries(
      Object.entries(entries).map(([sector, subsectors]) => [
        sector,
        (subsectors || []).map((item) => ({
          value: item,
          label: item,
        })),
      ])
    );
  }, [profileData.subsectorsBySector]);

  const languageValues = useMemo(
    () =>
      (profileData.languages || []).map((lang) => ({
        value: lang,
        label: lang,
      })),
    [profileData.languages]
  );

  const sectorOptions = useMemo(() => {
    const entries = showAllSectors
      ? Object.entries(INDUSTRY_SECTORS)
      : selectedIndustryNames.map((industry) => [
          industry,
          INDUSTRY_SECTORS[industry] || {},
        ]);

    return entries
      .filter(([, sectorMap]) => sectorMap && Object.keys(sectorMap).length)
      .map(([industry, sectorMap]) => ({
        label: industry,
        options: Object.keys(sectorMap).map((sector) => ({
          value: `${industry}:::${sector}`,
          label: sector,
        })),
      }));
  }, [selectedIndustryNames, showAllSectors]);

  const selectedSectorsCount = useMemo(
    () => flattenSectors(sectorsByIndustry).length,
    [sectorsByIndustry]
  );

  useEffect(() => {
    if (!registerValidator) return;
    const validator = () => {
      if (!selectedIndustryNames.length) {
        setError("Select at least one industry.");
        return false;
      }
      if (!selectedSectorsCount) {
        setError("Select at least one sector.");
        return false;
      }
      if (!languageValues.length) {
        setError("Select at least one language.");
        return false;
      }
      setError("");
      return true;
    };
    registerValidator(validator);
    return () => registerValidator(null);
  }, [
    registerValidator,
    selectedIndustryNames.length,
    selectedSectorsCount,
    languageValues.length,
  ]);

  const handleIndustryChange = (options) => {
    const next = options || [];
    if (next.length > MAX_INDUSTRIES) {
      setError(`You can highlight up to ${MAX_INDUSTRIES} industries.`);
      return;
    }
    setError("");
    const names = next.map((opt) => opt.value);
    setProfileData((prev) => {
      const nextSectors = { ...(prev.sectorsByIndustry || {}) };
      const nextSubsectors = { ...(prev.subsectorsBySector || {}) };
      const allowedIndustries = new Set(names);
      Object.keys(nextSectors).forEach((industry) => {
        if (!allowedIndustries.has(industry)) {
          delete nextSectors[industry];
        }
      });
      Object.keys(nextSubsectors).forEach((sector) => {
        const hostIndustry = sectorToIndustry[sector];
        if (hostIndustry && !allowedIndustries.has(hostIndustry)) {
          delete nextSubsectors[sector];
        }
      });
      return {
        ...prev,
        industries: names,
        sectorsByIndustry: nextSectors,
        sectors: flattenSectors(nextSectors),
        subsectorsBySector: nextSubsectors,
        subsectors: flattenSubsectors(nextSubsectors),
      };
    });
  };

  const handleSectorsChange = (options) => {
    const next = options || [];
    const grouped = {};
    next.forEach(({ value }) => {
      const [industry, sector] = value.split(":::");
      if (!industry || !sector) return;
      if (!grouped[industry]) grouped[industry] = [];
      if (!grouped[industry].includes(sector)) {
        grouped[industry].push(sector);
      }
    });
    const industriesInUse = Object.keys(grouped);

    if (industriesInUse.length > MAX_INDUSTRIES) {
      setError(
        `You can highlight up to ${MAX_INDUSTRIES} industries. Remove one before adding another.`
      );
      return;
    }

    setError("");
    setProfileData((prev) => {
      const nextSubsectors = { ...(prev.subsectorsBySector || {}) };
      const allowedSectors = new Set(flattenSectors(grouped));
      Object.keys(nextSubsectors).forEach((sector) => {
        if (!allowedSectors.has(sector)) {
          delete nextSubsectors[sector];
        } else {
          const validOptions = (
            INDUSTRY_SECTORS[sectorToIndustry[sector]]?.[sector] || []
          ).map(String);
          nextSubsectors[sector] = (nextSubsectors[sector] || []).filter((item) =>
            validOptions.includes(item)
          );
          if (!nextSubsectors[sector].length) {
            delete nextSubsectors[sector];
          }
        }
      });

      let nextIndustries = prev.industries || [];
      if (showAllSectors && next.length) {
        const updated = new Set(nextIndustries);
        industriesInUse.forEach((industry) => updated.add(industry));
        nextIndustries = Array.from(updated);
      }

      return {
        ...prev,
        industries: nextIndustries,
        sectorsByIndustry: grouped,
        sectors: flattenSectors(grouped),
        subsectorsBySector: nextSubsectors,
        subsectors: flattenSubsectors(nextSubsectors),
      };
    });
  };

  const handleSubsectorChange = (sector, selections) => {
    setProfileData((prev) => {
      const updated = { ...(prev.subsectorsBySector || {}) };
      const values = (selections || []).map((opt) => opt.value);
      if (!values.length) {
        delete updated[sector];
      } else {
        updated[sector] = values;
      }
      return {
        ...prev,
        subsectorsBySector: updated,
        subsectors: flattenSubsectors(updated),
      };
    });
  };

  const handleLanguageChange = (values) => {
    setProfileData((prev) => ({
      ...prev,
      languages: (values || []).map((opt) => opt.value),
    }));
  };

  const selectedSectorsList = useMemo(
    () =>
      Object.entries(sectorsByIndustry).flatMap(([industry, sectors]) =>
        (sectors || []).map((sector) => ({
          industry,
          sector,
        }))
      ),
    [sectorsByIndustry]
  );

  const renderSubsectorSelects = selectedSectorsList.map(({ industry, sector }) => {
    const subsectorChoices =
      INDUSTRY_SECTORS[industry]?.[sector]?.map((item) => ({
        value: item,
        label: item,
      })) || [];

    if (!subsectorChoices.length) return null;

    return (
      <div key={`${industry}-${sector}`} className="subsector-group">
        <label>Subsectors for {sector}</label>
        <Select
          isMulti
          options={subsectorChoices}
          placeholder="Select subsectors (optional)"
          value={selectedSubsectorOptions[sector] || []}
          onChange={(values) => handleSubsectorChange(sector, values)}
        />
      </div>
    );
  });

  return (
    <div className="section">
      <h2>Expertise Snapshot</h2>
      <p>
        Define the industries, sectors, subsectors, and languages that show where you
        create the most impact.
      </p>

      <label>Industries (max 3) *</label>
      <Select
        isMulti
        options={industryOptions}
        value={selectedIndustryOptions}
        onChange={handleIndustryChange}
        placeholder="Select up to three industries"
      />
      <p className="description">
        You can add more industries later—start with the top areas clients should know.
      </p>

      <div className="toggle-row">
        <label>
          <input
            type="checkbox"
            checked={showAllSectors}
            onChange={(e) => setShowAllSectors(e.target.checked)}
          />{" "}
          Show all sectors
        </label>
        <span className="description">
          Browse the full taxonomy across every industry.
        </span>
      </div>

      <label>Sectors *</label>
      <Select
        isMulti
        options={sectorOptions}
        value={selectedSectorValues}
        isDisabled={!showAllSectors && !selectedIndustryOptions.length}
        placeholder={
          showAllSectors
            ? "Search or browse all sectors"
            : "Select sectors for your highlighted industries"
        }
        onChange={handleSectorsChange}
      />
      {!showAllSectors && !selectedIndustryOptions.length && (
        <p className="warning-text">Add an industry to unlock sector choices.</p>
      )}

      {renderSubsectorSelects.some(Boolean) && (
        <div className="subsector-grid">{renderSubsectorSelects}</div>
      )}

      <label>Languages *</label>
      <Select
        isMulti
        isSearchable
        options={languageOptions}
        value={languageValues}
        placeholder="Select languages you can work in"
        onChange={handleLanguageChange}
      />
      <p className="selected-info">
        <span className="label-light">Languages selected:</span>{" "}
        {languageValues.length
          ? `${languageValues.map((item) => item.label).join(", ")} (${
              languageValues.length
            })`
          : "None"}
      </p>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
