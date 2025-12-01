export default function ProgressBar({ progress }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
    </div>
  );
}
