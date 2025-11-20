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
import IndustryProfileFilter from "../../Components/IndustryProfileFilter.jsx";
import "./ConsultantProfile.css";

const MAX_ABOUT = 300;
const MAX_ONELINER = 120;
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
const REGION_OPTIONS = Object.keys(GEOGRAPHIC_EXPERIENCE).map((region) => ({
  value: region,
  label: region,
}));
const DONOR_OPTIONS = DONOR_TAXONOMY.map((donor) => ({
  value: donor,
  label: donor,
}));
const SKILL_OPTIONS = skillsData.map((s) => ({ value: s, label: s }));
const LANGUAGE_OPTIONS = ISO6391.getAllNames().map((name) => ({
  value: name.toLowerCase(),
  label: name,
}));
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
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];

export default function ConsultantProfile() {
  const { user, profile, refreshProfile, loading } = useAuth();
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
    resumeFile: "",
    resumeFileName: "",
    resumeStoragePath: "",
    currency: "USD",
    availabilityStatus: "",
    availabilityNote: "",
    customPronouns: "",
  });
  const [selectedPronouns, setSelectedPronouns] = useState(null);
  const [selectedTimeZone, setSelectedTimeZone] = useState(null);
  const [selectedDegree, setSelectedDegree] = useState(null);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedSectorsByIndustry, setSelectedSectorsByIndustry] = useState({});
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedDonors, setSelectedDonors] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isConsultant = useMemo(
    () => profile?.accountType === "consultant",
    [profile?.accountType]
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

  useEffect(() => {
    if (!profile || !user) return;
    const profileMap = profile.profile || {};
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

    const regionsFromDb =
      profileMap.experienceRegions || profileMap.regions || [];
    const nextRegions = regionsFromDb.map((region) => {
      return (
        REGION_OPTIONS.find(
          (opt) => opt.value === region || opt.label === region
        ) || { value: region, label: region }
      );
    });

    const donorsFromDb = profileMap.donorExperience || [];
    const nextDonors = donorsFromDb.map((donor) => {
      return (
        DONOR_OPTIONS.find(
          (opt) => opt.value === donor || opt.label === donor
        ) || { value: donor, label: donor }
      );
    });

    const skillsFromDb = profileMap.skills || [];
    const nextSkills = skillsFromDb.map((skill) => ({
      value: skill,
      label: skill,
    }));

    const pronounValue = profileMap.pronouns || "";
    let pronounOpt =
      PRONOUN_OPTIONS.find((o) => o.label === pronounValue) || null;

    const tzValue = profileMap.timeZone || "";
    const tzMatch =
      TIMEZONE_OPTIONS.find((o) => o.value === tzValue || o.label === tzValue) ||
      null;
    const tzOpt = tzMatch || (tzValue ? { value: tzValue, label: tzValue } : null);

    const degreeValue = profileMap.highestDegree || "";
    const degreeOpt =
      skillsData.find((o) => o.label === degreeValue) || null;

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
*** End Patch
