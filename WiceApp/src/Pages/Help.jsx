import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Help.css";

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]); // File[]
  const [submitting, setSubmitting] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "archived"

  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [ticketFiles, setTicketFiles] = useState([]);
  const [ticketResponses, setTicketResponses] = useState([]);

  const fileInputRef = useRef(null);
  const { user, profile } = useAuth();

  const categories = [
    {
      id: "billing",
      label: "Billing",
      color: "#10b981",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        </svg>
      ),
    },
    {
      id: "scheduling",
      label: "Scheduling",
      color: "#8b5cf6",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
        </svg>
      ),
    },
    {
      id: "bugs",
      label: "Bugs/Glitches",
      color: "#ef4444",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
        </svg>
      ),
    },
    {
      id: "questions",
      label: "Questions",
      color: "#f59e0b",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
        </svg>
      ),
    },
    {
      id: "other",
      label: "Other",
      color: "#6366f1",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      ),
    },
  ];

  const getCategoryConfig = (id) =>
    categories.find((c) => c.id === id) || null;

  const getCategoryLabel = (id) => getCategoryConfig(id)?.label || "Other";
  const getCategoryColor = (id) => getCategoryConfig(id)?.color || "#6366f1";
  const getCategoryIcon = (id) => getCategoryConfig(id)?.icon || "●";

  const formatDateTime = (ts) => {
    if (!ts) return "N/A";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  };

  // ---------- Load user's tickets ----------
  useEffect(() => {
    if (!user) {
      setTickets([]);
      setLoadingTickets(false);
      return;
    }

    setLoadingTickets(true);
    const ticketsRef = collection(db, "helpTickets");
    const q = query(ticketsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        docs.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setTickets(docs);
        setLoadingTickets(false);
      },
      (err) => {
        console.error("Error loading help tickets:", err);
        setLoadingTickets(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const activeTickets = tickets.filter((t) => t.status !== "solved");
  const archivedTickets = tickets.filter((t) => t.status === "solved");
  const visibleTickets = activeTab === "active" ? activeTickets : archivedTickets;

  // ---------- File selection (multi-file) ----------
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAttachments((prev) => [...prev, ...files]);
    // Clear input so selecting same file again works
    e.target.value = "";
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------- Submit new ticket ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      alert("Please select a category");
      return;
    }

    if (!user) {
      alert("You must be logged in to submit a ticket.");
      return;
    }

    setSubmitting(true);

    try {
      const ticketData = {
        category: selectedCategory,
        subject,
        message,
        status: "unsolved",
        userId: user.uid,
        userEmail: user.email || "unknown",
        userName: profile?.name || user.displayName || "User",
        userRole: profile?.accountType || "unknown",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        hasResponse: false,
      };

      // Create ticket first
      const ticketRef = await addDoc(collection(db, "helpTickets"), ticketData);

      // Upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            const path = `helpTickets/${ticketRef.id}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            await addDoc(
              collection(db, "helpTickets", ticketRef.id, "files"),
              {
                fileName: file.name,
                fileUrl: url,
                size: file.size,
                contentType: file.type,
                createdAt: serverTimestamp(),
              }
            );
          } catch (uploadErr) {
            console.error("Error uploading attachment:", uploadErr);
          }
        }
      }

      alert("Your help request has been submitted!");

      // Reset form
      setSelectedCategory("");
      setSubject("");
      setMessage("");
      setAttachments([]);
      setShowNewTicketModal(false);
    } catch (error) {
      console.error("Error submitting help ticket:", error);
      alert("Failed to submit help request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Ticket details ----------
  const handleOpenTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
    setTicketDetailsLoading(true);
    setTicketFiles([]);
    setTicketResponses([]);

    try {
      const filesSnap = await getDocs(
        collection(db, "helpTickets", ticket.id, "files")
      );
      setTicketFiles(filesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const responsesSnap = await getDocs(
        collection(db, "helpTickets", ticket.id, "responses")
      );
      const responses = responsesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      responses.sort(
        (a, b) =>
          (a.createdAt?.toMillis?.() ?? 0) -
          (b.createdAt?.toMillis?.() ?? 0)
      );
      setTicketResponses(responses);
    } catch (err) {
      console.error("Error loading ticket details:", err);
    } finally {
      setTicketDetailsLoading(false);
    }
  };

  const handleCloseTicketModal = () => {
    setShowTicketModal(false);
    setSelectedTicket(null);
    setTicketFiles([]);
    setTicketResponses([]);
  };

  // ---------- Toggle Resolved / Open ----------
  const handleToggleResolved = async () => {
    if (!selectedTicket) return;
    if (!user) return;

    const newStatus =
      selectedTicket.status === "solved" ? "unsolved" : "solved";

    try {
      const ticketRef = doc(db, "helpTickets", selectedTicket.id);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Optimistic update for modal
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );

      const msg =
        newStatus === "solved"
          ? "Ticket marked as resolved and archived."
          : "Ticket reopened.";
      alert(msg);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      alert("Failed to update ticket status.");
    }
  };

  // ---------- Render ----------
  return (
    <div className="help-container">
      {/* Header */}
      <div className="help-header">
        <div>
          <h2 className="help-title">Help &amp; Support</h2>
          <p className="help-description">
            View your previous help tickets or submit a new request if you need
            assistance.
          </p>
        </div>
        <button
          type="button"
          className="help-primary-button"
          onClick={() => setShowNewTicketModal(true)}
        >
          + Submit Help Request
        </button>
      </div>

      {/* Tabs */}
      <div className="help-tabs">
        <button
          type="button"
          className={`help-tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          My Tickets
          {activeTickets.length > 0 && (
            <span className="help-tab-count">{activeTickets.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`help-tab ${activeTab === "archived" ? "active" : ""}`}
          onClick={() => setActiveTab("archived")}
        >
          Archived
          {archivedTickets.length > 0 && (
            <span className="help-tab-count">{archivedTickets.length}</span>
          )}
        </button>
      </div>

      {/* Ticket list */}
      <div className="help-tickets-list">
        {loadingTickets ? (
          <div className="help-empty-state">Loading your tickets...</div>
        ) : visibleTickets.length === 0 ? (
          <div className="help-empty-state">
            {activeTab === "active"
              ? "You have no open help tickets yet."
              : "You have no archived tickets yet."}
          </div>
        ) : (
          visibleTickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              className="help-ticket-item"
              onClick={() => handleOpenTicket(ticket)}
            >
              <div className="help-ticket-icon-wrapper">
                <div
                  className="help-ticket-icon"
                  style={{
                    backgroundColor: getCategoryColor(ticket.category),
                  }}
                >
                  {getCategoryIcon(ticket.category)}
                </div>
              </div>
              <div className="help-ticket-content">
                <div className="help-ticket-title-row">
                  <span className="help-ticket-title">
                    {ticket.subject || "(No subject)"}
                  </span>
                  <span
                    className={`help-status-badge ${
                      ticket.status === "solved" ? "solved" : "unsolved"
                    }`}
                  >
                    {ticket.status === "solved" ? "Resolved" : "Open"}
                  </span>
                </div>
                <div className="help-ticket-meta">
                  <span className="help-ticket-category">
                    {getCategoryLabel(ticket.category)}
                  </span>
                  <span className="help-ticket-date">
                    {formatDateTime(ticket.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div
          className="help-modal-overlay"
          onClick={() => !submitting && setShowNewTicketModal(false)}
        >
          <div
            className="help-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="help-modal-header">
              <h3 className="help-modal-title">Submit a Help Request</h3>
              <button
                type="button"
                className="help-modal-close"
                onClick={() => !submitting && setShowNewTicketModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="help-modal-body">
              <form onSubmit={handleSubmit}>
                <label className="help-label">What do you need help with?</label>
                <div className="help-categories">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`help-category-btn ${
                        selectedCategory === category.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                      style={{ "--category-color": category.color }}
                    >
                      <div className="category-icon">{category.icon}</div>
                      <span className="category-label">
                        {category.label}
                      </span>
                    </button>
                  ))}
                </div>

                <label className="help-label">Subject</label>
                <input
                  type="text"
                  className="help-input"
                  placeholder="Enter a short title"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />

                <label className="help-label">Message</label>
                <textarea
                  className="help-textarea"
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                ></textarea>

                {/* Attachments */}
                <label className="help-label">Attachments (optional)</label>
                <div className="help-attachments-row">
                  <button
                    type="button"
                    className="help-attach-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    + Add files
                  </button>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="help-attachments-pills">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="help-attachment-pill">
                        <span className="help-attachment-name">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          className="help-attachment-remove"
                          onClick={() => handleRemoveAttachment(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="help-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Help Request"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="help-modal-overlay" onClick={handleCloseTicketModal}>
          <div
            className="help-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="help-modal-header">
              <h3 className="help-modal-title">
                {getCategoryIcon(selectedTicket.category)}{" "}
                {selectedTicket.subject || "Help Ticket"}
              </h3>
              <button
                type="button"
                className="help-modal-close"
                onClick={handleCloseTicketModal}
              >
                ✕
              </button>
            </div>

            <div className="help-modal-body">
              {ticketDetailsLoading ? (
                <div className="help-empty-state">
                  Loading ticket details...
                </div>
              ) : (
                <>
                  <div className="help-ticket-detail-section">
                    <div className="help-detail-row">
                      <span className="help-detail-label">Category:</span>
                      <span className="help-detail-value">
                        {getCategoryLabel(selectedTicket.category)}
                      </span>
                    </div>
                    <div className="help-detail-row status-row">
                      <span className="help-detail-label">Status:</span>
                      <span
                        className={`help-status-badge ${
                          selectedTicket.status === "solved"
                            ? "solved"
                            : "unsolved"
                        }`}
                      >
                        {selectedTicket.status === "solved"
                          ? "Resolved"
                          : "Open"}
                      </span>
                      <button
                        type="button"
                        className={`resolve-button ${
                          selectedTicket.status === "solved"
                            ? "resolve-button-outline"
                            : ""
                        }`}
                        onClick={handleToggleResolved}
                      >
                        {selectedTicket.status === "solved"
                          ? "Mark as Open"
                          : "Mark as Resolved"}
                      </button>
                    </div>
                    <div className="help-detail-row">
                      <span className="help-detail-label">Submitted:</span>
                      <span className="help-detail-value">
                        {formatDateTime(selectedTicket.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="help-ticket-message">
                    <h4>Message</h4>
                    <p>{selectedTicket.message}</p>
                  </div>

                  <div className="help-ticket-files">
                    <h4>Files</h4>
                    {ticketFiles.length === 0 ? (
                      <p className="help-subtle-text">
                        No files attached to this ticket.
                      </p>
                    ) : (
                      <ul className="help-files-list">
                        {ticketFiles.map((file) => (
                          <li key={file.id}>
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="help-file-link"
                            >
                              {file.fileName || "View file"}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="help-ticket-responses">
                    <h4>Admin Responses</h4>
                    {ticketResponses.length === 0 ? (
                      <p className="help-subtle-text">
                        No responses yet. Our team will reply soon.
                      </p>
                    ) : (
                      <ul className="help-responses-list">
                        {ticketResponses.map((resp) => (
                          <li key={resp.id} className="help-response">
                            <div className="help-response-header">
                              <span className="help-response-author">
                                {resp.respondedBy || "Admin"}
                              </span>
                              <span className="help-response-date">
                                {formatDateTime(resp.createdAt)}
                              </span>
                            </div>
                            <p className="help-response-message">
                              {resp.message}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
