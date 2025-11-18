import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { SearchIcon } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CreateProjectModal({ close }) {
  const { currentUser } = useAuth();

  const [projectName, setProjectName] = useState("");

  const [clients, setClients] = useState([]);
  const [consultants, setConsultants] = useState([]);

  const [clientSearch, setClientSearch] = useState("");
  const [consultantSearch, setConsultantSearch] = useState("");

  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedConsultants, setSelectedConsultants] = useState([]);

  // -----------------------------
  // LOAD USERS FROM FIRESTORE
  // -----------------------------
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      console.log("Loaded users:", users); // keep this for debugging

      setClients(users.filter((u) => u.accountType === "client"));
      setConsultants(users.filter((u) => u.accountType === "consultant"));
    };

    loadUsers().catch((err) => console.error("Error loading users:", err));
  }, []);

  // -----------------------------
  // SEARCH BY fullName (names)
  // -----------------------------
  const filteredClients =
    clientSearch.trim() === ""
      ? clients
      : clients.filter((u) =>
          (u.fullName || "")
            .toLowerCase()
            .includes(clientSearch.toLowerCase())
        );

  const filteredConsultants =
    consultantSearch.trim() === ""
      ? consultants
      : consultants.filter((u) =>
          (u.fullName || "")
            .toLowerCase()
            .includes(consultantSearch.toLowerCase())
        );

  // -----------------------------
  // SELECT / UNSELECT USERS
  // -----------------------------
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

  // -----------------------------
  // CREATE PROJECT + MILESTONE
  // -----------------------------
  const createProject = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    const members = [currentUser.uid, ...selectedClients, ...selectedConsultants];

    if (members.length < 1) {
      alert("Please add at least one member.");
      return;
    }

    try {
      const projectRef = await addDoc(collection(db, "projects"), {
        name: projectName,
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        members,
      });

      await addDoc(collection(db, `projects/${projectRef.id}/milestones`), {
        title: "Project Created",
        description: "Initial project setup",
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        date: Timestamp.now(),
        completed: true,
        completedAt: Timestamp.now(),
        order: 0,
      });

      close();
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Could not create project (check Firestore rules / console).");
    }
  };

  // -----------------------------
  // TAGS FOR SELECTED USERS
  // -----------------------------
  const selectedUsers = [
    ...clients.filter((u) => selectedClients.includes(u.id)),
    ...consultants.filter((u) => selectedConsultants.includes(u.id)),
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Create Project</h2>

        <label>Name of your project</label>
        <input
          className="modal-input"
          placeholder="Enter project name..."
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />

        <h3>Members</h3>
        <div className="tag-container">
          {selectedUsers.map((u) => (
            <div className="user-tag" key={u.id}>
              {u.fullName}
              <span
                className="remove-tag"
                onClick={() => {
                  if (u.accountType === "client") {
                    toggleClient(u.id);
                  } else {
                    toggleConsultant(u.id);
                  }
                }}
              >
                ✕
              </span>
            </div>
          ))}
        </div>

        {/* ADD CLIENTS */}
        <p>Add Clients</p>
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
          {filteredClients.map((u) => (
            <label key={u.id} className="search-user">
              <input
                type="checkbox"
                checked={selectedClients.includes(u.id)}
                onChange={() => toggleClient(u.id)}
              />
              {u.fullName}
            </label>
          ))}
        </div>

        {/* ADD CONSULTANTS */}
        <p>Add Consultants</p>
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
          {filteredConsultants.map((u) => (
            <label key={u.id} className="search-user">
              <input
                type="checkbox"
                checked={selectedConsultants.includes(u.id)}
                onChange={() => toggleConsultant(u.id)}
              />
              {u.fullName}
            </label>
          ))}
        </div>

        <button className="primary-btn" onClick={createProject}>
          Create Project
        </button>
        <button className="secondary-btn" onClick={close}>
          Cancel
        </button>
      </div>
    </div>
  );
}
