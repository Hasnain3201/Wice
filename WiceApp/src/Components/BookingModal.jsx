import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxWidth: 900,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: '#1e293b',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: '#64748b',
    padding: 0,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  body: {
    padding: 24,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 20,
    marginTop: 0,
  },
  consultantInfo: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 20,
    border: '1px solid #e5e7eb',
  },
  consultantName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 4,
  },
  consultantTitle: {
    fontSize: 14,
    color: '#64748b',
  },
  dayGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  dayCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#fff',
  },
  dayCardSelected: {
    border: '2px solid #1e293b',
    backgroundColor: '#f8fafc',
  },
  dayCardDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  dayName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 8,
  },
  slotsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  slotText: {
    fontSize: 12,
    color: '#64748b',
  },
  datePickerSection: {
    marginBottom: 24,
  },
  dateInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'system-ui',
  },
  timeSlotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 8,
    marginTop: 16,
  },
  timeSlot: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: 13,
    backgroundColor: '#fff',
    transition: 'all 0.2s',
  },
  timeSlotSelected: {
    backgroundColor: '#1e293b',
    color: '#fff',
    border: '1px solid #1e293b',
  },
  timeSlotBooked: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    cursor: 'not-allowed',
  },
  notesSection: {
    marginTop: 24,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'system-ui',
    resize: 'vertical',
    minHeight: 80,
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  bookBtn: {
    padding: '10px 24px',
    backgroundColor: '#1e293b',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
  },
  bookBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  cancelBtn: {
    padding: '10px 24px',
    backgroundColor: '#fff',
    color: '#334155',
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 8,
  },
  selectedSlotInfo: {
    padding: 12,
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 6,
    marginTop: 16,
    fontSize: 14,
    color: '#166534',
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#334155',
    marginBottom: 8,
  },
};

export default function BookingModal({ isOpen, onClose, consultantId, clientId, clientName, clientEmail }) {
  const [availability, setAvailability] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [consultantInfo, setConsultantInfo] = useState(null);

  // Load consultant availability and existing bookings
  useEffect(() => {
    if (!isOpen || !consultantId) return;

    const loadData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Load availability
        const availDoc = await getDoc(doc(db, 'availabilities', consultantId));
        if (availDoc.exists()) {
          setAvailability(availDoc.data());
        } else {
          setError('This consultant has not set their availability yet.');
        }

        // Load consultant info
        const userDoc = await getDoc(doc(db, 'users', consultantId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setConsultantInfo({
            name: userData.fullName || 'Consultant',
            title: userData.title || userData.profile?.title || '',
          });
        }

        // Load existing bookings for this consultant
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('consultantId', '==', consultantId),
          where('status', 'in', ['pending', 'confirmed'])
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const booked = bookingsSnap.docs.map(doc => doc.data());
        setBookedSlots(booked);
      } catch (err) {
        console.error('Error loading booking data:', err);
        setError('Failed to load availability. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, consultantId]);

  // Generate time slots for selected day
  const generateTimeSlots = () => {
    if (!selectedDay || !availability) return [];

    const dayBlock = availability.blocks?.find(b => b.day === selectedDay);
    if (!dayBlock) return [];

    const slots = [];
    let current = dayBlock.start;
    
    while (current < dayBlock.end) {
      const next = current + 0.5; // 30-minute slots
      slots.push({ start: current, end: next });
      current = next;
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if a time slot is already booked
  const isSlotBooked = (slot) => {
    if (!selectedDate) return false;
    
    return bookedSlots.some(booking => 
      booking.date === selectedDate &&
      booking.day === selectedDay &&
      booking.startTime === slot.start &&
      booking.endTime === slot.end
    );
  };

  // Get available days
  const availableDays = availability?.blocks?.map(b => b.day) || [];

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setSelectedTimeSlot(null);
    setSelectedDate('');
  };

  // Handle date change
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    
    // Validate that the selected date matches the selected day
    if (date) {
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = DAYS[dateObj.getDay()];
      if (dayOfWeek !== selectedDay) {
        setError(`Selected date is not a ${selectedDay}. Please choose a ${selectedDay}.`);
        setSelectedDate('');
      } else {
        setError('');
      }
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    if (isSlotBooked(slot)) return;
    setSelectedTimeSlot(slot);
  };

  // Format time for display
  const formatTime = (t) => {
    const h = Math.floor(t);
    const m = (t % 1) * 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !clientId) {
      setError('Please select a date and time slot.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const bookingData = {
        consultantId,
        clientId,
        clientName: clientName || 'Client',
        clientEmail: clientEmail || '',
        day: selectedDay,
        date: selectedDate,
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        status: 'pending',
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confirmedAt: null,
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
      // Success - close modal
      alert('Booking request sent! The consultant will review and confirm your appointment.');
      onClose();
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedDay(null);
    setSelectedDate('');
    setSelectedTimeSlot(null);
    setNotes('');
    setError('');
    onClose();
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Book an Appointment</h2>
          <button style={styles.closeBtn} onClick={handleCancel}>×</button>
        </div>

        <div style={styles.body}>
          {isLoading ? (
            <p style={styles.loadingText}>Loading availability...</p>
          ) : error && !availability ? (
            <p style={styles.errorText}>{error}</p>
          ) : (
            <>
              {consultantInfo && (
                <div style={styles.consultantInfo}>
                  <div style={styles.consultantName}>{consultantInfo.name}</div>
                  {consultantInfo.title && (
                    <div style={styles.consultantTitle}>{consultantInfo.title}</div>
                  )}
                </div>
              )}

              <p style={styles.subtitle}>
                Select a day, then choose a date and time slot to request an appointment.
              </p>

              {/* Step 1: Select Day */}
              <div>
                <label style={styles.label}>Step 1: Select a day</label>
                <div style={styles.dayGrid}>
                  {DAYS.map((day) => {
                    const isAvailable = availableDays.includes(day);
                    const dayBlock = availability?.blocks?.find(b => b.day === day);
                    const isSelected = selectedDay === day;
                    
                    return (
                      <div
                        key={day}
                        style={{
                          ...styles.dayCard,
                          ...(isSelected && styles.dayCardSelected),
                          ...(!isAvailable && styles.dayCardDisabled),
                        }}
                        onClick={() => isAvailable && handleDaySelect(day)}
                      >
                        <div style={styles.dayName}>{day}</div>
                        {isAvailable && dayBlock && (
                          <div style={styles.slotsContainer}>
                            <div style={styles.slotText}>
                              {formatTime(dayBlock.start)} - {formatTime(dayBlock.end)}
                            </div>
                          </div>
                        )}
                        {!isAvailable && (
                          <div style={{ ...styles.slotText, color: '#dc2626' }}>
                            Unavailable
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Date */}
              {selectedDay && (
                <div style={styles.datePickerSection}>
                  <label style={styles.label}>Step 2: Choose a specific {selectedDay}</label>
                  <input
                    type="date"
                    style={styles.dateInput}
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={getMinDate()}
                  />
                </div>
              )}

              {/* Step 3: Select Time Slot */}
              {selectedDay && selectedDate && (
                <div>
                  <label style={styles.label}>Step 3: Select a time slot</label>
                  <div style={styles.timeSlotGrid}>
                    {timeSlots.map((slot, idx) => {
                      const booked = isSlotBooked(slot);
                      const selected = selectedTimeSlot?.start === slot.start;
                      
                      return (
                        <div
                          key={idx}
                          style={{
                            ...styles.timeSlot,
                            ...(selected && styles.timeSlotSelected),
                            ...(booked && styles.timeSlotBooked),
                          }}
                          onClick={() => handleTimeSlotSelect(slot)}
                        >
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                          {booked && <div style={{ fontSize: 11 }}>Booked</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected slot confirmation */}
              {selectedTimeSlot && selectedDate && (
                <div style={styles.selectedSlotInfo}>
                  <strong>Selected:</strong> {selectedDay}, {selectedDate} at {formatTime(selectedTimeSlot.start)} - {formatTime(selectedTimeSlot.end)}
                </div>
              )}

              {/* Notes */}
              {selectedTimeSlot && (
                <div style={styles.notesSection}>
                  <label style={styles.label}>Notes (optional)</label>
                  <textarea
                    style={styles.textarea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes for the consultant..."
                  />
                </div>
              )}

              {error && <p style={styles.errorText}>{error}</p>}
            </>
          )}
        </div>

        <div style={styles.footer}>
          <div>
            {isSaving && <span style={{ fontSize: 13, color: '#64748b' }}>Sending request...</span>}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
            <button
              style={{
                ...styles.bookBtn,
                ...(!selectedTimeSlot || !selectedDate || isSaving ? styles.bookBtnDisabled : {}),
              }}
              onClick={handleBooking}
              disabled={!selectedTimeSlot || !selectedDate || isSaving}
            >
              {isSaving ? 'Booking...' : 'Request Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}