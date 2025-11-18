import React, { useCallback, useId, useRef } from "react";
import "../profileBuilder.css";

/**
 * Wraps every profile builder section in a <form> so native HTML validation
 * runs automatically. Sections that need custom validation can call
 * registerValidator(fn) to run additional checks before progressing.
 */
export default function SectionWrapper({
  children,
  onBack,
  onSkip,
  onNext,
  showSkip = false,
  showNav = true,
}) {
  const formId = useId();
  const validatorRef = useRef(null);

  const registerValidator = useCallback((fn) => {
    validatorRef.current = typeof fn === "function" ? fn : null;
  }, []);

  const enhancedChildren = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { registerValidator })
      : child
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validatorRef.current) {
      const result = validatorRef.current();
      if (!result) {
        return;
      }
    }
    onNext?.();
  };

  return (
    <div className="form-section">
      {showNav ? (
        <form id={formId} onSubmit={handleSubmit}>
          {enhancedChildren}
        </form>
      ) : (
        enhancedChildren
      )}

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
            <button type="submit" form={formId} className="next">
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
