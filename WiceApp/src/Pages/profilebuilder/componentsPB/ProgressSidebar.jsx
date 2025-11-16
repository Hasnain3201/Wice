import ProgressBar from "./ProgressBar";
import "../sidebar.css";

export default function ProgressSidebar({
  sections,
  current,
  completed,
  progress,
  onNavigate,
  isFullProfileMode,  // ⭐ NEW CONTROL
}) {
  // Light profile pages (skip intro)
  const light = sections.slice(1, 6);

  // All full profile pages
  const full = sections.slice(6);

  // When in full mode, merge lists
  const merged = [...light, ...full];

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

      {/* 🔵 MODE 1: USER HAS NOT YET CLICKED “COMPLETE FULL PROFILE” */}
      {!isFullProfileMode && (
        <>
          <div className="phase-header">Light Profile</div>
          <ul className="sidebar-list">
            {light.map((sec) => renderSectionItem(sec))}
          </ul>
        </>
      )}

      {/* 🔵 MODE 2: USER CLICKED “COMPLETE FULL PROFILE NOW” */}
      {isFullProfileMode && (
        <>
          {/* No headers */}
          <ul className="sidebar-list">
            {merged.map((sec) => renderSectionItem(sec))}
          </ul>
        </>
      )}
    </aside>
  );
}
