import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext.jsx";
import ProjectCard from "../../Components/ProjectCard.jsx";
import CreateProjectModal from "./CreateProjectModal.jsx";
import "./ProjectsHome.css";

export default function ProjectsHome() {
  const { currentUser, role, user } = useAuth();
  const activeUser = currentUser || user;
  const [projects, setProjects] = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Load projects from Firestore in real-time
  useEffect(() => {
    if (!activeUser?.uid) {
      console.log("No active user, skipping project load");
      setLoading(false);
      return;
    }

    console.log("Loading projects for user:", activeUser.uid);

    // Load ALL projects first (we'll filter in code)
    const allProjectsQuery = query(
      collection(db, "projects"),
      where("members", "array-contains", activeUser.uid)
    );

    const unsubAll = onSnapshot(
      allProjectsQuery,
      (snapshot) => {
        console.log("Projects snapshot received, count:", snapshot.docs.length);
        
        const allProjects = snapshot.docs.map((doc) => {
          const data = { id: doc.id, ...doc.data() };
          console.log("Project data:", data);
          return data;
        });

        // Filter active projects (those without archived status or explicitly active)
        const activeProjects = allProjects.filter(
          (p) => p.status !== "archived" && p.archived !== true
        );

        // Filter archived projects
        const archived = allProjects.filter(
          (p) => p.status === "archived" || p.archived === true
        );

        console.log("Active projects:", activeProjects.length);
        console.log("Archived projects:", archived.length);

        // Sort active projects by creation date (newest first)
        activeProjects.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });

        // Sort archived projects by archived date (newest first)
        archived.sort((a, b) => {
          const dateA = a.archivedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.archivedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });

        setProjects(activeProjects);
        setArchivedProjects(archived);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading projects:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        setLoading(false);
      }
    );

    return unsubAll;
  }, [activeUser?.uid]);

  return (
    <div className="projects-page">
      <h1 className="dashboard-title">Projects</h1>
      <h3>Collaborate with your team and track progress easily.</h3>

      <div className="projects-actions">
        {/* Only consultants can create projects */}
        {role === "consultant" && (
          <button className="create-project-btn" onClick={() => setShowModal(true)}>
            + Create Project
          </button>
        )}

        {/* Toggle archived projects */}
        {archivedProjects.length > 0 && (
          <button 
            className="view-archived-btn" 
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "← Back to Active Projects" : `📦 View Archived (${archivedProjects.length})`}
          </button>
        )}
      </div>

      {/* Active Projects */}
      {!showArchived && (
        <div className="projects-container">
          <h2 className="section-title">Active Projects</h2>
          {loading ? (
            <p className="no-projects">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="no-projects">
              {role === "consultant"
                ? "No projects yet. Create your first project to get started!"
                : "No projects yet. A consultant will add you to a project soon."}
            </p>
          ) : (
            projects.map((p) => <ProjectCard key={p.id} project={p} />)
          )}
        </div>
      )}

      {/* Archived Projects */}
      {showArchived && (
        <div className="projects-container">
          <h2 className="section-title">Archived Projects</h2>
          {archivedProjects.length === 0 ? (
            <p className="no-projects">No archived projects yet.</p>
          ) : (
            archivedProjects.map((p) => <ProjectCard key={p.id} project={p} />)
          )}
        </div>
      )}

      {/* Create project modal */}
      {showModal && <CreateProjectModal close={() => setShowModal(false)} />}
    </div>
  );
}