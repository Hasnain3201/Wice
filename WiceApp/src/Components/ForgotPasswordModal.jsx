import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase"; // <-- make sure this path matches your project

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter an email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg("A password reset link has been sent to your email.");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setErrorMsg("This email is not registered with Wice");
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("Invalid email format.");
      } else {
        setErrorMsg("Something went wrong. Try again.");
      }
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '400px',
      width: '90%',
      position: 'relative',
    },
    closeBtn: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#6b7280',
      transition: 'all 0.2s',
    },
    title: {
      margin: '0 0 1.5rem 0',
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#111827',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#374151',
      marginBottom: '-0.5rem',
    },
    input: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'border-color 0.2s',
    },
    error: {
      color: '#dc2626',
      fontSize: '0.875rem',
      margin: 0,
    },
    success: {
      color: '#16a34a',
      fontSize: '0.875rem',
      margin: 0,
    },
    submitBtn: {
      padding: '0.75rem 1.5rem',
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button 
          style={styles.closeBtn} 
          onClick={onClose}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#f9fafb';
            e.target.style.borderColor = '#9ca3af';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.borderColor = '#d1d5db';
          }}
        >
          ✕
        </button>

        <h2 style={styles.title}>Reset Password</h2>

        <form onSubmit={handleReset} style={styles.form}>

          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            placeholder="Enter your email"
          />

          {errorMsg && <p style={styles.error}>{errorMsg}</p>}
          {successMsg && <p style={styles.success}>{successMsg}</p>}

          <button 
            type="submit" 
            style={styles.submitBtn}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
}