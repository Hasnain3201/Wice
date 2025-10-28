import React, { useState, useEffect } from "react";
import { useChat } from "../context/ChatContext.jsx";
import { useAuth } from "../context/AuthContext.jsx"; // ✅ access name + role
import "./ProjectCard.css";

export default function ProjectCard({ project }) {
  const { role, user } = useAuth(); // ✅ ensure AuthContext provides "user"
  const { chats, sendMessage, createProjectChat } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: "", date: "" });

  useEffect(() => {
    createProjectChat(project.id, project.name);
  }, [project.id, project.name, createProjectChat]);

  const chat = chats.find((c) => c.id === project.id);

  // Default milestones
  const [milestones, setMilestones] = useState(() => {
    const base = [
      { name: "Consultation Approval", completed: true, date: new Date().toLocaleString() },
      { name: "Consultation Meeting", completed: false, date: new Date().toLocaleString() },
    ];
    return project.milestones?.length ? [...base, ...project.milestones] : base;
  });

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestone.name.trim()) return;
    setMilestones((prev) => [...prev, { ...newMilestone, completed: false }]);
    setNewMilestone({ name: "", date: "" });
    setShowAddForm(false);
  };

  // ✅ Include uploader name and timestamp
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      name: file.name,
      uploadedByName: user?.name || "Unknown User",
      uploadedByRole: role,
      date: new Date().toLocaleString(),
    }));
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleSendMsg = () => {
    if (!inputMsg.trim()) return;
    sendMessage(project.id, inputMsg);
    setInputMsg("");
  };

  const myFiles = uploadedFiles.filter((f) => f.uploadedByName === user?.name);
  const theirFiles = uploadedFiles.filter((f) => f.uploadedByName !== user?.name);

  return (
    <div className={`project-card ${isOpen ? "open" : ""}`}>
      <div className="project-header" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="project-title">{project.name}</h2>
        <span className="toggle-icon">{isOpen ? "▾" : "▸"}</span>
      </div>

      {isOpen && (
        <>
          {/* Timeline */}
          <div className="timeline-container">
            <div className="timeline-line"></div>
            <div className="timeline-points">
              {milestones.map((m, i) => (
                <div key={i} className={`milestone-item ${i % 2 === 0 ? "top" : "bottom"}`}>
                  <div className={`milestone-dot ${m.completed ? "filled" : "unfilled"}`}></div>
                  <div className="milestone-info">
                    <p className="milestone-label">{m.name}</p>
                    <p className="milestone-date">{m.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Milestone */}
          {!showAddForm ? (
            <button className="add-btn" onClick={() => setShowAddForm(true)}>
              + Add Milestone
            </button>
          ) : (
            <form className="add-milestone-form" onSubmit={handleAddMilestone}>
              <input
                type="text"
                placeholder="Milestone name..."
                value={newMilestone.name}
                onChange={(e) => setNewMilestone((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <input
                type="datetime-local"
                value={newMilestone.date}
                onChange={(e) => setNewMilestone((p) => ({ ...p, date: e.target.value }))}
              />
              <div className="add-actions">
                <button type="submit">Save</button>
                <button type="button" className="cancel" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* File Upload */}
          <div className="file-upload">
            <h3>Project Files</h3>
            <input type="file" multiple onChange={handleFileUpload} />
          </div>

          {/* File Lists */}
          <div className="file-lists">
            <div className="file-section">
              <h4>My Files</h4>
              {myFiles.length > 0 ? (
                <ul>
                  {myFiles.map((f, i) => (
                    <li key={i} className="my-file">
                      📄 {f.name}{" "}
                      <span className="file-meta">
                        (uploaded by {f.uploadedByName} — {f.date})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-files">No files uploaded yet.</p>
              )}
            </div>

            <div className="file-section">
              <h4>Their Files</h4>
              {theirFiles.length > 0 ? (
                <ul>
                  {theirFiles.map((f, i) => (
                    <li key={i} className="their-file">
                      📁 {f.name}{" "}
                      <span className="file-meta">
                        (uploaded by {f.uploadedByName} — {f.date})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-files">No files from the other member yet.</p>
              )}
            </div>
          </div>

          {/* Project Chat */}
          <div className="project-members">
            <h3 className="chat-title">
              Project Group Chat{" "}
              <span className="members">({project.members?.join(", ")})</span>
            </h3>
          </div>

          <div className="chat-section">
            <div className="chat-box">
              {chat?.messages.map((msg, i) => (
                <div key={i} className={`message ${msg.type}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={handleSendMsg}>Send</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
