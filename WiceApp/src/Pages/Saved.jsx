import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  Users,
  Briefcase,
  Landmark,
  Search,
  FolderPlus,
  Filter,
  X,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { grants } from "../data/grants.js";
import "./Saved.css";

export default function Saved() {
  const { user, role } = useAuth();
  const [openSection, setOpenSection] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [folders, setFolders] = useState({});

  const key = user ? `savedFolders_${role}_${user.email}` : null;

  // ✅ Load folders once
  useEffect(() => {
    if (key) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setFolders(JSON.parse(stored));
        } catch {
          setFolders({});
        }
      }
    }
  }, [key]);

  // ✅ Listen for external updates (e.g., saving consultants)
  useEffect(() => {
    if (!key) return;
    const handleStorage = () => {
      const stored = localStorage.getItem(key);
      if (stored) {
        setFolders(JSON.parse(stored));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key]);

  // ✅ Helper to write back safely without overwriting
  const updateLocalStorage = (newData) => {
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(newData));
    setFolders(newData);
  };

  const toggleSection = (section) =>
    setOpenSection(openSection === section ? null : section);

  const openModal = (section) => {
    setActiveSection(section);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewFolderName("");
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim() || !activeSection) return;
    const updated = { ...folders };
    if (!updated[activeSection]) updated[activeSection] = [];
    updated[activeSection].push({ name: newFolderName.trim(), items: [] });
    updateLocalStorage(updated);
    closeModal();
  };

  const handleRemoveItem = (section, folderName, itemIndex) => {
    const updated = { ...folders };
    const folderList = updated[section] || [];
    const target = folderList.find((f) => f.name === folderName);
    if (target && target.items) {
      target.items.splice(itemIndex, 1);
    }
    updateLocalStorage(updated);
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
              folder.items.map((item, i) => (
                <div key={i} className="folder-item">
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
                      handleRemoveItem(sectionKey, folder.name, i)
                    }
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

  const allItems =
    role === "consultant"
      ? [
          ...(folders.savedOpportunities || []),
          ...(folders.savedGrants || []),
        ].flatMap((f) => f.items || [])
      : [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-card saved-card">
        <header className="dashboard-header">
          <h1 className="dashboard-title">{user.name}'s Saved</h1>
        </header>

        {/* CLIENT VIEW */}
        {role === "client" && (
          <>
            {/* Saved Searches */}
            <div className="saved-section">
              <button
                className="saved-section-header"
                onClick={() => toggleSection("savedSearches")}
              >
                <div className="saved-section-label">
                  <Search size={18} />
                  <span>Saved Searches</span>
                </div>
                {openSection === "savedSearches" ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </button>
              {openSection === "savedSearches" && (
                <div className="saved-options">
                  <AddFolderButton section="savedSearches" />
                  {(folders.savedSearches || []).map((f, i) => (
                    <Folder key={i} folder={f} sectionKey="savedSearches" />
                  ))}
                </div>
              )}
            </div>

            {/* Consultant Collections */}
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
                      key={i}
                      folder={f}
                      sectionKey="consultantCollections"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* All Saved Consultants */}
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
                  {(folders.consultantCollections || [])
                    .flatMap((f) => f.items || [])
                    .map((item, i) => (
                      <div key={i} className="folder-item">
                        <Link to={item.link}>{item.title}</Link>
                        <p className="item-desc">{item.description}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* CONSULTANT VIEW */}
        {role === "consultant" && (
          <>
            {[
              { key: "savedSearches", label: "Saved Searches", icon: Search },
              { key: "savedOpportunities", label: "Saved Opportunities", icon: Briefcase },
              { key: "savedGrants", label: "Saved Grants", icon: Landmark },
              { key: "clientFilters", label: "Saved Client Search Filters", icon: Filter },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="saved-section">
                <button
                  className="saved-section-header"
                  onClick={() => toggleSection(key)}
                >
                  <div className="saved-section-label">
                    <Icon size={18} />
                    <span>{label}</span>
                  </div>
                  {openSection === key ? <ChevronUp /> : <ChevronDown />}
                </button>
                {openSection === key && (
                  <div className="saved-options">
                    <AddFolderButton section={key} />
                    {(folders[key] || []).map((f, i) => (
                      <Folder key={i} folder={f} sectionKey={key} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* All Saved Opportunities & Grants */}
            <div className="saved-section">
              <button
                className="saved-section-header"
                onClick={() => toggleSection("allItems")}
              >
                <div className="saved-section-label">
                  <Bookmark size={18} />
                  <span>All Saved Opportunities & Grants</span>
                </div>
                {openSection === "allItems" ? <ChevronUp /> : <ChevronDown />}
              </button>
              {openSection === "allItems" && (
                <div className="saved-options">
                  {allItems.length > 0 ? (
                    allItems.map((item, i) => (
                      <div key={i} className="folder-item">
                        {item.link.startsWith("http") ? (
                          <a href={item.link} target="_blank" rel="noreferrer">
                            {item.title}
                          </a>
                        ) : (
                          <Link to={item.link}>{item.title}</Link>
                        )}
                        <p className="item-desc">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    <p>No saved opportunities or grants yet.</p>
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
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="modal-input"
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>
              <button className="create-btn" onClick={handleCreateFolder}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
