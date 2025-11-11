import { useState } from "react";
import "../ProfileBuilder.css"

export default function ProfessionalIdentity({ onNext }) {
  const [oneLiner, setOneLiner] = useState("");
  const [about, setAbout] = useState("");
  const [oneLinerError, setOneLinerError] = useState("");
  const [aboutError, setAboutError] = useState("");

  const handleOneLinerChange = (e) => {
    const value = e.target.value;
    setOneLiner(value);

    if (value.length < 120) {
      setOneLinerError(`Your one-liner must be exactly 120 characters. (${value.length}/120)`);
    } else if (value.length > 120) {
      setOneLinerError(`Exceeded limit! Please use only 120 characters.`);
    } else {
      setOneLinerError("");
    }
  };

  const handleAboutChange = (e) => {
    const value = e.target.value;
    setAbout(value);

    if (value.length < 300) {
      setAboutError(`Your about section must be exactly 300 characters. (${value.length}/300)`);
    } else if (value.length > 300) {
      setAboutError(`Exceeded limit! Please use only 300 characters.`);
    } else {
      setAboutError("");
    }
  };

  return (
    <div className="section">
      <h2>Professional Identity</h2>
      <p>
        Build a snapshot of who you are professionally. These details help clients
        understand your background quickly.
      </p>

      <form>
        {/* One-Liner Bio */}
        <label>One-Liner Bio *</label>
        <p className="description">
          This line will appear on your consultant card when clients first search for consultants. (120 character max)
        </p>
        <input
          type="text"
          value={oneLiner}
          onChange={handleOneLinerChange}
          placeholder="Example: Global Health Advisor with 12 years supporting Latin America programs."
          required
        />
        {oneLinerError && <p className="error-message">{oneLinerError}</p>}

        {/* About Section */}
        <label>About *</label>
        <p className="description">
          This section appears when clients click into your consultant profile. (300 character max)
        </p>
        <textarea
          value={about}
          onChange={handleAboutChange}
          placeholder="Write a concise and engaging description about your professional journey."
          rows="5"
          required
        />
        {aboutError && <p className="error-message">{aboutError}</p>}

        {/* Professional Experience */}
        <label>Total Years of Professional Experience *</label>
        <select required>
          <option value="">Select...</option>
          <option>Less than 2</option>
          <option>2-4</option>
          <option>5-7</option>
          <option>8-10</option>
          <option>11-14</option>
          <option>15-20</option>
          <option>20+</option>
        </select>

        {/* LinkedIn URL */}
        <label>LinkedIn URL</label>
        <input type="url" placeholder="https://www.linkedin.com/in/yourname" />

        {/* Actions */}
        <div className="section-actions">
         
        </div>
      </form>
    </div>
  );
}
