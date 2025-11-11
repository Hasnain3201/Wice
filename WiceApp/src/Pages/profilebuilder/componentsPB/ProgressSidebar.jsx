import ProgressBar from "./ProgressBar";
import "../sidebar.css";

export default function ProgressSidebar({
  sections,
  current,
  completed,
  progress,
  onNavigate,
}) {
  return (
    <aside className="sidebar">
      <h3>Build Your Profile</h3>
      <ProgressBar progress={progress} />
      <ul className="sidebar-list">
        {sections.slice(0, -1).map((sec) => (
          <li
            key={sec}
            className={`sidebar-item ${
              sec === current ? "active" : completed.includes(sec) ? "done" : ""
            }`}
            onClick={() => onNavigate(sec)}
          >
            {completed.includes(sec) ? "✔" : "○"} {sec}
          </li>
        ))}
      </ul>
    </aside>
  );
}
