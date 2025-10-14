import React, { useMemo, useState } from "react";
import NavBar from "../../Components/NavBar.jsx";
import ConsultantCard from "../../Components/ConsultantCard.jsx";
import { consultants } from "../../data/consultants.js";

export default function Marketplace() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return consultants;
    return consultants.filter((c) => {
      const hay =
        `${c.name} ${c.headline} ${c.location} ${c.languages} ${c.bio || ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--page)" }}>
      <NavBar />

      <main className="marketplace-shell">
        <header style={{ marginBottom: 16 }}>
          <h2 className="title" style={{ margin: 0 }}>Consultant Marketplace</h2>
          <p className="subtitle" style={{ marginTop: 8 }}>
            Search and explore vetted experts across climate, health, energy, and community development.
          </p>
        </header>

        <div style={{ margin: "16px 0 22px" }}>
          <input
            className="searchbar"
            placeholder="Search by name, skill, sector, language…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search consultants"
          />
        </div>

        <section className="grid" aria-live="polite">
          {filtered.map((c) => (
            <ConsultantCard key={c.id} consultant={c} />
          ))}
        </section>

        {filtered.length === 0 && (
          <p style={{ marginTop: 16, color: "#6b7280" }}>
            No consultants match your search.
          </p>
        )}
      </main>
    </div>
  );
}
