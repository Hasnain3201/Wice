import { useState } from "react";

export default function CompletionConfirmation({ onBack, onNext }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="section">
      <h2>Final Review and Confirmation</h2>
      <p>
        Review your full profile and confirm submission. Once submitted, your full
        profile becomes visible to clients.
      </p>

      <label>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={() => setConfirmed((v) => !v)}
        />{" "}
        I confirm that all the information provided is accurate.
      </label>

      <div className="section-actions">
        <button className="back" onClick={onBack}>
          Back
        </button>
        <button
          className="next"
          disabled={!confirmed}
          onClick={() => onNext(confirmed)}
        >
          Submit Full Profile
        </button>
      </div>
    </div>
  );
}
