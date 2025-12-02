import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { SearchIcon } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CreateProjectModal({ close }) {
  const { currentUser, user } = useAuth();
  const activeUser = currentUser || user;

  const [projectName, setProjectName] = useState("");

  const [clients, setClients] = useState([]);
  const [consultants, setConsultants] = useState([]);

  const [clientSearch, setClientSearch] = useState("");
  const [consultantSearch, setConsultantSearch] = useState("");

  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedConsultants, setSelectedConsultants] = useState([]);

  const [isCreating, setIsCreating] = useState(false);

  // Load users from Firestore
  useEffect(() => {
    const loadUsers = async () => {
      if (!activeUser?.uid) return;
      
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        console.log("Loaded users:", users);

        // Filter by account type
        const clientsList = users.filter((u) => u.accountType === "client");
        const consultantsList = users.filter(
          (u) => u.accountType === "consultant" && u.id !== activeUser.uid
        );

        console.log("Clients:", clientsList);
        console.log("Consultants:", consultantsList);

        setClients(clientsList);
        setConsultants(consultantsList);
      } catch (err) {
        console.error("Error loading users:", err);
        alert("Failed to load users. Please check your connection.");
      }
    };

    loadUsers();
  }, [activeUser?.uid]);

  // Search filtering
  const filteredClients =
    clientSearch.trim() === ""
      ? clients
      : clients.filter((u) =>
          (u.fullName || "").toLowerCase().includes(clientSearch.toLowerCase())
        );

  const filteredConsultants =
    consultantSearch.trim() === ""
      ? consultants
      : consultants.filter((u) =>
          (u.fullName || "").toLowerCase().includes(consultantSearch.toLowerCase())
        );

  // Toggle selection
  const toggleClient = (id) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleConsultant = (id) => {
    setSelectedConsultants((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Remove user from selection
  const removeUser = (id, type) => {
    if (type === "client") {
      setSelectedClients((prev) => prev.filter((x) => x !== id));
    } else {
      setSelectedConsultants((prev) => prev.filter((x) => x !== id));
    }
  };

  // Create project with initial milestone
  const createProject = async () => {
    if (!activeUser?.uid) {
      alert("User not authenticated. Please log in again.");
      return;
    }

    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    const members = [activeUser.uid, ...selectedClients, ...selectedConsultants];

    if (members.length < 2) {
      alert("Please add at least one other member to the project.");
      return;
    }

    setIsCreating(true);

    try {
      // Create the project
      const projectRef = await addDoc(collection(db, "projects"), {
        name: projectName,
        createdBy: activeUser.uid,
        createdAt: Timestamp.now(),
        members,
        archived: false,
        status: "active", // active, completed, archived
      });

      // Create the initial milestone
      await addDoc(collection(db, `projects/${projectRef.id}/milestones`), {
        title: "Project Created",
        description: "Initial project setup",
        createdBy: activeUser.uid,
        createdAt: Timestamp.now(),
        date: Timestamp.now(),
        completed: true,
        completedAt: Timestamp.now(),
      });

      close();
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Could not create project. Please check Firestore rules and console.");
    } finally {
      setIsCreating(false);
    }
  };

  // Get selected users for display
  const selectedUsers = [
    ...clients.filter((u) => selectedClients.includes(u.id)).map((u) => ({ ...u, type: "client" })),
    ...consultants.filter((u) => selectedConsultants.includes(u.id)).map((u) => ({ ...u, type: "consultant" })),
  ];

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && close()}>
      <div className="modal-box">
        <h2>Create New Project</h2>

        <label>Project Name</label>
        <input
          className="modal-input"
          placeholder="Enter project name..."
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          autoFocus
        />

        <h3>Team Members ({selectedUsers.length} selected)</h3>
        <div className="tag-container">
          {selectedUsers.length === 0 ? (
            <p className="no-members-text">No members selected yet</p>
          ) : (
            selectedUsers.map((u) => (
              <div className="user-tag" key={u.id}>
                <span className="user-tag-name">{u.fullName}</span>
                <span className="user-tag-role">({u.type})</span>
                <span className="remove-tag" onClick={() => removeUser(u.id, u.type)}>
                  ✕
                </span>
              </div>
            ))
          )}
        </div>

        {/* Add Clients */}
        <div className="member-section">
          <p className="section-label">Add Clients</p>
          <div className="wice-search-container">
            <SearchIcon className="wice-search-icon" size={17} strokeWidth={1.5} />
            <input
              className="wice-search-input"
              placeholder="Search clients..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
          </div>

          <div className="search-results">
            {filteredClients.length === 0 ? (
              <p className="no-results">No clients found</p>
            ) : (
              filteredClients.map((u) => (
                <label key={u.id} className="search-user">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(u.id)}
                    onChange={() => toggleClient(u.id)}
                  />
                  <span className="user-name">{u.fullName}</span>
                  <span className="user-email">{u.email}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Add Consultants */}
        <div className="member-section">
          <p className="section-label">Add Consultants</p>
          <div className="wice-search-container">
            <SearchIcon className="wice-search-icon" size={17} strokeWidth={1.5} />
            <input
              className="wice-search-input"
              placeholder="Search consultants..."
              value={consultantSearch}
              onChange={(e) => setConsultantSearch(e.target.value)}
            />
          </div>

          <div className="search-results">
            {filteredConsultants.length === 0 ? (
              <p className="no-results">No consultants found</p>
            ) : (
              filteredConsultants.map((u) => (
                <label key={u.id} className="search-user">
                  <input
                    type="checkbox"
                    checked={selectedConsultants.includes(u.id)}
                    onChange={() => toggleConsultant(u.id)}
                  />
                  <span className="user-name">{u.fullName}</span>
                  <span className="user-email">{u.email}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <button 
          className="primary-btn" 
          onClick={createProject}
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Create Project"}
        </button>
        <button 
          className="secondary-btn" 
          onClick={close}
          disabled={isCreating}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}