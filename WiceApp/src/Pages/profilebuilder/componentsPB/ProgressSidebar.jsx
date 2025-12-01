import ProgressBar from "./ProgressBar";
import "../sidebar.css";

export default function ProgressSidebar({
  sections,
  current,
  completed,
  progress,
  onNavigate,
}) {
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

      <ul className="sidebar-list">
        {sections.map((sec) => renderSectionItem(sec))}
      </ul>
    </aside>
  );
}
