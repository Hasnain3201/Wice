import { useState } from "react";

export default function ExperienceSnapshot({ onBack, onNext }) {
  const [regions, setRegions] = useState([]);
  const [valid, setValid] = useState(false);

  const handleCheckbox = (r) => {
    setRegions((prev) =>
      prev.includes(r) ? prev.filter((v) => v !== r) : [...prev, r]
    );
    setValid(true);
  };

  const nextHandler = () => onNext(valid);

  return (
    <div className="section">
      <h2>Experience Snapshot</h2>
      <p>Select at least one region where you’ve worked or supported programs.</p>

      <div className="multi-select">
        {["Africa", "Asia", "Europe", "North America", "South America"].map((r) => (
          <label key={r}>
            <input
              type="checkbox"
              checked={regions.includes(r)}
              onChange={() => handleCheckbox(r)}
            />
            {r}
          </label>
        ))}
      </div>

      <div className="section-actions">
        <button className="back" onClick={onBack}>Back</button>
        <button className="next" disabled={!valid} onClick={nextHandler}>Next</button>
      </div>
    </div>
  );
}
