import { useState } from "react";

export default function PortfolioNPow({ onBack, onNext }) {
  const [cv, setCv] = useState(null);
  const valid = !!cv;

  return (
    <div className="section">
      <h2>Portfolio and Proof of Work</h2>
      <p>Upload your resume and any samples of your professional work.</p>

      <label>Resume / CV *</label>
      <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files[0])} />

      <label>Additional Files (optional)</label>
      <input type="file" accept=".pdf,.doc,.ppt,.pptx" multiple />

      <div className="section-actions">
        
      </div>
    </div>
  );
}
