import { useState, useEffect } from "react";
import "../ProfileBuilder.css";

export default function WorkPreferences({ profileData, setProfileData, onNext }) {
  const [currency, setCurrency] = useState(profileData.currency || "USD");
  const [dailyRate, setDailyRate] = useState(profileData.dailyRate || "");
  const [openToTravel, setOpenToTravel] = useState(
    profileData.openToTravel || ""
  );

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];

  // ⭐ Sync into parent profileData
  useEffect(() => {
    setProfileData({
      ...profileData,
      currency,
      dailyRate,
      openToTravel,
    });
  }, [currency, dailyRate, openToTravel]);

  return (
    <div className="section">
      <h2>Work Preferences</h2>
      <p>You can update your preferences at any time.</p>

      {/* Daily Rate */}
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

      {/* Travel Preference */}
      <label>Open to Travel *</label>
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
  );
}
