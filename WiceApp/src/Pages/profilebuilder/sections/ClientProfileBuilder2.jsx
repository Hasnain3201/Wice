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
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((x) => x !== value)
          : [...arr, value],
      };
    });
  };

  const fullFields = [
    "website",
    "supportAreas",
    "engagementTypes",
    "timezone",
    "phone",
    "whatsapp",
  ];

  const labelByKey = {
    website: "Website URL",
    supportAreas: "Support Areas Needed",
    engagementTypes: "Engagement Types",
    timezone: "Time Zone",
    phone: "Phone Number",
    whatsapp: "Whatsapp",
  };

  const filledKeys = fullFields.filter((field) => {
    const value = form[field];
    if (Array.isArray(value)) return value.length > 0;
    return value.trim() !== "";
  });

  const filledCount = filledKeys.length;
  const completedLabels = filledKeys.map((key) => labelByKey[key]);

  useEffect(() => {
    if (typeof onProgress === "function") {
      onProgress({ filled: filledCount, completedLabels });
    }
  }, [filledCount, completedLabels, onProgress]);

  return (
    <div className="section">
      <h2>Full Profile</h2>
      <p>These fields are optional but helpful.</p>

      {/* Website */}
      <label>Website URL</label>
      <input
        name="website"
        type="text"
        placeholder="https://"
        value={form.website}
        onChange={update}
      />

      {/* Support Needed */}
      <label>Main Areas of Support Needed</label>
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

      {/* Engagement Types */}
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

      {/* Time Zone */}
      <label>Time Zone</label>
      <input
        name="timezone"
        type="text"
        placeholder="e.g. GMT+1"
        value={form.timezone}
        onChange={update}
      />

      {/* Phone */}
      <label>Phone Number</label>
      <input
        name="phone"
        type="text"
        placeholder="Optional"
        value={form.phone}
        onChange={update}
      />

      {/* Whatsapp */}
      <label>Whatsapp</label>
      <input
        name="whatsapp"
        type="text"
        placeholder="Optional"
        value={form.whatsapp}
        onChange={update}
      />
    </div>
  );
}
