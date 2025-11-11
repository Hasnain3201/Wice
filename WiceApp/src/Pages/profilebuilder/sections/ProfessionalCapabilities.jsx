import { useState } from "react";

export default function ProfessionalCapabilities({ onBack, onNext }) {
  const [skills, setSkills] = useState([]);
  const [valid, setValid] = useState(false);

  const toggleSkill = (s) => {
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setValid(true);
  };

  const nextHandler = () => onNext(valid);

  return (
    <div className="section">
      <h2>Professional Capabilities</h2>
      <p>Select the professional skills that describe your core capabilities.</p>

      <div className="multi-select">
        {["Project Management", "Data Analysis", "Policy Design", "Financial Planning"].map(
          (s) => (
            <label key={s}>
              <input
                type="checkbox"
                checked={skills.includes(s)}
                onChange={() => toggleSkill(s)}
              />
              {s}
            </label>
          )
        )}
      </div>

      <div className="section-actions">
        <button className="back" onClick={onBack}>Back</button>
        <button className="next" disabled={!valid} onClick={nextHandler}>Next</button>
      </div>
    </div>
  );
}
