import "../ProfileBuilder.css";

export default function ProfessionalIdentity({ profileData, setProfileData, onNext }) {
  const update = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value,
    });
  };

  return (
    <div className="section">
      <h2>Professional Identity</h2>
      <p>
        Build a snapshot of who you are professionally. These details help clients
        understand your background quickly.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
      >
        {/* One-Liner Bio */}
        <label>One-Liner Bio *</label>
        <p className="description">
          This line will appear on your consultant card when clients first search for
          consultants. (120 character max)
        </p>
        <input
          type="text"
          required
          maxLength={120}
          value={profileData.oneLinerBio || ""}
          onChange={(e) => update("oneLinerBio", e.target.value)}
        />

        {/* About */}
        <label>About *</label>
        <p className="description">
          This section appears when clients click into your consultant profile. (300 character max)
        </p>
        <textarea
          rows="5"
          required
          maxLength={300}
          value={profileData.about || ""}
          onChange={(e) => update("about", e.target.value)}
        />

        {/* Experience */}
        <label>Total Years of Professional Experience *</label>
        <select
          required
          value={profileData.totalYearsExperience || ""}
          onChange={(e) => update("totalYearsExperience", e.target.value)}
        >
          <option value="">Select...</option>
          <option>Less than 2</option>
          <option>2-4</option>
          <option>5-7</option>
          <option>8-10</option>
          <option>11-14</option>
          <option>15-20</option>
          <option>20+</option>
        </select>

        {/* LinkedIn */}
        <label>LinkedIn URL</label>
        <input
          type="url"
          placeholder="https://www.linkedin.com/in/yourname"
          value={profileData.linkedinUrl || ""}
          onChange={(e) => update("linkedinUrl", e.target.value)}
        />

        
      </form>
    </div>
  );
}
