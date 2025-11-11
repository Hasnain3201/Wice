import { useState } from "react";

export default function ExpertiseSnapshot({ onNext }) {
  const [industries, setIndustries] = useState([]);
  const [sectors, setSectors] = useState([]);

  const toggle = (list, setList, item) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="section">
      <h2>Expertise Snapshot</h2>
      <p>
        Select at least one Industry and one related Sector to begin. You may add more
        later or expand your profile.
      </p>

      <form>
        <label>Industries *</label>
        <div className="multi-select">
          {["Health", "Finance", "Agriculture", "Education"].map((i) => (
            <label key={i}>
              <input
                type="checkbox"
                checked={industries.includes(i)}
                onChange={() => toggle(industries, setIndustries, i)}
              />{" "}
              {i}
            </label>
          ))}
        </div>

        <label>Sectors *</label>
        <div className="multi-select">
          {["Policy", "Operations", "Research", "Technology"].map((s) => (
            <label key={s}>
              <input
                type="checkbox"
                checked={sectors.includes(s)}
                onChange={() => toggle(sectors, setSectors, s)}
              />{" "}
              {s}
            </label>
          ))}
        </div>

        <label>Languages</label>
        <select multiple>
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>Arabic</option>
        </select>

        <div className="section-actions">
          <button type="button" className="skip">Skip</button>
          <button type="button" className="link">Already have a profile</button>
          <button type="button" className="next" onClick={onNext}>Next</button>
        </div>
      </form>
    </div>
  );
}
