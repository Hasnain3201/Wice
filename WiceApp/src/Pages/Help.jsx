import React, { useState } from "react";
import "./help.css";

export default function HelpPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // For now just show an alert — you can replace with backend/localStorage later
    alert(`Submitted!\n\nSubject: ${subject}\nMessage: ${message}`);

    // Clear inputs
    setSubject("");
    setMessage("");
  };

  return (
    <div className="help-container">
      <h2 className="help-title">Help & Support</h2>

      <form onSubmit={handleSubmit}>
        <label className="help-label">Subject</label>
        <input
          type="text"
          className="help-input"
          placeholder="Enter a short title"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <label className="help-label">Message</label>
        <textarea
          className="help-textarea"
          placeholder="Describe your issue..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>

        <button className="help-button" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}
