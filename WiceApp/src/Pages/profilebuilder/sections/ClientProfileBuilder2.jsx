// src/Pages/profilebuilder/ClientProfileBuilder2.jsx

import React, { useState, useEffect, useRef } from "react";
import "../profileBuilder.css";

export default function ClientProfileBuilder2({ onProgress, initialValues = {}, registerValidator }) {
  const supportInputRef = useRef(null);
  const engagementInputRef = useRef(null);
  const [form, setForm] = useState({
    website: initialValues.website || "",
    supportAreas: initialValues.supportAreas || [],
    engagementTypes: initialValues.engagementTypes || [],
    phone: initialValues.phone || "",
    whatsapp: initialValues.whatsapp || "",
    contactMethod: initialValues.contactMethod || "",
  });

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addMulti = (field, value, inputRef) => {
    if (!value.trim()) return;
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field]
        : [...prev[field], value],
    }));
    if (inputRef?.current) {
      inputRef.current.value = "";
    }
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

  useEffect(() => {
    setForm({
      website: initialValues.website || "",
      supportAreas: initialValues.supportAreas || [],
      engagementTypes: initialValues.engagementTypes || [],
      phone: initialValues.phone || "",
      whatsapp: initialValues.whatsapp || "",
      contactMethod: initialValues.contactMethod || "",
    });
  }, [
    initialValues.website,
    initialValues.supportAreas,
    initialValues.engagementTypes,
    initialValues.phone,
    initialValues.whatsapp,
    initialValues.contactMethod,
  ]);

  const filledKeys = allFields.filter((key) => {
    const v = form[key];
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim() !== "";
    return Boolean(v);
  });

  const filledCount = filledKeys.length;

  const labelMap = {
    website: "Website URL",
    supportAreas: "Support Areas Needed",
    engagementTypes: "Engagement Types",
    phone: "Phone Number",
    whatsapp: "Whatsapp",
    contactMethod: "Preferred Contact Method",
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

  useEffect(() => {
    if (!registerValidator) return;
    registerValidator(() => {
      const hasWebsite = (form.website || "").trim() !== "";
      const hasSupport = Array.isArray(form.supportAreas) && form.supportAreas.length > 0;
      const hasEngagements =
        Array.isArray(form.engagementTypes) && form.engagementTypes.length > 0;
      const hasPhone = (form.phone || "").trim() !== "";
      const hasWhatsapp = (form.whatsapp || "").trim() !== "";
      const hasContactMethod = (form.contactMethod || "").trim() !== "";
      return (
        hasWebsite &&
        hasSupport &&
        hasEngagements &&
        hasPhone &&
        hasWhatsapp &&
        hasContactMethod
      );
    });
  }, [registerValidator, form]);

  return (
    <div className="section">
      <h2>Full Profile</h2>

      <label>Website URL</label>
      <input name="website" value={form.website} onChange={update} />

      {/* ------------------ SUPPORT AREAS (SEARCHABLE MULTI) ------------------ */}
      <label>Support Areas Needed</label>

      <input
        ref={supportInputRef}
        list="support-list"
        placeholder="Search and add…"
        onChange={(e) => addMulti("supportAreas", e.target.value, supportInputRef)}
      />

      <datalist id="support-list">
        {SUPPORT_OPTIONS.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>

      {/* Tags */}
      <div className="tags-container">
        {form.supportAreas.map((item) => (
          <span key={item} className="pill-chip">
            {item}
            <button onClick={() => removeMulti("supportAreas", item)}>×</button>
          </span>
        ))}
      </div>

      {/* ------------------ ENGAGEMENT TYPES (SEARCHABLE MULTI) ------------------ */}
      <label>Preferred Engagement Types</label>

      <input
        ref={engagementInputRef}
        list="engagement-list"
        placeholder="Search and add…"
        onChange={(e) => addMulti("engagementTypes", e.target.value, engagementInputRef)}
      />

      <datalist id="engagement-list">
        {ENGAGEMENT_OPTIONS.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>

      {/* Tags */}
      <div className="tags-container">
        {form.engagementTypes.map((item) => (
          <span key={item} className="pill-chip">
            {item}
            <button onClick={() => removeMulti("engagementTypes", item)}>×</button>
          </span>
        ))}
      </div>

      <label>Preferred Contact Method</label>
      <select name="contactMethod" value={form.contactMethod} onChange={update}>
        <option value="">Select</option>
        {["Email", "Phone", "WhatsApp"].map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </select>

      <label>Phone Number</label>
      <input name="phone" value={form.phone} onChange={update} />

      <label>Whatsapp</label>
      <input name="whatsapp" value={form.whatsapp} onChange={update} />
    </div>
  );
}
