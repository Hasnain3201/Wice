import { useEffect, useState } from "react";
import "../ProfileBuilder.css";
import AvailabilityEditor from "../componentsPB/AvailabilityEditor.jsx";

export default function WorkPreferences({
  profileData,
  setProfileData,
  registerValidator,
  userId,
}) {
  const [currency, setCurrency] = useState(profileData.currency || "USD");
  const [dailyRate, setDailyRate] = useState(profileData.dailyRate || "");
  const [openToTravel, setOpenToTravel] = useState(
    profileData.openToTravel || ""
  );
  const [error, setError] = useState("");

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];

  // Keep writing the non-availability fields into profileData (users collection)
  useEffect(() => {
    setProfileData((prev) => ({
      ...prev,
      currency,
      dailyRate,
      openToTravel,
    }));
  }, [currency, dailyRate, openToTravel, setProfileData]);

  // Re-hydrate local state when profileData changes
  useEffect(() => {
    setCurrency(profileData.currency || "USD");
    setDailyRate(profileData.dailyRate || "");
    setOpenToTravel(profileData.openToTravel || "");
  }, [profileData.currency, profileData.dailyRate, profileData.openToTravel]);

  // Validation: daily rate + travel only (availability handled separately)
  useEffect(() => {
    if (!registerValidator) return;

    const validator = () => {
      if (!dailyRate || Number(dailyRate) <= 0) {
        setError("Enter your typical daily rate.");
        return false;
      }
      if (!openToTravel) {
        setError("Select whether you are open to travel.");
        return false;
      }
      setError("");
      return true;
    };

    registerValidator(validator);
    return () => registerValidator(null);
  }, [dailyRate, openToTravel, registerValidator]);

  useEffect(() => {
    setError("");
  }, [dailyRate, openToTravel, currency]);

  return (
    <div className="section">
      <h2>Work Preferences</h2>
      <p>You can update your preferences at any time.</p>

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
          min="0"
        />
      </div>

      <label>Open to Travel *</label>
      <div className="radio-inline">
        <label>
          <input
            type="radio"
            name="travel"
            value="Yes"
            checked={openToTravel === "Yes"}
            onChange={(e) => setOpenToTravel(e.target.value)}
            required={openToTravel === ""}
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

      {/* NEW: weekly availability editor stored in availabilities/{uid} */}
      <AvailabilityEditor userId={userId} timeZone={profileData.timeZone} />

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
