import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const ALL_SUPPORT_AREAS = [
  "Program Design",
  "MEL",
  "Grants & Compliance",
  "Project Management",
  "Operations",
  "HR & Recruitment",
  "Business Development & Proposal Writing",
  "Tech & AI",
  "Strategy & Transformation",
  "Research",
  "Communications",
  "Finance",
  "Security",
  "Training & Facilitation",
  "ESG & Sustainability",
  "Other",
];

const ENGAGEMENT_TYPES = ["Short term", "Long term", "Advisory", "Fractional"];

export default function Profile() {
  const { user, profile, loading } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    jobTitle: "",
    workEmail: "",
    organizationName: "",
    organizationType: "",
    primaryIndustry: "",
    country: "",
    websiteUrl: "",
    supportSelections: [], // NEW CLEAN FORMAT
    timeZone: "",
    contactMethods: [],
    phoneNumber: "",
    whatsappNumber: "",
  });

  const [search, setSearch] = useState("");
  const [openParent, setOpenParent] = useState({});

  useEffect(() => {
    if (!profile || !user) return;

    setForm((prev) => ({
      ...prev,
      fullName: profile.fullName || "",
      jobTitle: profile.jobTitle || "",
      workEmail: profile.workEmail || user.email || "",
      organizationName: profile.organizationName || "",
      organizationType: profile.organizationType || "",
      primaryIndustry: profile.primaryIndustry || "",
      country: profile.country || "",
      websiteUrl: profile.websiteUrl || "",
      supportSelections: profile.supportSelections || [],
      timeZone: profile.timeZone || "",
      contactMethods: profile.contactMethods || [],
      phoneNumber: profile.phoneNumber || "",
      whatsappNumber: profile.whatsappNumber || "",
    }));
  }, [profile, user]);

  const change = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleContactMethod = (method) => {
    setForm((prev) => {
      const set = new Set(prev.contactMethods);
      set.has(method) ? set.delete(method) : set.add(method);
      return { ...prev, contactMethods: [...set] };
    });
  };

  const filteredAreas = ALL_SUPPORT_AREAS.filter((area) =>
    area.toLowerCase().includes(search.toLowerCase())
  );

  const addSelection = (area, type) => {
    const tag = `${area} (${type})`;
    if (!form.supportSelections.includes(tag)) {
      setForm((prev) => ({
        ...prev,
        supportSelections: [...prev.supportSelections, tag],
      }));
    }
    setSearch(""); // close search results
    setOpenParent({});
  };

  const removeSelection = (tag) => {
    setForm((prev) => ({
      ...prev,
      supportSelections: prev.supportSelections.filter((t) => t !== tag),
    }));
  };

  if (!user && !loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Your Profile</h1>
        <p className="dashboard-subtitle">
          Update your information so WICE can match you with the right people.
        </p>
      </header>

      <form className="dashboard-card settings">

        {/* ---------------------------------------------- */}
        {/* 1. INDIVIDUAL INFORMATION */}
        {/* ---------------------------------------------- */}
        <h2 className="section-title">1. About You</h2>
        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Full Name *</label>
            <input className="input" value={form.fullName} onChange={change("fullName")} />
          </div>

          <div className="settings-col">
            <label className="label">Job Title / Role *</label>
            <input className="input" value={form.jobTitle} onChange={change("jobTitle")} />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Work Email *</label>
            <input className="input" value={form.workEmail} onChange={change("workEmail")} />
          </div>
        </div>

        {/* ---------------------------------------------- */}
        {/* 2. ORGANIZATION INFORMATION */}
        {/* ---------------------------------------------- */}
        <h2 className="section-title">2. About Your Organization</h2>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Organization Name *</label>
            <input className="input" value={form.organizationName} onChange={change("organizationName")} />
          </div>

          <div className="settings-col">
            <label className="label">Organization Type *</label>
            <select className="input" value={form.organizationType} onChange={change("organizationType")}>
              <option value="">Select</option>
              <option value="NGO">NGO</option>
              <option value="Nonprofit">Nonprofit</option>
              <option value="Social Enterprise">Social Enterprise</option>
              <option value="Private Company">Private Company</option>
              <option value="Government Entity">Government Entity</option>
              <option value="UN Agency">UN Agency</option>
              <option value="Foundation">Foundation</option>
              <option value="Academic Institution">Academic Institution</option>
            </select>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Primary Industry *</label>
            <input className="input" value={form.primaryIndustry} onChange={change("primaryIndustry")} />
          </div>

          <div className="settings-col">
            <label className="label">Country of Registration *</label>
            <input className="input" value={form.country} onChange={change("country")} />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col settings-col--full">
            <label className="label">Website URL</label>
            <input className="input" value={form.websiteUrl} onChange={change("websiteUrl")} />
          </div>
        </div>

        {/* ---------------------------------------------- */}
        {/* 3. WHAT DO YOU NEED HELP WITH?  (UPDATED)*/}
        {/* ---------------------------------------------- */}
        <h2 className="section-title">3. What Do You Need Help With?</h2>

        <div className="settings-col settings-col--full">
          <label className="label">Search for a support area</label>

          {/* SEARCH BAR */}
          <input
            className="input"
            placeholder="Search sectors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* SEARCH RESULTS */}
          {search && (
            <div className="support-search-dropdown">
              {filteredAreas.map((area) => (
                <div key={area}>
                  <div
                    className="support-parent"
                    onClick={() =>
                      setOpenParent((prev) => ({
                        ...prev,
                        [area]: !prev[area],
                      }))
                    }
                  >
                    {area}
                    <span>{openParent[area] ? "▾" : "▸"}</span>
                  </div>

                  {openParent[area] && (
                    <div className="support-children">
                      {ENGAGEMENT_TYPES.map((type) => (
                        <div
                          key={type}
                          className="support-child"
                          onClick={() => addSelection(area, type)}
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAGS */}
          {form.supportSelections.length > 0 && (
            <div className="support-tag-list">
              {form.supportSelections.map((tag) => (
                <span key={tag} className="support-tag">
                  {tag}
                  <button
                    type="button"
                    className="support-tag-remove"
                    onClick={() => removeSelection(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ---------------------------------------------- */}
        {/* 4. CONTACT PREFERENCES */}
        {/* ---------------------------------------------- */}
        <h2 className="section-title">4. Contact Preferences</h2>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Time Zone</label>
            <input className="input" value={form.timeZone} onChange={change("timeZone")} />
          </div>

          <div className="settings-col">
            <label className="label">Preferred Contact Method</label>
            <div className="pill-row">
              {["Email", "Phone", "WhatsApp"].map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`pill-toggle ${
                    form.contactMethods.includes(method)
                      ? "pill-active"
                      : ""
                  }`}
                  onClick={() => toggleContactMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Phone Number</label>
            <input className="input" value={form.phoneNumber} onChange={change("phoneNumber")} />
          </div>

          <div className="settings-col">
            <label className="label">WhatsApp Number</label>
            <input className="input" value={form.whatsappNumber} onChange={change("whatsappNumber")} />
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn primary" type="button">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
