import { useState } from "react";
import ProgressSidebar from "./componentsPB/ProgressSidebar";

// Section imports (match your folder structure)
import IntroPage from "./sections/IntroPage";
import IdentityBasics from "./sections/IdentityBasics";
import ProfessionalIdentity from "./sections/ProfessionalIdentity";
import ExpertiseSnapshot from "./sections/ExpertiseSnapshot";
import WorkPreferences from "./sections/WorkPreferences";
import CompletionPage from "./sections/CompletionPage";

import "./profileBuilder.css";

export default function ProfileBuilder() {
  // All Light Profile stages (per WICE outline)
  const sections = [
    "Intro Page",
    "Identity Basics",
    "Professional Identity",
    "Expertise Snapshot",
    "Work Preferences",
    "Completion",
  ];

  const [currentSection, setCurrentSection] = useState(sections[0]);
  const [completed, setCompleted] = useState([]);

  // Calculate progress (exclude Completion screen)
  const progress = (completed.length / (sections.length - 1)) * 100;

  // Move forward to the next section
  const handleNext = (section) => {
    if (!completed.includes(section)) {
      setCompleted((prev) => [...prev, section]);
    }

    const nextIndex = sections.indexOf(section) + 1;
    if (nextIndex < sections.length) {
      setCurrentSection(sections[nextIndex]);
    }
  };

  // Move backward to the previous section
  const handleBack = (section) => {
    const currentIndex = sections.indexOf(section);
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentSection(sections[prevIndex]);

      // Update progress backward logically
      setCompleted((prev) => prev.filter((s) => s !== section));
    }
  };

  // Render appropriate section content
  const renderSection = () => {
    switch (currentSection) {
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

      case "Completion":
        return <CompletionPage />;

      default:
        return null;
    }
  };

  return (
    <div className="profile-builder-container">
      {/* Sidebar hidden only on Intro Page */}
      {currentSection !== "Intro Page" && (
        <ProgressSidebar
          sections={sections}
          current={currentSection}
          completed={completed}
          progress={progress}
          onNavigate={setCurrentSection}
        />
      )}

      {/* Right column dynamic form area */}
      <div className="form-section">{renderSection()}</div>
    </div>
  );
}
