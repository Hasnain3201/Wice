import React, { useEffect, useMemo, useState } from "react";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { useAuth } from "../../context/AuthContext.jsx";
import { auth } from "../../firebase";
import { saveUserProfile } from "../../services/userProfile.js";

function arrayFromCsv(input) {
  return (input || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function csvFromArray(arr) {
  return Array.isArray(arr) ? arr.join(", ") : "";
}

export default function Profile() {
  const { user, profile, refreshProfile, loading } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    organization: "",
    email: "",
    location: "",
    sectorsCsv: "",
    languages: "",
    about: "",
    photoUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isClient = useMemo(
    () => profile?.accountType === "client",
    [profile?.accountType]
  );

  useEffect(() => {
    if (!profile || !user) return;

    setForm({
      fullName: profile.fullName || user.displayName || "",
      organization: profile.organization || "",
      email: user.email || profile.email || "",
      location: profile.location || "",
      sectorsCsv: csvFromArray(profile.sectors),
      languages: profile.languages || "",
      about: profile.about || "",
      photoUrl: profile.photoUrl || "",
    });
  }, [profile, user]);

  const handleFieldChange = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, photoUrl: reader.result || "" }));
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setForm((prev) => ({ ...prev, photoUrl: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    if (!user) {
      setError("You must be signed in to update your profile.");
      setSaving(false);
      return;
    }

    const sectors = arrayFromCsv(form.sectorsCsv);

    try {
      await saveUserProfile(user.uid, {
        fullName: form.fullName,
        organization: form.organization,
        location: form.location,
        sectors,
        languages: form.languages,
        about: form.about,
        photoUrl: form.photoUrl,
      });

      if (auth.currentUser && form.fullName) {
        await updateAuthProfile(auth.currentUser, {
          displayName: form.fullName,
        });
      }

      await refreshProfile();
      setMessage("Profile saved.");
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError(
        err?.message || "Unable to save your profile right now. Try again later."
      );
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const defaultAvatar = useMemo(() => {
    const name = form.fullName || user?.displayName || "Client";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=E5E7EB&color=111827&size=180&bold=true`;
  }, [form.fullName, user?.displayName]);

  if (!user && !loading) {
    return (
      <div className="dashboard-page">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Your Profile</h1>
          <p className="dashboard-subtitle">
            Sign in to manage your profile details.
          </p>
        </header>
      </div>
    );
  }

  const photoSrc = form.photoUrl || defaultAvatar;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Your Profile</h1>
        <p className="dashboard-subtitle">
          {isClient
            ? "Update your client details to keep consultants in the loop."
            : "Keep your information current for consultants across WICE."}
        </p>
      </header>

      <form className="dashboard-card settings" onSubmit={handleSubmit}>
        <div className="profile-photo-editor">
          <img
            src={photoSrc}
            alt={`${form.fullName || "Client"} avatar`}
            className="profile-photo"
          />
          <div className="profile-photo-actions">
            <label className="ghost-btn" htmlFor="photo-input">
              Upload Photo
            </label>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
            {form.photoUrl ? (
              <button
                className="ghost-btn"
                type="button"
                onClick={clearPhoto}
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.fullName}
              onChange={handleFieldChange("fullName")}
              required
            />
          </div>

          <div className="settings-col">
            <label className="label">Organization</label>
            <input
              className="input"
              value={form.organization}
              onChange={handleFieldChange("organization")}
              placeholder="Coastal Resilience Org"
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              readOnly
              disabled
              title="Email updates will be supported soon."
            />
          </div>

          <div className="settings-col">
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={handleFieldChange("location")}
              placeholder="Newark, NJ, USA"
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Preferred Sectors</label>
            <input
              className="input"
              placeholder="Climate, Health, Energy…"
              value={form.sectorsCsv}
              onChange={handleFieldChange("sectorsCsv")}
            />
          </div>

          <div className="settings-col">
            <label className="label">Languages</label>
            <input
              className="input"
              placeholder="English, Spanish…"
              value={form.languages}
              onChange={handleFieldChange("languages")}
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col settings-col--full">
            <label className="label">About</label>
            <textarea
              className="input"
              rows={6}
              value={form.about}
              onChange={handleFieldChange("about")}
              placeholder="Share a short introduction for consultants."
            />
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {message && <span className="hint-ok">{message}</span>}
          {error && <span className="hint-error">{error}</span>}
        </div>
      </form>
    </div>
  );
}
