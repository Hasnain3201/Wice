import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { saveUserProfile } from "../../services/userProfile.js";
import { TIMEZONES, PREFERED_CONTACT_METHOD } from "../../data/taxonomy.js";
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
const ORG_TYPE_OPTIONS = [
  "NGO",
  "Nonprofit",
  "Social Enterprise",
  "Private Company",
  "Government Entity",
  "UN Agency",
  "Foundation",
  "Academic Institution",
];

const normalizeKey = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z]/g, "");

const normalizeEngagementLabel = (value) => {
  const clean = (value || "").toString().trim();
  if (!clean) return "";
  return (
    ENGAGEMENT_TYPES.find((option) => normalizeKey(option) === normalizeKey(clean)) ||
    clean
  );
};

const normalizeEngagementTypes = (values = []) =>
  Array.from(
    new Set(
      (values || [])
        .map(normalizeEngagementLabel)
        .filter(Boolean)
    )
  );

const dedupeList = (list = []) =>
  Array.from(new Set((list || []).filter(Boolean)));

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
    contactMethod: "",
    phoneNumber: "",
    whatsappNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [engagementInput, setEngagementInput] = useState("");

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
          (profile?.profile?.supportAreas || []).length ||
          normalizeEngagementTypes(
            profile?.profile?.engagementTypes || profile?.profile?.engagementOptions || []
          ).length ||
          (profile?.supportSelections || []).length ||
          normalizeEngagementTypes(profile?.engagementTypes || []).length ||
          profile?.profile?.websiteUrl ||
          profile?.profile?.website ||
          profile?.websiteUrl ||
          profile?.profile?.phoneNumber ||
          profile?.profile?.whatsappNumber
      ),
    [
      profile?.clientFullCompleted,
      profile?.phaseFullCompleted,
      profile?.profile?.supportSelections,
      profile?.profile?.supportAreas,
      profile?.profile?.engagementTypes,
      profile?.profile?.engagementOptions,
      profile?.profile?.websiteUrl,
      profile?.profile?.website,
      profile?.supportSelections,
      profile?.engagementTypes,
      profile?.websiteUrl,
      profile?.profile?.phoneNumber,
      profile?.profile?.whatsappNumber,
    ]
  );

  const [search, setSearch] = useState("");
  const [openParent, setOpenParent] = useState({});

  useEffect(() => {
    if (!profile || !user) return;
    const stored = profile.profile || {};
    const normalizedEngagements = normalizeEngagementTypes(
      stored.engagementTypes ||
        stored.engagementOptions ||
        stored.engagement_types ||
        profile?.engagementTypes ||
        []
    );
    const supportSelections = dedupeList(
      stored.supportSelections || stored.supportAreas || profile?.supportSelections || []
    );

    setForm((prev) => ({
      ...prev,
      fullName: stored.fullName || profile.fullName || "",
      jobTitle: stored.jobTitle || profile.jobTitle || "",
      workEmail: stored.workEmail || profile.workEmail || user.email || "",
      organizationName: stored.organizationName || profile.organizationName || "",
      organizationType: stored.organizationType || profile.organizationType || "",
      primaryIndustry: stored.primaryIndustry || profile.primaryIndustry || "",
      sector: stored.sector || profile.sector || "",
      country: stored.country || profile.country || "",
      websiteUrl: stored.websiteUrl || stored.website || profile.websiteUrl || "",
      supportSelections,
      engagementTypes: normalizedEngagements,
      timeZone: stored.timeZone || profile.timeZone || "",
      contactMethod:
        (stored.contactMethods && stored.contactMethods[0]) ||
        (profile.contactMethods && profile.contactMethods[0]) ||
        stored.contactMethod ||
        profile.contactMethod ||
        "",
      phoneNumber: stored.phoneNumber || profile.phoneNumber || "",
      whatsappNumber: stored.whatsappNumber || profile.whatsappNumber || "",
    }));
  }, [profile, user]);

  const change = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
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
    const canonical = normalizeEngagementLabel(type);
    if (!canonical) return;
    setForm((prev) => {
      const set = new Set(normalizeEngagementTypes(prev.engagementTypes));
      set.has(canonical) ? set.delete(canonical) : set.add(canonical);
      return { ...prev, engagementTypes: Array.from(set) };
    });
  };

  const addEngagementType = () => {
    const canonical = normalizeEngagementLabel(engagementInput);
    if (!canonical) return;
    setForm((prev) => ({
      ...prev,
      engagementTypes: normalizeEngagementTypes([...(prev.engagementTypes || []), canonical]),
    }));
    setEngagementInput("");
  };

  const removeEngagementType = (type) => {
    const canonical = normalizeEngagementLabel(type);
    setForm((prev) => ({
      ...prev,
      engagementTypes: normalizeEngagementTypes(prev.engagementTypes).filter(
        (t) => normalizeKey(t) !== normalizeKey(canonical)
      ),
    }));
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
      timeZone: form.timeZone || existingProfile.timeZone || "",
      contactMethods: form.contactMethod
        ? [form.contactMethod]
        : existingProfile.contactMethods ||
          (existingProfile.contactMethod ? [existingProfile.contactMethod] : []),
    };

    if (hasFullProfile) {
      const normalizedEngagements =
        normalizeEngagementTypes(
          form.engagementTypes.length
            ? form.engagementTypes
            : existingProfile.engagementTypes ||
              existingProfile.engagementOptions ||
              []
        ) || [];

      nextProfile.websiteUrl =
        form.websiteUrl || existingProfile.websiteUrl || existingProfile.website || "";
      nextProfile.supportSelections = dedupeList(
        (form.supportSelections && form.supportSelections.length
          ? form.supportSelections
          : existingProfile.supportSelections || existingProfile.supportAreas) || []
      );
      nextProfile.engagementTypes = normalizedEngagements;
      nextProfile.timeZone = form.timeZone || existingProfile.timeZone || "";
      nextProfile.phoneNumber = form.phoneNumber || existingProfile.phoneNumber || "";
      nextProfile.whatsappNumber =
        form.whatsappNumber || existingProfile.whatsappNumber || "";
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

  return (
    <main className="profile-form-page">
      <section className="profile-form-hero">
        <div>
          <p className="profile-eyebrow">Client profile</p>
          <h1>Tell consultants what you need</h1>
          <p>Keep these details accurate so WICE can match you with the right experts.</p>
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
            <a className="banner-link" href="/client/profile-builder?full=1">
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
              {ORG_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
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
              <div className="engagement-chip-row">
                {ENGAGEMENT_TYPES.map((type) => {
                  const isActive = form.engagementTypes.includes(type);
                  return (
                    <label
                      key={type}
                      className={`engagement-chip ${isActive ? "engagement-chip--active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="visually-hidden"
                        checked={isActive}
                        onChange={() => toggleEngagementType(type)}
                      />
                      <span>{type}</span>
                    </label>
                  );
                })}
              </div>

              <div className="engagement-input-row">
                <input
                  className="input"
                  list="engagement-options"
                  placeholder="Add another engagement type"
                  value={engagementInput}
                  onChange={(e) => setEngagementInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEngagementType();
                    }
                  }}
                />
                <datalist id="engagement-options">
                  {ENGAGEMENT_TYPES.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
                <button type="button" className="ghost-btn" onClick={addEngagementType}>
                  Add
                </button>
              </div>

              {form.engagementTypes.length > 0 && (
                <div className="engagement-chip-row" style={{ marginTop: 10 }}>
                  {form.engagementTypes.map((type) => (
                    <div key={type} className="engagement-chip engagement-chip--active">
                      <span>{type}</span>
                      <button
                        type="button"
                        className="engagement-chip-remove"
                        aria-label={`Remove ${type}`}
                        onClick={() => removeEngagementType(type)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            <select className="input" value={form.timeZone} onChange={change("timeZone")}>
              <option value="">Select a time zone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-col">
            <label className="label">Preferred Contact Method</label>
            <select
              className="input"
              value={form.contactMethod}
              onChange={change("contactMethod")}
            >
              <option value="">Select</option>
              {PREFERED_CONTACT_METHOD.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
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
