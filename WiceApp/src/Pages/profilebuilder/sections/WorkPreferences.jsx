import { useState } from "react";

export default function WorkPreferences({ onNext }) {
  const [availability, setAvailability] = useState("");
  const [travel, setTravel] = useState("");

  return (
    <div className="section">
      <h2>Work Preferences</h2>
      <p>You can update your preferences at any time.</p>

      <form>
        <label>Daily Rate (USD) *</label>
        <input type="number" placeholder="Enter your daily rate" required />

        <label>Availability Status *</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="availability"
              value="Available now"
              checked={availability === "Available now"}
              onChange={() => setAvailability("Available now")}
            />{" "}
            Available now
          </label>

          <label>
            <input
              type="radio"
              name="availability"
              value="Not currently available"
              checked={availability === "Not currently available"}
              onChange={() => setAvailability("Not currently available")}
            />{" "}
            Not currently available
          </label>

          {availability === "Not currently available" && (
            <input type="text" placeholder="Not available until..." />
          )}
        </div>

        <label>Open to Travel *</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="travel"
              value="Yes"
              checked={travel === "Yes"}
              onChange={() => setTravel("Yes")}
            />{" "}
            Yes
          </label>

          <label>
            <input
              type="radio"
              name="travel"
              value="No"
              checked={travel === "No"}
              onChange={() => setTravel("No")}
            />{" "}
            No
          </label>
        </div>

        <div className="section-actions">
          <button type="button" className="skip">Skip</button>
          <button type="button" className="link">Already have a profile</button>
          <button type="button" className="next" onClick={onNext}>Next</button>
        </div>
      </form>
    </div>
  );
}
