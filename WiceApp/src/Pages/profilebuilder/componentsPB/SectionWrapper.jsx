import React from "react";
import "../profileBuilder.css";

/**
 * SectionWrapper handles all navigation buttons globally.
 * 
 * Props:
 *  - children: section content (form/UI)
 *  - onBack, onSkip, onNext: navigation handlers from ProfileBuilder
 *  - showSkip: boolean (true only for full profile pages)
 */
export default function SectionWrapper({ children, onBack, onSkip, onNext, showSkip = false }) {
  return (
    <div className="form-section">
      {children}

      <div className="section-actions">
        <button type="button" className="back" onClick={onBack}>
          Back
        </button>

        {showSkip && (
          <button type="button" className="back" onClick={onSkip}>
            Skip
          </button>
        )}

        <button type="button" className="next" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
