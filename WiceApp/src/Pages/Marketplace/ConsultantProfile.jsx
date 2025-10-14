import React from "react";
import { Link, useParams } from "react-router-dom";
import NavBar from "../../Components/NavBar.jsx";
import { consultants } from "../../data/consultants.js";

export default function ConsultantProfile() {
  const { id } = useParams();
  const profile = consultants.find((c) => String(c.id) === String(id));

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--page)" }}>
        <NavBar />
        <div className="profile-wrap">
          <p style={{ color: "#b91c1c" }}>Consultant not found.</p>
          <p>
            Go back to <Link className="backlink" to="/marketplace">Marketplace</Link>.
          </p>
        </div>
      </div>
    );
  }

  const avatar =
    profile.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile.name
    )}&background=E5E7EB&color=111827&size=180&bold=true`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--page)" }}>
      <NavBar />
      <div className="profile-wrap">
        <Link className="backlink" to="/marketplace">← Back to Marketplace</Link>

        <div className="profile-head" style={{ marginTop: 14 }}>
          <img src={avatar} alt={`${profile.name} avatar`} className="profile-img" />
          <div>
            <h1 className="profile-name">{profile.name}</h1>
            <p className="profile-sub">{profile.headline}</p>
            <p className="kv"><strong>Location:</strong> {profile.location}</p>
          </div>
        </div>

        <section>
          <h3 className="section-title">Professional Bio</h3>
          <p style={{ color: "#111827", lineHeight: 1.6 }}>{profile.bio}</p>
        </section>

        <section>
          <h3 className="section-title">Additional Info</h3>
          {profile.languages && (
            <p className="kv"><strong>Languages:</strong> {profile.languages}</p>
          )}
          {profile.linkedin && (
            <p className="kv">
              <strong>LinkedIn:</strong>{" "}
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="backlink"
              >
                View profile
              </a>
            </p>
          )}
        </section>

        {/* placeholder for future contact flow */}
        {/* <button className="btn primary" style={{ marginTop: 16 }}>Request Consultation</button> */}
      </div>
    </div>
  );
}
