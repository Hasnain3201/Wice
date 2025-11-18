// src/Pages/profilebuilder/ClientProfileBuilder2.jsx

import React, { useState, useEffect } from "react";
import "../profileBuilder.css";
import { TIMEZONES } from "../../../data/taxonomy.js";

export default function ClientProfileBuilder2({ onProgress }) {
  const [form, setForm] = useState({
    website: "",
    supportAreas: [],
    engagementTypes: [],
    timezone: "",
    phone: "",
    whatsapp: "",
  });

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addMulti = (field, value) => {
    if (!value.trim()) return;
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field]
        : [...prev[field], value],
    }));
  };

  const removeMulti = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((v) => v !== value),
    }));
  };

  // Static options for searchable dropdowns
  const SUPPORT_OPTIONS = [
    "Program Design",
    "MEL",
    "Grants & Compliance",
    "Project Management",
    "Operations",
    "HR & Recruitment",
    "Business Development",
    "Tech & AI",
    "ESG & Sustainability",
    "Research",
    "Communications",
    "Finance",
    "Other",
  ];

  const ENGAGEMENT_OPTIONS = [
    "Short Term",
    "Long Term",
    "Advisory",
    "Fractional",
  ];

  const allFields = Object.keys(form);

  const filledKeys = allFields.filter((key) => {
    const v = form[key];
    return Array.isArray(v) ? v.length > 0 : v.trim() !== "";
  });

  const filledCount = filledKeys.length;

  const labelMap = {
    website: "Website URL",
    supportAreas: "Support Areas Needed",
    engagementTypes: "Preferred Engagement Types",
    timezone: "Time Zone",
    phone: "Phone Number",
    whatsapp: "Whatsapp",
  };

  const completedLabels = filledKeys.map((k) => labelMap[k]);

  useEffect(() => {
    if (!onProgress) return;
    onProgress({
      filled: filledCount,
      completedLabels,
      values: form,
    });
  }, [form, filledCount, completedLabels, onProgress]);

  return (
    <div className="section">
      <h2>Full Profile</h2>

      <label>Website URL</label>
      <input name="website" value={form.website} onChange={update} />

      {/* ------------------ SUPPORT AREAS (SEARCHABLE MULTI) ------------------ */}
      <label>Support Areas Needed</label>

      <input
        list="support-list"
        placeholder="Search and add…"
        onChange={(e) => addMulti("supportAreas", e.target.value)}
      />

      <datalist id="support-list">
        {SUPPORT_OPTIONS.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>

      {/* Tags */}
      <div className="tags-container">
        {form.supportAreas.map((item) => (
          <span key={item} className="tag">
            {item}
            <button onClick={() => removeMulti("supportAreas", item)}>×</button>
          </span>
        ))}
      </div>

      {/* ------------------ ENGAGEMENT TYPES (SEARCHABLE MULTI) ------------------ */}
      <label>Preferred Engagement Types</label>

      <input
        list="engagement-list"
        placeholder="Search and add…"
        onChange={(e) => addMulti("engagementTypes", e.target.value)}
      />

      <datalist id="engagement-list">
        {ENGAGEMENT_OPTIONS.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>

      {/* Tags */}
      <div className="tags-container">
        {form.engagementTypes.map((item) => (
          <span key={item} className="tag">
            {item}
            <button onClick={() => removeMulti("engagementTypes", item)}>×</button>
          </span>
        ))}
      </div>

      {/* ------------------ TIME ZONE (SEARCHABLE SINGLE) ------------------ */}
      <label>Time Zone</label>
      <input
        list="timezone-list"
        name="timezone"
        value={form.timezone}
        onChange={update}
        placeholder="Search timezone…"
      />

      <datalist id="timezone-list">
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz} />
        ))}
      </datalist>

      {/* ------------------ PHONE + WHATSAPP ------------------ */}
      <label>Phone Number</label>
      <input name="phone" value={form.phone} onChange={update} />

      <label>Whatsapp</label>
      <input name="whatsapp" value={form.whatsapp} onChange={update} />
    </div>
  );
}
