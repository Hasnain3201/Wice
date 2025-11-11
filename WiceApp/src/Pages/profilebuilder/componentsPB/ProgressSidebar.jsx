import ProgressBar from "./ProgressBar";
import "../sidebar.css";

export default function ProgressSidebar({
  sections,
  current,
  completed,
  progress,
  onNavigate,
}) {
  // Identify where each phase begins in your sequence
  const lightProfileSections = sections.slice(1, 6); // Light Profile (skip Intro Page)
  const fullProfileSections = sections.slice(6); // Full Profile sections

  const renderSectionItem = (sec) => {
    const isActive = sec === current;
    const isDone = completed.includes(sec);

    return (
      <li
        key={sec}
        className={`sidebar-item ${isActive ? "active" : isDone ? "done" : ""}`}
        onClick={() => onNavigate(sec)}
      >
        {isDone ? "✔" : "○"} {sec}
      </li>
    );
  };

  return (
    <aside className="sidebar">
      <h3>Build Your Profile</h3>
      <ProgressBar progress={progress} />

      {/* Light Profile Phase */}
      <div className="phase-header">Light Profile</div>
      <ul className="sidebar-list">
        {lightProfileSections.map((sec) => renderSectionItem(sec))}
      </ul>

      {/* Full Profile Phase */}
      <div className="phase-header">Full Profile</div>
      <ul className="sidebar-list">
        {fullProfileSections.map((sec) => renderSectionItem(sec))}
      </ul>
    </aside>
  );
}
