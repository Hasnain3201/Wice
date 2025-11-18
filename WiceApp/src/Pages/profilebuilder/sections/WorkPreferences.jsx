import { useEffect, useState } from "react";
import "../ProfileBuilder.css";

export default function WorkPreferences({
  profileData,
  setProfileData,
  registerValidator,
}) {
  const [currency, setCurrency] = useState(profileData.currency || "USD");
  const [dailyRate, setDailyRate] = useState(profileData.dailyRate || "");
  const [availabilityStatus, setAvailabilityStatus] = useState(
    profileData.availabilityStatus || ""
  );
  const [availabilityNote, setAvailabilityNote] = useState(
    profileData.availabilityNote || ""
  );
  const [openToTravel, setOpenToTravel] = useState(
    profileData.openToTravel || ""
  );
  const [error, setError] = useState("");

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];

  useEffect(() => {
    setProfileData((prev) => ({
      ...prev,
      currency,
      dailyRate,
      availabilityStatus,
      availabilityNote,
      openToTravel,
    }));
  }, [
    currency,
    dailyRate,
    availabilityStatus,
    availabilityNote,
    openToTravel,
    setProfileData,
  ]);

  useEffect(() => {
    setCurrency(profileData.currency || "USD");
    setDailyRate(profileData.dailyRate || "");
    setOpenToTravel(profileData.openToTravel || "");
    setAvailabilityStatus(profileData.availabilityStatus || "");
    setAvailabilityNote(profileData.availabilityNote || "");
  }, [
    profileData.currency,
    profileData.dailyRate,
    profileData.openToTravel,
    profileData.availabilityStatus,
    profileData.availabilityNote,
  ]);

  useEffect(() => {
    if (!registerValidator) return;
    const validator = () => {
      if (!dailyRate || Number(dailyRate) <= 0) {
        setError("Enter your typical daily rate.");
        return false;
      }
      if (!availabilityStatus) {
        setError("Select your availability status.");
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
  }, [dailyRate, availabilityStatus, openToTravel, registerValidator]);

  useEffect(() => {
    setError("");
  }, [dailyRate, availabilityStatus, openToTravel, availabilityNote, currency]);

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

      <label>Availability Status *</label>
      <div className="radio-inline">
        <label>
          <input
            type="radio"
            name="availability"
            value="available_now"
            checked={availabilityStatus === "available_now"}
            onChange={(e) => setAvailabilityStatus(e.target.value)}
          />
          Available now
        </label>
        <label>
          <input
            type="radio"
            name="availability"
            value="not_currently_available"
            checked={availabilityStatus === "not_currently_available"}
            onChange={(e) => setAvailabilityStatus(e.target.value)}
          />
          Not currently available
        </label>
      </div>
      {availabilityStatus === "not_currently_available" && (
        <input
          className="input"
          placeholder="Add a note (e.g., available after June)"
          value={availabilityNote}
          onChange={(e) => setAvailabilityNote(e.target.value)}
        />
      )}

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

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
