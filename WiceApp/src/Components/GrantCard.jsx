import React, { useState } from "react";

export default function GrantCard({ grant }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="grant-card">
      <div className="grant-top">
        <div>
          <h3 className="grant-title">{grant.title}</h3>
          <p className="grant-agency">{grant.agency} • {grant.region} • {grant.type}</p>
          <div className="pill-row">
            {grant.sectors.map((s) => (
              <span className="pill" key={s}>{s}</span>
            ))}
            {grant.amount && <span className="pill pill-money">{grant.amount}</span>}
          </div>
        </div>

        <button className="ghost-btn" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Details"}
        </button>
      </div>

      <p className="grant-summary">{grant.summary}</p>

      {open && (
        <div className="grant-detail">
          <div className="kv"><strong>Deadline:</strong> {grant.deadline}</div>
          {grant.url && (
            <div className="kv">
              <strong>Link:</strong>{" "}
              <a className="backlink" href={grant.url} target="_blank" rel="noreferrer">
                View opportunity
              </a>
            </div>
          )}
          {grant.eligibility && (
            <div className="kv"><strong>Eligibility:</strong> {grant.eligibility}</div>
          )}
          {grant.notes && (
            <div className="kv"><strong>Notes:</strong> {grant.notes}</div>
          )}
        </div>
      )}
    </article>
  );
}
