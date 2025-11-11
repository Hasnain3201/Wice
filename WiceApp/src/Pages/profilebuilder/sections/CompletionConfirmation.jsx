import { useState } from "react";
import "../profileBuilder.css"; // ensure lowercase p in path

export default function CompletionConfirmation({ onBack }) {
  const [isChecked, setIsChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Handle submit
  const handleSubmit = () => {
    if (!isChecked) {
      alert("Please confirm that your information is accurate before submitting.");
      return;
    }
    setShowModal(true);
  };

  // Close modal and allow return to editing
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Navigate to homepage
  const goToHome = () => {
    window.location.href = "/home"; // change if your homepage route differs
  };

  return (
    <div className="section">
      <h2>Final Review and Confirmation</h2>
      <p>
        Review your full profile and confirm submission. Once submitted, your
        full profile becomes visible to clients.
      </p>

      {/* Confirmation checkbox inline */}
      <div className="confirm-center">
        <input
          type="checkbox"
          id="confirmBox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
        />
        <label htmlFor="confirmBox">
          I confirm that all the information provided is accurate.
        </label>
      </div>

      {/* Page action buttons */}
      <div className="section-actions">
        <button type="button" className="back" onClick={onBack}>
          Back
        </button>
        <button type="button" className="next" onClick={handleSubmit}>
          Submit Full Profile
        </button>
      </div>

      {/* Popup modal after submit */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3>Your Full Profile is Complete</h3>
            <p>
              🎉 Congratulations! You’ve completed your WICE Full Profile.
              <br />
              Your profile is now visible to clients.
              <br />
              You can edit or update your profile anytime.
            </p>

            <div className="modal-buttons">
              <button className="back" onClick={handleCloseModal}>
                Go Back to Edit
              </button>
              <button className="next" onClick={goToHome}>
                Go to Home Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
