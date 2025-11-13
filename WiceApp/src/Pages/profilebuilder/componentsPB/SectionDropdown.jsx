import { useState } from "react";
import "../profileBuilder.css";

export default function SectionDropdown({ title, data }) {
  const [open, setOpen] = useState(false);

  const isEmpty =
    !data || (typeof data === "object" && Object.keys(data).length === 0);

  return (
    <div className="pb-dropdown-container">
      <button
        className="pb-dropdown-header"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span className="pb-dropdown-icon">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="pb-dropdown-body">
          {isEmpty ? (
            <p className="pb-empty-text">No information provided yet.</p>
          ) : (
            <pre className="pb-data-block">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
