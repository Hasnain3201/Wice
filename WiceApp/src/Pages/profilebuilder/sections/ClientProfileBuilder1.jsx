// src/Pages/profilebuilder/ClientProfileBuilder1.jsx

import React, { useState, useEffect } from "react";
import "../profileBuilder.css";

export default function ClientProfileBuilder1({ onProgress }) {
  const [form, setForm] = useState({
    fullName: "",
    jobTitle: "",
    workEmail: "",
    orgName: "",
    orgType: "",
    primaryIndustry: "",
    country: "",
    contactMethod: "",
  });

  const required = Object.keys(form);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const filledKeys = required.filter((k) => form[k].trim() !== "");
  const filledCount = filledKeys.length;
  const isComplete = filledCount === required.length;

  const labelMap = {
    fullName: "Full Name",
    jobTitle: "Job Title / Role",
    workEmail: "Work Email",
    orgName: "Organization Name",
    orgType: "Organization Type",
    primaryIndustry: "Primary Industry",
    country: "Country",
    contactMethod: "Contact Method",
  };

  const completedLabels = filledKeys.map((k) => labelMap[k]);

  useEffect(() => {
    if (!onProgress) return;
    onProgress({
      filled: filledCount,
      completedLabels,
      isComplete,
      values: form,
    });
  }, [form, filledCount, completedLabels, isComplete, onProgress]);

  return (
    <div className="section">
      <h2>Light Profile</h2>
      <p>Please complete all required fields (*)</p>

      {required.map((field) => (
        <div key={field}>
          <label>{labelMap[field]} *</label>
          <input
            name={field}
            type="text"
            value={form[field]}
            onChange={update}
            required
          />
        </div>
      ))}
    </div>
  );
}
