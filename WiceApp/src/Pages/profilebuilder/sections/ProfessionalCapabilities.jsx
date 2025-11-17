import { useState } from "react";
import Select from "react-select";
import skillsData from "../../../data/skillsData";
import "../profileBuilder.css";

export default function ProfessionalCapabilities() {
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Convert skill list into React-Select options
  const skillOptions = skillsData.map((skill) => ({
    value: skill,
    label: skill,
  }));

  return (
    <div className="section">
      <h2>Professional Capabilities</h2>
      <p> <label>Skills</label></p>
      <p>
        Select the professional skills that describe your core capabilities.
        You can search and select multiple.
      </p>

      <Select
        isMulti
        options={skillOptions}
        value={selectedSkills}
        onChange={setSelectedSkills}
        placeholder="Search or select skills..."
      />

      <div className="selected-info">
        <span className="label-light">Selected Skills:</span>{" "}
        {selectedSkills.length > 0
          ? selectedSkills.map((s) => s.label).join(", ")
          : "None"}
      </div>
    </div>
  );
}
