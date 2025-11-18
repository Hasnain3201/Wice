import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext.jsx";
import ProjectCard from "../../Components/ProjectCard.jsx";
import CreateProjectModal from "./CreateProjectModal.jsx";
import "./ProjectsHome.css";

export default function ProjectsHome() {
  const { currentUser, role } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // -------------------------------------------------
  // Load Projects From Firestore (real-time)
  // -------------------------------------------------
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "projects"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(list);
    });

    return unsub;
  }, [currentUser?.uid]);

  return (
    <div className="projects-page">
      <h1 className="dashboard-title">Projects</h1>
      <h3>Collaborate with your team and track progress easily.</h3>

      {/* ONLY CONSULTANTS CAN CREATE PROJECTS */}
      {role === "consultant" && (
        <button className="create-project-btn" onClick={() => setShowModal(true)}>
          + Create Project
        </button>
      )}

      {/* PROJECT CARDS */}
      <div className="projects-container">
        {projects.length === 0 ? (
          <p className="no-projects">No projects yet.</p>
        ) : (
          projects.map((p) => <ProjectCard key={p.id} project={p} />)
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showModal && <CreateProjectModal close={() => setShowModal(false)} />}
    </div>
  );
}
