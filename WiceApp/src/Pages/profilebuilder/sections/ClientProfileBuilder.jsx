// src/Pages/profilebuilder/ClientProfileBuilder.jsx

import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import ProgressSidebar from "../componentsPB/ProgressSidebar";
import SectionWrapper from "../componentsPB/SectionWrapper";

// LIGHT PROFILE
import ClientProfileBuilder1 from "./ClientProfileBuilder1";
import ClientProfileBuilder1Comp from "./ClientProfileBuilder1Comp";

// FULL PROFILE
import ClientProfileBuilder2 from "./ClientProfileBuilder2";
import ClientProfileBuilder2Comp from "./ClientProfileBuilder2Comp";

import "../profileBuilder.css";

export default function ClientProfileBuilder() {
  const { profile } = useAuth();
  const baseProfile = useMemo(() => profile?.profile || {}, [profile]);
  const [step, setStep] = useState(0);

  // Store ALL form input
  const [lightData, setLightData] = useState(() => ({
    fullName: baseProfile.fullName || "",
    jobTitle: baseProfile.jobTitle || "",
    workEmail: baseProfile.workEmail || profile?.email || "",
    orgName: baseProfile.organizationName || "",
    orgType: baseProfile.organizationType || "",
    primaryIndustry: baseProfile.primaryIndustry || "",
    sector: baseProfile.sector || "",
    country: baseProfile.country || "",
    contactMethod: (baseProfile.contactMethods || [])[0] || "",
  }));

  const [fullData, setFullData] = useState(() => ({
    website: baseProfile.websiteUrl || "",
    supportAreas: baseProfile.supportSelections || [],
    engagementTypes: baseProfile.engagementTypes || [],
    timezone: baseProfile.timeZone || "",
    phone: baseProfile.phoneNumber || "",
    whatsapp: baseProfile.whatsappNumber || "",
  }));

  // Progress tracking
  const [lightFilled, setLightFilled] = useState(0);
  const [fullFilled, setFullFilled] = useState(0);
  const [isLightComplete, setIsLightComplete] = useState(false);
  const [completedLightLabels, setCompletedLightLabels] = useState([]);
  const [completedFullLabels, setCompletedFullLabels] = useState([]);

  const lightLabels = [
    "Full Name",
    "Job Title / Role",
    "Work Email",
    "Organization Name",
    "Organization Type",
    "Primary Industry",
    "Country",
    "Contact Method",
  ];

  const fullLabels = [
    "Website URL",
    "Support Areas Needed",
    "Engagement Types",
    "Time Zone",
    "Phone Number",
    "Whatsapp",
  ];

  const mergedLabels = [...lightLabels, ...fullLabels];
  const isFullMode = step >= 2;

  const shownSections = isFullMode ? mergedLabels : lightLabels;
  const completedSidebar = [...completedLightLabels, ...completedFullLabels];

  const overallProgress = Math.round(
    ((lightFilled + fullFilled) / mergedLabels.length) * 100
  );

  const goToLightCompletion = () => {
    if (isLightComplete) setStep(1);
  };

  const goToFullForm = () => setStep(2);
  const goToFinalCompletion = () => setStep(3);

  const back = () => {
    if (step === 1) setStep(0);
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  let currentPage;

  // Step 0 — LIGHT FORM
  if (step === 0) {
    currentPage = (
          <SectionWrapper
            hideBack={true}
            onNext={goToLightCompletion}
            disableNext={!isLightComplete}
          >
            <ClientProfileBuilder1
              initialValues={lightData}
              onProgress={({ filled, completedLabels, isComplete, values }) => {
                setLightFilled(filled);
                setCompletedLightLabels(completedLabels);
                setIsLightComplete(isComplete);
                setLightData(values); // ⭐ store data
          }}
        />
      </SectionWrapper>
    );
  }

  // Step 1 — LIGHT COMPLETION
  else if (step === 1) {
    currentPage = (
      <ClientProfileBuilder1Comp
        lightData={lightData}
        onBack={back}
        onContinue={goToFullForm}
      />
    );
  }

  // Step 2 — FULL FORM
  else if (step === 2) {
    currentPage = (
      <SectionWrapper onBack={back} onNext={goToFinalCompletion}>
        <ClientProfileBuilder2
          initialValues={fullData}
          onProgress={({ filled, completedLabels, values }) => {
            setFullFilled(filled);
            setCompletedFullLabels(completedLabels);
            setFullData(values); // ⭐ store data
          }}
        />
      </SectionWrapper>
    );
  }

  // Step 3 — FULL COMPLETION
  else {
    currentPage = (
      <ClientProfileBuilder2Comp
        lightData={lightData}
        fullData={fullData}
        onBack={back}
      />
    );
  }

  return (
    <div className="profile-builder-container">
      <ProgressSidebar
        sections={shownSections}
        completed={completedSidebar}
        progress={overallProgress}
        isFullProfileMode={isFullMode}
      />

      <div className="form-section">{currentPage}</div>
    </div>
  );
}
