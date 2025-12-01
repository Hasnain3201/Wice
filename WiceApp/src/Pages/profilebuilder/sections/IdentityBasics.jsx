import "../ProfileBuilder.css";
import { TIMEZONES } from "../../../data/taxonomy";

export default function IdentityBasics({ profileData, setProfileData }) {
  const update = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const pronouns = profileData.pronouns || "";
  const showCustomPronouns = pronouns === "Self describe";

  return (
    <div className="section">
      <h2>Identity Basics</h2>
      <p>
        Tell us where you are based so we can support time-zone friendly
        matching and ease client coordination.
      </p>

      <label>Full Name *</label>
      <input
        type="text"
        placeholder="Enter your full name"
        required
        value={profileData.fullName || ""}
        onChange={(e) => update("fullName", e.target.value)}
        autoComplete="name"
      />

      <label>Pronouns</label>
      <select
        value={profileData.pronouns || ""}
        onChange={(e) => update("pronouns", e.target.value)}
      >
        <option value="">Select...</option>
        <option>She / Her</option>
        <option>He / Him</option>
        <option>They / Them</option>
        <option>Prefer not to say</option>
        <option>Self describe</option>
      </select>

      {showCustomPronouns && (
        <>
          <label>Share your pronouns</label>
          <input
            type="text"
            value={profileData.customPronouns || ""}
            onChange={(e) => update("customPronouns", e.target.value)}
            placeholder="Write your pronouns"
          />
        </>
      )}

      <label>Role / Title *</label>
      <input
        type="text"
        placeholder="e.g., Senior MEL Consultant"
        required
        value={profileData.title || ""}
        onChange={(e) => update("title", e.target.value)}
      />

      <label>Location *</label>
      <input
        type="text"
        placeholder="City, Country"
        required
        value={profileData.location || ""}
        onChange={(e) => update("location", e.target.value)}
        autoComplete="address-level2"
      />

      <label>Time Zone *</label>
      <p className="description">
        Tell us where you are based so we can support time-zone friendly matching.
      </p>
      <select
        required
        value={profileData.timeZone || ""}
        onChange={(e) => update("timeZone", e.target.value)}
      >
        <option value="">Select...</option>
        {TIMEZONES.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
    </div>
  );
}
