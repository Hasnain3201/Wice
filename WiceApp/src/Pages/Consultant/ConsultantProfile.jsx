import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import ISO6391 from "iso-639-1";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../context/AuthContext.jsx";
import { auth, storage } from "../../firebase";
import { saveUserProfile } from "../../services/userProfile.js";
import skillsData from "../../data/skillsData.js";

/* ----------------- constants ----------------- */

const MAX_ABOUT = 300;
const MAX_ONELINER = 120;

// industries + sectors (same as your ExpertiseSnapshot)
const INDUSTRY_OPTIONS = [
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "technology", label: "Technology" },
  { value: "education", label: "Education" },
];

const SECTORS_BY_INDUSTRY = {
  healthcare: [
    { value: "public_health", label: "Public Health" },
    { value: "pharma", label: "Pharmaceuticals" },
    { value: "medical_devices", label: "Medical Devices" },
  ],
  finance: [
    { value: "banking", label: "Banking" },
    { value: "investment", label: "Investment Management" },
    { value: "insurance", label: "Insurance" },
  ],
  technology: [
    { value: "software", label: "Software Development" },
    { value: "cybersecurity", label: "Cybersecurity" },
    { value: "ai", label: "Artificial Intelligence" },
  ],
  education: [
    { value: "higher_ed", label: "Higher Education" },
    { value: "edtech", label: "EdTech" },
  ],
};

// regions (from ExperienceSnapshot)
const REGION_OPTIONS = [
  { value: "Africa", label: "Africa" },
  { value: "Asia", label: "Asia" },
  { value: "Europe", label: "Europe" },
  { value: "North America", label: "North America" },
  { value: "South America", label: "South America" },
  { value: "Oceania", label: "Oceania" },
];

// donor experience options
const DONOR_OPTIONS = [
  { value: "usaid", label: "USAID" },
  { value: "world_bank", label: "World Bank" },
  { value: "undp", label: "UNDP" },
  { value: "unicef", label: "UNICEF" },
  { value: "gates_foundation", label: "Gates Foundation" },
  { value: "dfid", label: "DFID (UK)" },
  { value: "who", label: "WHO" },
];

// skills from skillsData.js
const SKILL_OPTIONS = skillsData.map((s) => ({ value: s, label: s }));

// pronouns & timezone & degree (single-select, tag-style)
const PRONOUN_OPTIONS = [
  { value: "she_her", label: "She / Her" },
  { value: "he_him", label: "He / Him" },
  { value: "they_them", label: "They / Them" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const TIMEZONE_OPTIONS = [
  { value: "EST", label: "EST" },
  { value: "PST", label: "PST" },
  { value: "CST", label: "CST" },
  { value: "MST", label: "MST" },
];

const DEGREE_OPTIONS = [
  { value: "bachelors", label: "Bachelor’s" },
  { value: "masters", label: "Master’s" },
  { value: "phd", label: "PhD" },
];

export default function ConsultantProfile() {
  const { user, profile, refreshProfile, loading } = useAuth();

  // simple text / boolean fields
  const [form, setForm] = useState({
    fullName: "",
    title: "",
    email: "",
    location: "",
    about: "",
    oneLinerBio: "",
    timeZone: "",
    pronouns: "",
    totalYearsExperience: "",
    linkedinUrl: "",
    dailyRate: "",
    availability: "",
    openToTravel: false,
    highestDegree: "",
    institution: "",
    resumeFile: "", // URL
  });

  // arrays / selects
  const [selectedPronouns, setSelectedPronouns] = useState(null);
  const [selectedTimeZone, setSelectedTimeZone] = useState(null);
  const [selectedDegree, setSelectedDegree] = useState(null);

  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedSectorsByIndustry, setSelectedSectorsByIndustry] = useState({});
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedDonors, setSelectedDonors] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [additionalFiles, setAdditionalFiles] = useState([]); // array of URLs

  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isConsultant = useMemo(
    () => profile?.accountType === "consultant",
    [profile?.accountType]
  );

  const languageOptions = useMemo(
    () =>
      ISO6391.getAllNames().map((name) => ({
        value: name.toLowerCase(),
        label: name,
      })),
    []
  );

  /* ---------- hydrate from Firestore ---------- */

  useEffect(() => {
    if (!profile || !user) return;

    const profileMap = profile.profile || {};

    // industries: nested structure or legacy strings
    let industriesFromDb = profileMap.industries || [];
    if (
      Array.isArray(industriesFromDb) &&
      industriesFromDb.length > 0 &&
      typeof industriesFromDb[0] === "string"
    ) {
      industriesFromDb = industriesFromDb.map((val) => ({
        industry: val,
        sectors: [],
      }));
    }

    const nextIndustries = [];
    const nextSectorsByIndustry = {};

    industriesFromDb.forEach((item) => {
      const indOpt = INDUSTRY_OPTIONS.find((opt) => opt.value === item.industry);
      if (!indOpt) return;
      nextIndustries.push(indOpt);

      const sectorVals = item.sectors || [];
      const optionsForIndustry = SECTORS_BY_INDUSTRY[item.industry] || [];
      const sectorOpts = optionsForIndustry.filter((opt) =>
        sectorVals.includes(opt.value)
      );
      if (sectorOpts.length) {
        nextSectorsByIndustry[item.industry] = sectorOpts;
      }
    });

    // languages
    const langsFromDb = profileMap.languages || [];
    const nextLanguages = (langsFromDb || []).map((lng) => {
      const match =
        languageOptions.find(
          (opt) =>
            opt.label.toLowerCase() === String(lng).toLowerCase() ||
            opt.value === String(lng).toLowerCase()
        ) || null;
      return (
        match || {
          value: String(lng).toLowerCase(),
          label: String(lng),
        }
      );
    });

    // regions
    const regionsFromDb = profileMap.regions || [];
    const nextRegions = REGION_OPTIONS.filter((opt) =>
      regionsFromDb.includes(opt.value)
    );

    // donors
    const donorsFromDb = profileMap.donorExperience || [];
    const nextDonors = DONOR_OPTIONS.filter((opt) =>
      donorsFromDb.includes(opt.value)
    );

    // skills
    const skillsFromDb = profileMap.skills || [];
    const nextSkills = SKILL_OPTIONS.filter((opt) =>
      skillsFromDb.includes(opt.label)
    );

    // pronouns
    const pronounValue = profileMap.pronouns || "";
    const pronounOpt =
      PRONOUN_OPTIONS.find((o) => o.label === pronounValue) || null;

    // time zone
    const tzValue = profileMap.timeZone || "";
    const tzOpt =
      TIMEZONE_OPTIONS.find((o) => o.value === tzValue || o.label === tzValue) ||
      null;

    // degree
    const degreeValue = profileMap.highestDegree || "";
    const degreeOpt =
      DEGREE_OPTIONS.find((o) => o.label === degreeValue) || null;

    // additional files (array of URLs or strings)
    const additionalFromDb = profileMap.additionalFiles || [];

    setForm({
      fullName: profile.fullName || user.displayName || "",
      title: profile.title || "",
      email: user.email || profile.email || "",
      location: profile.location || "",
      about: profileMap.about || "",
      oneLinerBio: profileMap.oneLinerBio || "",
      timeZone: tzOpt?.value || "",
      pronouns: pronounOpt?.label || "",
      totalYearsExperience: profileMap.totalYearsExperience || "",
      linkedinUrl: profileMap.linkedinUrl || "",
      dailyRate: profileMap.dailyRate || "",
      availability: profileMap.availability || "",
      openToTravel: !!profileMap.openToTravel,
      highestDegree: degreeOpt?.label || "",
      institution: profileMap.institution || "",
      resumeFile: profileMap.resumeFile || "",
    });

    setSelectedPronouns(pronounOpt);
    setSelectedTimeZone(tzOpt);
    setSelectedDegree(degreeOpt);
    setSelectedIndustries(nextIndustries);
    setSelectedSectorsByIndustry(nextSectorsByIndustry);
    setSelectedLanguages(nextLanguages);
    setSelectedRegions(nextRegions);
    setSelectedDonors(nextDonors);
    setSelectedSkills(nextSkills);
    setAdditionalFiles(
      Array.isArray(additionalFromDb) ? additionalFromDb : []
    );
  }, [profile, user, languageOptions]);

  /* ------------- field handlers ------------- */

  const handleFieldChange = (key) => (event) => {
    const value =
      event && event.target && event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLimitedFieldChange = (key, max) => (event) => {
    const value = event.target.value.slice(0, max);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePronounsChange = (option) => {
    setSelectedPronouns(option);
    setForm((prev) => ({ ...prev, pronouns: option ? option.label : "" }));
  };

  const handleTimeZoneChange = (option) => {
    setSelectedTimeZone(option);
    setForm((prev) => ({ ...prev, timeZone: option ? option.value : "" }));
  };

  const handleDegreeChange = (option) => {
    setSelectedDegree(option);
    setForm((prev) => ({
      ...prev,
      highestDegree: option ? option.label : "",
    }));
  };

  // industries (limit 3) + sectors
  const handleIndustriesChange = (selected) => {
    const limited = (selected || []).slice(0, 3);
    setSelectedIndustries(limited);
    setSelectedSectorsByIndustry((prev) => {
      const next = {};
      limited.forEach((ind) => {
        const key = ind.value;
        const existing = prev[key] || [];
        const allowedOptions = SECTORS_BY_INDUSTRY[key] || [];
        next[key] = existing.filter((sec) =>
          allowedOptions.some((opt) => opt.value === sec.value)
        );
      });
      return next;
    });
  };

  const handleSectorsChange = (industryValue) => (selected) => {
    setSelectedSectorsByIndustry((prev) => ({
      ...prev,
      [industryValue]: selected || [],
    }));
  };

  /* ------------- upload handlers (Storage) ------------- */

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploadingResume(true);
    setError("");
    try {
      const storageRef = ref(
        storage,
        `users/${user.uid}/resume/${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, resumeFile: url }));
    } catch (err) {
      console.error("Resume upload failed:", err);
      setError("Unable to upload resume right now.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleAdditionalFilesUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !user) return;
    setUploadingAdditional(true);
    setError("");
    try {
      const urls = [];
      for (const file of files) {
        const storageRef = ref(
          storage,
          `users/${user.uid}/additional/${file.name}`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      }
      setAdditionalFiles((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error("Additional files upload failed:", err);
      setError("Unable to upload files right now.");
    } finally {
      setUploadingAdditional(false);
      // allow re-selecting the same file name
      event.target.value = "";
    }
  };

  const handleRemoveAdditionalFile = (urlToRemove) => {
    setAdditionalFiles((prev) => prev.filter((url) => url !== urlToRemove));
  };

  /* ------------- submit/save ------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    if (!user) {
      setError("You must be signed in to update your profile.");
      setSaving(false);
      return;
    }

    const existingProfileMap = profile?.profile || {};

    const industriesPayload = selectedIndustries.map((ind) => ({
      industry: ind.value,
      sectors: (selectedSectorsByIndustry[ind.value] || []).map(
        (sec) => sec.value
      ),
    }));

    const profilePayload = {
      ...existingProfileMap,
      about: form.about,
      oneLinerBio: form.oneLinerBio,
      pronouns: form.pronouns,
      timeZone: form.timeZone,
      totalYearsExperience: form.totalYearsExperience,
      linkedinUrl: form.linkedinUrl,
      dailyRate: form.dailyRate,
      availability: form.availability,
      openToTravel: !!form.openToTravel,
      highestDegree: form.highestDegree,
      institution: form.institution,
      resumeFile: form.resumeFile || null,
      additionalFiles: additionalFiles,
      industries: industriesPayload,
      languages: selectedLanguages.map((l) => l.label),
      regions: selectedRegions.map((r) => r.value),
      donorExperience: selectedDonors.map((d) => d.value),
      skills: selectedSkills.map((s) => s.label),
    };

    try {
      await saveUserProfile(user.uid, {
        fullName: form.fullName,
        title: form.title,
        location: form.location,
        profile: profilePayload,
      });

      if (auth.currentUser && form.fullName) {
        await updateAuthProfile(auth.currentUser, {
          displayName: form.fullName,
        });
      }

      await refreshProfile();
      setMessage("Profile saved.");
    } catch (err) {
      console.error("Consultant profile save failed:", err);
      setError(
        err?.message ||
        "Unable to save your profile right now. Try again later."
      );
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  /* ------------- render guards ------------- */

  if ((!user || !isConsultant) && !loading) {
    return (
      <main className="shell">
        <h1 className="dashboard-title">Consultant Profile</h1>
        <p className="subtitle" style={{ marginTop: 8 }}>
          Sign in with a consultant account to manage your profile.
        </p>
      </main>
    );
  }

  const aboutChars = form.about.length;
  const oneLinerChars = form.oneLinerBio.length;

  /* ------------- render ------------- */

  return (
    <main className="shell">
      <h1 className="dashboard-title">Your Profile</h1>
      <p className="subtitle" style={{ marginTop: 8 }}>
        Update your consultant details so clients can understand your expertise.
      </p>

      <form className="settings" onSubmit={handleSubmit}>
        {/* ABOUT at top with counter */}
        <div className="settings-full">
          <label className="label">About</label>
          <textarea
            className="input"
            rows={5}
            style={{ width: "100%" }}
            value={form.about}
            onChange={handleLimitedFieldChange("about", MAX_ABOUT)}
            placeholder="Write a short summary about your expertise..."
          />
          <div className="label helper" style={{ marginTop: 4 }}>
            {aboutChars}/{MAX_ABOUT} characters
          </div>
        </div>

        {/* ONE-LINER + LINKEDIN */}
        <div className="settings-row">
          <div className="settings-col">
            <label className="label">One-liner Bio</label>
            <input
              className="input"
              value={form.oneLinerBio}
              onChange={handleLimitedFieldChange("oneLinerBio", MAX_ONELINER)}
              placeholder="Energy transition specialist with 10+ years experience…"
            />
            <div className="label helper">
              {oneLinerChars}/{MAX_ONELINER} characters
            </div>
          </div>

          <div className="settings-col">
            <label className="label">LinkedIn URL</label>
            <input
              className="input"
              value={form.linkedinUrl}
              onChange={handleFieldChange("linkedinUrl")}
              placeholder="https://www.linkedin.com/in/…"
            />
          </div>
        </div>

        {/* BASICS: NAME, TITLE, EMAIL, LOCATION */}
        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.fullName}
              onChange={handleFieldChange("fullName")}
              required
            />
          </div>

          <div className="settings-col">
            <label className="label">Role / Title</label>
            <input
              className="input"
              value={form.title}
              onChange={handleFieldChange("title")}
              placeholder="Senior Climate Consultant"
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              readOnly
              disabled
              title="Email updates will be supported soon."
            />
          </div>

          <div className="settings-col">
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={handleFieldChange("location")}
              placeholder="Remote, USA"
            />
          </div>
        </div>

        {/* PRONOUNS / TIMEZONE (tag style single select) */}
        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Pronouns</label>
            <Select
              value={selectedPronouns}
              onChange={handlePronounsChange}
              options={PRONOUN_OPTIONS}
              isClearable
              placeholder="Select pronouns"
            />
          </div>

          <div className="settings-col">
            <label className="label">Time Zone</label>
            <Select
              value={selectedTimeZone}
              onChange={handleTimeZoneChange}
              options={TIMEZONE_OPTIONS}
              isClearable
              placeholder="Select time zone"
            />
          </div>
        </div>

        {/* EXPERIENCE SNAPSHOT */}
        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Total Years of Experience</label>
            <input
              className="input"
              value={form.totalYearsExperience}
              onChange={handleFieldChange("totalYearsExperience")}
              placeholder="10+"
            />
          </div>

          <div className="settings-col">
            <label className="label">Daily Rate</label>
            <input
              className="input"
              value={form.dailyRate}
              onChange={handleFieldChange("dailyRate")}
              placeholder="$1200 / day"
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Availability</label>
            <input
              className="input"
              value={form.availability}
              onChange={handleFieldChange("availability")}
              placeholder="10–15 hours/week, evenings only…"
            />
          </div>

          <div className="settings-col">
            <label className="label">
              <input
                type="checkbox"
                checked={form.openToTravel}
                onChange={handleFieldChange("openToTravel")}
                style={{ marginRight: 8 }}
              />
              Open to travel
            </label>
          </div>
        </div>

        {/* EDUCATION */}
        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Highest Degree</label>
            <Select
              value={selectedDegree}
              onChange={handleDegreeChange}
              options={DEGREE_OPTIONS}
              isClearable
              placeholder="Select degree"
            />
          </div>

          <div className="settings-col">
            <label className="label">Institution</label>
            <input
              className="input"
              value={form.institution}
              onChange={handleFieldChange("institution")}
              placeholder="Harvard University"
            />
          </div>
        </div>

        {/* INDUSTRIES & SECTORS */}
        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Industries (max 3)</label>
            <Select
              isMulti
              options={INDUSTRY_OPTIONS}
              value={selectedIndustries}
              onChange={handleIndustriesChange}
              placeholder="Select up to 3 industries"
            />
            {selectedIndustries.length >= 3 && (
              <p className="hint-error">
                You can select up to 3 industries only.
              </p>
            )}
          </div>
        </div>

        {selectedIndustries.map((ind) => (
          <div className="settings-row" key={ind.value}>
            <div className="settings-col">
              <label className="label">Sectors – {ind.label}</label>
              <Select
                isMulti
                options={SECTORS_BY_INDUSTRY[ind.value] || []}
                value={selectedSectorsByIndustry[ind.value] || []}
                onChange={handleSectorsChange(ind.value)}
                placeholder="Select sectors for this industry"
              />
            </div>
          </div>
        ))}

        {/* LANGUAGES / REGIONS / DONORS / SKILLS */}
        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Languages</label>
            <Select
              isMulti
              isSearchable
              options={languageOptions}
              value={selectedLanguages}
              onChange={setSelectedLanguages}
              placeholder="Select languages"
            />
          </div>

          <div className="settings-col">
            <label className="label">Regions</label>
            <Select
              isMulti
              options={REGION_OPTIONS}
              value={selectedRegions}
              onChange={setSelectedRegions}
              placeholder="Select regions"
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Donor Experience</label>
            <Select
              isMulti
              options={DONOR_OPTIONS}
              value={selectedDonors}
              onChange={setSelectedDonors}
              placeholder="Select donor organizations"
            />
          </div>

          <div className="settings-col">
            <label className="label">Skills</label>
            <Select
              isMulti
              options={SKILL_OPTIONS}
              value={selectedSkills}
              onChange={setSelectedSkills}
              placeholder="Select skills"
            />
          </div>
        </div>

        {/* FILES: RESUME + ADDITIONAL */}
        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Resume</label>
            <div className="file-upload-row">
              <label className="ghost-btn" htmlFor="resume-upload-input">
                {uploadingResume ? "Uploading…" : "Upload Resume"}
              </label>
              <input
                id="resume-upload-input"
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={handleResumeUpload}
              />
              {form.resumeFile && (
                <a
                  href={form.resumeFile}
                  target="_blank"
                  rel="noreferrer"
                  className="link"
                  style={{ marginLeft: 12 }}
                >
                  View current resume
                </a>
              )}
            </div>
          </div>

          <div className="settings-col">
            <label className="label">Additional Files</label>
            <div className="file-upload-row">
              <label
                className="ghost-btn"
                htmlFor="additional-files-upload-input"
              >
                {uploadingAdditional ? "Uploading…" : "Upload Files"}
              </label>
              <input
                id="additional-files-upload-input"
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleAdditionalFilesUpload}
              />
            </div>
            {additionalFiles.length > 0 && (
              <ul className="file-list">
                {additionalFiles.map((url) => {
                  const name = url.split("?")[0].split("/").pop();
                  return (
                    <li key={url} className="file-list-item">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="link"
                      >
                        {name}
                      </a>
                      <button
                        type="button"
                        className="ghost-btn"
                        style={{ marginLeft: 8 }}
                        onClick={() => handleRemoveAdditionalFile(url)}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="settings-actions">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {message ? <span className="hint-ok">{message}</span> : null}
          {error ? <span className="hint-error">{error}</span> : null}
        </div>
      </form>
    </main>
  );
}
