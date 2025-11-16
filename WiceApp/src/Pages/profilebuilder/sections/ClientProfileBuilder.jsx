import React, { useState } from "react";
import ProgressSidebar from "../componentsPB/ProgressSidebar";
import SectionWrapper from "../componentsPB/SectionWrapper";

// LIGHT PROFILE pages
import ClientProfileBuilder1 from "./ClientProfileBuilder1";
import ClientProfileBuilder1Comp from "./ClientProfileBuilder1Comp";

// FULL PROFILE pages
import ClientProfileBuilder2 from "./ClientProfileBuilder2";
import ClientProfileBuilder2Comp from "./ClientProfileBuilder2Comp";

import "../profileBuilder.css";

export default function ClientProfileBuilder() {
  // steps:
  // 0 = light profile form
  // 1 = light completion
  // 2 = full profile form
  // 3 = full completion

  const [step, setStep] = useState(0);

  const [lightFilled, setLightFilled] = useState(0);
  const [fullFilled, setFullFilled] = useState(0);
  const [isLightComplete, setIsLightComplete] = useState(false);

  const [completedLightLabels, setCompletedLightLabels] = useState([]);
  const [completedFullLabels, setCompletedFullLabels] = useState([]);

  // LIGHT fields
  const lightFieldsLabels = [
    "Full Name",
    "Job Title / Role",
    "Work Email",
    "Organization Name",
    "Organization Type",
    "Primary Industry",
    "Country",
    "Contact Method",
  ];

  // FULL fields
  const fullFieldsLabels = [
    "Website URL",
    "Support Areas Needed",
    "Engagement Types",
    "Time Zone",
    "Phone Number",
    "Whatsapp",
  ];

  // merged list AFTER they hit continue
  const mergedList = [...lightFieldsLabels, ...fullFieldsLabels];

  // NEW: merged-mode logic
  const isFullProfileMode = step >= 2;

  const shownSections = isFullProfileMode ? mergedList : lightFieldsLabels;

  const completedSidebarLabels = [
    ...completedLightLabels,
    ...completedFullLabels,
  ];

  const totalFields = lightFieldsLabels.length + fullFieldsLabels.length;
  const overallProgress = Math.round(
    ((lightFilled + fullFilled) / totalFields) * 100
  );

  const goToLightCompletion = () => {
    if (isLightComplete) setStep(1);
  };

  const goToFullProfile = () => {
    setStep(2);
  };

  const goToFinalCompletion = () => {
    setStep(3);
  };

  const back = () => {
    if (step === 1) setStep(0);
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleFinalSubmit = () => {
    console.log("Submit Full Profile");
  };

  let currentPage;

  if (step === 0) {
    currentPage = (
      <SectionWrapper
        hideBack={true}
        onNext={goToLightCompletion}
        disableNext={!isLightComplete}
      >
        <ClientProfileBuilder1
          onProgress={({ filled, completedLabels, isComplete }) => {
            setLightFilled(filled);
            setCompletedLightLabels(completedLabels);
            setIsLightComplete(isComplete);
          }}
        />
      </SectionWrapper>
    );
  } else if (step === 1) {
    currentPage = (
      <ClientProfileBuilder1Comp
        onBack={back}
        onContinue={goToFullProfile}
      />
    );
  } else if (step === 2) {
    currentPage = (
      <SectionWrapper onBack={back} onNext={goToFinalCompletion}>
        <ClientProfileBuilder2
          onProgress={({ filled, completedLabels }) => {
            setFullFilled(filled);
            setCompletedFullLabels(completedLabels);
          }}
        />
      </SectionWrapper>
    );
  } else {
    currentPage = (
      <ClientProfileBuilder2Comp
        onBack={back}
        onSubmit={handleFinalSubmit}
      />
    );
  }

  return (
    <div className="profile-builder-container">
      <ProgressSidebar
        sections={shownSections}
        completed={completedSidebarLabels}
        progress={overallProgress}
        isFullProfileMode={isFullProfileMode}  // ⭐ ADDED
      />

      <div className="form-section">{currentPage}</div>
    </div>
  );
}
