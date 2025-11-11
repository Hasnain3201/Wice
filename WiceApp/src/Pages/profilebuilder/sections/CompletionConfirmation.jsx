import { useState } from "react";
import "../ProfileBuilder.css";

export default function CompletionConfirmation({ onBack }) {
  const [isChecked, setIsChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = () => {
    if (!isChecked) {
      alert("Please confirm that your information is accurate before submitting.");
      return;
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const goToHome = () => {
    window.location.href = "/home"; // adjust route as needed
  };

  return (
    <div className="section">
      <h2>Final Review and Confirmation</h2>
      <p>
        Review your full profile and confirm submission. Once submitted, your full profile becomes visible to clients.
      </p>

      {/* Centered inline checkbox */}
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

      {/* Actions */}
      <div className="section-actions">
        <button type="button" className="back" onClick={onBack}>
          Back
        </button>
        <button type="button" className="next" onClick={handleSubmit}>
          Submit Full Profile
        </button>
      </div>

      {/* TRUE POPUP MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3>Your Full Profile is Complete</h3>
            <p>
              Congratulations! You’ve completed your WICE Full Profile. Your profile is now visible to clients.
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
