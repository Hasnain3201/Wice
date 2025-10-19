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
    <main className="shell">
      <h2 className="title" style={{ margin: 0 }}>GrantHunt</h2>
      <p className="subtitle" style={{ marginTop: 8 }}>
        Quickly scan for relevant funding opportunities across sectors.
      </p>

      {/* Toolbar */}
      <div className="toolbar">
        <input
          className="searchbar"
          placeholder="Search by title, agency, keywords…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search grants"
        />

        <div className="filters">
          <label className="label small">Sector</label>
          <select className="select" value={sector} onChange={(e) => setSector(e.target.value)}>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <label className="label small">Region</label>
          <select className="select" value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <label className="label small">Type</label>
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      <section className="grant-grid">
        {filtered.map((g) => <GrantCard key={g.id} grant={g} />)}
      </section>

      {filtered.length === 0 && (
        <p style={{ marginTop: 16, color: "#6b7280" }}>
          No results. Try changing filters or search terms.
        </p>
      )}
    </main>
  );
}
