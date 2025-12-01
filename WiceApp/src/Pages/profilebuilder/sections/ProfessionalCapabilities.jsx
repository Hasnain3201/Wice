import { useMemo, useState } from "react";
import Select from "react-select";
import "../ProfileBuilder.css";
import {
  FUNCTIONAL_SKILLS,
  SOFTWARE_TOOLS,
} from "../../../data/taxonomy";
import skillsData from "../../../data/skillsData.js";

const flattenSkills = (map = {}) =>
  Object.values(map)
    .flat()
    .filter(Boolean);

const SKILL_OPTIONS = skillsData.map((skill) => ({
  value: skill,
  label: skill,
}));

export default function ProfessionalCapabilities({ profileData, setProfileData }) {
  const [showAllSkills, setShowAllSkills] = useState(false);

  const expertiseOptions = useMemo(
    () =>
      Object.keys(FUNCTIONAL_SKILLS).map((name) => ({
        value: name,
        label: name,
      })),
    []
  );

  const skillOptions = useMemo(() => {
    const areas = showAllSkills
      ? Object.keys(FUNCTIONAL_SKILLS)
      : profileData.functionalExpertise || [];
    return areas
      .filter((area) => FUNCTIONAL_SKILLS[area]?.length)
      .map((area) => ({
        label: area,
        options: FUNCTIONAL_SKILLS[area].map((skill) => ({
          value: `${area}:::${skill}`,
          label: skill,
        })),
      }));
  }, [profileData.functionalExpertise, showAllSkills]);

  const selectedExpertise = (profileData.functionalExpertise || []).map((area) => ({
    value: area,
    label: area,
  }));

  const selectedSkills = useMemo(
    () =>
      Object.entries(profileData.technicalSkillsByExpertise || {}).flatMap(
        ([area, skills]) =>
          (skills || []).map((skill) => ({
            value: `${area}:::${skill}`,
            label: skill,
          }))
      ),
    [profileData.technicalSkillsByExpertise]
  );

  const softwareOptions = useMemo(
    () =>
      SOFTWARE_TOOLS.map((tool) => ({
        value: tool,
        label: tool,
      })),
    []
  );

  const selectedSoftware = (profileData.softwareTools || []).map((tool) => ({
    value: tool,
    label: tool,
  }));

  const selectedGeneralSkills = (profileData.skills || []).map((skill) => ({
    value: skill,
    label: skill,
  }));

  const handleExpertiseChange = (values) => {
    const chosen = (values || []).map((opt) => opt.value);
    setProfileData((prev) => {
      const nextSkills = { ...(prev.technicalSkillsByExpertise || {}) };
      Object.keys(nextSkills).forEach((area) => {
        if (!chosen.includes(area)) {
          delete nextSkills[area];
        }
      });
      return {
        ...prev,
        functionalExpertise: chosen,
        technicalSkillsByExpertise: nextSkills,
        capabilitiesList: flattenSkills(nextSkills),
      };
    });
  };

  const handleSkillsChange = (values) => {
    const grouped = {};
    (values || []).forEach(({ value }) => {
      const [area, skill] = value.split(":::");
      if (!area || !skill) return;
      if (!grouped[area]) grouped[area] = [];
      if (!grouped[area].includes(skill)) {
        grouped[area].push(skill);
      }
    });

    setProfileData((prev) => {
      const nextExpertise = showAllSkills
        ? Array.from(new Set([...(prev.functionalExpertise || []), ...Object.keys(grouped)]))
        : prev.functionalExpertise || [];
      return {
        ...prev,
        functionalExpertise: nextExpertise,
        technicalSkillsByExpertise: grouped,
        capabilitiesList: flattenSkills(grouped),
      };
    });
  };

  const handleSoftwareChange = (values) => {
    setProfileData((prev) => ({
      ...prev,
      softwareTools: (values || []).map((opt) => opt.value),
    }));
  };

  const handleGeneralSkillsChange = (values) => {
    setProfileData((prev) => ({
      ...prev,
      skills: (values || []).map((opt) => opt.value),
    }));
  };

  return (
    <div className="section">
      <h2>Professional Capabilities</h2>
      <p>
        Showcase functional expertise, detailed technical skills, and the tools you use to deliver
        outcomes.
      </p>

      <label>Functional Expertise</label>
      <Select
        isMulti
        options={expertiseOptions}
        value={selectedExpertise}
        placeholder="Select the focus areas you work in"
        onChange={handleExpertiseChange}
      />

      <div className="toggle-row">
        <label>
          <input
            type="checkbox"
            checked={showAllSkills}
            onChange={(e) => setShowAllSkills(e.target.checked)}
          />{" "}
          Show all technical skills
        </label>
        <span className="description">
          Toggle on to browse every skill category across the marketplace.
        </span>
      </div>

      <label>Technical Skills</label>
      <Select
        isMulti
        options={skillOptions}
        value={selectedSkills}
        isDisabled={!skillOptions.length}
        placeholder={
          skillOptions.length
            ? "Search for specific skills"
            : "Select at least one functional expertise to unlock skills"
        }
        onChange={handleSkillsChange}
      />

      <label>Software & Tools</label>
      <Select
        isMulti
        options={softwareOptions}
        value={selectedSoftware}
        placeholder="Select the platforms or tools you regularly use"
        onChange={handleSoftwareChange}
      />

      <label>General Skills</label>
      <Select
        isMulti
        options={SKILL_OPTIONS}
        value={selectedGeneralSkills}
        placeholder="Select skills"
        onChange={handleGeneralSkillsChange}
      />

      <p className="selected-info">
        <span className="label-light">Highlighted skills:</span>{" "}
        {selectedSkills.length || selectedGeneralSkills.length
          ? [
              ...flattenSkills(profileData.technicalSkillsByExpertise || []),
              ...(profileData.skills || []),
            ]
              .filter(Boolean)
              .join(", ")
          : "None"}
      </p>
    </div>
  );
}
