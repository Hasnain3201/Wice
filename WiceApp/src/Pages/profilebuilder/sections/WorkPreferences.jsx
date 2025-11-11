import { useState } from "react";
import "../ProfileBuilder.css";

export default function WorkPreferences({ onNext }) {
  const [currency, setCurrency] = useState("USD");
  const [dailyRate, setDailyRate] = useState("");
  const [openToTravel, setOpenToTravel] = useState("");

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];

  return (
    <div className="section">
      <h2>Work Preferences</h2>
      <p>You can update your preferences at any time.</p>

      {/* DAILY RATE */}
      <label>Daily Rate *</label>
      <div className="daily-rate-row">
        <select
          className="currency-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {currencies.map((curr) => (
            <option key={curr} value={curr}>
              {curr}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="rate-input"
          placeholder="Enter rate"
          value={dailyRate}
          onChange={(e) => setDailyRate(e.target.value)}
          required
        />
      </div>

      {/* AVAILABILITY (placeholder) */}
      <label>Availability Status *</label>
      <div className="availability-placeholder"></div>

      {/* OPEN TO TRAVEL */}
      <div className="travel-inline">
        <label className="travel-label">Open to Travel *</label>
        <div className="radio-inline">
          <label>
            <input
              type="radio"
              name="travel"
              value="Yes"
              checked={openToTravel === "Yes"}
              onChange={(e) => setOpenToTravel(e.target.value)}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="travel"
              value="No"
              checked={openToTravel === "No"}
              onChange={(e) => setOpenToTravel(e.target.value)}
            />
            No
          </label>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="section-actions">
        <button type="button" className="back">Back</button>
        
        <button type="button" className="next" onClick={onNext}>Next</button>
      </div>
    </div>
  );
}
