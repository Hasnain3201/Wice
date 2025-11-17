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
  const { id, name, profile, email, sectors } = consultant || {};
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

  // REMOVE PROFILE PICTURE COMPLETELY
  // const avatar = ...

  const ctaLabel =
    viewerRole === "consultant" ? "Preview profile" : "View profile";

  const oneLinerBio =
    profile?.oneLinerBio || profile?.about || "This consultant has not added a bio yet.";

  // For consultants viewing their own cards
  const contextLine =
    viewerRole === "consultant" && sectors
      ? `Highlighted sectors: ${sectors}`
      : null;

  const loadFolders = async () => {
    if (!user?.uid) return;
    await ensureSavedCollectionsDoc(user.uid, role);
    const savedFolders = await listSavedFolders(
      user.uid,
      "consultantCollections"
    );
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
      await addItemToSavedFolder(
        user.uid,
        "consultantCollections",
        selectedFolder,
        {
          title: name,
          description: oneLinerBio,
          link: `/consultant/${id}`,
          metadata: {
            consultantId: id,
            consultantEmail: email,
          },
        }
      );
      setShowSaveModal(false);
      setSelectedFolder("");
    } catch (err) {
      setModalSaveError("Unable to save this consultant right now.");
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

  const canManageConsultants = role === "client" || role === "admin";

  return (
    <article className="card-profile">

      {/* NAME */}
      <h3 className="card-name">{name || "Unnamed Consultant"}</h3>

      {/* REAL ONE-LINER BIO */}
      <p className="card-headline">{oneLinerBio}</p>

      {contextLine ? <p className="card-context">{contextLine}</p> : null}

      {/* VIEW PROFILE */}
      <Link to={`/consultant/${id}`} className="card-cta">
        {ctaLabel}
      </Link>

      {canManageConsultants && (
        <div className="card-actions">
          <button
            className="message-btn"
            onClick={handleMessage}
            disabled={messaging}
            type="button"
          >
            <MessageCircle size={18} />
            <span>{messaging ? "Starting…" : "Message"}</span>
          </button>

          <button
            className="card-save-btn"
            onClick={handleSave}
            disabled={loadingFolders}
          >
            <Bookmark size={18} />
          </button>
        </div>
      )}

      {messageError ? <p className="card-error">{messageError}</p> : null}
      {saveError ? <p className="card-error">{saveError}</p> : null}

      {showSaveModal && (
        <div className="modal-overlay" onClick={closeSaveModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Save Consultant</h3>
              <X className="close-icon" size={20} onClick={closeSaveModal} />
            </div>

            {folders.length > 0 ? (
              <>
                <label className="label small">Select collection</label>
                <select
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

                <button
                  className="create-btn"
                  onClick={addConsultantToFolder}
                  disabled={!selectedFolder || savingConsultant}
                >
                  {savingConsultant ? "Saving…" : "Save to Collection"}
                </button>
              </>
            ) : (
              <p>You have no collections yet. Create one on the Saved page.</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
