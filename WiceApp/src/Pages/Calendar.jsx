import React, { useState, useEffect, useCallback } from "react";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";
import BookingRequestsManager from "../Components/BookingRequestsManager";
import ClientBookingsView from "../Components/ClientBookingsView";
import CalendarView from "../Components/CalendarView";

export default function CalendarPage() {
  const { user, role, profile } = useAuth();
  const name = profile?.fullName || user?.displayName || user?.email;
  const [confirmedBookings, setConfirmedBookings] = useState([]);

  const loadConfirmedBookings = useCallback(async () => {
    if (!user?.uid) return;
    try {
      let bookingsQuery;
      if (role === 'consultant') {
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('consultantId', '==', user.uid),
          where('status', '==', 'confirmed')
        );
      } else if (role === 'client') {
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('clientId', '==', user.uid),
          where('status', '==', 'confirmed')
        );
      }

      if (bookingsQuery) {
        const snapshot = await getDocs(bookingsQuery);
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setConfirmedBookings(bookings);
      }
    } catch (err) {
      console.error('Error loading confirmed bookings:', err);
    }
  }, [role, user?.uid]);

  useEffect(() => {
    loadConfirmedBookings();
  }, [loadConfirmedBookings]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Calendar</h1>
        <p className="dashboard-subtitle">
          {name
            ? `${name}'s calendar`
            : "Your calendar events will appear here."}
        </p>
      </header>

      {(role === "consultant" || role === "client") && user?.uid ? (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Left side - Booking Management */}
          <div style={{ flex: '0 0 400px', minWidth: 0 }}>
            {role === "consultant" ? (
              <BookingRequestsManager consultantId={user.uid} />
            ) : (
              <ClientBookingsView clientId={user.uid} />
            )}
          </div>

          {/* Right side - Calendar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <CalendarView 
              bookings={confirmedBookings}
              userRole={role}
            />
          </div>
        </div>
      ) : (
        <section className="dashboard-card">
          <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            Upcoming events
          </p>
          <p>Please sign in to view your calendar.</p>
        </section>
      )}
    </div>
  );
}
