import React, { useState } from "react";
import { Bookmark, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  addItemToSavedFolder,
  ensureSavedCollectionsDoc,
  listSavedFolders,
} from "../services/saved.js";

export default function GrantCard({ grant, viewerRole = "client" }) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [saveError, setSaveError] = useState("");
  const [modalSaveError, setModalSaveError] = useState("");
  const [savingGrant, setSavingGrant] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const isConsultant = viewerRole === "consultant" || role === "consultant";

  const loadFolders = async () => {
    if (!user?.uid) return;
    await ensureSavedCollectionsDoc(user.uid, role);
    const savedFolders = await listSavedFolders(user.uid, "savedGrants");
    setFolders(savedFolders);
  };

  const handleSave = async () => {
    if (!user) {
      setSaveError("Please sign in to save grants.");
      return;
    }
    setSaveError("");
    setModalSaveError("");
    setSelectedFolder("");
    setLoadingFolders(true);
    try {
      await loadFolders();
      setShowSaveModal(true);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to load grant folders:", err);
      }
      setSaveError("Unable to load your collections right now.");
    } finally {
      setLoadingFolders(false);
    }
  };

  const addGrantToFolder = async () => {
    if (!selectedFolder || !user?.uid) return;
    setModalSaveError("");
    setSavingGrant(true);
    try {
      await addItemToSavedFolder(user.uid, "savedGrants", selectedFolder, {
        title: grant.title,
        description: grant.summary || "Grant opportunity",
        link: grant.url || "",
        metadata: {
          grantId: grant.id || null,
          agency: grant.agency || null,
          deadline: grant.deadline || null,
        },
      });
      setShowSaveModal(false);
      setSelectedFolder("");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to save grant:", err);
      }
      setModalSaveError(
        err?.message || "Unable to save this grant right now."
      );
    } finally {
      setSavingGrant(false);
    }
  };

  const closeSaveModal = () => {
    if (savingGrant) return;
    setShowSaveModal(false);
    setSelectedFolder("");
    setModalSaveError("");
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
            disabled={loadingFolders}
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
        <div className="modal-overlay" onClick={closeSaveModal}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Save Grant</h3>
              <X
                className="close-icon"
                size={20}
                onClick={closeSaveModal}
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
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>

                {modalSaveError ? (
                  <p style={{ marginTop: "8px", color: "#dc2626" }}>
                    {modalSaveError}
                  </p>
                ) : null}

                <button
                  className="create-btn"
                  style={{ marginTop: "10px" }}
                  onClick={addGrantToFolder}
                  disabled={savingGrant || !selectedFolder}
                >
                  {savingGrant ? "Saving…" : "Save to Collection"}
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
      {saveError ? (
        <p style={{ marginTop: "8px", color: "#dc2626" }}>{saveError}</p>
      ) : null}
    </article>
  );
}
