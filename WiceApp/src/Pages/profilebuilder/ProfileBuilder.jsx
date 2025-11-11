import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressSidebar from "./componentsPB/ProgressSidebar";

// Light Profile Sections
import IntroPage from "./sections/IntroPage";
import IdentityBasics from "./sections/IdentityBasics";
import ProfessionalIdentity from "./sections/ProfessionalIdentity";
import ExpertiseSnapshot from "./sections/ExpertiseSnapshot";
import WorkPreferences from "./sections/WorkPreferences";
import CompletionPage from "./sections/CompletionPage";

// Full Profile Sections
import ExperienceSnapshot from "./sections/ExperienceSnapshot";
import ProfessionalCapabilities from "./sections/ProfessionalCapabilities";
import EducationNCredentials from "./sections/EducationNCredentials";
import PortfolioNPow from "./sections/PortfolioNPow";
import CompletionConfirmation from "./sections/CompletionConfirmation";
import WholeCompletion from "./sections/WholeCompletion";

import "./profileBuilder.css";

export default function ProfileBuilder() {
  const navigate = useNavigate();

  const sections = [
    // Light Profile
    "Intro Page",
    "Identity Basics",
    "Professional Identity",
    "Expertise Snapshot",
    "Work Preferences",
    "Light Completion",

    // Full Profile
    "Experience Snapshot",
    "Professional Capabilities",
    "Education and Credentials",
    "Portfolio and Proof of Work",
    "Completion Confirmation",
    "Full Completion",
  ];

  const [currentSection, setCurrentSection] = useState(sections[0]);
  const [completed, setCompleted] = useState([]);

  const progress = (completed.length / (sections.length - 1)) * 100;

  const canProgress = (section, valid) => {
    if (valid && !completed.includes(section)) {
      setCompleted((prev) => [...prev, section]);
    }
  };

  const handleNext = (section, valid = true) => {
    if (valid) canProgress(section, valid);
    const nextIndex = sections.indexOf(section) + 1;
    if (nextIndex < sections.length) setCurrentSection(sections[nextIndex]);
  };

  const handleBack = (section) => {
    const idx = sections.indexOf(section);
    if (idx > 0) {
      setCurrentSection(sections[idx - 1]);
      setCompleted((prev) => prev.filter((s) => s !== section));
    }
  };

  const handleSaveAndReturn = () => navigate("/consultant/login");

  const renderSection = () => {
    switch (currentSection) {
      // Light Profile
      case "Intro Page":
        return <IntroPage onStart={() => handleNext("Intro Page")} />;
      case "Identity Basics":
        return (
          <IdentityBasics
            onNext={() => handleNext("Identity Basics")}
            onBack={() => handleBack("Identity Basics")}
          />
        );
      case "Professional Identity":
        return (
          <ProfessionalIdentity
            onNext={() => handleNext("Professional Identity")}
            onBack={() => handleBack("Professional Identity")}
          />
        );
      case "Expertise Snapshot":
        return (
          <ExpertiseSnapshot
            onNext={() => handleNext("Expertise Snapshot")}
            onBack={() => handleBack("Expertise Snapshot")}
          />
        );
      case "Work Preferences":
        return (
          <WorkPreferences
            onNext={() => handleNext("Work Preferences")}
            onBack={() => handleBack("Work Preferences")}
          />
        );
      case "Light Completion":
        return (
          <CompletionPage
            onSave={handleSaveAndReturn}
            onNextFull={() => handleNext("Light Completion")}
          />
        );

      // Full Profile
      case "Experience Snapshot":
        return (
          <ExperienceSnapshot
            onNext={(valid) => handleNext("Experience Snapshot", valid)}
            onBack={() => handleBack("Experience Snapshot")}
          />
        );
      case "Professional Capabilities":
        return (
          <ProfessionalCapabilities
            onNext={(valid) => handleNext("Professional Capabilities", valid)}
            onBack={() => handleBack("Professional Capabilities")}
          />
        );
      case "Education and Credentials":
        return (
          <EducationNCredentials
            onNext={(valid) => handleNext("Education and Credentials", valid)}
            onBack={() => handleBack("Education and Credentials")}
          />
        );
      case "Portfolio and Proof of Work":
        return (
          <PortfolioNPow
            onNext={(valid) => handleNext("Portfolio and Proof of Work", valid)}
            onBack={() => handleBack("Portfolio and Proof of Work")}
          />
        );
      case "Completion Confirmation":
        return (
          <CompletionConfirmation
            onNext={(valid) => handleNext("Completion Confirmation", valid)}
            onBack={() => handleBack("Completion Confirmation")}
          />
        );
      case "Full Completion":
        return <WholeCompletion onHome={handleSaveAndReturn} />;
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
        />
      )}
      <div className="form-section">{renderSection()}</div>
    </div>
  );
}
