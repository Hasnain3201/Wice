// src/Pages/profilebuilder/ClientProfileBuilder1.jsx

import React, { useState, useEffect } from "react";
import "../profileBuilder.css";
import {
  INDUSTRY_SECTORS,
  GEOGRAPHIC_EXPERIENCE,
  PREFERED_CONTACT_METHOD,
} from "../../../data/taxonomy.js";

export default function ClientProfileBuilder1({ onProgress, initialValues = {} }) {
  const [form, setForm] = useState({
    fullName: initialValues.fullName || "",
    jobTitle: initialValues.jobTitle || "",
    workEmail: initialValues.workEmail || "",
    orgName: initialValues.orgName || "",
    orgType: initialValues.orgType || "",
    primaryIndustry: initialValues.primaryIndustry || "",
    sector: initialValues.sector || "",
    country: initialValues.country || "",
    contactMethod: initialValues.contactMethod || "", // now “Preferred Contact Method”
  });

  // Build taxonomy lists
  const industries = Object.keys(INDUSTRY_SECTORS);

  const sectors =
    form.primaryIndustry && INDUSTRY_SECTORS[form.primaryIndustry]
      ? Object.keys(INDUSTRY_SECTORS[form.primaryIndustry])
      : [];

  const allCountries = Object.values(GEOGRAPHIC_EXPERIENCE).flat();

  const required = Object.keys(form);
  useEffect(() => {
    setForm({
      fullName: initialValues.fullName || "",
      jobTitle: initialValues.jobTitle || "",
      workEmail: initialValues.workEmail || "",
      orgName: initialValues.orgName || "",
      orgType: initialValues.orgType || "",
      primaryIndustry: initialValues.primaryIndustry || "",
      sector: initialValues.sector || "",
      country: initialValues.country || "",
      contactMethod: initialValues.contactMethod || "",
    });
  }, [
    initialValues.fullName,
    initialValues.jobTitle,
    initialValues.workEmail,
    initialValues.orgName,
    initialValues.orgType,
    initialValues.primaryIndustry,
    initialValues.sector,
    initialValues.country,
    initialValues.contactMethod,
  ]);

  const update = (e) => {
    const { name, value } = e.target;

    // Reset sector if industry changes
    if (name === "primaryIndustry") {
      setForm((prev) => ({
        ...prev,
        primaryIndustry: value,
        sector: "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const filledKeys = required.filter((k) => (form[k] || "").trim() !== "");
  const filledCount = filledKeys.length;
  const isComplete = filledCount === required.length;

  const labelMap = {
    fullName: "Full Name",
    jobTitle: "Job Title / Role",
    workEmail: "Work Email",
    orgName: "Organization Name",
    orgType: "Organization Type",
    primaryIndustry: "Primary Industry",
    sector: "Sector (Subsector)",
    country: "Country",
    contactMethod: "Preferred Contact Method", // updated label
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

      {/* Standard text inputs */}
      {["fullName", "jobTitle", "workEmail", "orgName", "orgType"].map((field) => (
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

      {/* Industry */}
      <div>
        <label>Primary Industry *</label>
        <input
          list="industry-list"
          name="primaryIndustry"
          value={form.primaryIndustry}
          onChange={update}
          required
        />
        <datalist id="industry-list">
          {industries.map((ind) => (
            <option key={ind} value={ind} />
          ))}
        </datalist>
      </div>

      {/* Sector */}
      {form.primaryIndustry && (
        <div>
          <label>Sector (Subsector) *</label>
          <input
            list="sector-list"
            name="sector"
            value={form.sector}
            onChange={update}
            required
          />
          <datalist id="sector-list">
            {sectors.map((sec) => (
              <option key={sec} value={sec} />
            ))}
          </datalist>
        </div>
      )}

      {/* Country */}
      <div>
        <label>Country *</label>
        <input
          list="country-list"
          name="country"
          value={form.country}
          onChange={update}
          required
        />
        <datalist id="country-list">
          {allCountries.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {/* Preferred Contact Method */}
      <div>
        <label>Preferred Contact Method *</label>
        <input
          list="contact-list"
          name="contactMethod"
          value={form.contactMethod}
          onChange={update}
          required
        />
        <datalist id="contact-list">
          {PREFERED_CONTACT_METHOD.map((method) => (
            <option key={method} value={method} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
