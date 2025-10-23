import React, { useState } from "react";
import { ChevronDown, ChevronUp, Bookmark, Users, Briefcase, Landmark, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import "./Saved.css";

export default function Saved() {
  const { user, role } = useAuth();
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  if (!user) {
    return (
      <div className="saved-page">
        <div className="saved-card">
          <h1>Saved</h1>
          <p>Please log in to view your saved content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-page">
      <div className="saved-card">
        <h1 className="saved-title">{user.name ? `${user.name}'s Saved` : "Saved"}</h1>

        {/* 🔍 Saved Searches (shown to everyone) */}
        <div className="saved-section">
          <button
            className="saved-section-header"
            onClick={() => toggleSection("searches")}
          >
            <div className="saved-section-label">
              <Search size={18} />
              <span>Saved Searches</span>
            </div>
            {openSection === "searches" ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection === "searches" && (
            <div className="saved-options">
              <p>No saved searches yet.</p>
            </div>
          )}
        </div>

        {/* 💾 Saved Items (common) */}
        <div className="saved-section">
          <button
            className="saved-section-header"
            onClick={() => toggleSection("saved")}
          >
            <div className="saved-section-label">
              <Bookmark size={18} />
              <span>Saved Items</span>
            </div>
            {openSection === "saved" ? <ChevronUp /> : <ChevronDown />}
          </button>
          {openSection === "saved" && (
            <div className="saved-options">
              <p>You haven’t saved any items yet.</p>
            </div>
          )}
        </div>

        {/* 👥 Consultants (Client only) */}
        {role === "client" && (
          <div className="saved-section">
            <button
              className="saved-section-header"
              onClick={() => toggleSection("consultants")}
            >
              <div className="saved-section-label">
                <Users size={18} />
                <span>Saved Consultants</span>
              </div>
              {openSection === "consultants" ? <ChevronUp /> : <ChevronDown />}
            </button>
            {openSection === "consultants" && (
              <div className="saved-options">
                <p>No consultants saved yet.</p>
              </div>
            )}
          </div>
        )}

        {/* 💼 Opportunities (Consultant only) */}
        {role === "consultant" && (
          <>
            <div className="saved-section">
              <button
                className="saved-section-header"
                onClick={() => toggleSection("opportunities")}
              >
                <div className="saved-section-label">
                  <Briefcase size={18} />
                  <span>Saved Opportunities</span>
                </div>
                {openSection === "opportunities" ? <ChevronUp /> : <ChevronDown />}
              </button>
              {openSection === "opportunities" && (
                <div className="saved-options">
                  <p>No saved opportunities yet.</p>
                </div>
              )}
            </div>

            <div className="saved-section">
              <button
                className="saved-section-header"
                onClick={() => toggleSection("grants")}
              >
                <div className="saved-section-label">
                  <Landmark size={18} />
                  <span>Saved Grants</span>
                </div>
                {openSection === "grants" ? <ChevronUp /> : <ChevronDown />}
              </button>
              {openSection === "grants" && (
                <div className="saved-options">
                  <p>No saved grants yet.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
