import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  Users,
  Landmark,
  FolderPlus,
  X,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  createEmptySavedSections,
  createSavedFolder,
  ensureSavedCollectionsDoc,
  removeItemFromSavedFolder,
  subscribeToSavedCollections,
} from "../services/saved.js";
import "./Saved.css";

export default function Saved() {
  const { user, role, profile } = useAuth();
  const [openSection, setOpenSection] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [folders, setFolders] = useState(() => createEmptySavedSections());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setFolders(createEmptySavedSections());
      setLoading(false);
      return () => {};
    }

    let unsubscribe;
    setLoading(true);
    ensureSavedCollectionsDoc(user.uid, role).catch((err) => {
      if (import.meta.env.DEV) {
        console.error("Failed to ensure saved collections doc:", err);
      }
    });

    unsubscribe = subscribeToSavedCollections(
      user.uid,
      (payload) => {
        setFolders(payload.sections);
        setLoading(false);
        setError("");
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.error("Saved collections listener error:", err);
        }
        setError("Unable to load saved items right now.");
        setLoading(false);
      }
    );

    return () => unsubscribe?.();
  }, [user?.uid, role]);

  const toggleSection = (section) =>
    setOpenSection(openSection === section ? null : section);

  const openModal = (section) => {
    setActiveSection(section);
    setModalError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (creatingFolder) return;
    setShowModal(false);
    setNewFolderName("");
    setActiveSection(null);
    setModalError("");
  };

  const handleCreateFolder = async () => {
    if (!user?.uid || !activeSection || !newFolderName.trim()) return;
    setCreatingFolder(true);
    setModalError("");
    try {
      await createSavedFolder(user.uid, activeSection, newFolderName.trim());
      setNewFolderName("");
      setShowModal(false);
      setActiveSection(null);
    } catch (err) {
      setModalError(
        err?.message || "Unable to create folder. Please try again."
      );
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleRemoveItem = async (section, folderId, itemId) => {
    if (!user?.uid) return;
    setRemovingItemId(itemId);
    try {
      await removeItemFromSavedFolder(user.uid, section, folderId, itemId);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to remove saved item:", err);
      }
    } finally {
      setRemovingItemId(null);
    }
  };

  const AddFolderButton = ({ section }) => (
    <button className="add-folder-btn" onClick={() => openModal(section)}>
      <FolderPlus size={16} style={{ marginRight: "6px" }} />
      Add New Folder
    </button>
  );

  const Folder = ({ folder, sectionKey }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="folder-block">
        <div className="folder-header" onClick={() => setOpen(!open)}>
          📁 {folder.name} ({folder.items?.length || 0} items)
        </div>
        {open && (
          <div className="folder-items">
            {folder.items?.length > 0 ? (
              folder.items.map((item) => (
                <div key={item.id} className="folder-item">
                  {item.link.startsWith("http") ? (
                    <a href={item.link} target="_blank" rel="noreferrer">
                      {item.title}
                    </a>
                  ) : (
                    <Link to={item.link}>{item.title}</Link>
                  )}
                  <p className="item-desc">{item.description}</p>
                  <button
                    className="remove-btn"
                    onClick={() =>
                      handleRemoveItem(sectionKey, folder.id, item.id)
                    }
                    disabled={removingItemId === item.id}
                    title="Remove saved item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-folder">No items yet.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const savedConsultantItems = useMemo(() => {
    return (folders.consultantCollections || []).flatMap((folder) =>
      (folder.items || []).map((item) => ({
        ...item,
        folderId: folder.id,
        folderName: folder.name,
      }))
    );
  }, [folders]);

  const consultantAllItems = useMemo(() => {
    return (folders.savedGrants || []).flatMap((folder) =>
      (folder.items || []).map((item) => ({
        ...item,
        folderId: folder.id,
        folderName: folder.name,
      }))
    );
  }, [folders]);

  if (!user) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-card">
          <h1 className="dashboard-title" style={{ fontSize: "1.6rem" }}>
            Saved
          </h1>
          <p>Please log in to view your saved content.</p>
        </section>
      </div>
    );
  }

  const allItems = role === "consultant" ? consultantAllItems : [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-card saved-card">
        <header className="dashboard-header">
          <h1 className="dashboard-title">
            {(profile?.fullName || user?.displayName || user?.email || "User") +
              "'s Saved"}
          </h1>
        </header>

        {loading ? (
          <p style={{ marginTop: "8px", color: "#6b7280" }}>
            Loading saved collections…
          </p>
        ) : null}
        {error ? (
          <p style={{ marginTop: "8px", color: "#b91c1c" }}>{error}</p>
        ) : null}

        {/* CLIENT VIEW */}
        {role === "client" && (
          <>
            <div className="saved-section">
              <button
                className="saved-section-header"
                onClick={() => toggleSection("consultantCollections")}
              >
                <div className="saved-section-label">
                  <Users size={18} />
                  <span>Consultant Collections</span>
                </div>
                {openSection === "consultantCollections" ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </button>
              {openSection === "consultantCollections" && (
                <div className="saved-options">
                  <AddFolderButton section="consultantCollections" />
                  {(folders.consultantCollections || []).map((f, i) => (
                    <Folder
                      key={f.id || `${f.name}-${i}`}
                      folder={f}
                      sectionKey="consultantCollections"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="saved-section">
              <button
                className="saved-section-header"
                onClick={() => toggleSection("savedConsultants")}
              >
                <div className="saved-section-label">
                  <Bookmark size={18} />
                  <span>All Saved Consultants</span>
                </div>
                {openSection === "savedConsultants" ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </button>
              {openSection === "savedConsultants" && (
                <div className="saved-options">
                  {savedConsultantItems.length > 0 ? (
                    savedConsultantItems.map((item) => (
                      <div key={item.id} className="folder-item">
                        <Link to={item.link}>{item.title}</Link>
                        {item.description ? (
                          <p className="item-desc">{item.description}</p>
                        ) : null}
                        <p className="item-desc">Folder: {item.folderName}</p>
                      </div>
                    ))
                  ) : (
                    <p>No consultants saved yet.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* CONSULTANT VIEW */}
        {role === "consultant" && (
          <>
            <div className="saved-section">
              <button
                className="saved-section-header"
                onClick={() => toggleSection("savedGrants")}
              >
                <div className="saved-section-label">
                  <Landmark size={18} />
                  <span>Saved Grants</span>
                </div>
                {openSection === "savedGrants" ? <ChevronUp /> : <ChevronDown />}
              </button>
              {openSection === "savedGrants" && (
                <div className="saved-options">
                  <AddFolderButton section="savedGrants" />
                  {(folders.savedGrants || []).map((f, i) => (
                    <Folder
                      key={f.id || `${f.name}-${i}`}
                      folder={f}
                      sectionKey="savedGrants"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="saved-section">
              <button
                className="saved-section-header"
                onClick={() => toggleSection("allGrants")}
              >
                <div className="saved-section-label">
                  <Bookmark size={18} />
                  <span>All Saved Grants</span>
                </div>
                {openSection === "allGrants" ? <ChevronUp /> : <ChevronDown />}
              </button>
              {openSection === "allGrants" && (
                <div className="saved-options">
                  {allItems.length > 0 ? (
                    allItems.map((item) => (
                      <div key={item.id} className="folder-item">
                        {item.link.startsWith("http") ? (
                          <a href={item.link} target="_blank" rel="noreferrer">
                            {item.title}
                          </a>
                        ) : (
                          <Link to={item.link}>{item.title}</Link>
                        )}
                        {item.description ? (
                          <p className="item-desc">{item.description}</p>
                        ) : null}
                        {item.folderName ? (
                          <p className="item-desc">
                            Folder: {item.folderName}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p>No grants saved yet.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Folder Creation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Folder</h3>
              <X className="close-icon" size={20} onClick={closeModal} />
            </div>
            {modalError ? (
              <p style={{ color: "#dc2626", marginBottom: "0.75rem" }}>
                {modalError}
              </p>
            ) : null}
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="modal-input"
            />
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={closeModal}
                disabled={creatingFolder}
              >
                Cancel
              </button>
              <button
                className="create-btn"
                onClick={handleCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
              >
                {creatingFolder ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
