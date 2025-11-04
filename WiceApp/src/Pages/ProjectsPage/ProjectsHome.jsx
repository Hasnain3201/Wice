import React, { useMemo } from "react";
import ProjectCard from "../../Components/ProjectCard.jsx";
import "./ProjectsHome.css";

export default function ProjectsHome() {
  const projects = useMemo(
    () => [
      {
        id: "proj-1",
        name: "Website Redesign",
        milestones: [
          { name: "Planning", completed: true },
          { name: "Wireframes", completed: true },
          { name: "Development", completed: false },
          { name: "Testing", completed: false },
        ],
        members: ["Client", "Consultant"],
        myFiles: ["proposal.pdf", "design.png"],
        theirFiles: ["requirements.docx", "feedback.txt"],
        participants: [],
      },
      {
        id: "proj-2",
        name: "Marketing Campaign",
        milestones: [
          { name: "Research", completed: true },
          { name: "Design", completed: false },
          { name: "Launch", completed: false },
        ],
        members: ["Client", "Consultant"],
        myFiles: ["pitch.pdf"],
        theirFiles: ["brief.docx"],
        participants: [],
      },
    ],
    []
  );

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1>Projects</h1>
        <p>Collaborate with your team and track progress easily.</p>
      </header>

      <div className="projects-container">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
