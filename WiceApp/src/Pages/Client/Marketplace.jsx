import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConsultantCard from "../../Components/ConsultantCard.jsx";
import { consultants } from "../../data/consultants.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Marketplace() {
  const [q, setQ] = useState("");
  const { role } = useAuth();
  const isConsultant = role === "consultant";

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
    <div className="marketplace-shell">
      <header style={{ marginBottom: 16 }}>
        <h2 className="title" style={{ margin: 0 }}>
          {isConsultant ? "Marketplace Preview" : "Consultant Marketplace"}
        </h2>
        <p className="subtitle" style={{ marginTop: 8 }}>
          {isConsultant
            ? "Preview how clients see consultants, optimize your listing, and monitor peers."
            : "Search and explore vetted experts across climate, health, energy, and community development."}
        </p>
      </header>

      {isConsultant ? (
        <div className="marketplace-consultant-banner">
          <div>
            <h3>Boost your visibility</h3>
            <p>
              Keep your skills, sectors, and availability current so clients find you first.
            </p>
          </div>
          <Link className="banner-link" to="/consultant/profile">
            Manage profile
          </Link>
        </div>
      ) : null}

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
          <ConsultantCard
            key={c.id}
            consultant={c}
            viewerRole={isConsultant ? "consultant" : "client"}
          />
        ))}
      </section>

      {filtered.length === 0 && (
        <p style={{ marginTop: 16, color: "#6b7280" }}>
          No consultants match your search.
        </p>
      )}
    </div>
  );
}
