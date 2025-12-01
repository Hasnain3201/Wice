// src/Pages/profilebuilder/ClientProfileBuilder.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import ProgressSidebar from "../componentsPB/ProgressSidebar";
import SectionWrapper from "../componentsPB/SectionWrapper";

// LIGHT PROFILE
import ClientProfileBuilder1 from "./ClientProfileBuilder1";
import ClientProfileBuilder1Comp from "./ClientProfileBuilder1Comp";

// FULL PROFILE
import ClientProfileBuilder2 from "./ClientProfileBuilder2";
import ClientProfileBuilder2Comp from "./ClientProfileBuilder2Comp";

import "../profileBuilder.css";

const shallowEqual = (a = {}, b = {}) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

export default function ClientProfileBuilder() {
  const { profile } = useAuth();
  const location = useLocation();
  const baseProfile = useMemo(() => profile?.profile || {}, [profile]);
  const searchParams = new URLSearchParams(location.search);
  const wantsFull = searchParams.get("full") === "1";
  const [hydratedProfile, setHydratedProfile] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const computeStep = useCallback(() => {
    const lightDone = profile?.phaseLightCompleted || profile?.clientLightCompleted;
    const fullDone = profile?.phaseFullCompleted || profile?.clientFullCompleted;
    if (!profile) return 0; // render light form by default while loading profile
    if (fullDone) return 3;
    if (wantsFull && lightDone) return 2;
    if (lightDone) return 1; // keep user on light review until they opt into full
    return 0;
  }, [profile, wantsFull]);

  const [step, setStep] = useState(() => computeStep());

  useEffect(() => {
    const next = computeStep();
    if (next === null) return;
    setStep(next);
  }, [computeStep]);

  // Store ALL form input
  const [lightData, setLightData] = useState(() => ({
    fullName: baseProfile.fullName || profile?.fullName || "",
    jobTitle: baseProfile.jobTitle || profile?.jobTitle || "",
    workEmail: baseProfile.workEmail || profile?.email || "",
    orgName: baseProfile.organizationName || "",
    orgType: baseProfile.organizationType || "",
    primaryIndustry: baseProfile.primaryIndustry || "",
    sector: baseProfile.sector || "",
    country: baseProfile.country || "",
    timeZone: baseProfile.timeZone || "",
    contactMethod: (baseProfile.contactMethods || [])[0] || "",
  }));

  const [fullData, setFullData] = useState(() => ({
    website: baseProfile.websiteUrl || "",
    supportAreas: baseProfile.supportSelections || [],
    engagementTypes: baseProfile.engagementTypes || [],
    phone: baseProfile.phoneNumber || "",
    whatsapp: baseProfile.whatsappNumber || "",
    contactMethod:
      (baseProfile.contactMethods && baseProfile.contactMethods[0]) ||
      baseProfile.contactMethod ||
      "",
  }));

  // Hydrate from stored profile when skipping directly to full flow
  useEffect(() => {
    if (!profile || hydratedProfile) return;

    const contactMethodFromProfile =
      (baseProfile.contactMethods && baseProfile.contactMethods[0]) ||
      (profile.contactMethods && profile.contactMethods[0]) ||
      baseProfile.contactMethod ||
      profile.contactMethod ||
      "";

    const hydratedLight = {
      fullName: baseProfile.fullName || profile.fullName || "",
      jobTitle: baseProfile.jobTitle || profile.jobTitle || "",
      workEmail: baseProfile.workEmail || profile.workEmail || profile.email || "",
      orgName: baseProfile.organizationName || profile.organizationName || "",
      orgType: baseProfile.organizationType || profile.organizationType || "",
      primaryIndustry: baseProfile.primaryIndustry || profile.primaryIndustry || "",
      sector: baseProfile.sector || profile.sector || "",
      country: baseProfile.country || profile.country || "",
      timeZone: baseProfile.timeZone || profile.timeZone || "",
      contactMethod: contactMethodFromProfile,
    };

    setLightData((prev) => ({
      fullName: prev.fullName || hydratedLight.fullName,
      jobTitle: prev.jobTitle || hydratedLight.jobTitle,
      workEmail: prev.workEmail || hydratedLight.workEmail,
      orgName: prev.orgName || hydratedLight.orgName,
      orgType: prev.orgType || hydratedLight.orgType,
      primaryIndustry: prev.primaryIndustry || hydratedLight.primaryIndustry,
      sector: prev.sector || hydratedLight.sector,
      country: prev.country || hydratedLight.country,
      timeZone: prev.timeZone || hydratedLight.timeZone,
      contactMethod: prev.contactMethod || hydratedLight.contactMethod,
    }));

    const hydratedFull = {
      website:
        baseProfile.websiteUrl || baseProfile.website || profile.websiteUrl || "",
      supportAreas:
        baseProfile.supportSelections ||
        baseProfile.supportAreas ||
        profile.supportSelections ||
        [],
      engagementTypes:
        baseProfile.engagementTypes ||
        baseProfile.engagementOptions ||
        profile.engagementTypes ||
        [],
      phone: baseProfile.phoneNumber || profile.phoneNumber || "",
      whatsapp: baseProfile.whatsappNumber || profile.whatsappNumber || "",
      contactMethod: contactMethodFromProfile,
    };

    setFullData((prev) => ({
      website: prev.website || hydratedFull.website,
      supportAreas:
        (prev.supportAreas && prev.supportAreas.length
          ? prev.supportAreas
          : hydratedFull.supportAreas) || [],
      engagementTypes:
        (prev.engagementTypes && prev.engagementTypes.length
          ? prev.engagementTypes
          : hydratedFull.engagementTypes) || [],
      phone: prev.phone || hydratedFull.phone,
      whatsapp: prev.whatsapp || hydratedFull.whatsapp,
      contactMethod: prev.contactMethod || hydratedFull.contactMethod,
    }));
    setHydratedProfile(true);
    setInitialLoaded(true);
  }, [profile, baseProfile, hydratedProfile]);

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
    "Sector (Subsector)",
    "Country",
    "Time Zone",
  ];

  const fullLabels = [
    "Website URL",
    "Support Areas Needed",
    "Engagement Types",
    "Phone Number",
    "Whatsapp",
    "Preferred Contact Method",
  ];

  const isFullMode = step >= 2;
  const shownSections = isFullMode ? fullLabels : lightLabels;
  const completedSidebar = isFullMode ? completedFullLabels : completedLightLabels;
  const progressTotal = isFullMode ? fullLabels.length : lightLabels.length;
  const progressFilled = isFullMode ? fullFilled : lightFilled;
  const overallProgress = Math.round((progressFilled / progressTotal) * 100);

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
                setLightData((prev) => (shallowEqual(prev, values) ? prev : values)); // ⭐ store data
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
      />

      <div className="form-section">{currentPage}</div>
    </div>
  );
}
