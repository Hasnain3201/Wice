import { useState } from "react";

export default function EducationNCredentials() {
  const [degree, setDegree] = useState("");
  const [institution, setInstitution] = useState("");

  return (
    <div className="section">
      <h2>Education and Credentials</h2>
      <p>Provide your highest degree and institution attended.</p>

      <label>Highest Degree *</label>
      <select value={degree} onChange={(e) => setDegree(e.target.value)} required>
        <option value="">Select...</option>
        <option>Bachelor’s</option>
        <option>Master’s</option>
        <option>PhD</option>
      </select>

      <label>Institution *</label>
      <input
        type="text"
        placeholder="Enter institution name"
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
        required
      />
    </div>
  );
}
