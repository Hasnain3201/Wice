import React, { useEffect, useMemo, useState } from "react";
import { useChat } from "../context/ChatContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./ProjectCard.css";

export default function ProjectCard({ project }) {
  const { role, user, profile } = useAuth();
  const { messages, sendMessage, createProjectChat } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: "", date: "" });

  useEffect(() => {
    if (!user?.uid) return;
    createProjectChat(project.id, project.name, project.participants || []);
  }, [createProjectChat, project.id, project.name, project.participants, user?.uid]);

  const chatMessages = messages[project.id] || [];

  const [milestones, setMilestones] = useState(() => {
    const base = [
      { name: "Consultation Approval", completed: true, date: new Date().toLocaleString() },
      { name: "Consultation Meeting", completed: false, date: new Date().toLocaleString() },
    ];
    return project.milestones?.length ? [...base, ...project.milestones] : base;
  });

  const handleAddMilestone = (event) => {
    event.preventDefault();
    if (!newMilestone.name.trim()) return;
    setMilestones((prev) => [...prev, { ...newMilestone, completed: false }]);
    setNewMilestone({ name: "", date: "" });
    setShowAddForm(false);
  };

  const displayName = useMemo(
    () => profile?.fullName || user?.displayName || user?.email || "Unknown User",
    [profile?.fullName, user?.displayName, user?.email]
  );

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []).map((file) => ({
      name: file.name,
      uploadedByName: displayName,
      uploadedByRole: role,
      date: new Date().toLocaleString(),
    }));
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleSendMsg = async () => {
    if (!inputMsg.trim()) return;
    await sendMessage(project.id, inputMsg);
    setInputMsg("");
  };

  const myFiles = uploadedFiles.filter((file) => file.uploadedByName === displayName);
  const theirFiles = uploadedFiles.filter((file) => file.uploadedByName !== displayName);

  return (
    <div className={`project-card ${isOpen ? "open" : ""}`}>
      <div className="project-header" onClick={() => setIsOpen((open) => !open)}>
        <h2 className="project-title">{project.name}</h2>
        <span className="toggle-icon">{isOpen ? "▾" : "▸"}</span>
      </div>

      {isOpen && (
        <>
          <div className="timeline-container">
            <div className="timeline-line"></div>
            <div className="timeline-points">
              {milestones.map((milestone, index) => (
                <div
                  key={`${milestone.name}-${index}`}
                  className={`milestone-item ${index % 2 === 0 ? "top" : "bottom"}`}
                >
                  <div className={`milestone-dot ${milestone.completed ? "filled" : "unfilled"}`} />
                  <div className="milestone-info">
                    <p className="milestone-label">{milestone.name}</p>
                    <p className="milestone-date">{milestone.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                onChange={(event) =>
                  setNewMilestone((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
              <input
                type="datetime-local"
                value={newMilestone.date}
                onChange={(event) =>
                  setNewMilestone((prev) => ({ ...prev, date: event.target.value }))
                }
              />
              <div className="add-actions">
                <button type="submit">Save</button>
                <button type="button" className="cancel" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="file-upload">
            <h3>Project Files</h3>
            <input type="file" multiple onChange={handleFileUpload} />
          </div>

          <div className="file-lists">
            <div className="file-section">
              <h4>My Files</h4>
              {myFiles.length > 0 ? (
                <ul>
                  {myFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="my-file">
                      📄 {file.name}{" "}
                      <span className="file-meta">
                        (uploaded by {file.uploadedByName} — {file.date})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-files">No files uploaded yet.</p>
              )}
            </div>

            <div className="file-section">
              <h4>Team Uploaded Files</h4>
              {theirFiles.length > 0 ? (
                <ul>
                  {theirFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="their-file">
                      📁 {file.name}{" "}
                      <span className="file-meta">
                        (uploaded by {file.uploadedByName} — {file.date})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-files">No files from the other member yet.</p>
              )}
            </div>
          </div>

          <div className="project-members">
            <h3 className="chat-title">
              Project Group Chat{" "}
              <span className="members">({project.members?.join(", ")})</span>
            </h3>
          </div>

          <div className="chat-section">
            <div className="chat-box">
              {chatMessages.length > 0 ? (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${
                      message.senderId === user?.uid ? "sent" : "received"
                    }`}
                  >
                    <strong>{message.senderName}:</strong> {message.text}
                  </div>
                ))
              ) : (
                <p className="no-files">No messages yet.</p>
              )}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={inputMsg}
                onChange={(event) => setInputMsg(event.target.value)}
                placeholder="Type a message..."
              />
              <button type="button" onClick={handleSendMsg}>
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
