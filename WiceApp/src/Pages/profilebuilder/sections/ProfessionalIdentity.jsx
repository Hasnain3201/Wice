import { useEffect, useState } from "react";
import "../ProfileBuilder.css";

const MIN_BIO = 250;
const MAX_BIO = 600;

export default function ProfessionalIdentity({
  profileData,
  setProfileData,
  registerValidator,
}) {
  const [bioError, setBioError] = useState("");

  const update = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (!registerValidator) return;
    const validator = () => {
      const length = (profileData.about || "").length;
      if (length < MIN_BIO) {
        setBioError(`Short bio must be at least ${MIN_BIO} characters.`);
        return false;
      }
      if (length > MAX_BIO) {
        setBioError(`Short bio must be under ${MAX_BIO} characters.`);
        return false;
      }
      setBioError("");
      return true;
    };
    registerValidator(validator);
    return () => registerValidator(null);
  }, [profileData.about, registerValidator]);

  return (
    <div className="section">
      <h2>Professional Identity</h2>
      <p>
        Build a snapshot of who you are professionally. These details help
        clients understand your background quickly.
      </p>

      <label>Professional Headline *</label>
      <p className="description">
        This line appears on your consultant card. (120 character max)
      </p>
      <input
        type="text"
        required
        maxLength={120}
        value={profileData.oneLinerBio || ""}
        onChange={(e) => update("oneLinerBio", e.target.value)}
      />

      <label>Short Bio *</label>
      <p className="description">
        Share 250–600 characters about your background.
      </p>
      <textarea
        rows={5}
        required
        minLength={MIN_BIO}
        maxLength={MAX_BIO}
        value={profileData.about || ""}
        onChange={(e) => update("about", e.target.value)}
      />
      {bioError && (
        <p className="error-message" role="alert">
          {bioError}
        </p>
      )}

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

      <label>LinkedIn URL</label>
      <input
        type="url"
        placeholder="https://www.linkedin.com/in/yourname"
        value={profileData.linkedinUrl || ""}
        onChange={(e) => update("linkedinUrl", e.target.value)}
        autoComplete="url"
      />
    </div>
  );
}
