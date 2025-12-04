import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Help.css";

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const { user, profile } = useAuth();

  const categories = [
    { 
      id: "billing", 
      label: "Billing", 
      color: "#10b981",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
        </svg>
      )
    },
    { 
      id: "scheduling", 
      label: "Scheduling", 
      color: "#8b5cf6",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      )
    },
    { 
      id: "bugs", 
      label: "Bugs/Glitches", 
      color: "#ef4444",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
        </svg>
      )
    },
    { 
      id: "questions", 
      label: "Questions", 
      color: "#f59e0b",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
        </svg>
      )
    },
    { 
      id: "other", 
      label: "Other", 
      color: "#6366f1",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      )
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      alert("Please select a category");
      return;
    }

    setSubmitting(true);

    try {
      const ticketData = {
        category: selectedCategory,
        subject: subject,
        message: message,
        status: "unsolved",
        userId: user?.uid || "anonymous",
        userEmail: user?.email || "anonymous@example.com",
        userName: profile?.name || user?.displayName || "Anonymous User",
        userRole: profile?.accountType || "unknown",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        hasResponse: false,
      };

      const docRef = await addDoc(collection(db, "helpTickets"), ticketData);
      console.log("Ticket created with ID:", docRef.id);

      await sendAdminEmailNotification({
        ...ticketData,
        ticketId: docRef.id,
      });

      alert("Your help request has been submitted successfully! Our team will respond soon.");

      setSelectedCategory("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting help ticket:", error);
      alert("Failed to submit help request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendAdminEmailNotification = async (ticketData) => {
    try {
      await addDoc(collection(db, "emailNotifications"), {
        type: "new_help_ticket",
        ticketData: ticketData,
        createdAt: serverTimestamp(),
        sent: false,
      });

      console.log("Email notification queued");
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  };

  return (
    <div className="help-container">
      <h2 className="help-title">Help & Support</h2>
      <p className="help-description">
        Need assistance? Select a category and describe your issue. Our team will respond as soon as possible.
      </p>

      <form onSubmit={handleSubmit}>
        <label className="help-label">What do you need help with?</label>
        <div className="help-categories">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`help-category-btn ${
                selectedCategory === category.id ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                "--category-color": category.color,
              }}
            >
              <div className="category-icon">{category.icon}</div>
              <span className="category-label">{category.label}</span>
            </button>
          ))}
        </div>

        <label className="help-label">Subject</label>
        <input
          type="text"
          className="help-input"
          placeholder="Enter a short title"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <label className="help-label">Message</label>
        <textarea
          className="help-textarea"
          placeholder="Describe your issue in detail..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        ></textarea>

        <button 
          className="help-button" 
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}