import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressSidebar from "./componentsPB/ProgressSidebar";
import SectionWrapper from "./componentsPB/SectionWrapper";

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

export default function ProfileBuilder() {
  const navigate = useNavigate();

  const sections = [
    "Intro Page",
    "Identity Basics",
    "Professional Identity",
    "Expertise Snapshot",
    "Work Preferences",
    "Light Completion",
    "Experience Snapshot",
    "Professional Capabilities",
    "Education and Credentials",
    "Portfolio and Proof of Work",
    "Completion Confirmation",
  ];

  const [currentSection, setCurrentSection] = useState(sections[0]);
  const [completed, setCompleted] = useState([]);

  // ⭐ GLOBAL PROFILE DATA FOR ALL PAGES
  const [profileData, setProfileData] = useState({});

  const [isFullProfileMode, setIsFullProfileMode] = useState(false);

  const progress =
    (completed.length / (sections.length - (isFullProfileMode ? 0 : 4))) * 100;

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

  const handleSaveAndReturn = () => navigate("/consultant/login");

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
            <WorkPreferences profileData={profileData} setProfileData={setProfileData} />
          </SectionWrapper>
        );

      case "Light Completion":
        return (
          <SectionWrapper {...props} showSkip={false}>
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
              onSubmit={() => handleNext("Completion Confirmation")}
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
