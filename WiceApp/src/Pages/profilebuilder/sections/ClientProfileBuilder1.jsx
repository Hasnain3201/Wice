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

  const requiredFields = [
    "fullName",
    "jobTitle",
    "workEmail",
    "orgName",
    "orgType",
    "primaryIndustry",
    "country",
    "contactMethod",
  ];

  const labelByKey = {
    fullName: "Full Name",
    jobTitle: "Job Title / Role",
    workEmail: "Work Email",
    orgName: "Organization Name",
    orgType: "Organization Type",
    primaryIndustry: "Primary Industry",
    country: "Country",
    contactMethod: "Contact Method",
  };

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const filledKeys = requiredFields.filter(
    (f) => form[f].trim() !== ""
  );
  const filledCount = filledKeys.length;

  const isComplete = filledCount === requiredFields.length;

  const completedLabels = filledKeys.map((key) => labelByKey[key]);

  useEffect(() => {
    if (typeof onProgress === "function") {
      onProgress({ filled: filledCount, completedLabels, isComplete });
    }
  }, [filledCount, completedLabels, isComplete, onProgress]);

  return (
    <div className="section">
      <h2>Light Profile</h2>
      <p>Please complete all required fields (*)</p>

      <label>Full Name *</label>
      <input
        name="fullName"
        type="text"
        value={form.fullName}
        onChange={update}
        required
      />

      <label>Job Title / Role *</label>
      <input
        name="jobTitle"
        type="text"
        value={form.jobTitle}
        onChange={update}
        required
      />

      <label>Work Email *</label>
      <input
        name="workEmail"
        type="email"
        value={form.workEmail}
        onChange={update}
        required
      />

      <label>Organization Name *</label>
      <input
        name="orgName"
        type="text"
        value={form.orgName}
        onChange={update}
        required
      />

      <label>Organization Type *</label>
      <input
        name="orgType"
        type="text"
        value={form.orgType}
        onChange={update}
        required
      />

      <label>Primary Industry *</label>
      <input
        name="primaryIndustry"
        type="text"
        value={form.primaryIndustry}
        onChange={update}
        required
      />

      <label>Country *</label>
      <input
        name="country"
        type="text"
        value={form.country}
        onChange={update}
        required
      />

      <label>Contact Method *</label>
      <input
        name="contactMethod"
        type="text"
        value={form.contactMethod}
        onChange={update}
        required
      />
    </div>
  );
}
