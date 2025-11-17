import React from "react";
import "../profileBuilder.css";

/**
 * SectionWrapper controls navigation buttons ONLY if showNav=true.
 * For pages that have their own Next/Back buttons, set showNav={false}
 */
export default function SectionWrapper({
  children,
  onBack,
  onSkip,
  onNext,
  showSkip = false,
  showNav = true,
}) {
  return (
    <div className="form-section">
      {children}

      {/* Render navigation buttons only when enabled */}
      {showNav && (
        <div className="section-actions">
          {onBack && (
            <button type="button" className="back" onClick={onBack}>
              Back
            </button>
          )}

          {showSkip && (
            <button type="button" className="back" onClick={onSkip}>
              Skip
            </button>
          )}

          {onNext && (
            <button type="button" className="next" onClick={onNext}>
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
