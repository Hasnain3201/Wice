import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchConsultantById } from "../../services/consultantsDirectory.js";

export default function ConsultantProfile() {
  const { id } = useParams();
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    fetchConsultantById(id)
      .then((doc) => {
        if (!isMounted) return;
        if (!doc) {
          setError("Consultant not found.");
        }
        setConsultant(doc);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load consultant profile:", err);
        if (!isMounted) return;
        setError("Unable to load this consultant right now.");
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="profile-wrap">
        <p style={{ color: "#6b7280" }}>Loading consultant…</p>
      </div>
    );
  }

  if (error || !consultant) {
    return (
      <div className="profile-wrap">
        <p style={{ color: "#b91c1c" }}>{error || "Consultant not found."}</p>
        <p>
          Go back to{" "}
          <Link className="backlink" to="/marketplace">
            Marketplace
          </Link>
          .
        </p>
      </div>
    );
  }

  const profile = consultant.profile || {};
  const avatar =
    profile.photoUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      consultant.name
    )}&background=E5E7EB&color=111827&size=180&bold=true`;

  const languages = consultant.languages?.join(", ");
  const industries = consultant.industries?.join(", ");
  const sectors = consultant.sectors?.join(", ");

  return (
    <div className="profile-wrap">
      <Link className="backlink" to="/marketplace">
        ← Back to Marketplace
      </Link>

      <div className="profile-head" style={{ marginTop: 14 }}>
        <img src={avatar} alt={`${consultant.name} avatar`} className="profile-img" />
        <div>
          <h1 className="profile-name">{consultant.name}</h1>
          <p className="profile-sub">{consultant.headline}</p>
          {consultant.location && (
            <p className="kv">
              <strong>Location:</strong> {consultant.location}
            </p>
          )}
          {consultant.country && (
            <p className="kv">
              <strong>Country:</strong> {consultant.country}
            </p>
          )}
          {consultant.timeZone && (
            <p className="kv">
              <strong>Time Zone:</strong> {consultant.timeZone}
            </p>
          )}
        </div>
      </div>

      <section>
        <h3 className="section-title">Professional Bio</h3>
        <p style={{ color: "#111827", lineHeight: 1.6 }}>
          {profile.about || "This consultant has not added a bio yet."}
        </p>
      </section>

      <section>
        <h3 className="section-title">Expertise</h3>
        {industries && (
          <p className="kv">
            <strong>Industries:</strong> {industries}
          </p>
        )}
        {sectors && (
          <p className="kv">
            <strong>Sectors:</strong> {sectors}
          </p>
        )}
        {languages && (
          <p className="kv">
            <strong>Languages:</strong> {languages}
          </p>
        )}
      </section>

      <section>
        <h3 className="section-title">Additional Info</h3>
        {profile.linkedinUrl && (
          <p className="kv">
            <strong>LinkedIn:</strong>{" "}
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="backlink"
            >
              View profile
            </a>
          </p>
        )}
        {profile.openToTravel !== undefined && profile.openToTravel !== "" && (
          <p className="kv">
            <strong>Open to Travel:</strong>{" "}
            {profile.openToTravel === true || profile.openToTravel === "Yes"
              ? "Yes"
              : profile.openToTravel === false || profile.openToTravel === "No"
              ? "No"
              : profile.openToTravel}
          </p>
        )}
        {profile.dailyRate && (
          <p className="kv">
            <strong>Daily Rate:</strong> {profile.currency || "USD"} {profile.dailyRate}
          </p>
        )}
      </section>
    </div>
  );
}
