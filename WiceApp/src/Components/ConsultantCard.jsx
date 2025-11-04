import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, MessageCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useChat } from "../context/ChatContext.jsx";
import { findUserByEmail, findUserByFullName } from "../services/chat.js";
import {
  addItemToSavedFolder,
  ensureSavedCollectionsDoc,
  listSavedFolders,
} from "../services/saved.js";

export default function ConsultantCard({ consultant, viewerRole = "client" }) {
  const { id, name, headline, image, sectors, email } = consultant;
  const { user, role } = useAuth();
  const { startDirectChat } = useChat();
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingConsultant, setSavingConsultant] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [modalSaveError, setModalSaveError] = useState("");

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

  const loadFolders = async () => {
    if (!user?.uid) return;
    await ensureSavedCollectionsDoc(user.uid, role);
    const savedFolders = await listSavedFolders(user.uid, "consultantCollections");
    setFolders(savedFolders);
  };

  const handleSave = async () => {
    if (!user) {
      setSaveError("Please sign in to save consultants.");
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
        console.error("Failed to load saved folders:", err);
      }
      setSaveError("Unable to load your collections right now.");
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleMessage = async () => {
    if (!user) {
      setMessageError("Please sign in to start a conversation.");
      return;
    }
    setMessageError("");
    setMessaging(true);
    try {
      const target =
        (email && (await findUserByEmail(email))) ||
        (await findUserByFullName(name, "consultant")) ||
        null;

      if (!target?.uid) {
        setMessageError("This consultant is not available for messaging yet.");
        return;
      }

      await startDirectChat({
        uid: target.uid,
        fullName: target.fullName || name,
        email: target.email || email,
        role: target.accountType || "consultant",
      });
      navigate("/chat");
    } catch (err) {
      console.error("Failed to start chat:", err);
      setMessageError("Unable to start chat right now. Please try again.");
    } finally {
      setMessaging(false);
    }
  };

  const addConsultantToFolder = async () => {
    if (!selectedFolder || !user?.uid) return;
    setModalSaveError("");
    setSavingConsultant(true);
    try {
      await addItemToSavedFolder(user.uid, "consultantCollections", selectedFolder, {
        title: name,
        description: headline || "Consultant profile",
        link: `/consultant/${id}`,
        metadata: {
          consultantId: id,
          consultantEmail: email,
        },
      });
      setShowSaveModal(false);
      setSelectedFolder("");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to save consultant:", err);
      }
      setModalSaveError(
        err?.message || "Unable to save this consultant right now."
      );
    } finally {
      setSavingConsultant(false);
    }
  };

  const closeSaveModal = () => {
    if (savingConsultant) return;
    setShowSaveModal(false);
    setSelectedFolder("");
    setModalSaveError("");
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
        <div className="card-actions">
          <button
            className="message-btn"
            onClick={handleMessage}
            disabled={messaging}
            title="Message consultant"
            type="button"
          >
            <MessageCircle size={18} />
            <span>{messaging ? "Starting…" : "Message"}</span>
          </button>
          <button
            className="card-save-btn"
            onClick={handleSave}
            title="Save consultant"
            type="button"
            disabled={loadingFolders}
          >
            <Bookmark size={18} />
          </button>
        </div>
      )}

      {messageError ? <p className="card-error">{messageError}</p> : null}
      {saveError ? <p className="card-error">{saveError}</p> : null}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={closeSaveModal}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Save Consultant</h3>
              <X className="close-icon" size={20} onClick={closeSaveModal} />
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
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
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
                  onClick={addConsultantToFolder}
                  disabled={savingConsultant || !selectedFolder}
                >
                  {savingConsultant ? "Saving…" : "Save to Collection"}
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
