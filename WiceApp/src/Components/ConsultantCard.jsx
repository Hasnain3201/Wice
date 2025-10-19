import React from "react";
import { Link } from "react-router-dom";

export default function ConsultantCard({ consultant, viewerRole = "client" }) {
  const { id, name, headline, image, sectors } = consultant;
  const avatar =
    image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=E5E7EB&color=111827&size=128&bold=true`;

  const ctaLabel = viewerRole === "consultant" ? "Preview profile" : "View profile";
  const contextLine = viewerRole === "consultant" && sectors
    ? `Highlighted sectors: ${sectors}`
    : null;

  return (
    <article className="card-profile">
      <img src={avatar} className="avatar" alt={`${name} avatar`} />
      <h3 className="card-name">{name}</h3>
      <p className="card-headline">{headline}</p>
      {contextLine ? <p className="card-context">{contextLine}</p> : null}

      <Link to={`/consultant/${id}`} className="card-cta" aria-label={`View ${name} profile`}>
        {ctaLabel}
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L12 6.414V16a1 1 0 11-2 0V6.414L6.707 9.707A1 1 0 115.293 8.293l5-5z"/>
        </svg>
      </Link>
    </article>
  );
}
