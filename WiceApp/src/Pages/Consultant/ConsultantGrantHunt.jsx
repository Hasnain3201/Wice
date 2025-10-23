import React, { useMemo, useState } from "react";
import { grants } from "../../data/grants.js";
import GrantCard from "../../Components/GrantCard.jsx";

export default function GrantHunt() {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("All");
  const [region, setRegion] = useState("All");
  const [type, setType] = useState("All");

  const sectors = ["All", "Climate", "Health", "Energy", "Agriculture", "Community"];
  const regions = ["All", "US", "EU", "Global", "Africa", "Asia", "LAC"];
  const types = ["All", "Grant", "RFP", "Fellowship", "Challenge"];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return grants.filter((g) => {
      const matchesQuery =
        !query ||
        `${g.title} ${g.agency} ${g.summary}`.toLowerCase().includes(query);

      const matchesSector = sector === "All" || g.sectors.includes(sector);
      const matchesRegion = region === "All" || g.region === region;
      const matchesType = type === "All" || g.type === type;
      return matchesQuery && matchesSector && matchesRegion && matchesType;
    });
  }, [q, sector, region, type]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">GrantHunt</h1>
        <p className="dashboard-subtitle">
          Quickly scan for relevant funding opportunities across sectors.
        </p>
      </header>

      {/* Toolbar */}
      <div className="grant-toolbar">
        <div className="grant-toolbar__search">
          <input
            className="searchbar"
            placeholder="Search by title, agency, keywords…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search grants"
          />
        </div>

        <div className="grant-toolbar__filters">
          <div className="filter-control">
            <label className="label small" htmlFor="grant-sector">Sector</label>
            <select
              id="grant-sector"
              className="select"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-control">
            <label className="label small" htmlFor="grant-region">Region</label>
            <select
              id="grant-region"
              className="select"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="filter-control">
            <label className="label small" htmlFor="grant-type">Type</label>
            <select
              id="grant-type"
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="dashboard-card">
        <section className="grant-grid">
          {filtered.map((g) => <GrantCard key={g.id} grant={g} />)}
        </section>

        {filtered.length === 0 && (
          <p style={{ marginTop: 16, color: "#6b7280" }}>
            No results. Try changing filters or search terms.
          </p>
        )}
      </section>
    </div>
  );
}
