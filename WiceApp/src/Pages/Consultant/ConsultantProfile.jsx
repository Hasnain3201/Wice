import React, { useEffect, useMemo, useState } from "react";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { useAuth } from "../../context/AuthContext.jsx";
import { auth } from "../../firebase";
import { saveUserProfile } from "../../services/userProfile.js";

function arrayFromCsv(value) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function csvFromArray(arr) {
  return Array.isArray(arr) ? arr.join(", ") : "";
}

export default function ConsultantProfile() {
  const { user, profile, refreshProfile, loading } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    title: "",
    email: "",
    location: "",
    focusAreasCsv: "",
    regions: "",
    languages: "",
    about: "",
    photoUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isConsultant = useMemo(
    () => profile?.accountType === "consultant",
    [profile?.accountType]
  );

  useEffect(() => {
    if (!profile || !user) return;

    setForm({
      fullName: profile.fullName || user.displayName || "",
      title: profile.title || "",
      email: user.email || profile.email || "",
      location: profile.location || "",
      focusAreasCsv: csvFromArray(profile.focusAreas),
      regions: profile.regions || "",
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

    const focusAreas = arrayFromCsv(form.focusAreasCsv);

    try {
      await saveUserProfile(user.uid, {
        fullName: form.fullName,
        title: form.title,
        location: form.location,
        focusAreas,
        regions: form.regions,
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
      console.error("Consultant profile save failed:", err);
      setError(
        err?.message || "Unable to save your profile right now. Try again later."
      );
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const defaultAvatar = useMemo(() => {
    const name = form.fullName || user?.displayName || "Consultant";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=E5E7EB&color=111827&size=180&bold=true`;
  }, [form.fullName, user?.displayName]);

  if ((!user || !isConsultant) && !loading) {
    return (
      <main className="shell">
        <h1 className="dashboard-title">
          Consultant Profile
        </h1>
        <p className="subtitle" style={{ marginTop: 8 }}>
          Sign in with a consultant account to manage your profile.
        </p>
      </main>
    );
  }

  const photoSrc = form.photoUrl || defaultAvatar;

  return (
    <main className="shell">
      <h1 className="dashboard-title">
        Consultant Profile
      </h1>
      <p className="subtitle" style={{ marginTop: 8 }}>
        Manage your WICE consultant profile so clients understand your expertise.
      </p>

      <form className="settings" onSubmit={handleSubmit}>
        <div className="profile-photo-editor">
          <img
            src={photoSrc}
            alt={`${form.fullName || "Consultant"} avatar`}
            className="profile-photo"
          />
          <div className="profile-photo-actions">
            <label className="ghost-btn" htmlFor="consultant-photo-input">
              Upload Photo
            </label>
            <input
              id="consultant-photo-input"
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
            <label className="label">Role / Title</label>
            <input
              className="input"
              value={form.title}
              onChange={handleFieldChange("title")}
              placeholder="Senior Climate Consultant"
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
              placeholder="Remote, USA"
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Focus Areas</label>
            <input
              className="input"
              placeholder="Grantmaking, Compliance…"
              value={form.focusAreasCsv}
              onChange={handleFieldChange("focusAreasCsv")}
            />
          </div>

          <div className="settings-col">
            <label className="label">Regions Managed</label>
            <input
              className="input"
              value={form.regions}
              onChange={handleFieldChange("regions")}
              placeholder="Global"
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Languages</label>
            <input
              className="input"
              value={form.languages}
              onChange={handleFieldChange("languages")}
              placeholder="English, Spanish"
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col" style={{ flex: 1 }}>
            <label className="label">About</label>
            <textarea
              className="input"
              rows={4}
              value={form.about}
              onChange={handleFieldChange("about")}
              placeholder="Energy and resilience specialist supporting partners…"
            />
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {message ? <span className="hint-ok">{message}</span> : null}
          {error ? <span className="hint-error">{error}</span> : null}
        </div>
      </form>
    </main>
  );
}
