import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import ISO6391 from "iso-639-1";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "../../context/AuthContext.jsx";
import { auth, storage } from "../../firebase";
import { saveUserProfile } from "../../services/userProfile.js";
import skillsData from "../../data/skillsData.js";
import {
  INDUSTRY_SECTORS,
  TIMEZONES,
  GEOGRAPHIC_EXPERIENCE,
  DONOR_EXPERIENCE as DONOR_TAXONOMY,
} from "../../data/taxonomy.js";
import "./ConsultantProfile.css";

/* ----------------- constants ----------------- */

const MAX_ABOUT = 300;
const MAX_ONELINER = 120;

// industries + sectors (same as your ExpertiseSnapshot)
const INDUSTRY_OPTIONS = Object.keys(INDUSTRY_SECTORS).map((industry) => ({
  value: industry,
  label: industry,
}));

const SECTOR_OPTIONS = Object.fromEntries(
  Object.entries(INDUSTRY_SECTORS).map(([industry, sectorMap]) => [
    industry,
    Object.keys(sectorMap || {}).map((sector) => ({
      value: sector,
      label: sector,
    })),
  ])
);

// regions (from ExperienceSnapshot)
const REGION_OPTIONS = Object.keys(GEOGRAPHIC_EXPERIENCE).map((region) => ({
  value: region,
  label: region,
}));

// donor experience options
const DONOR_OPTIONS = DONOR_TAXONOMY.map((donor) => ({
  value: donor,
  label: donor,
}));

// skills from skillsData.js
const SKILL_OPTIONS = skillsData.map((s) => ({ value: s, label: s }));

// pronouns & timezone & degree (single-select, tag-style)
const PRONOUN_OPTIONS = [
  { value: "she_her", label: "She / Her" },
  { value: "he_him", label: "He / Him" },
  { value: "they_them", label: "They / Them" },
  { value: "prefer_not_say", label: "Prefer not to say" },
  { value: "self_describe", label: "Self describe" },
];

const TIMEZONE_OPTIONS = TIMEZONES.map((zone) => ({
  value: zone,
  label: zone,
}));

const DEGREE_OPTIONS = [
  { value: "bachelors", label: "Bachelor’s" },
  { value: "masters", label: "Master’s" },
  { value: "phd", label: "PhD" },
];

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];

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
    openToTravel: false,
    highestDegree: "",
    institution: "",
    resumeFile: "", // URL
    resumeFileName: "",
    resumeStoragePath: "",
    currency: "USD",
    availabilityStatus: "",
    availabilityNote: "",
    customPronouns: "",
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

  const [additionalFiles, setAdditionalFiles] = useState([]); // [{ name, url, path }]

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

  const donorOptions = useMemo(() => {
    const extras = selectedDonors.filter(
      (selected) =>
        !DONOR_OPTIONS.some((opt) => opt.value === selected.value)
    );
    if (extras.length === 0) return DONOR_OPTIONS;
    return [...DONOR_OPTIONS, ...extras];
  }, [selectedDonors]);

  const hasFullProfile = useMemo(() => {
    const details = profile?.profile || {};
    if (profile?.phaseFullCompleted) return true;
    return Boolean(
      details.experienceRegions?.length ||
        details.functionalExpertise?.length ||
        details.highestDegree ||
        details.resumeFile ||
        details.additionalFiles?.length ||
        details.donorExperience?.length ||
        details.certifications?.length
    );
  }, [profile]);

  /* ---------- hydrate from Firestore ---------- */

  useEffect(() => {
    if (!profile || !user) return;

    const profileMap = profile.profile || {};

    // industries + sectors
    const industriesFromDb = profileMap.industries || [];
    const sectorsFromDb = profileMap.sectorsByIndustry || {};
    const nextIndustries = [];
    const nextSectorsByIndustry = {};

    const ensureIndustryOption = (name) =>
      INDUSTRY_OPTIONS.find((opt) => opt.value === name) || {
        value: name,
        label: name,
      };

    const ensureSectorOption = (industry, sector) => {
      const pool = SECTOR_OPTIONS[industry] || [];
      return (
        pool.find(
          (opt) => opt.value === sector || opt.label === sector
        ) || { value: sector, label: sector }
      );
    };

    industriesFromDb.forEach((entry) => {
      const industryName =
        typeof entry === "string" ? entry : entry?.industry || "";
      if (!industryName) return;
      const industryOption = ensureIndustryOption(industryName);
      if (!nextIndustries.find((opt) => opt.value === industryOption.value)) {
        nextIndustries.push(industryOption);
      }
      const savedSectors =
        (typeof entry === "object" && Array.isArray(entry.sectors) && entry.sectors.length
          ? entry.sectors
          : sectorsFromDb[industryName]) || [];
      if (savedSectors.length) {
        nextSectorsByIndustry[industryName] = savedSectors.map((sector) =>
          ensureSectorOption(industryName, sector)
        );
      }
    });

    Object.entries(sectorsFromDb).forEach(([industryName, sectorList]) => {
      if (!sectorList || !sectorList.length) return;
      if (!nextIndustries.find((opt) => opt.value === industryName)) {
        nextIndustries.push(ensureIndustryOption(industryName));
      }
      if (!nextSectorsByIndustry[industryName]) {
        nextSectorsByIndustry[industryName] = sectorList.map((sector) =>
          ensureSectorOption(industryName, sector)
        );
      }
    });

    nextIndustries.forEach((opt) => {
      if (!nextSectorsByIndustry[opt.value]) {
        nextSectorsByIndustry[opt.value] = [];
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
    const regionsFromDb =
      profileMap.experienceRegions || profileMap.regions || [];
    const nextRegions = regionsFromDb.map((region) => {
      return (
        REGION_OPTIONS.find(
          (opt) => opt.value === region || opt.label === region
        ) || { value: region, label: region }
      );
    });

    // donors
    const donorsFromDb = profileMap.donorExperience || [];
    const nextDonors = donorsFromDb.map((donor) => {
      return (
        DONOR_OPTIONS.find(
          (opt) => opt.value === donor || opt.label === donor
        ) || { value: donor, label: donor }
      );
    });

    // skills
    const skillsFromDb = profileMap.skills || [];
    const nextSkills = SKILL_OPTIONS.filter((opt) =>
      skillsFromDb.includes(opt.label)
    );

    // pronouns
    const pronounValue = profileMap.pronouns || "";
    let pronounOpt =
      PRONOUN_OPTIONS.find((o) => o.label === pronounValue) || null;

    // time zone
    const tzValue = profileMap.timeZone || "";
    const tzMatch =
      TIMEZONE_OPTIONS.find((o) => o.value === tzValue || o.label === tzValue) ||
      null;
    const tzOpt = tzMatch || (tzValue ? { value: tzValue, label: tzValue } : null);

    // degree
    const degreeValue = profileMap.highestDegree || "";
    const degreeOpt =
      DEGREE_OPTIONS.find((o) => o.label === degreeValue) || null;

    // additional files (array of URLs or strings)
    const additionalFromDb = profileMap.additionalFiles || [];
    const availabilityStatus = profileMap.availabilityStatus || "";
    const availabilityNote = profileMap.availabilityNote || "";
    const storedCurrency = profileMap.currency || "USD";
    const customPronouns = profileMap.customPronouns || "";
    if (!pronounOpt && customPronouns) {
      pronounOpt = PRONOUN_OPTIONS.find((o) => o.value === "self_describe") || null;
    }

    setForm({
      fullName: profile.fullName || user.displayName || "",
      title: profile.title || profileMap.title || "",
      email: user.email || profile.email || "",
      location: profile.location || profileMap.location || "",
      about: profileMap.about || "",
      oneLinerBio: profileMap.oneLinerBio || "",
      timeZone: tzOpt?.value || tzValue || "",
      pronouns: pronounOpt?.value === "self_describe" ? customPronouns : pronounOpt?.label || "",
      customPronouns,
      totalYearsExperience: profileMap.totalYearsExperience || "",
      linkedinUrl: profileMap.linkedinUrl || "",
      dailyRate: profileMap.dailyRate || "",
      availabilityStatus,
      availabilityNote,
      openToTravel: !!profileMap.openToTravel,
      highestDegree: degreeOpt?.label || "",
      institution: profileMap.institution || "",
      resumeFile: profileMap.resumeFile || "",
      resumeFileName: profileMap.resumeFileName || "",
      resumeStoragePath: profileMap.resumeStoragePath || "",
      currency: storedCurrency,
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
    const normalizedAdditional = Array.isArray(additionalFromDb)
      ? additionalFromDb.map((entry) =>
          typeof entry === "string"
            ? {
                name: entry?.split("?")[0].split("/").pop() || "Document",
                url: entry,
                path: "",
              }
            : entry
        )
      : [];
    setAdditionalFiles(normalizedAdditional);
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
    if (option?.value === "self_describe") {
      setForm((prev) => ({
        ...prev,
        customPronouns: prev.customPronouns || "",
        pronouns: prev.customPronouns || "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        pronouns: option ? option.label : "",
        customPronouns: "",
      }));
    }
  };

  const handleCustomPronounsChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      customPronouns: value,
      pronouns: selectedPronouns?.value === "self_describe" ? value : prev.pronouns,
    }));
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
        next[key] = prev[key] || [];
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
      setForm((prev) => ({
        ...prev,
        resumeFile: url,
        resumeFileName: file.name,
        resumeStoragePath: storageRef.fullPath,
      }));
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
      for (const file of files) {
        const storageRef = ref(
          storage,
          `users/${user.uid}/additional/${file.name}`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setAdditionalFiles((prev) => [
          ...prev,
          { name: file.name, url, path: storageRef.fullPath },
        ]);
      }
    } catch (err) {
      console.error("Additional files upload failed:", err);
      setError("Unable to upload files right now.");
    } finally {
      setUploadingAdditional(false);
      // allow re-selecting the same file name
      event.target.value = "";
    }
  };

  const handleRemoveAdditionalFile = async (fileToRemove) => {
    try {
      if (fileToRemove?.path) {
        await deleteObject(ref(storage, fileToRemove.path));
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
    setAdditionalFiles((prev) =>
      prev.filter((file) =>
        fileToRemove?.path
          ? file.path !== fileToRemove.path
          : file.url !== fileToRemove.url
      )
    );
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

    const industriesList = selectedIndustries.map((ind) => ind.value);
    const sectorsByIndustry = {};
    industriesList.forEach((industry) => {
      const sectors = selectedSectorsByIndustry[industry] || [];
      if (sectors.length) {
        sectorsByIndustry[industry] = sectors.map((sec) => sec.value);
      }
    });
    const flatSectors = Object.values(sectorsByIndustry).flat();

    const profilePayload = {
      ...existingProfileMap,
      about: form.about,
      oneLinerBio: form.oneLinerBio,
      pronouns: form.pronouns,
      customPronouns: form.customPronouns || "",
      timeZone: form.timeZone,
      totalYearsExperience: form.totalYearsExperience,
      linkedinUrl: form.linkedinUrl,
      dailyRate: form.dailyRate,
      currency: form.currency || "USD",
      availabilityStatus: form.availabilityStatus || "",
      availabilityNote:
        form.availabilityStatus === "not_currently_available"
          ? form.availabilityNote || ""
          : "",
      availability:
        form.availabilityStatus === "not_currently_available"
          ? form.availabilityNote || ""
          : "",
      openToTravel: !!form.openToTravel,
      highestDegree: form.highestDegree,
      institution: form.institution,
      resumeFile: form.resumeFile || null,
      resumeFileName: form.resumeFileName || existingProfileMap.resumeFileName || "",
      resumeStoragePath:
        form.resumeStoragePath || existingProfileMap.resumeStoragePath || "",
      additionalFiles,
      industries: industriesList,
      sectorsByIndustry,
      sectors: flatSectors,
      languages: selectedLanguages.map((l) => l.label),
      experienceRegions: selectedRegions.map((r) => r.value),
      regions: existingProfileMap.regions || [],
      experienceCountries: existingProfileMap.experienceCountries || [],
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

  const availabilityLabel =
    form.availabilityStatus === "available_now"
      ? "Available now"
      : form.availabilityStatus === "not_currently_available"
      ? form.availabilityNote || "Not currently available"
      : "—";

  const currencyLabel =
    form.currency || profile?.profile?.currency || "USD";

  const heroStats = [
    {
      label: "Experience",
      value:
        form.totalYearsExperience ||
        profile?.profile?.totalYearsExperience ||
        "—",
    },
    {
      label: "Daily rate",
      value: form.dailyRate
        ? `${currencyLabel} ${form.dailyRate}`
        : "—",
    },
    {
      label: "Availability",
      value: availabilityLabel,
    },
  ];
  return (
    <main className="profile-form-page">
      <section className="profile-form-hero">
        <div>
          <p className="profile-eyebrow">Consultant profile</p>
          <h1>Your expertise at a glance</h1>
          <p>Keep this profile fresh so clients can quickly understand your availability.</p>
        </div>
        <div className="profile-form-hero__stats">
          {heroStats.map((stat) => (
            <article key={stat.label}>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </article>
          ))}
        </div>
      </section>

      <form className="profile-form-card settings" onSubmit={handleSubmit}>
        {!hasFullProfile && (
          <div className="profile-builder-banner">
            <div>
              <h3>Finish your full profile</h3>
              <p>
                You’ve completed the light profile. Share your full experience
                so clients can see everything.
              </p>
            </div>
            <Link className="banner-link" to="/consultant/profile-builder/full">
              Continue profile
            </Link>
          </div>
        )}
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
          {hasFullProfile && (
            <div className="settings-col">
              <label className="label">Role / Title</label>
              <input
                className="input"
                value={form.title}
                onChange={handleFieldChange("title")}
                placeholder="Senior Climate Consultant"
              />
            </div>
          )}
        </div>

        {hasFullProfile && (
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
        )}

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
            {selectedPronouns?.value === "self_describe" && (
              <input
                className="input"
                placeholder="Share your pronouns"
                value={form.customPronouns}
                onChange={handleCustomPronounsChange}
                style={{ marginTop: 8 }}
              />
            )}
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
            <div className="profile-rate-row">
              <select
                className="input"
                value={form.currency}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, currency: e.target.value }))
                }
              >
                {CURRENCY_OPTIONS.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                min="0"
                value={form.dailyRate}
                onChange={handleFieldChange("dailyRate")}
                placeholder="1200"
              />
            </div>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <label className="label">Availability Status</label>
            <div className="profile-radio-group">
              <label>
                <input
                  type="radio"
                  name="availability-status"
                  value="available_now"
                  checked={form.availabilityStatus === "available_now"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      availabilityStatus: e.target.value,
                    }))
                  }
                />
                Available now
              </label>
              <label>
                <input
                  type="radio"
                  name="availability-status"
                  value="not_currently_available"
                  checked={
                    form.availabilityStatus === "not_currently_available"
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      availabilityStatus: e.target.value,
                    }))
                  }
                />
                Not currently available
              </label>
            </div>
            {form.availabilityStatus === "not_currently_available" && (
              <input
                className="input"
                value={form.availabilityNote}
                onChange={handleFieldChange("availabilityNote")}
                placeholder="e.g., Available after June"
                style={{ marginTop: 10 }}
              />
            )}
          </div>

          <div className="settings-col">
            <label className="label">Open to travel</label>
            <div className="profile-radio-group">
              <label>
                <input
                  type="radio"
                  name="travel"
                  value="yes"
                  checked={form.openToTravel === true}
                  onChange={() =>
                    setForm((prev) => ({ ...prev, openToTravel: true }))
                  }
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="travel"
                  value="no"
                  checked={form.openToTravel === false}
                  onChange={() =>
                    setForm((prev) => ({ ...prev, openToTravel: false }))
                  }
                />
                No
              </label>
            </div>
          </div>
        </div>

        {/* EDUCATION */}
        {hasFullProfile && (
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
        )}

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
                options={
                  (SECTOR_OPTIONS[ind.value] &&
                    SECTOR_OPTIONS[ind.value].length > 0 &&
                    SECTOR_OPTIONS[ind.value]) ||
                  selectedSectorsByIndustry[ind.value] ||
                  []
                }
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

          {hasFullProfile && (
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
          )}
        </div>

        {hasFullProfile && (
          <>
            <div className="settings-row">
            <div className="settings-col">
              <label className="label">Donor Experience</label>
              <Select
                isMulti
                options={donorOptions}
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
                      {form.resumeFileName
                        ? `View ${form.resumeFileName}`
                        : "View current resume"}
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
                    {additionalFiles.map((file) => {
                      const url = file.url || "";
                      const name =
                        file.name ||
                        url.split("?")[0].split("/").pop() ||
                        "Supporting document";
                      return (
                        <li key={file.path || url} className="file-list-item">
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
                            onClick={() => handleRemoveAdditionalFile(file)}
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
          </>
        )}

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
