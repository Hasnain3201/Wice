import { useState } from "react";
import "../profileBuilder.css";

export default function SectionDropdown({ title, data = {} }) {
  const [open, setOpen] = useState(false);

  const isEmpty =
    !data ||
    (typeof data === "object" &&
      Object.values(data).every((v) => !v || v.length === 0));

  // Format values so they show as normal readable text instead of code
  const formatValue = (value) => {
    if (!value) return "—";

    // Arrays → comma separated
    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "—";
    }

    // Strings with line breaks → render lines
    if (typeof value === "string" && value.includes("\n")) {
      return value.split("\n").map((line, i) => (
        <div key={i} style={{ marginBottom: "4px" }}>
          {line}
        </div>
      ));
    }

    return value;
  };

  return (
    <div className="pb-dropdown-container">
      <button className="pb-dropdown-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className="pb-dropdown-icon">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="pb-dropdown-body">
          {isEmpty ? (
            <p className="pb-empty-text">No information provided yet.</p>
          ) : (
            Object.entries(data).map(([label, value]) => (
              <div key={label} style={{ marginBottom: "14px" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>
                  {label}:
                </strong>

                <div className="pb-data-block">{formatValue(value)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
