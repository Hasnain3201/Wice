import React, { useState } from "react";
import { Bookmark, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function GrantCard({ grant, viewerRole = "client" }) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");

  const isConsultant = viewerRole === "consultant" || role === "consultant";

  const loadFolders = () => {
    if (!user) return;
    const key = `savedFolders_${role}_${user.email}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      setFolders(parsed.savedGrants || []);
    }
  };

  const handleSave = () => {
    loadFolders();
    setShowSaveModal(true);
  };

  const addGrantToFolder = () => {
    if (!selectedFolder || !user) return;
    const key = `savedFolders_${role}_${user.email}`;
    const stored = localStorage.getItem(key);
    let data = stored ? JSON.parse(stored) : {};
    const section = "savedGrants";

    if (!data[section]) data[section] = [];

    // find folder
    let target = data[section].find((f) => f.name === selectedFolder);
    if (!target) {
      target = { name: selectedFolder, items: [] };
      data[section].push(target);
    }

    // check for duplicates
    const alreadySaved = target.items.some((i) => i.link === grant.url);
    if (!alreadySaved) {
      const newItem = {
        title: grant.title,
        description: grant.summary || "Grant opportunity",
        link: grant.url,
      };
      target.items.push(newItem);

      // also push to All Saved section
      if (!data.allSaved) data.allSaved = [];
      data.allSaved.push(newItem);
    }

    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event("storage"));
    setShowSaveModal(false);
  };

  return (
    <article className="grant-card" style={{ position: "relative" }}>
      <div className="grant-top">
        <div>
          <h3 className="grant-title">{grant.title}</h3>
          <p className="grant-agency">
            {grant.agency} • {grant.region} • {grant.type}
          </p>
          <div className="pill-row">
            {grant.sectors.map((s) => (
              <span className="pill" key={s}>
                {s}
              </span>
            ))}
            {grant.amount && (
              <span className="pill pill-money">{grant.amount}</span>
            )}
          </div>
        </div>

        {/* 🔖 Save icon for consultants */}
        {isConsultant && (
          <button
            className="save-btn"
            onClick={handleSave}
            title="Save grant"
          >
            <Bookmark size={18} />
          </button>
        )}

        <button className="ghost-btn" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Details"}
        </button>
      </div>

      <p className="grant-summary">{grant.summary}</p>

      {open && (
        <div className="grant-detail">
          <div className="kv">
            <strong>Deadline:</strong> {grant.deadline}
          </div>
          {grant.url && (
            <div className="kv">
              <strong>Link:</strong>{" "}
              <a
                className="backlink"
                href={grant.url}
                target="_blank"
                rel="noreferrer"
              >
                View opportunity
              </a>
            </div>
          )}
          {grant.eligibility && (
            <div className="kv">
              <strong>Eligibility:</strong> {grant.eligibility}
            </div>
          )}
          {grant.notes && (
            <div className="kv">
              <strong>Notes:</strong> {grant.notes}
            </div>
          )}
        </div>
      )}

      {/* 💾 Save modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Save Grant</h3>
              <X
                className="close-icon"
                size={20}
                onClick={() => setShowSaveModal(false)}
              />
            </div>

            {folders.length > 0 ? (
              <>
                <label htmlFor="folderSelect" className="label small">
                  Select Collection
                </label>
                <select
                  id="folderSelect"
                  className="select"
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                >
                  <option value="">Select folder</option>
                  {folders.map((f, i) => (
                    <option key={i} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <button
                  className="create-btn"
                  style={{ marginTop: "10px" }}
                  onClick={addGrantToFolder}
                >
                  Save to Collection
                </button>
              </>
            ) : (
              <p style={{ marginTop: "8px" }}>
                You have no Saved Grant folders yet. Create one in your Saved page.
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
