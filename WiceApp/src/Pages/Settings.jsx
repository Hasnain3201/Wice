import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import "./Settings.css";
import { useAuth } from "../context/AuthContext.jsx";

/** ---- Field catalog & labels ---- */
const LABELS = {
  projectMilestones: "Project Milestones",
  projectMemberUpdates: "Project Member Updates",
  bookingUpdates: "Booking Updates",
  pendingPayments: "Pending Payments",
  paidPayments: "Paid Payments",
  consultantApprovals: "Consultant Approvals",
  calendarReminders: "Calendar Reminders",
  newOpportunities: "New Opportunities",
  newGrantsAvailable: "New Grants Available",
};

const CLIENT_FIELDS = [
  "projectMilestones",
  "projectMemberUpdates",
  "bookingUpdates",
  "pendingPayments",
  "paidPayments",
  "consultantApprovals",
  "calendarReminders",
];

const CONSULTANT_FIELDS = [
  ...CLIENT_FIELDS,
  "newOpportunities",
  "newGrantsAvailable",
];

/** Merge saved settings with the current field list so new fields appear (default false)
 * without losing anything previously saved.
 */
function mergeWithCurrentFields(savedObj = {}, fieldList) {
  const merged = { ...savedObj };
  fieldList.forEach((k) => {
    if (typeof merged[k] !== "boolean") merged[k] = false;
  });
  // If old keys exist that are no longer in fieldList, keep them (non-destructive)
  return merged;
}
export default function Settings() {
  const { user, role, profile } = useAuth(); // role should be "client" or "consultant"
  const [openSection, setOpenSection] = useState(null);

  // Which fields to show based on role
  const portalFields = useMemo(
    () => (role === "consultant" ? CONSULTANT_FIELDS : CLIENT_FIELDS),
    [role]
  );
  // Email == same as portal for both roles
  const emailFields = portalFields;

  // Settings state is keyed by section name, then by field key
  const [settings, setSettings] = useState({
    portal: Object.fromEntries(portalFields.map((k) => [k, false])),
    email: Object.fromEntries(emailFields.map((k) => [k, false])),
  });

  const storageKey = user ? `settings_${user.email}` : null;

  // Load saved + shape to current fields
  useEffect(() => {
    if (!storageKey) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      // Initialize clean with current fields
      setSettings({
        portal: Object.fromEntries(portalFields.map((k) => [k, false])),
        email: Object.fromEntries(emailFields.map((k) => [k, false])),
      });
      return;
    }
    try {
      const saved = JSON.parse(raw);
      setSettings({
        portal: mergeWithCurrentFields(saved.portal, portalFields),
        email: mergeWithCurrentFields(saved.email, emailFields),
      });
    } catch {
      // Fallback if JSON is corrupted
      setSettings({
        portal: Object.fromEntries(portalFields.map((k) => [k, false])),
        email: Object.fromEntries(emailFields.map((k) => [k, false])),
      });
    }
  }, [storageKey, portalFields, emailFields]);

  // Persist
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [settings, storageKey]);

  const toggleSection = (sec) =>
    setOpenSection((prev) => (prev === sec ? null : sec));

  const flip = (section, key) =>
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: !prev[section][key] },
    }));

  if (!user) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-card">
          <h1 className="dashboard-title" style={{ fontSize: "1.9rem" }}>Settings</h1>
          <p>Please log in to view your personalized settings.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          {profile?.fullName || user?.displayName
            ? `${profile?.fullName || user?.displayName}'s Settings`
            : user?.email
            ? `${user.email}'s Settings`
            : "Settings"}
        </h1>
        <p className="dashboard-subtitle">
          Manage the alerts you receive inside Wice and by email.
        </p>
      </header>

      <div className="dashboard-card settings-card settings-card--wide">

        {/* PORTAL NOTIFICATIONS */}
        <section className="settings-section">
          <button
            className="settings-section__header"
            onClick={() => toggleSection("portal")}
            aria-expanded={openSection === "portal"}
          >
            <span>Portal Notification Settings</span>
            {openSection === "portal" ? <ChevronUp /> : <ChevronDown />}
          </button>
          <p className="settings-section__desc">
            These control alerts shown inside the Wice portal (while you’re logged in).
            Unchecking an item means you won’t see those in-portal updates.
          </p>
          <div
            className={`settings-section__body ${
              openSection === "portal" ? "is-open" : ""
            }`}
          >
            {portalFields.map((key) => (
              <label key={`portal-${key}`}>
                <input
                  type="checkbox"
                  checked={!!settings.portal[key]}
                  onChange={() => flip("portal", key)}
                />
                {LABELS[key] || key}
              </label>
            ))}
          </div>
        </section>

        {/* EMAIL SETTINGS */}
        <section className="settings-section">
          <button
            className="settings-section__header"
            onClick={() => toggleSection("email")}
            aria-expanded={openSection === "email"}
          >
            <span>Email Settings</span>
            {openSection === "email" ? <ChevronUp /> : <ChevronDown />}
          </button>
          <p className="settings-section__desc">
            Choose which updates Wice should email you. Unchecking an item
            means you won’t receive those messages in your inbox.
          </p>
          <div
            className={`settings-section__body ${
              openSection === "email" ? "is-open" : ""
            }`}
          >
            {emailFields.map((key) => (
              <label key={`email-${key}`}>
                <input
                  type="checkbox"
                  checked={!!settings.email[key]}
                  onChange={() => flip("email", key)}
                />
                {LABELS[key] || key}
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
