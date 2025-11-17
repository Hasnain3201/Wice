// src/Pages/profilebuilder/ClientProfileBuilder2.jsx

import React, { useState, useEffect } from "react";
import "../profileBuilder.css";

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

  const toggleMulti = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const allFields = Object.keys(form);

  const filledKeys = allFields.filter((key) => {
    const v = form[key];
    return Array.isArray(v) ? v.length > 0 : v.trim() !== "";
  });

  const filledCount = filledKeys.length;

  const labelMap = {
    website: "Website URL",
    supportAreas: "Support Areas Needed",
    engagementTypes: "Engagement Types",
    timezone: "Time Zone",
    phone: "Phone Number",
    whatsapp: "Whatsapp",
  };

  const completedLabels = filledKeys.map((k) => labelMap[k]);

  useEffect(() => {
    onProgress &&
      onProgress({
        filled: filledCount,
        completedLabels,
        values: form, // ⭐ pass values up
      });
  }, [form]);

  return (
    <div className="section">
      <h2>Full Profile</h2>

      <label>Website URL</label>
      <input name="website" value={form.website} onChange={update} />

      <label>Support Areas Needed</label>
      <div className="multi-select">
        {[
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
        ].map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={form.supportAreas.includes(item)}
              onChange={() => toggleMulti("supportAreas", item)}
            />
            {item}
          </label>
        ))}
      </div>

      <label>Preferred Engagement Types</label>
      <div className="multi-select">
        {["Short Term", "Long Term", "Advisory", "Fractional"].map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={form.engagementTypes.includes(item)}
              onChange={() => toggleMulti("engagementTypes", item)}
            />
            {item}
          </label>
        ))}
      </div>

      <label>Time Zone</label>
      <input name="timezone" value={form.timezone} onChange={update} />

      <label>Phone Number</label>
      <input name="phone" value={form.phone} onChange={update} />

      <label>Whatsapp</label>
      <input name="whatsapp" value={form.whatsapp} onChange={update} />
    </div>
  );
}
