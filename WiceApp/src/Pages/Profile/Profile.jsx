import React, { useState } from "react";

export default function Profile() {
  // mock client profile state (no backend yet)
  const [form, setForm] = useState({
    name: "Jane Doe",
    organization: "Coastal Resilience Org",
    email: "jane@example.org",
    location: "Newark, NJ, USA",
    sectors: ["Climate", "Health"],
    languages: "English, Spanish",
    about:
      "Community development lead focusing on climate resilience, public health, and equitable access to services.",
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

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: send to API later
    console.log("Profile save (mock):", form);
    setMsg("Profile saved (local only).");
    setTimeout(() => setMsg(""), 2500);
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    form.name || "Client"
  )}&background=E5E7EB&color=111827&size=180&bold=true`;
  const photoSrc = form.photo || defaultAvatar;

  return (
    <main className="shell">
      <h2 className="title" style={{ margin: 0 }}>Your Profile</h2>
      <p className="subtitle" style={{ marginTop: 8 }}>
        Update your client details to keep consultants in the loop.
      </p>

      <form className="settings" onSubmit={onSubmit}>
        <div className="profile-photo-editor">
          <img
            src={photoSrc}
            alt={`${form.name || "Client"} avatar`}
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
            <label className="label">Organization</label>
            <input
              className="input"
              value={form.organization}
              onChange={(e) => update("organization", e.target.value)}
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
            <label className="label">Preferred Sectors</label>
            <input
              className="input"
              placeholder="Climate, Health, Energy…"
              value={form.sectors.join(", ")}
              onChange={(e) =>
                update(
                  "sectors",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>

          <div className="settings-col">
            <label className="label">Languages</label>
            <input
              className="input"
              placeholder="English, Spanish…"
              value={form.languages}
              onChange={(e) => update("languages", e.target.value)}
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col" style={{ flex: 1 }}>
            <label className="label">About</label>
            <textarea
              className="input"
              rows={5}
              value={form.about}
              onChange={(e) => update("about", e.target.value)}
            />
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn primary" type="submit">Save Changes</button>
          {msg && <span className="hint-ok">{msg}</span>}
        </div>
      </form>
    </main>
  );
}
