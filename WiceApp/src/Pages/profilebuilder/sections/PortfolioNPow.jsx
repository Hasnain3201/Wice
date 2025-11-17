import { useState, useEffect } from "react";
import "../ProfileBuilder.css";

export default function PortfolioNPow({
  profileData,
  setProfileData,
  onNext,
  onBack,
}) {
  const [portfolioLinks, setPortfolioLinks] = useState(
    profileData.portfolioLinks || []
  );

  const [newLink, setNewLink] = useState("");

  const [portfolioUploads, setPortfolioUploads] = useState(
    profileData.portfolioUploads || []
  );

  // ⭐ Sync into global profileData
  useEffect(() => {
    setProfileData({
      ...profileData,
      portfolioLinks,
      portfolioUploads,
    });
  }, [portfolioLinks, portfolioUploads]);

  const addLink = () => {
    if (!newLink.trim()) return;
    setPortfolioLinks([...portfolioLinks, newLink.trim()]);
    setNewLink("");
  };

  const removeLink = (index) => {
    const updated = [...portfolioLinks];
    updated.splice(index, 1);
    setPortfolioLinks(updated);
  };

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files); // convert FileList -> array
    setPortfolioUploads([...portfolioUploads, ...newFiles]);
  };

  const removeFile = (index) => {
    const updated = [...portfolioUploads];
    updated.splice(index, 1);
    setPortfolioUploads(updated);
  };

  return (
    <div className="section">
      <h2>Portfolio & Proof of Work</h2>
      <p>
        Upload files or provide links to samples of your past projects. This helps
        clients understand your skills and experience.
      </p>

      {/* Portfolio Links */}
      <label>Add Portfolio Links</label>
      <div className="portfolio-link-row">
        <input
          type="url"
          className="portfolio-input"
          placeholder="https://example.com/project"
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
        />
        <button type="button" onClick={addLink} className="add-link-btn">
          Add
        </button>
      </div>

      {/* Display existing links */}
      {portfolioLinks.length > 0 && (
        <ul className="portfolio-list">
          {portfolioLinks.map((link, index) => (
            <li key={index} className="portfolio-item">
              <span>{link}</span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => removeLink(index)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* File Uploads */}
      <label>Upload Files</label>
      <input
        type="file"
        multiple
        onChange={handleFileUpload}
        className="file-upload-input"
      />

      {/* Display uploaded files */}
      {portfolioUploads.length > 0 && (
        <ul className="file-list">
          {portfolioUploads.map((file, index) => (
            <li key={index} className="portfolio-item">
              <span>{file.name}</span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => removeFile(index)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="section-actions">
        {onBack && (
          <button className="back" onClick={onBack}>
            Back
          </button>
        )}
        
      </div>
    </div>
  );
}
