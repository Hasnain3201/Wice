import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function ConsultantCard({ consultant, viewerRole = "client" }) {
  const { id, name, headline, image, sectors } = consultant;
  const { user, role } = useAuth();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");

  const avatar =
    image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=E5E7EB&color=111827&size=128&bold=true`;

  const ctaLabel =
    viewerRole === "consultant" ? "Preview profile" : "View profile";
  const contextLine =
    viewerRole === "consultant" && sectors
      ? `Highlighted sectors: ${sectors}`
      : null;

  // Load client folders
  const loadFolders = () => {
    if (!user) return;
    const key = `savedFolders_${role}_${user.email}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      setFolders(parsed.consultantCollections || []);
    }
  };

  const handleSave = () => {
    loadFolders();
    setShowSaveModal(true);
  };

  const addConsultantToFolder = () => {
    if (!selectedFolder || !user) return;
    const key = `savedFolders_${role}_${user.email}`;
    const stored = localStorage.getItem(key);
    let data = stored ? JSON.parse(stored) : {};
    const section = "consultantCollections";

    // Ensure structure exists
    if (!data[section]) data[section] = [];

    let target = data[section].find((f) => f.name === selectedFolder);
    if (!target) {
      target = { name: selectedFolder, items: [] };
      data[section].push(target);
    }

    // Prevent duplicates
    const alreadySaved = target.items.some(
      (i) => i.title === name && i.link === `/consultant/${id}`
    );

    if (!alreadySaved) {
      target.items.push({
        title: name,
        description: headline || "Consultant profile",
        link: `/consultant/${id}`,
      });
    }

    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event("storage")); // trigger Saved.jsx reload
    setShowSaveModal(false);
  };

  return (
    <article className="card-profile">
      <img src={avatar} className="avatar" alt={`${name} avatar`} />
      <h3 className="card-name">{name}</h3>
      <p className="card-headline">{headline}</p>
      {contextLine ? <p className="card-context">{contextLine}</p> : null}

      <Link
        to={`/consultant/${id}`}
        className="card-cta"
        aria-label={`View ${name} profile`}
      >
        {ctaLabel}
        <svg
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L12 6.414V16a1 1 0 11-2 0V6.414L6.707 9.707A1 1 0 115.293 8.293l5-5z" />
        </svg>
      </Link>

      {role === "client" && (
        <button
          className="save-btn"
          onClick={handleSave}
          title="Save consultant"
        >
          <Bookmark size={18} />
        </button>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Save Consultant</h3>
              <X className="close-icon" size={20} onClick={() => setShowSaveModal(false)} />
            </div>

            {folders.length > 0 ? (
              <>
                <label htmlFor="folderSelect" className="label small">Select collection</label>
                <select
                  id="folderSelect"
                  className="select"
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                >
                  <option value="">Select folder</option>
                  {folders.map((f, i) => (
                    <option key={i} value={f.name}>{f.name}</option>
                  ))}
                </select>
                <button
                  className="create-btn"
                  style={{ marginTop: "10px" }}
                  onClick={addConsultantToFolder}
                >
                  Save to Collection
                </button>
              </>
            ) : (
              <p style={{ marginTop: "8px" }}>
                You have no collections yet. Create one in your Saved page.
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
