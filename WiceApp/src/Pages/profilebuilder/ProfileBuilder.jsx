import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressSidebar from "./componentsPB/ProgressSidebar";
import SectionWrapper from "./componentsPB/SectionWrapper";
import { useAuth } from "../../context/AuthContext.jsx";

import IntroPage from "./sections/IntroPage";
import IdentityBasics from "./sections/IdentityBasics";
import ProfessionalIdentity from "./sections/ProfessionalIdentity";
import ExpertiseSnapshot from "./sections/ExpertiseSnapshot";
import WorkPreferences from "./sections/WorkPreferences";
import CompletionPage from "./sections/CompletionPage";

import ExperienceSnapshot from "./sections/ExperienceSnapshot";
import ProfessionalCapabilities from "./sections/ProfessionalCapabilities";
import EducationNCredentials from "./sections/EducationNCredentials";
import PortfolioNPow from "./sections/PortfolioNPow";
import CompletionConfirmation from "./sections/CompletionConfirmation";

import "./profileBuilder.css";

export default function ProfileBuilder({ mode = "light" }) {
  const navigate = useNavigate();

  const lightSections = [
    "Intro Page",
    "Identity Basics",
    "Professional Identity",
    "Expertise Snapshot",
    "Work Preferences",
    "Light Completion",
  ];
  const fullSections = [
    "Experience Snapshot",
    "Professional Capabilities",
    "Education and Credentials",
    "Portfolio and Proof of Work",
    "Completion Confirmation",
  ];
  const sections = mode === "full" ? ["Experience Snapshot", ...fullSections.slice(1)] : [...lightSections, ...fullSections];
  const [currentSection, setCurrentSection] = useState(sections[0]);
  const [completed, setCompleted] = useState([]);

  // ⭐ GLOBAL PROFILE DATA FOR ALL PAGES
  const [profileData, setProfileData] = useState({
    fullName: "",
    title: "",
    location: "",
    pronouns: "",
    customPronouns: "",
    timeZone: "",
    oneLinerBio: "",
    about: "",
    totalYearsExperience: "",
    linkedinUrl: "",
    industries: [],
    sectors: [],
    sectorsByIndustry: {},
    subsectorsBySector: {},
    subsectors: [],
    languages: [],
    currency: "USD",
    dailyRate: "",
    availabilityStatus: "",
    availabilityNote: "",
    openToTravel: "",
    experienceRegions: [],
    experienceCountries: [],
    donorExperience: [],
    functionalExpertise: [],
    technicalSkillsByExpertise: {},
    capabilitiesList: [],
    skills: [],
    softwareTools: [],
    highestDegree: "",
    institution: "",
    certifications: [],
    securityClearances: [],
    resumeFile: "",
    resumeFileName: "",
    resumeStoragePath: "",
    additionalFiles: [],
    additionalEducation: [],
  });

  const { profile: userDoc, user } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userDoc || hydrated) return;
    if (userDoc.accountType !== "consultant") {
      setHydrated(true);
      return;
    }
    const stored = userDoc.profile || {};
    setProfileData((prev) => ({
      ...prev,
      fullName:
        prev.fullName ||
        userDoc.fullName ||
        stored.fullName ||
        user?.displayName ||
        "",
      title: prev.title || stored.title || userDoc.title || "",
      location: prev.location || stored.location || userDoc.location || "",
      pronouns: prev.pronouns || stored.pronouns || "",
      customPronouns: prev.customPronouns || stored.customPronouns || "",
      timeZone: prev.timeZone || stored.timeZone || "",
      oneLinerBio: prev.oneLinerBio || stored.oneLinerBio || "",
      about: prev.about || stored.about || "",
      totalYearsExperience:
        prev.totalYearsExperience ||
        stored.experienceBucket ||
        stored.totalYearsExperience ||
        "",
      linkedinUrl: prev.linkedinUrl || stored.linkedinUrl || "",
      industries: Array.isArray(prev.industries) && prev.industries.length
        ? prev.industries
        : stored.industries || [],
      sectors:
        Array.isArray(prev.sectors) && prev.sectors.length
          ? prev.sectors
          : stored.sectors || [],
      sectorsByIndustry: prev.sectorsByIndustry || stored.sectorsByIndustry || {},
      subsectorsBySector: prev.subsectorsBySector || stored.subsectorsBySector || {},
      subsectors:
        Array.isArray(prev.subsectors) && prev.subsectors.length
          ? prev.subsectors
          : stored.subsectors || [],
      languages:
        prev.languages && prev.languages.length
          ? prev.languages
          : Array.isArray(stored.languages)
            ? stored.languages
            : [],
      currency: prev.currency || stored.currency || "USD",
      dailyRate:
        prev.dailyRate ||
        (stored.dailyRate !== undefined && stored.dailyRate !== null
          ? String(stored.dailyRate)
          : ""),
      availabilityStatus: prev.availabilityStatus || stored.availabilityStatus || "",
      availabilityNote: prev.availabilityNote || stored.availabilityNote || "",
      openToTravel:
        prev.openToTravel ||
        (stored.openToTravel === true
          ? "Yes"
          : stored.openToTravel === false
            ? "No"
            : ""),
      experienceRegions: stored.experienceRegions || prev.experienceRegions || [],
      experienceCountries: stored.experienceCountries || prev.experienceCountries || [],
      donorExperience: stored.donorExperience || prev.donorExperience || [],
      functionalExpertise: stored.functionalExpertise || prev.functionalExpertise || [],
      technicalSkillsByExpertise:
        stored.functionalSkillsByExpertise ||
        prev.technicalSkillsByExpertise ||
        {},
      capabilitiesList:
        (prev.capabilitiesList && prev.capabilitiesList.length
          ? prev.capabilitiesList
          : stored.capabilitiesList) ||
        [],
      skills:
        (prev.skills && prev.skills.length ? prev.skills : stored.skills) || [],
      softwareTools: stored.softwareTools || prev.softwareTools || [],
      highestDegree: stored.highestDegree || prev.highestDegree || "",
      institution: stored.institution || prev.institution || "",
      certifications: stored.certifications || prev.certifications || [],
      securityClearances:
        stored.securityClearances || prev.securityClearances || [],
      resumeFile: stored.resumeFile || prev.resumeFile || "",
      resumeFileName: prev.resumeFileName || stored.resumeFileName || "",
      resumeStoragePath:
        prev.resumeStoragePath || stored.resumeStoragePath || "",
      additionalFiles:
        Array.isArray(prev.additionalFiles) && prev.additionalFiles.length
          ? prev.additionalFiles
          : Array.isArray(stored.additionalFiles)
            ? stored.additionalFiles.map((entry) =>
              typeof entry === "string"
                ? { name: "", url: entry, path: "" }
                : entry
            )
            : [],
      additionalEducation:
        Array.isArray(prev.additionalEducation) && prev.additionalEducation.length
          ? prev.additionalEducation
          : stored.additionalEducation || [],
    }));
    setHydrated(true);
  }, [userDoc, user, hydrated]);

  const [isFullProfileMode, setIsFullProfileMode] = useState(mode === "full");

  const progress = (completed.length / sections.length) * 100;

  const canProgress = (section, valid) => {
    if (valid && !completed.includes(section)) {
      setCompleted((prev) => [...prev, section]);
    }
  };

  const handleNext = (section, valid = true) => {
    if (valid) canProgress(section, valid);
    const nextIndex = sections.indexOf(section) + 1;
    if (nextIndex < sections.length) {
      setCurrentSection(sections[nextIndex]);
    }
  };

  const handleBack = (section) => {
    const idx = sections.indexOf(section);
    if (idx > 0) {
      setCurrentSection(sections[idx - 1]);
      setCompleted((prev) => prev.filter((s) => s !== section));
    }
  };

  const handleSkip = (section) => {
    const nextIndex = sections.indexOf(section) + 1;
    if (nextIndex < sections.length) {
      setCurrentSection(sections[nextIndex]);
    }
  };

  const handleSaveAndReturn = () => navigate("/consultant/portal");

  const isFullProfileSection = (sectionName) =>
    [
      "Experience Snapshot",
      "Professional Capabilities",
      "Education and Credentials",
      "Portfolio and Proof of Work",
    ].includes(sectionName);

  const renderSection = () => {
    const props = {
      onBack: () => handleBack(currentSection),
      onNext: () => handleNext(currentSection),
      onSkip: () => handleSkip(currentSection),
      profileData,
      setProfileData,
      showSkip: isFullProfileSection(currentSection),
    };

    switch (currentSection) {
      case "Intro Page":
        return <IntroPage onStart={() => handleNext("Intro Page")} />;

      case "Identity Basics":
        return (
          <SectionWrapper {...props} showSkip={false}>
            <IdentityBasics profileData={profileData} setProfileData={setProfileData} />
          </SectionWrapper>
        );

      case "Professional Identity":
        return (
          <SectionWrapper {...props} showSkip={false}>
            <ProfessionalIdentity
              profileData={profileData}
              setProfileData={setProfileData}
            />
          </SectionWrapper>
        );

      case "Expertise Snapshot":
        return (
          <SectionWrapper {...props} showSkip={false}>
            <ExpertiseSnapshot
              profileData={profileData}
              setProfileData={setProfileData}
            />
          </SectionWrapper>
        );

      case "Work Preferences":
        return (
          <SectionWrapper {...props} showSkip={false}>
            <WorkPreferences
              profileData={profileData}
              setProfileData={setProfileData}
              userId={user?.uid}
            />
          </SectionWrapper>
        );


      case "Light Completion":
        return (
          <SectionWrapper {...props} showSkip={false} showNav={false}>
            <CompletionPage
              profileData={profileData}
              onSave={handleSaveAndReturn}
              onNextFull={() => {
                setIsFullProfileMode(true);
                handleNext("Light Completion");
              }}
            />
          </SectionWrapper>
        );

      // ⭐ FULL PROFILE PAGES
      case "Experience Snapshot":
        return (
          <SectionWrapper {...props}>
            <ExperienceSnapshot
              profileData={profileData}
              setProfileData={setProfileData}
            />
          </SectionWrapper>
        );

      case "Professional Capabilities":
        return (
          <SectionWrapper {...props}>
            <ProfessionalCapabilities
              profileData={profileData}
              setProfileData={setProfileData}
            />
          </SectionWrapper>
        );

      case "Education and Credentials":
        return (
          <SectionWrapper {...props}>
            <EducationNCredentials
              profileData={profileData}
              setProfileData={setProfileData}
            />
          </SectionWrapper>
        );

      case "Portfolio and Proof of Work":
        return (
          <SectionWrapper {...props}>
            <PortfolioNPow profileData={profileData} setProfileData={setProfileData} />
          </SectionWrapper>
        );

      case "Completion Confirmation":
        return (
          <div className="form-section">
            <CompletionConfirmation
              profileData={profileData}
              onBack={() => handleBack("Completion Confirmation")}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-builder-container">
      {currentSection !== "Intro Page" && (
        <ProgressSidebar
          sections={sections}
          current={currentSection}
          completed={completed}
          progress={progress}
          onNavigate={setCurrentSection}
          isFullProfileMode={isFullProfileMode}
        />
      )}
      {renderSection()}
    </div>
  );
}
