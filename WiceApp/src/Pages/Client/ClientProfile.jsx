import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { saveUserProfile } from "../../services/userProfile.js";
import "../Consultant/ConsultantProfile.css";

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
  const { user, profile, loading, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    jobTitle: "",
    workEmail: "",
    organizationName: "",
    organizationType: "",
    primaryIndustry: "",
    sector: "",
    country: "",
    websiteUrl: "",
    supportSelections: [], // NEW CLEAN FORMAT
    engagementTypes: [],
    timeZone: "",
    contactMethods: [],
    phoneNumber: "",
    whatsappNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasLightProfile = useMemo(
    () => Boolean(profile?.clientLightCompleted || profile?.phaseLightCompleted),
    [profile?.clientLightCompleted, profile?.phaseLightCompleted]
  );
  const hasFullProfile = useMemo(
    () =>
      Boolean(
        profile?.clientFullCompleted ||
          profile?.phaseFullCompleted ||
          (profile?.profile?.supportSelections || []).length ||
          (profile?.profile?.engagementTypes || []).length ||
          profile?.profile?.websiteUrl
      ),
    [
      profile?.clientFullCompleted,
      profile?.phaseFullCompleted,
      profile?.profile?.supportSelections,
      profile?.profile?.engagementTypes,
      profile?.profile?.websiteUrl,
    ]
  );

  const [search, setSearch] = useState("");
  const [openParent, setOpenParent] = useState({});

  useEffect(() => {
    if (!profile || !user) return;
    const stored = profile.profile || {};

    setForm((prev) => ({
      ...prev,
      fullName: stored.fullName || profile.fullName || "",
      jobTitle: stored.jobTitle || profile.jobTitle || "",
      workEmail: stored.workEmail || user.email || "",
      organizationName: stored.organizationName || profile.organizationName || "",
      organizationType: stored.organizationType || profile.organizationType || "",
      primaryIndustry: stored.primaryIndustry || profile.primaryIndustry || "",
      sector: stored.sector || profile.sector || "",
      country: stored.country || profile.country || "",
      websiteUrl: stored.websiteUrl || profile.websiteUrl || "",
      supportSelections: stored.supportSelections || profile.supportSelections || [],
      engagementTypes: stored.engagementTypes || profile.engagementTypes || [],
      timeZone: stored.timeZone || profile.timeZone || "",
      contactMethods: stored.contactMethods || profile.contactMethods || [],
      phoneNumber: stored.phoneNumber || profile.phoneNumber || "",
      whatsappNumber: stored.whatsappNumber || profile.whatsappNumber || "",
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

  const toggleEngagementType = (type) => {
    setForm((prev) => {
      const set = new Set(prev.engagementTypes || []);
      set.has(type) ? set.delete(type) : set.add(type);
      return { ...prev, engagementTypes: [...set] };
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setMessage("");

    const existingProfile = profile?.profile || {};
    const nextProfile = {
      ...existingProfile,
      fullName: form.fullName || existingProfile.fullName || "",
      jobTitle: form.jobTitle || existingProfile.jobTitle || "",
      workEmail: form.workEmail || existingProfile.workEmail || user.email || "",
      organizationName: form.organizationName || existingProfile.organizationName || "",
      organizationType: form.organizationType || existingProfile.organizationType || "",
      primaryIndustry: form.primaryIndustry || existingProfile.primaryIndustry || "",
      sector: form.sector || existingProfile.sector || "",
      country: form.country || existingProfile.country || "",
      contactMethods: form.contactMethods || [],
    };

    if (hasFullProfile) {
      nextProfile.websiteUrl = form.websiteUrl || "";
      nextProfile.supportSelections = form.supportSelections || [];
      nextProfile.engagementTypes = form.engagementTypes || [];
      nextProfile.timeZone = form.timeZone || "";
      nextProfile.phoneNumber = form.phoneNumber || "";
      nextProfile.whatsappNumber = form.whatsappNumber || "";
    }

    try {
      await saveUserProfile(user.uid, {
        profile: nextProfile,
        clientLightCompleted: true,
        phaseLightCompleted: true,
        ...(hasFullProfile
          ? { clientFullCompleted: true, phaseFullCompleted: true }
          : {}),
      });
      await refreshProfile?.();
      setMessage("Profile saved.");
    } catch (err) {
      console.error("Client profile save failed:", err);
      setError(err?.message || "Unable to save your profile right now.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3500);
    }
  };

  if (!user && !loading) {
    return <div>Loading...</div>;
  }

  const heroStats = [
    { label: "Industry", value: form.primaryIndustry || "—" },
    { label: "Country", value: form.country || "—" },
    {
      label: "Contact methods",
      value:
        form.contactMethods.length > 0
          ? form.contactMethods.join(", ")
          : "—",
    },
  ];

  return (
    <main className="profile-form-page">
      <section className="profile-form-hero">
        <div>
          <p className="profile-eyebrow">Client profile</p>
          <h1>Tell consultants what you need</h1>
          <p>Keep these details accurate so WICE can match you with the right experts.</p>
        </div>
        <div className="profile-form-hero__stats">
          {heroStats.map((stat) => (
            <article key={stat.label}>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </article>
          ))}
        </div>
      </section>

      <form className="profile-form-card settings" onSubmit={handleSave}>
        {hasLightProfile && !hasFullProfile && (
          <div className="profile-builder-banner">
            <div>
              <h3>Finish your full profile</h3>
              <p>
                You’ve completed the light profile. Add full details so consultants see everything.
              </p>
            </div>
            <a className="banner-link" href="/client/profile-builder">
              Continue profile
            </a>
          </div>
        )}

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
            <label className="label">Sector (Subsector) *</label>
            <input className="input" value={form.sector} onChange={change("sector")} />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Country of Registration *</label>
            <input className="input" value={form.country} onChange={change("country")} />
          </div>
        </div>

        {hasFullProfile && (
          <div className="settings-row">
            <div className="settings-col settings-col--full">
              <label className="label">Website URL</label>
              <input className="input" value={form.websiteUrl} onChange={change("websiteUrl")} />
            </div>
          </div>
        )}

        {/* ---------------------------------------------- */}
        {/* 3. WHAT DO YOU NEED HELP WITH?  (UPDATED)*/}
        {/* ---------------------------------------------- */}
        {hasFullProfile && (
          <>
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

            <div className="settings-col settings-col--full" style={{ marginTop: 16 }}>
              <label className="label">Preferred Engagement Types</label>
              <div className="pill-row">
                {ENGAGEMENT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`pill-toggle ${
                      form.engagementTypes.includes(type) ? "pill-active" : ""
                    }`}
                    onClick={() => toggleEngagementType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

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

        {hasFullProfile && (
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
        )}

        <div className="settings-actions">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          {message && <span className="hint-ok">{message}</span>}
          {error && <span className="hint-error">{error}</span>}
        </div>
      </form>
    </main>
  );
}
