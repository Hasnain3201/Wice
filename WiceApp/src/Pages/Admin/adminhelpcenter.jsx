import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../../firebase"; // Adjust path as needed
import { useAuth } from "../../context/AuthContext";
import "./AdminHelpCenter.css";

export default function AdminHelpCenter() {
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, in-progress, resolved
  
  const { user } = useAuth();

  useEffect(() => {
    // Real-time listener for help requests
    const q = query(
      collection(db, "helpRequests"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHelpRequests(requests);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching help requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRespond = async (e) => {
    e.preventDefault();
    
    if (!responseMessage.trim() || !selectedRequest) return;

    setSending(true);

    try {
      const requestRef = doc(db, "helpRequests", selectedRequest.id);
      
      const response = {
        message: responseMessage.trim(),
        respondedBy: user.email,
        respondedAt: serverTimestamp()
      };

      await updateDoc(requestRef, {
        responses: arrayUnion(response),
        status: "in-progress",
        lastUpdated: serverTimestamp()
      });

      // TODO: Send email to user
      // Example: await fetch('/api/send-response-email', { 
      //   method: 'POST', 
      //   body: JSON.stringify({
      //     userEmail: selectedRequest.userEmail,
      //     subject: `Re: ${selectedRequest.subject}`,
      //     message: responseMessage
      //   })
      // });

      setResponseMessage("");
      alert("Response sent successfully!");
      
    } catch (err) {
      console.error("Error sending response:", err);
      alert("Failed to send response. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, "helpRequests", requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const filteredRequests = helpRequests.filter(req => {
    if (filterStatus === "all") return true;
    return req.status === filterStatus;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "in-progress": return "#3b82f6";
      case "resolved": return "#10b981";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <h1 className="dashboard-title">Loading help requests...</h1>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Help Center</h1>
        <p className="dashboard-subtitle">
          Manage and respond to user support requests
        </p>
      </div>

      {/* Filter Bar */}
      <div className="help-center-filters">
        <button 
          className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
          onClick={() => setFilterStatus("all")}
        >
          All ({helpRequests.length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
          onClick={() => setFilterStatus("pending")}
        >
          Pending ({helpRequests.filter(r => r.status === "pending").length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === "in-progress" ? "active" : ""}`}
          onClick={() => setFilterStatus("in-progress")}
        >
          In Progress ({helpRequests.filter(r => r.status === "in-progress").length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === "resolved" ? "active" : ""}`}
          onClick={() => setFilterStatus("resolved")}
        >
          Resolved ({helpRequests.filter(r => r.status === "resolved").length})
        </button>
      </div>

      <div className="help-center-layout">
        {/* Requests List */}
        <div className="help-requests-list">
          {filteredRequests.length === 0 ? (
            <div className="empty-state">
              <p>No help requests found</p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div 
                key={request.id}
                className={`help-request-card ${selectedRequest?.id === request.id ? "selected" : ""}`}
                onClick={() => setSelectedRequest(request)}
              >
                <div className="help-request-header">
                  <h3>{request.subject}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(request.status) }}
                  >
                    {request.status}
                  </span>
                </div>
                <div className="help-request-meta">
                  <span className="user-info">
                    {request.userName} ({request.userType})
                  </span>
                  <span className="date-info">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
                <p className="help-request-preview">
                  {request.message.substring(0, 100)}...
                </p>
                {request.responses && request.responses.length > 0 && (
                  <span className="response-count">
                    {request.responses.length} response(s)
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Request Detail & Response */}
        <div className="help-request-detail">
          {selectedRequest ? (
            <>
              <div className="detail-header">
                <div>
                  <h2>{selectedRequest.subject}</h2>
                  <p className="detail-meta">
                    From: {selectedRequest.userName} ({selectedRequest.userEmail})
                    <br />
                    Submitted: {formatDate(selectedRequest.createdAt)}
                  </p>
                </div>
                <select 
                  value={selectedRequest.status}
                  onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)}
                  className="status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="detail-content">
                <h3>Original Message</h3>
                <div className="message-box">
                  {selectedRequest.message}
                </div>

                {selectedRequest.responses && selectedRequest.responses.length > 0 && (
                  <div className="responses-section">
                    <h3>Previous Responses</h3>
                    {selectedRequest.responses.map((response, index) => (
                      <div key={index} className="response-item">
                        <div className="response-header">
                          <strong>{response.respondedBy}</strong>
                          <span>{formatDate(response.respondedAt)}</span>
                        </div>
                        <p>{response.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="response-form">
                  <h3>Send Response</h3>
                  <form onSubmit={handleRespond}>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Type your response here..."
                      rows="6"
                      className="response-textarea"
                      disabled={sending}
                    />
                    <button 
                      type="submit" 
                      className="send-response-btn"
                      disabled={sending || !responseMessage.trim()}
                    >
                      {sending ? "Sending..." : "Send Response"}
                    </button>
                    <p className="email-note">
                      * Response will be sent via email and saved to the portal
                    </p>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-detail">
              <p>Select a help request to view details and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}