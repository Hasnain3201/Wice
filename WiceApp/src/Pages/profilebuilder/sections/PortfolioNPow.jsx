import { useState } from "react";

export default function PortfolioNPow() {
  const [cvName, setCvName] = useState("");
  const [sampleCount, setSampleCount] = useState(0);

  const handleResumeUpload = (event) => {
    const file = event.target.files?.[0];
    setCvName(file?.name || "");
  };

  const handleSampleUpload = (event) => {
    setSampleCount(event.target.files?.length ?? 0);
  };

  return (
    <div className="section">
      <h2>Portfolio and Proof of Work</h2>
      <p>Upload your resume and any samples of your professional work.</p>

      <label>Resume / CV *</label>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleResumeUpload}
      />
      {cvName && (
        <p className="selected-info">
          <span className="label-light">Selected:</span> {cvName}
        </p>
      )}

      <label>Additional Files (optional)</label>
      <input
        type="file"
        accept=".pdf,.doc,.ppt,.pptx"
        multiple
        onChange={handleSampleUpload}
      />
      {sampleCount > 0 && (
        <p className="selected-info">
          <span className="label-light">Ready to upload:</span> {sampleCount} file(s)
        </p>
      )}
    </div>
  );
}
