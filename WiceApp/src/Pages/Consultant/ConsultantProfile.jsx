import React, { useState } from "react";

export default function ConsultantProfile() {
  const [form, setForm] = useState({
    name: "Jane Doe",
    title: "Senior Climate Consultant",
    email: "jane@wice.org",
    location: "Remote, USA",
    focusAreas: ["Climate Finance", "Humanitarian Response"],
    regions: "Global",
    about:
      "Energy and resilience specialist supporting partners with grant discovery, program design, and reporting workflows.",
    photo: "",
  });

  const [msg, setMsg] = useState("");

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handlePhotoChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      update("photo", reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => update("photo", "");

  const onSubmit = (event) => {
    event.preventDefault();
    console.log("Consultant profile save (mock):", form);
    setMsg("Consultant profile saved (local only).");
    setTimeout(() => setMsg(""), 2500);
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    form.name || "Consultant"
  )}&background=E5E7EB&color=111827&size=180&bold=true`;
  const photoSrc = form.photo || defaultAvatar;

  return (
    <main className="shell">
      <h2 className="title" style={{ margin: 0 }}>
        Consultant Profile
      </h2>
      <p className="subtitle" style={{ marginTop: 8 }}>
        Manage your WICE consultant profile so clients understand your expertise.
      </p>

      <form className="settings" onSubmit={onSubmit}>
        <div className="profile-photo-editor">
          <img
            src={photoSrc}
            alt={`${form.name || "Consultant"} avatar`}
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
            {form.photo ? (
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
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div className="settings-col">
            <label className="label">Role / Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
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
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="settings-col">
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Focus Areas</label>
            <input
              className="input"
              placeholder="Grantmaking, Compliance…"
              value={form.focusAreas.join(", ")}
              onChange={(e) =>
                update(
                  "focusAreas",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>

          <div className="settings-col">
            <label className="label">Regions Managed</label>
            <input
              className="input"
              value={form.regions}
              onChange={(e) => update("regions", e.target.value)}
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
              onChange={(e) => update("about", e.target.value)}
            />
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn primary" type="submit">
            Save Changes
          </button>
          {msg ? <span className="hint-ok">{msg}</span> : null}
        </div>
      </form>
    </main>
  );
}
