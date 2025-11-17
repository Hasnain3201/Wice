import "../ProfileBuilder.css";

export default function IdentityBasics({ profileData, setProfileData, onNext }) {
  const update = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value,
    });
  };

  return (
    <div className="section">
      <h2>Identity Basics</h2>
      <p>
        Tell us where you are based so we can support time zone friendly matching
        and ease client coordination.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
      >
        <label>Full Name *</label>
        <input
          type="text"
          placeholder="Enter your full name"
          required
          value={profileData.fullName || ""}
          onChange={(e) => update("fullName", e.target.value)}
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
        </select>

        <label>Time Zone *</label>
        <select
          required
          value={profileData.timeZone || ""}
          onChange={(e) => update("timeZone", e.target.value)}
        >
          <option value="">Select...</option>
          <option>EST</option>
          <option>PST</option>
          <option>CST</option>
          <option>MST</option>
        </select>

        
      </form>
    </div>
  );
}
