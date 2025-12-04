import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase"; // Corrected path - goes up to src folder
import "./AdminHelpManagement.css";

export default function AdminHelpManagement() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "all", label: "All Categories", icon: "📋" },
    { id: "billing", label: "Billing", icon: "💳" },
    { id: "scheduling", label: "Scheduling", icon: "📅" },
    { id: "bugs", label: "Bugs/Glitches", icon: "🐛" },
    { id: "questions", label: "Questions", icon: "❓" },
    { id: "other", label: "Other", icon: "💬" },
  ];

  const statusOptions = [
    { id: "all", label: "All Status" },
    { id: "unsolved", label: "Unsolved" },
    { id: "solved", label: "Solved" },
  ];

  // Fetch tickets from Firebase
  useEffect(() => {
    const ticketsRef = collection(db, "helpTickets");
    const q = query(ticketsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTickets(ticketsData);
      setFilteredTickets(ticketsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter tickets based on category and status
  useEffect(() => {
    let filtered = tickets;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((ticket) => ticket.category === selectedCategory);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === selectedStatus);
    }

    setFilteredTickets(filtered);
  }, [selectedCategory, selectedStatus, tickets]);

  // Mark ticket as solved/unsolved
  const toggleTicketStatus = async (ticketId, currentStatus) => {
    try {
      const ticketRef = doc(db, "helpTickets", ticketId);
      const newStatus = currentStatus === "solved" ? "unsolved" : "solved";
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating ticket status:", error);
      alert("Failed to update ticket status");
    }
  };

  // Submit admin response
  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    try {
      const ticketRef = doc(db, "helpTickets", selectedTicket.id);
      
      // Add response to responses subcollection
      const responsesRef = collection(ticketRef, "responses");
      await addDoc(responsesRef, {
        message: responseText,
        respondedBy: "Admin", // You can replace with actual admin name/email
        createdAt: serverTimestamp(),
      });

      // Update ticket with last response time
      await updateDoc(ticketRef, {
        lastResponseAt: serverTimestamp(),
        hasResponse: true,
      });

      // TODO: Send email notification to user
      // You'll need to implement this using Cloud Functions or your backend

      setResponseText("");
      alert("Response sent successfully!");
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error sending response:", error);
      alert("Failed to send response");
    }
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.icon : "📋";
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="admin-help-container">
        <h2>Loading tickets...</h2>
      </div>
    );
  }

  return (
    <div className="admin-help-container">
      <div className="admin-help-header">
        <h1>Help Ticket Management</h1>
        <div className="ticket-stats">
          <div className="stat-card">
            <span className="stat-number">{tickets.length}</span>
            <span className="stat-label">Total Tickets</span>
          </div>
          <div className="stat-card unsolved">
            <span className="stat-number">
              {tickets.filter((t) => t.status === "unsolved").length}
            </span>
            <span className="stat-label">Unsolved</span>
          </div>
          <div className="stat-card solved">
            <span className="stat-number">
              {tickets.filter((t) => t.status === "solved").length}
            </span>
            <span className="stat-label">Solved</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-help-filters">
        <div className="filter-section">
          <label>Filter by Category:</label>
          <div className="filter-buttons">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`filter-btn ${
                  selectedCategory === category.id ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <label>Filter by Status:</label>
          <div className="filter-buttons">
            {statusOptions.map((status) => (
              <button
                key={status.id}
                className={`filter-btn ${
                  selectedStatus === status.id ? "active" : ""
                }`}
                onClick={() => setSelectedStatus(status.id)}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="tickets-list">
        {filteredTickets.length === 0 ? (
          <div className="no-tickets">
            <p>No tickets found matching your filters.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`ticket-card ${ticket.status}`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="ticket-header">
                <div className="ticket-icon">
                  {getCategoryIcon(ticket.category)}
                </div>
                <div className="ticket-info">
                  <h3 className="ticket-subject">{ticket.subject}</h3>
                  <p className="ticket-meta">
                    <span className="user-info">
                      👤 {ticket.userName || ticket.userEmail}
                    </span>
                    <span className="ticket-date">
                      {formatDate(ticket.createdAt)}
                    </span>
                  </p>
                </div>
                <div className="ticket-actions">
                  <span
                    className={`status-badge ${ticket.status}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTicketStatus(ticket.id, ticket.status);
                    }}
                  >
                    {ticket.status === "solved" ? "✓ Solved" : "⏳ Unsolved"}
                  </span>
                </div>
              </div>
              <div className="ticket-preview">
                {ticket.message.substring(0, 120)}
                {ticket.message.length > 120 ? "..." : ""}
              </div>
              {ticket.hasResponse && (
                <div className="response-indicator">💬 Has admin response</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {getCategoryIcon(selectedTicket.category)} {selectedTicket.subject}
              </h2>
              <button
                className="close-btn"
                onClick={() => setSelectedTicket(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="ticket-details">
                <div className="detail-row">
                  <strong>From:</strong> {selectedTicket.userName || selectedTicket.userEmail}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedTicket.userEmail}
                </div>
                <div className="detail-row">
                  <strong>Category:</strong>{" "}
                  {categories.find((c) => c.id === selectedTicket.category)?.label}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-badge ${selectedTicket.status}`}
                    onClick={() =>
                      toggleTicketStatus(selectedTicket.id, selectedTicket.status)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {selectedTicket.status === "solved" ? "✓ Solved" : "⏳ Unsolved"}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Created:</strong> {formatDate(selectedTicket.createdAt)}
                </div>
              </div>

              <div className="ticket-message">
                <h3>Message:</h3>
                <p>{selectedTicket.message}</p>
              </div>

              <div className="admin-response-section">
                <h3>Admin Response:</h3>
                <form onSubmit={handleSubmitResponse}>
                  <textarea
                    className="response-textarea"
                    placeholder="Type your response here..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={6}
                  />
                  <button type="submit" className="send-response-btn">
                    Send Response
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}