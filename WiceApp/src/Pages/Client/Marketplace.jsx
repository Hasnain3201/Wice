// src/Pages/Marketplace/Marketplace.jsx

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ConsultantCard from "../../Components/ConsultantCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { subscribeToConsultants } from "../../services/consultantsDirectory.js";
import "./Marketplace.css";

import {
  INDUSTRY_SECTORS,
  FUNCTIONAL_SKILLS,
  LANGUAGES,
  SOFTWARE_TOOLS,
  DONOR_EXPERIENCE,
  CERTIFICATIONS,
  DEGREES,
  SECURITY_CLEARANCES,
} from "../../data/taxonomy.js";

const TIMEZONES = [
  "UTC-8 (PST)",
  "UTC-7 (MST)",
  "UTC-6 (CST)",
  "UTC-5 (EST)",
  "UTC-3 (BRT)",
  "UTC+0 (GMT)",
  "UTC+1 (CET)",
  "UTC+2 (EET)",
  "UTC+3 (EAT)",
  "UTC+4 (GST)",
  "UTC+5:30 (IST)",
  "UTC+7 (ICT)",
  "UTC+8 (CST/SGT)",
  "UTC+9 (JST)",
  "UTC+10 (AEST)",
];

/* ----------------- SMALL REUSABLE COMPONENTS ----------------- */

function TagPill({ label, onClick, onRemove, className = "", children }) {
  return (
    <div className={`filter-tag-pill ${className}`}>
      <button
        type="button"
        className="filter-tag-main"
        onClick={onClick}
      >
        <span>{label}</span>
        {children}
      </button>
      {onRemove && (
        <button
          type="button"
          className="tag-remove"
          onClick={onRemove}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function MiniTag({ label, onRemove }) {
  return (
    <button
      type="button"
      className="filter-tag-pill filter-tag-subsector"
      onClick={onRemove}
    >
      <span>{label}</span>
      <span className="tag-remove-small">✕</span>
    </button>
  );
}

/* --------------------------------------------------------------
   SEARCHABLE CHECKBOX FILTER — FIXED WITH CLICK-OUTSIDE
-------------------------------------------------------------- */

function SearchableCheckboxFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = "Type to search…",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.localeCompare(b)),
    [options]
  );

  const filteredOptions = sortedOptions.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  const toggleValue = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div ref={wrapperRef} className="filters-field filter-with-tags">
      <div className="filter-label-row">
        <span>{label}</span>
        <div className="filter-tags-row">
          {selected.map((val) => (
            <MiniTag
              key={val}
              label={val}
              onRemove={() => toggleValue(val)}
            />
          ))}
        </div>
      </div>

      <div className="tag-search-wrapper">
        <input
          type="text"
          className="tag-search-input"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
        />
        {open && filteredOptions.length > 0 && (
          <div
            className="tag-suggestions tag-suggestions--checkbox"
            onMouseDown={(e) => e.preventDefault()}
          >
            {filteredOptions.map((opt) => (
              <label key={opt} className="tag-suggestion-checkbox">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleValue(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------
   INDUSTRY FILTER — FIXED CLICK-OUTSIDE
-------------------------------------------------------------- */

function IndustryFilter({ filters, setFilters }) {
  const [industrySearch, setIndustrySearch] = useState("");
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const [openIndustryTag, setOpenIndustryTag] = useState(null);
  const [openSectorTag, setOpenSectorTag] = useState(null);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIndustryDropdownOpen(false);
        setOpenIndustryTag(null);
        setOpenSectorTag(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const industries = useMemo(
    () => Object.keys(INDUSTRY_SECTORS).sort((a, b) => a.localeCompare(b)),
    []
  );

  const filteredIndustries = industries.filter((ind) =>
    ind.toLowerCase().includes(industrySearch.toLowerCase())
  );

  const toggleIndustry = (industry) => {
    setFilters((prev) => {
      const already = prev.industries.includes(industry);
      if (already) {
        const sectorMap = INDUSTRY_SECTORS[industry] || {};
        const sectorsForIndustry = Object.keys(sectorMap);
        const subsForIndustry = sectorsForIndustry.flatMap(
          (s) => sectorMap[s] || []
        );

        return {
          ...prev,
          industries: prev.industries.filter((i) => i !== industry),
          sectors: prev.sectors.filter((s) => !sectorsForIndustry.includes(s)),
          subsectors: prev.subsectors.filter((sub) => !subsForIndustry.includes(sub)),
        };
      }
      return { ...prev, industries: [...prev.industries, industry] };
    });
  };

  const toggleSector = (industry, sector) => {
    setFilters((prev) => {
      const hasSector = prev.sectors.includes(sector);
      const subs = (INDUSTRY_SECTORS[industry] || {})[sector] || [];

      if (hasSector) {
        return {
          ...prev,
          sectors: prev.sectors.filter((s) => s !== sector),
          subsectors: prev.subsectors.filter((s) => !subs.includes(s)),
        };
      }
      return { ...prev, sectors: [...prev.sectors, sector] };
    });
  };

  const toggleSubsector = (industry, sector, subsector) => {
    setFilters((prev) => {
      const has = prev.subsectors.includes(subsector);
      if (has) {
        return {
          ...prev,
          subsectors: prev.subsectors.filter((s) => s !== subsector),
        };
      }
      return {
        ...prev,
        industries: prev.industries.includes(industry)
          ? prev.industries
          : [...prev.industries, industry],
        sectors: prev.sectors.includes(sector)
          ? prev.sectors
          : [...prev.sectors, sector],
        subsectors: [...prev.subsectors, subsector],
      };
    });
  };

  return (
    <div ref={wrapperRef} className="filters-field filter-with-tags">
      <div className="filter-label-row">
        <span>Industry</span>

        <div className="filter-tags-column">
          {filters.industries.map((industry) => {
            const sectorMap = INDUSTRY_SECTORS[industry] || {};
            const sectorsForIndustry = Object.keys(sectorMap);
            const selectedSectors = filters.sectors.filter((s) =>
              sectorsForIndustry.includes(s)
            );

            return (
              <div key={industry} className="industry-tag-block">
                <TagPill
                  label={industry}
                  onClick={() =>
                    setOpenIndustryTag(
                      openIndustryTag === industry ? null : industry
                    )
                  }
                  onRemove={() => toggleIndustry(industry)}
                >
                  <span className="tag-caret">▾</span>
                </TagPill>

                {openIndustryTag === industry && (
                  <div className="tag-dropdown">
                    {sectorsForIndustry.length === 0 ? (
                      <p className="tag-dropdown-empty">
                        No sectors defined.
                      </p>
                    ) : (
                      sectorsForIndustry.map((sector) => (
                        <label key={sector} className="multi-option">
                          <input
                            type="checkbox"
                            checked={filters.sectors.includes(sector)}
                            onChange={() => toggleSector(industry, sector)}
                          />
                          <span>{sector}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}

                {selectedSectors.length > 0 && (
                  <div className="sector-tags">
                    {selectedSectors.map((sector) => {
                      const subs =
                        (sectorMap[sector] || []).sort((a, b) =>
                          a.localeCompare(b)
                        );
                      const selectedSubs = subs.filter((sub) =>
                        filters.subsectors.includes(sub)
                      );

                      return (
                        <div key={sector} className="sector-tag-group">
                          <TagPill
                            label={sector}
                            onClick={() =>
                              setOpenSectorTag(
                                openSectorTag === sector ? null : sector
                              )
                            }
                            onRemove={() => toggleSector(industry, sector)}
                          >
                            {subs.length > 0 && (
                              <span className="tag-caret">▾</span>
                            )}
                          </TagPill>

                          {openSectorTag === sector && subs.length > 0 && (
                            <div className="tag-dropdown">
                              {subs.map((sub) => (
                                <label key={sub} className="multi-option">
                                  <input
                                    type="checkbox"
                                    checked={filters.subsectors.includes(sub)}
                                    onChange={() =>
                                      toggleSubsector(industry, sector, sub)
                                    }
                                  />
                                  <span>{sub}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {selectedSubs.length > 0 && (
                            <div className="subsector-tags">
                              {selectedSubs.map((sub) => (
                                <MiniTag
                                  key={sub}
                                  label={sub}
                                  onRemove={() =>
                                    toggleSubsector(industry, sector, sub)
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Searchable industry dropdown */}
      <div className="tag-search-wrapper">
        <input
          type="text"
          className="tag-search-input"
          placeholder="Type to search industries…"
          value={industrySearch}
          onFocus={() => setIndustryDropdownOpen(true)}
          onChange={(e) => setIndustrySearch(e.target.value)}
        />
        {industryDropdownOpen && filteredIndustries.length > 0 && (
          <div
            className="tag-suggestions tag-suggestions--checkbox"
            onMouseDown={(e) => e.preventDefault()}
          >
            {filteredIndustries.map((ind) => (
              <label key={ind} className="tag-suggestion-checkbox">
                <input
                  type="checkbox"
                  checked={filters.industries.includes(ind)}
                  onChange={() => toggleIndustry(ind)}
                />
                <span>{ind}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------
   FUNCTIONAL FILTER — FIXED CLICK-OUTSIDE
-------------------------------------------------------------- */

function FunctionalFilter({ filters, setFilters }) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openFuncTag, setOpenFuncTag] = useState(null);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setOpenFuncTag(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const areas = useMemo(
    () => Object.keys(FUNCTIONAL_SKILLS).sort((a, b) => a.localeCompare(b)),
    []
  );

  const filteredAreas = areas.filter((area) =>
    area.toLowerCase().includes(search.toLowerCase())
  );

  const toggleArea = (area) => {
    setFilters((prev) => {
      const already = prev.functionalAreas.includes(area);
      if (already) {
        const skills = FUNCTIONAL_SKILLS[area] || [];
        return {
          ...prev,
          functionalAreas: prev.functionalAreas.filter((a) => a !== area),
          functionalSkills: prev.functionalSkills.filter(
            (s) => !skills.includes(s)
          ),
        };
      }
      return { ...prev, functionalAreas: [...prev.functionalAreas, area] };
    });
  };

  const toggleSkill = (area, skill) => {
    setFilters((prev) => {
      const already = prev.functionalSkills.includes(skill);
      if (already) {
        return {
          ...prev,
          functionalSkills: prev.functionalSkills.filter((s) => s !== skill),
        };
      }
      return {
        ...prev,
        functionalAreas: prev.functionalAreas.includes(area)
          ? prev.functionalAreas
          : [...prev.functionalAreas, area],
        functionalSkills: [...prev.functionalSkills, skill],
      };
    });
  };

  return (
    <div ref={wrapperRef} className="filters-field filter-with-tags">
      <div className="filter-label-row">
        <span>Functional Expertise</span>

        <div className="filter-tags-column">
          {filters.functionalAreas.map((area) => {
            const skills = (FUNCTIONAL_SKILLS[area] || []).sort((a, b) =>
              a.localeCompare(b)
            );

            const selectedSkills = skills.filter((s) =>
              filters.functionalSkills.includes(s)
            );

            return (
              <div key={area} className="industry-tag-block">
                <TagPill
                  label={area}
                  onClick={() =>
                    setOpenFuncTag(openFuncTag === area ? null : area)
                  }
                  onRemove={() => toggleArea(area)}
                >
                  {skills.length > 0 && <span className="tag-caret">▾</span>}
                </TagPill>

                {openFuncTag === area && skills.length > 0 && (
                  <div className="tag-dropdown">
                    {skills.map((skill) => (
                      <label key={skill} className="multi-option">
                        <input
                          type="checkbox"
                          checked={filters.functionalSkills.includes(skill)}
                          onChange={() => toggleSkill(area, skill)}
                        />
                        <span>{skill}</span>
                      </label>
                    ))}
                  </div>
                )}

                {selectedSkills.length > 0 && (
                  <div className="subsector-tags">
                    {selectedSkills.map((skill) => (
                      <MiniTag
                        key={skill}
                        label={skill}
                        onRemove={() => toggleSkill(area, skill)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="tag-search-wrapper">
        <input
          type="text"
          className="tag-search-input"
          placeholder="Type to search functional areas…"
          value={search}
          onFocus={() => setDropdownOpen(true)}
          onChange={(e) => setSearch(e.target.value)}
        />
        {dropdownOpen && filteredAreas.length > 0 && (
          <div
            className="tag-suggestions tag-suggestions--checkbox"
            onMouseDown={(e) => e.preventDefault()}
          >
            {filteredAreas.map((area) => (
              <label key={area} className="tag-suggestion-checkbox">
                <input
                  type="checkbox"
                  checked={filters.functionalAreas.includes(area)}
                  onChange={() => toggleArea(area)}
                />
                <span>{area}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
/* ------------------------ MAIN COMPONENT ------------------------ */

export default function Marketplace() {
  const { role, profile } = useAuth();
  const isConsultant = role === "consultant";
  const needsFullProfileCTA =
    isConsultant &&
    profile?.phaseLightCompleted &&
    !profile?.phaseFullCompleted;
  const [q, setQ] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedFiltersOpen, setSavedFiltersOpen] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [consultantsLoading, setConsultantsLoading] = useState(true);
  const [consultantsError, setConsultantsError] = useState("");

  const [filters, setFilters] = useState({
    industries: [],
    sectors: [],
    subsectors: [],
    functionalAreas: [],
    functionalSkills: [],
    languages: [],
    softwareTools: [],
    donors: [],
    certifications: [],
    degrees: [],
    securityClearances: [],
    minExperience: "",
    maxExperience: "",
    timeZone: "",
    minDailyRate: "",
    maxDailyRate: "",
    availability: "",
  });

  const [savedFilters, setSavedFilters] = useState([]);
  const [editingFilterId, setEditingFilterId] = useState(null);
  const [editingFilterName, setEditingFilterName] = useState("");

  useEffect(() => {
    setConsultantsLoading(true);
    setConsultantsError("");
    const unsubscribe = subscribeToConsultants(
      (list) => {
        setConsultants(list);
        setConsultantsLoading(false);
      },
      (err) => {
        console.error("Failed to load consultants:", err);
        setConsultantsError("Unable to load consultants right now.");
        setConsultantsLoading(false);
      }
    );
    return () => unsubscribe?.();
  }, []);

  /* ---------- Saved filters helpers ---------- */

  const saveCurrentFilters = () => {
    const hasAny = Object.values(filters).some((v) =>
      Array.isArray(v) ? v.length > 0 : v !== ""
    );
    if (!hasAny) return;

    setSavedFilters((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: `Filter ${prev.length + 1}`,
        values: { ...filters },
      },
    ]);
  };

  const applySavedFilter = (preset) => {
    setFilters(preset.values);
    setSavedFiltersOpen(false);
    setFiltersOpen(true);
  };

  const deleteSavedFilter = (id) => {
    setSavedFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const startRenameFilter = (preset) => {
    setEditingFilterId(preset.id);
    setEditingFilterName(preset.name);
  };

  const saveRenameFilter = () => {
    setSavedFilters((prev) =>
      prev.map((f) =>
        f.id === editingFilterId ? { ...f, name: editingFilterName } : f
      )
    );
    setEditingFilterId(null);
    setEditingFilterName("");
  };

  const cancelRenameFilter = () => {
    setEditingFilterId(null);
    setEditingFilterName("");
  };

  const clearFilters = () =>
    setFilters({
      industries: [],
      sectors: [],
      subsectors: [],
      functionalAreas: [],
      functionalSkills: [],
      languages: [],
      softwareTools: [],
      donors: [],
      certifications: [],
      degrees: [],
      securityClearances: [],
      minExperience: "",
      maxExperience: "",
      timeZone: "",
      minDailyRate: "",
      maxDailyRate: "",
      availability: "",
    });

  /* ---------- Filtering consultants ---------- */

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return consultants.filter((c) => {
      const name = c.name || "";
      const headline = c.headline || c.professionalHeadline || "";
      const text = `${name} ${headline}`.toLowerCase();

      if (query && !text.includes(query)) return false;

      const industries = c.industries || (c.industry ? [c.industry] : []);
      const sectors = c.sectors || [];
      const subsectors = c.subsectors || [];
      const langs = c.languages || [];
      const funcAreas = c.functionalAreas || c.functionalExpertise || [];
      const funcSkills = c.functionalSkills || [];
      const tools = c.softwareTools || c.tools || [];
      const donors = c.donorExperience || c.donors || [];
      const certs = c.certifications || [];
      const degrees = c.degrees || c.educationDegrees || [];
      const clearances = c.securityClearances || c.clearances || [];

      if (filters.industries.length > 0) {
        if (!filters.industries.some((ind) => industries.includes(ind)))
          return false;
      }

      if (filters.sectors.length > 0) {
        if (!filters.sectors.some((s) => sectors.includes(s))) return false;
      }

      if (filters.subsectors.length > 0) {
        if (!filters.subsectors.some((s) => subsectors.includes(s)))
          return false;
      }

      if (filters.functionalAreas.length > 0) {
        if (!filters.functionalAreas.some((a) => funcAreas.includes(a)))
          return false;
      }

      if (filters.functionalSkills.length > 0) {
        if (!filters.functionalSkills.some((s) => funcSkills.includes(s)))
          return false;
      }

      if (filters.languages.length > 0) {
        if (!filters.languages.some((l) => langs.includes(l))) return false;
      }

      if (filters.softwareTools.length > 0) {
        if (!filters.softwareTools.some((t) => tools.includes(t))) return false;
      }

      if (filters.donors.length > 0) {
        if (!filters.donors.some((d) => donors.includes(d))) return false;
      }

      if (filters.certifications.length > 0) {
        if (!filters.certifications.some((cert) => certs.includes(cert)))
          return false;
      }

      if (filters.degrees.length > 0) {
        if (!filters.degrees.some((deg) => degrees.includes(deg)))
          return false;
      }

      if (filters.securityClearances.length > 0) {
        if (!filters.securityClearances.some((sc) => clearances.includes(sc)))
          return false;
      }

      const years =
        c.experienceYears ??
        c.yearsOfExperience ??
        c.years_experience ??
        0;

      if (filters.minExperience && years < Number(filters.minExperience))
        return false;

      if (filters.maxExperience && years > Number(filters.maxExperience))
        return false;

      if (filters.timeZone) {
        const tz = c.timeZone || c.timezone || "";
        if (tz !== filters.timeZone) return false;
      }

      const rate = c.dailyRate ?? c.dayRate ?? c.daily_rate ?? 0;

      if (filters.minDailyRate && rate < Number(filters.minDailyRate))
        return false;

      if (filters.maxDailyRate && rate > Number(filters.maxDailyRate))
        return false;

      if (filters.availability) {
        const avail =
          c.availabilityStatus || c.availability || c.status || "";
        if (
          !avail.toLowerCase().includes(filters.availability.toLowerCase())
        )
          return false;
      }

      return true;
    });
  }, [q, filters, consultants]);

  /* ------------------------ RENDER ------------------------ */

  return (
    <div className="dashboard-page marketplace-shell">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          {isConsultant ? "Marketplace Preview" : "Consultant Marketplace"}
        </h1>
        <p className="dashboard-subtitle">
          {isConsultant
            ? "Preview how your profile appears to clients."
            : "Search and explore vetted experts across impact sectors."}
        </p>
      </header>

      {needsFullProfileCTA && (
        <div className="marketplace-consultant-banner">
          <div>
            <h3>Finish your full profile</h3>
            <p>
              Complete the remaining sections so clients can view your full expertise.
            </p>
          </div>
          <Link className="banner-link" to="/consultant/profile-builder/full">
            Complete profile
          </Link>
        </div>
      )}

      <div style={{ margin: "16px 0 22px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="searchbar"
            placeholder="Search by name or headline…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button
            type="button"
            className="primary-button"
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => setSavedFiltersOpen(true)}
          >
            Saved Filters
          </button>
        </div>
      </div>

      {/* ---------------- FILTER MODAL ---------------- */}
      {filtersOpen && (
        <div
          className="filters-backdrop"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="filters-modal filters-modal-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="filters-header">
              <h3>Filter consultants</h3>
              <button
                type="button"
                className="filters-close"
                onClick={() => setFiltersOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="filters-body">
              <IndustryFilter filters={filters} setFilters={setFilters} />

              <FunctionalFilter filters={filters} setFilters={setFilters} />

              <SearchableCheckboxFilter
                label="Languages"
                options={LANGUAGES}
                selected={filters.languages}
                onChange={(vals) =>
                  setFilters((f) => ({ ...f, languages: vals }))
                }
              />

              <SearchableCheckboxFilter
                label="Software & Tools"
                options={SOFTWARE_TOOLS}
                selected={filters.softwareTools}
                onChange={(vals) =>
                  setFilters((f) => ({ ...f, softwareTools: vals }))
                }
              />

              <SearchableCheckboxFilter
                label="Donor Experience"
                options={DONOR_EXPERIENCE}
                selected={filters.donors}
                onChange={(vals) =>
                  setFilters((f) => ({ ...f, donors: vals }))
                }
              />

              <SearchableCheckboxFilter
                label="Certifications"
                options={CERTIFICATIONS}
                selected={filters.certifications}
                onChange={(vals) =>
                  setFilters((f) => ({ ...f, certifications: vals }))
                }
              />

              <SearchableCheckboxFilter
                label="Degrees Earned"
                options={DEGREES}
                selected={filters.degrees}
                onChange={(vals) =>
                  setFilters((f) => ({ ...f, degrees: vals }))
                }
              />

              <SearchableCheckboxFilter
                label="Security Clearances"
                options={SECURITY_CLEARANCES}
                selected={filters.securityClearances}
                onChange={(vals) =>
                  setFilters((f) => ({ ...f, securityClearances: vals }))
                }
              />

              <div className="filters-field">
                <span>Years of Professional Experience</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={filters.minExperience}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        minExperience: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={filters.maxExperience}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        maxExperience: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="filters-field">
                <span>Time Zone</span>
                <select
                  value={filters.timeZone}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, timeZone: e.target.value }))
                  }
                >
                  <option value="">Any</option>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filters-field">
                <span>Daily Rate (USD)</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={filters.minDailyRate}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        minDailyRate: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={filters.maxDailyRate}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        maxDailyRate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="filters-field">
                <span>Availability</span>
                <input
                  type="text"
                  placeholder="e.g. Available, Booked, 2 days/week"
                  value={filters.availability}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      availability: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="filters-footer">
              <button
                type="button"
                className="outline-button"
                onClick={clearFilters}
              >
                Clear
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={saveCurrentFilters}
              >
                Save
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => setFiltersOpen(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SAVED FILTERS MODAL ---------------- */}
      {savedFiltersOpen && (
        <div
          className="filters-backdrop"
          onClick={() => setSavedFiltersOpen(false)}
        >
          <div
            className="filters-modal filters-modal-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="filters-header">
              <h3>Saved Filters</h3>
              <button
                type="button"
                className="filters-close"
                onClick={() => setSavedFiltersOpen(false)}
              >
                ✕
              </button>
            </div>

            {savedFilters.length === 0 ? (
              <p style={{ marginTop: 8, color: "#6b7280" }}>
                You don’t have any saved filters yet.
              </p>
            ) : (
              <ul className="saved-filters-list">
                {savedFilters.map((preset) => (
                  <li key={preset.id} className="saved-filters-item">
                    <div className="saved-filter-main">
                      {editingFilterId === preset.id ? (
                        <>
                          <input
                            className="saved-filter-name-input"
                            value={editingFilterName}
                            onChange={(e) =>
                              setEditingFilterName(e.target.value)
                            }
                          />

                          <div className="saved-filters-rename-actions">
                            <button
                              type="button"
                              className="primary-button"
                              onClick={saveRenameFilter}
                            >
                              Save name
                            </button>

                            <button
                              type="button"
                              className="outline-button"
                              onClick={cancelRenameFilter}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="saved-filter-name">
                            {preset.name}
                          </span>

                          <div className="saved-filter-summary">
                            {Object.entries(preset.values)
                              .filter(([, v]) =>
                                Array.isArray(v) ? v.length > 0 : v !== ""
                              )
                              .map(([key, val]) =>
                                Array.isArray(val)
                                  ? `${key}: ${val.join(", ")}`
                                  : `${key}: ${val}`
                              )
                              .join(" • ")}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="saved-filters-actions">
                      {editingFilterId !== preset.id && (
                        <button
                          type="button"
                          className="outline-button"
                          onClick={() => startRenameFilter(preset)}
                        >
                          Rename
                        </button>
                      )}

                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => applySavedFilter(preset)}
                      >
                        Apply
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => deleteSavedFilter(preset.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* RESULTS */}
      <section className="marketplace-grid" aria-live="polite">
        {consultantsLoading && (
          <p style={{ color: "#6b7280" }}>Loading consultants…</p>
        )}
        {!consultantsLoading &&
          filtered.map((c) => (
            <ConsultantCard
              key={c.id}
              consultant={c}
              viewerRole={isConsultant ? "consultant" : "client"}
            />
          ))}
      </section>

      {consultantsError && (
        <p style={{ marginTop: 16, color: "#b91c1c" }}>{consultantsError}</p>
      )}

      {!consultantsLoading && !consultantsError && filtered.length === 0 && (
        <p style={{ marginTop: 16, color: "#6b7280" }}>
          No consultants match your search.
        </p>
      )}
    </div>
  );
}
