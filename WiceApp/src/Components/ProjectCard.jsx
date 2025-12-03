import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db } from "../firebase";
import { useChat } from "../context/ChatContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./ProjectCard.css";

// Helper to choose an icon based on file extension
const getFileIcon = (fileName = "") => {
  const ext = (fileName.split(".").pop() || "").toLowerCase();

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "🖼️";
  if (ext === "pdf") return "📕";
  if (["doc", "docx"].includes(ext)) return "📘";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["ppt", "pptx", "key"].includes(ext)) return "📙";
  if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
  if (["txt", "md"].includes(ext)) return "📄";
  return "📁";
};

export default function ProjectCard({ project }) {
  const { role, user, profile } = useAuth();
  const { messages, sendMessage, createProjectChat } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", date: "" });
  const [milestones, setMilestones] = useState([]);
  const [projectEndDate, setProjectEndDate] = useState(null);
  const [showEndDateForm, setShowEndDateForm] = useState(false);
  const [showFinishForm, setShowFinishForm] = useState(false);

  // delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Initialize chat
  useEffect(() => {
    if (!user?.uid) return;
    createProjectChat(project.id, project.name, project.members || []);
  }, [createProjectChat, project.id, project.name, project.members, user?.uid]);

  // Load project end date from Firebase
  useEffect(() => {
    if (!project.id) return;

    const projectRef = doc(db, "projects", project.id);
    const unsub = onSnapshot(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProjectEndDate(data.endDate?.toDate?.() || null);
      }
    });

    return unsub;
  }, [project.id]);

  // Load milestones from Firebase in real-time
  useEffect(() => {
    if (!project.id) return;

    const qMilestones = query(
      collection(db, `projects/${project.id}/milestones`),
      orderBy("date", "asc")
    );

    const unsub = onSnapshot(qMilestones, (snapshot) => {
      const loadedMilestones = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        // Convert Firestore Timestamp to readable date
        date: docSnap.data().date?.toDate?.() || new Date(),
        completedAt: docSnap.data().completedAt?.toDate?.() || null,
      }));
      setMilestones(loadedMilestones);
    });

    return unsub;
  }, [project.id]);

  // Load project files in real-time
  useEffect(() => {
    if (!project.id) return;

    const filesRef = collection(db, `projects/${project.id}/files`);
    const qFiles = query(filesRef, orderBy("uploadedAt", "desc"));

    const unsub = onSnapshot(qFiles, (snapshot) => {
      const files = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setUploadedFiles(files);
    });

    return unsub;
  }, [project.id]);

  // Calculate milestone positions based on dates
  const calculateMilestonePositions = useMemo(() => {
    if (milestones.length === 0) return [];

    const startDate = milestones[0].date.getTime();
    const hasEndDate = projectEndDate !== null;

    // If no end date, use the latest milestone date and expand to 75% of visual timeline
    // If end date exists, use it for 100% of visual timeline
    const endDate = hasEndDate
      ? projectEndDate.getTime()
      : milestones[milestones.length - 1].date.getTime();

    const totalDuration = endDate - startDate || 1; // Avoid division by zero
    const timelineMultiplier = hasEndDate ? 1.0 : 0.75;

    return milestones.map((milestone) => {
      const milestoneTime = milestone.date.getTime();
      const progress =
        totalDuration > 0
          ? ((milestoneTime - startDate) / totalDuration) * timelineMultiplier
          : 0;

      return {
        ...milestone,
        position: Math.max(0, Math.min(progress, 1)), // Clamp between 0 and 1
      };
    });
  }, [milestones, projectEndDate]);

  const chatMessages = messages[project.id] || [];

  const displayName = useMemo(
    () => profile?.fullName || user?.displayName || user?.email || "Unknown User",
    [profile?.fullName, user?.displayName, user?.email]
  );

  const canDeleteFile = (file) =>
    file.uploadedByName === displayName || role === "consultant";

  // Add new milestone to Firebase
  const handleAddMilestone = async (event) => {
    event.preventDefault();
    if (!newMilestone.title.trim()) return;
    if (!newMilestone.date) {
      alert("Please select a date for the milestone.");
      return;
    }

    try {
      const milestoneDate = Timestamp.fromDate(new Date(newMilestone.date));

      await addDoc(collection(db, `projects/${project.id}/milestones`), {
        title: newMilestone.title,
        description: "",
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        date: milestoneDate,
        completed: false,
        completedAt: null,
      });

      setNewMilestone({ title: "", date: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding milestone:", error);
      alert("Failed to add milestone. Please try again.");
    }
  };

  // Toggle milestone completion (consultants only)
  const handleToggleMilestone = async (milestone) => {
    if (role !== "consultant") {
      alert("Only consultants can mark milestones as complete.");
      return;
    }

    try {
      const milestoneRef = doc(
        db,
        `projects/${project.id}/milestones`,
        milestone.id
      );
      await updateDoc(milestoneRef, {
        completed: !milestone.completed,
        completedAt: !milestone.completed ? Timestamp.now() : null,
      });
    } catch (error) {
      console.error("Error toggling milestone:", error);
      alert("Failed to update milestone. Please try again.");
    }
  };

  // Set project end date (consultants only)
  const handleSetEndDate = async (event) => {
    event.preventDefault();
    if (!event.target.endDate.value) {
      alert("Please select an end date.");
      return;
    }

    try {
      const endDate = Timestamp.fromDate(new Date(event.target.endDate.value));
      const projectRef = doc(db, "projects", project.id);
      await updateDoc(projectRef, {
        endDate: endDate,
      });
      setShowEndDateForm(false);
    } catch (error) {
      console.error("Error setting end date:", error);
      alert("Failed to set end date. Please try again.");
    }
  };

  // Mark project as finished and archive it
  const handleFinishProject = async (event) => {
    event.preventDefault();
    if (!event.target.finishDate.value) {
      alert("Please select a project finish date.");
      return;
    }

    if (!projectEndDate) {
      alert("Please set a project end date before marking as finished.");
      return;
    }

    try {
      const finishDate = Timestamp.fromDate(
        new Date(event.target.finishDate.value)
      );

      // Add "Project Finished" milestone
      await addDoc(collection(db, `projects/${project.id}/milestones`), {
        title: "Project Finished",
        description: "Project completed and archived",
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        date: finishDate,
        completed: true,
        completedAt: Timestamp.now(),
      });

      // Update project status to archived
      const projectRef = doc(db, "projects", project.id);
      await updateDoc(projectRef, {
        status: "archived",
        archived: true,
        archivedAt: Timestamp.now(),
        archivedBy: user.uid,
      });

      setShowFinishForm(false);
      alert("Project has been marked as finished and archived!");
    } catch (error) {
      console.error("Error finishing project:", error);
      alert("Failed to finish project. Please try again.");
    }
  };

  // FILE UPLOAD: upload to Storage + save metadata in Firestore
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const storage = getStorage();
    const filesCollectionRef = collection(db, `projects/${project.id}/files`);

    for (const file of files) {
      const storagePath = `projectFiles/${project.id}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);

      try {
        // Upload file bytes
        await uploadBytes(storageRef, file);

        // Get download URL
        const url = await getDownloadURL(storageRef);

        // Save metadata (includes who + when + storagePath)
        await addDoc(filesCollectionRef, {
          name: file.name,
          url,
          storagePath,
          uploadedByName: displayName,
          uploadedByRole: role,
          uploadedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error("File upload error:", error);
        alert("Failed to upload one of the files. Please try again.");
      }
    }

    // Clear the input so same file can be selected again if needed
    event.target.value = "";
  };

  // Delete file: open confirm modal
  const handleRequestDeleteFile = (file) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleCancelDeleteFile = () => {
    setFileToDelete(null);
    setShowDeleteModal(false);
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;

    const storage = getStorage();

    try {
      // Delete Firestore document
      const fileDocRef = doc(
        db,
        `projects/${project.id}/files`,
        fileToDelete.id
      );
      await deleteDoc(fileDocRef);

      // Delete from Storage if we have a path
      if (fileToDelete.storagePath) {
        const fileRef = ref(storage, fileToDelete.storagePath);
        await deleteObject(fileRef);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to remove file. Please try again.");
    } finally {
      setFileToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleSendMsg = async () => {
    if (!inputMsg.trim()) return;
    await sendMessage(project.id, inputMsg);
    setInputMsg("");
  };

  const myFiles = uploadedFiles.filter(
    (file) => file.uploadedByName === displayName
  );
  const theirFiles = uploadedFiles.filter(
    (file) => file.uploadedByName !== displayName
  );

  return (
    <div className={`project-card ${isOpen ? "open" : ""}`}>
      <div
        className="project-header"
        onClick={() => setIsOpen((open) => !open)}
      >
        <h2 className="project-title">{project.name}</h2>
        <span className="toggle-icon">{isOpen ? "▾" : "▸"}</span>
      </div>

      {isOpen && (
        <>
          <div className="timeline-container">
            <div className="timeline-header">
              <div className="timeline-dates">
                <span className="timeline-start-date">
                  {calculateMilestonePositions.length > 0
                    ? calculateMilestonePositions[0].date.toLocaleDateString()
                    : "Start"}
                </span>
                {projectEndDate && (
                  <span className="timeline-end-date">
                    {projectEndDate.toLocaleDateString()}
                  </span>
                )}
                {!projectEndDate && role === "consultant" && (
                  <button
                    className="set-end-date-btn"
                    onClick={() => setShowEndDateForm(true)}
                    title="Set project end date"
                  >
                    + Set End Date
                  </button>
                )}
              </div>
            </div>

            {showEndDateForm && role === "consultant" && (
              <form className="end-date-form" onSubmit={handleSetEndDate}>
                <input
                  type="date"
                  name="endDate"
                  min={
                    calculateMilestonePositions.length > 0
                      ? calculateMilestonePositions[
                        calculateMilestonePositions.length - 1
                      ].date
                        .toISOString()
                        .split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }
                  required
                />
                <div className="form-actions">
                  <button type="submit">Set Date</button>
                  <button
                    type="button"
                    onClick={() => setShowEndDateForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="timeline-line"></div>
            <div className="timeline-points">
              {calculateMilestonePositions.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className={`milestone-item ${index % 2 === 0 ? "top" : "bottom"
                    }`}
                  style={{ left: `${milestone.position * 100}%` }}
                >
                  <div
                    className={`milestone-dot ${milestone.completed ? "filled" : "unfilled"
                      }`}
                    onClick={() => handleToggleMilestone(milestone)}
                    style={{
                      cursor: role === "consultant" ? "pointer" : "default",
                    }}
                    title={
                      role === "consultant"
                        ? "Click to toggle completion"
                        : ""
                    }
                  />
                  <div className="milestone-info">
                    <p className="milestone-label">
                      {milestone.title}
                      {milestone.completed && " ✓"}
                    </p>
                    <p className="milestone-date">
                      {milestone.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {role === "consultant" && (
            <>
              {!showAddForm ? (
                <button className="add-btn" onClick={() => setShowAddForm(true)}>
                  + Add Milestone
                </button>
              ) : (
                <form className="add-milestone-form" onSubmit={handleAddMilestone}>
                  <input
                    type="text"
                    placeholder="Milestone name..."
                    value={newMilestone.title}
                    onChange={(event) =>
                      setNewMilestone((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    required
                  />
                  <input
                    type="datetime-local"
                    value={newMilestone.date}
                    onChange={(event) =>
                      setNewMilestone((prev) => ({
                        ...prev,
                        date: event.target.value,
                      }))
                    }
                    required
                  />
                  <div className="add-actions">
                    <button type="submit">Save</button>
                    <button
                      type="button"
                      className="cancel"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {projectEndDate &&
                project.status !== "archived" &&
                !showFinishForm && (
                  <button
                    className="finish-btn"
                    onClick={() => setShowFinishForm(true)}
                  >
                    ✓ Mark Project as Finished
                  </button>
                )}

              {showFinishForm && (
                <form className="finish-project-form" onSubmit={handleFinishProject}>
                  <label>Project Finish Date</label>
                  <input
                    type="date"
                    name="finishDate"
                    min={
                      projectEndDate
                        ? projectEndDate.toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    required
                  />
                  <div className="form-actions">
                    <button type="submit">Finish & Archive Project</button>
                    <button
                      type="button"
                      onClick={() => setShowFinishForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {project.status === "archived" && (
            <div className="archived-banner">
              <span className="archived-icon">📦</span>
              <span>This project has been archived</span>
            </div>
          )}

          {/* FILE UPLOAD */}
          <div className="file-upload">
            <h3>Project Files</h3>
            <input type="file" multiple onChange={handleFileUpload} />
          </div>

          {/* FILE LISTS */}
          <div className="file-lists">
            <div className="file-section">
              <h4>My Files</h4>
              {myFiles.length > 0 ? (
                <ul>
                  {myFiles.map((file) => (
                    <li key={file.id} className="my-file">
                      <div className="file-row">
                        <span className="file-icon">{getFileIcon(file.name)}</span>

                        <a
                          className="file-link"
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flex: 1, marginLeft: "8px" }}
                        >
                          {file.name}
                        </a>

                        {canDeleteFile(file) && (
                          <button
                            type="button"
                            className="file-delete-btn"
                            onClick={() => handleRequestDeleteFile(file)}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <span className="file-meta">
                        Uploaded by {file.uploadedByName} —{" "}
                        {file.uploadedAt?.toDate?.().toLocaleString() || ""}
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
                  {theirFiles.map((file) => (
                    <li key={file.id} className="their-file">
                      <div className="file-row">
                        <span className="file-icon">{getFileIcon(file.name)}</span>
                        <a
                          className="file-link"
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {file.name}
                        </a>
                        {canDeleteFile(file) && (
                          <button
                            type="button"
                            className="file-delete-btn"
                            onClick={() => handleRequestDeleteFile(file)}
                            aria-label="Remove file"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <span className="file-meta">
                        Uploaded by {file.uploadedByName} —{" "}
                        {file.uploadedAt?.toDate?.().toLocaleString() || ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-files">No files from the other member yet.</p>
              )}
            </div>
          </div>

          {/* DELETE CONFIRM MODAL */}
          {showDeleteModal && fileToDelete && (
            <div className="file-delete-modal-overlay">
              <div className="file-delete-modal">
                <p>
                  Are you sure you want to remove this file from your project's
                  files?
                </p>
                <div className="modal-actions">
                  <button type="button" onClick={handleConfirmDeleteFile}>
                    Yes, remove
                  </button>
                  <button type="button" onClick={handleCancelDeleteFile}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="project-members">
            <h3 className="chat-title">
              Project Group Chat{" "}
              <span className="members">
                ({calculateMilestonePositions.length} milestone
                {calculateMilestonePositions.length !== 1 ? "s" : ""})
              </span>
            </h3>
          </div>

          <div className="chat-section">
            <div className="chat-box">
              {chatMessages.length > 0 ? (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.senderId === user?.uid ? "sent" : "received"
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
                onKeyPress={(event) =>
                  event.key === "Enter" && handleSendMsg()
                }
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
