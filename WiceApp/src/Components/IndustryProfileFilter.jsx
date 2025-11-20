/* ============================================================
   MARKETPLACE-STYLE INDUSTRY FILTER (PROFILE VERSION)
   ============================================================ */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { INDUSTRY_SECTORS } from "../data/taxonomy";

function TagPill({ label, onClick, onRemove, className = "", children }) {
  return (
    <div className={`filter-tag-pill ${className}`}>
      <button type="button" className="filter-tag-main" onClick={onClick}>
        <span>{label}</span>
        {children}
      </button>
      {onRemove && (
        <button type="button" className="tag-remove" onClick={onRemove}>
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

function IndustryProfileFilter({ industryFilters, setIndustryFilters }) {
  const { industries, sectors, subsectors } = industryFilters;

  const [industrySearch, setIndustrySearch] = useState("");
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const [openIndustryTag, setOpenIndustryTag] = useState(null);
  const [openSectorTag, setOpenSectorTag] = useState(null);

  const wrapperRef = useRef(null);

  /* Close dropdowns when clicking outside */
  useEffect(() => {
    const handle = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIndustryDropdownOpen(false);
        setOpenIndustryTag(null);
        setOpenSectorTag(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* Industry list (full taxonomy) */
  const allIndustries = useMemo(
    () => Object.keys(INDUSTRY_SECTORS).sort((a, b) => a.localeCompare(b)),
    []
  );

  /* Filter industries by search */
  const filteredIndustries = allIndustries.filter((ind) =>
    ind.toLowerCase().includes(industrySearch.toLowerCase())
  );

  /* Toggle industry selection */
  const toggleIndustry = (industry) => {
    setIndustryFilters((prev) => {
      const already = prev.industries.includes(industry);

      if (already) {
        // remove industry + all children sectors + subsectors
        const secMap = INDUSTRY_SECTORS[industry] || {};
        const secs = Object.keys(secMap);
        const subs = secs.flatMap((s) => secMap[s] || []);

        return {
          ...prev,
          industries: prev.industries.filter((i) => i !== industry),
          sectors: prev.sectors.filter((s) => !secs.includes(s)),
          subsectors: prev.subsectors.filter((sub) => !subs.includes(sub)),
        };
      }

      if (prev.industries.length >= 3) return prev;

      return { ...prev, industries: [...prev.industries, industry] };
    });
  };

  /* Toggle sector selection */
  const toggleSector = (industry, sector) => {
    setIndustryFilters((prev) => {
      const has = prev.sectors.includes(sector);
      const subs = (INDUSTRY_SECTORS[industry] || {})[sector] || [];

      if (has) {
        // remove sector + its subsectors
        return {
          ...prev,
          sectors: prev.sectors.filter((s) => s !== sector),
          subsectors: prev.subsectors.filter((s) => !subs.includes(s)),
        };
      }

      return {
        ...prev,
        sectors: [...prev.sectors, sector],
      };
    });
  };

  /* Toggle subsector selection */
  const toggleSubsector = (industry, sector, sub) => {
    setIndustryFilters((prev) => {
      const has = prev.subsectors.includes(sub);
      if (has) {
        return {
          ...prev,
          subsectors: prev.subsectors.filter((s) => s !== sub),
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
        subsectors: [...prev.subsectors, sub],
      };
    });
  };

  return (
    <div ref={wrapperRef} className="filters-field filter-with-tags">

      {/* Label + all selected tags */}
      <div className="filter-label-row">
        <span>Industries (max 3)</span>

        <div className="filter-tags-column">
          {industries.map((industry) => {
            const sectorMap = INDUSTRY_SECTORS[industry] || {};
            const sectorsForIndustry = Object.keys(sectorMap);
            const selectedSectors = sectors.filter((s) =>
              sectorsForIndustry.includes(s)
            );

            return (
              <div key={industry} className="industry-tag-block">

                {/* Industry tag */}
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

                {/* Sector dropdown */}
                {openIndustryTag === industry && (
                  <div className="tag-dropdown">
                    {sectorsForIndustry.map((sector) => (
                      <label key={sector} className="multi-option">
                        <input
                          type="checkbox"
                          checked={sectors.includes(sector)}
                          onChange={() => toggleSector(industry, sector)}
                        />
                        <span>{sector}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Sector + subsector tags */}
                <div className="sector-tags">
                  {selectedSectors.map((sector) => {
                    const subs = sectorMap[sector] || [];
                    const selectedSubs = subs.filter((sub) =>
                      subsectors.includes(sub)
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
                          <span className="tag-caret">▾</span>
                        </TagPill>

                        {openSectorTag === sector && (
                          <div className="tag-dropdown">
                            {subs.map((sub) => (
                              <label key={sub} className="multi-option">
                                <input
                                  type="checkbox"
                                  checked={subsectors.includes(sub)}
                                  onChange={() =>
                                    toggleSubsector(industry, sector, sub)
                                  }
                                />
                                <span>{sub}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        <div className="subsector-tags">
                          {selectedSubs.map((sub) => (
                            <MiniTag
                              key={sub}
                              label={sub}
                              onRemove={() => toggleSubsector(industry, sector, sub)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Industry dropdown trigger */}
      <div className="tag-search-wrapper">
        <input
          type="text"
          className="tag-search-input"
          placeholder="Search industries"
          value={industrySearch}
          onFocus={() => setIndustryDropdownOpen(true)}
          onChange={(e) => setIndustrySearch(e.target.value)}
        />
        {industryDropdownOpen && (
          <div className="tag-suggestions">
            {filteredIndustries.length > 0 ? (
              filteredIndustries.map((industry) => (
                <button
                  key={industry}
                  type="button"
                  className="tag-suggestion"
                  onClick={() => toggleIndustry(industry)}
                >
                  {industry}
                </button>
              ))
            ) : (
              <p className="tag-dropdown-empty">No industries found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default IndustryProfileFilter;
