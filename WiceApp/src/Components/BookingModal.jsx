import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Duration options in minutes
const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
];

// ============ TIMEZONE UTILITIES (built-in, no separate file needed) ============
const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (err) {
    return 'UTC';
  }
};

const convertTimeBetweenTimezones = (timeInHours, fromTimezone, toTimezone, date) => {
  if (!fromTimezone || !toTimezone || fromTimezone === toTimezone) {
    return timeInHours;
  }

  try {
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours % 1) * 60);
    const dateTimeString = `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    const sourceDate = new Date(dateTimeString);
    
    const sourceTimeString = sourceDate.toLocaleString('en-US', {
      timeZone: fromTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const [datePart, timePart] = sourceTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const properDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
    const properDate = new Date(properDateString);
    
    const targetTimeString = properDate.toLocaleString('en-US', {
      timeZone: toTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    const [targetHours, targetMinutes] = targetTimeString.split(':').map(Number);
    return targetHours + (targetMinutes / 60);
  } catch (err) {
    console.error('Timezone conversion error:', err);
    return timeInHours;
  }
};

const getTimezoneAbbr = (timezone) => {
  if (!timezone) return '';
  try {
    const date = new Date();
    const formatted = date.toLocaleString('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatted.split(' ');
    return parts[parts.length - 1];
  } catch (err) {
    return timezone.split('/').pop().replace(/_/g, ' ');
  }
};
// =====================================================================================

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
  timezoneNote: {
    fontSize: 12,
    color: '#1e40af',
    marginTop: 8,
    fontStyle: 'italic',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
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
  durationSection: {
    marginBottom: 24,
  },
  durationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  durationBtn: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: 13,
    backgroundColor: '#fff',
    transition: 'all 0.2s',
    fontWeight: 500,
  },
  durationBtnSelected: {
    backgroundColor: '#1e293b',
    color: '#fff',
    border: '1px solid #1e293b',
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

export default function BookingModal({ 
  isOpen, 
  onClose, 
  consultantId, 
  clientId, 
  clientName, 
  clientEmail,
  clientTimezone // Pass from your useAuth profile: profile?.timeZone
}) {
  const [availability, setAvailability] = useState(null);
  const [consultantTimezone, setConsultantTimezone] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30); // Default 30 minutes
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [consultantInfo, setConsultantInfo] = useState(null);

  // Get client timezone with fallback to browser timezone
  const effectiveClientTimezone = clientTimezone || getBrowserTimezone();

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

        // Load consultant info including timezone
        const userDoc = await getDoc(doc(db, 'users', consultantId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setConsultantInfo({
            name: userData.fullName || 'Consultant',
            title: userData.title || userData.profile?.title || '',
          });
          // Get consultant's timezone from profile
          const ctz = userData.timeZone || userData.profile?.timeZone || null;
          setConsultantTimezone(ctz);
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

  // Generate time slots based on selected day, date, and duration
  const generateTimeSlots = () => {
    if (!selectedDay || !availability || !selectedDate) return [];
    
    const dayBlock = availability.blocks?.find(b => b.day === selectedDay);
    if (!dayBlock) return [];

    let start = dayBlock.start;
    let end = dayBlock.end;

    // Convert consultant's availability to client's timezone if both are available
    const needsConversion = consultantTimezone && effectiveClientTimezone && 
                           consultantTimezone !== effectiveClientTimezone;
    
    if (needsConversion) {
      start = convertTimeBetweenTimezones(start, consultantTimezone, effectiveClientTimezone, selectedDate);
      end = convertTimeBetweenTimezones(end, consultantTimezone, effectiveClientTimezone, selectedDate);
    }

    const slots = [];
    const durationInHours = selectedDuration / 60;
    let current = start;

    // Generate slots every 15 minutes, but each slot length = selected duration
    while (current + durationInHours <= end) {
      slots.push({
        start: current,
        end: current + durationInHours,
        duration: selectedDuration,
      });
      current += 0.25; // 15-minute increments for slot starts
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if a time slot conflicts with existing bookings
  const isSlotBooked = (slot) => {
    if (!selectedDate) return false;
    
    return bookedSlots.some(booking => {
      if (booking.date !== selectedDate || booking.day !== selectedDay) return false;
      
      // Check for overlap: new slot starts before existing ends AND new slot ends after existing starts
      const existingStart = booking.startTime;
      const existingEnd = booking.endTime;
      const newStart = slot.start;
      const newEnd = slot.end;
      
      return (newStart < existingEnd && newEnd > existingStart);
    });
  };

  // Get available days with times converted for display
  const getAvailableDaysDisplay = () => {
    if (!availability?.blocks) return [];
    
    const needsConversion = consultantTimezone && effectiveClientTimezone && 
                           consultantTimezone !== effectiveClientTimezone;
    
    return availability.blocks.map(block => {
      let displayStart = block.start;
      let displayEnd = block.end;
      
      if (needsConversion && selectedDate) {
        displayStart = convertTimeBetweenTimezones(block.start, consultantTimezone, effectiveClientTimezone, selectedDate);
        displayEnd = convertTimeBetweenTimezones(block.end, consultantTimezone, effectiveClientTimezone, selectedDate);
      }
      
      return {
        day: block.day,
        start: displayStart,
        end: displayEnd,
      };
    });
  };

  const availableDaysDisplay = getAvailableDaysDisplay();
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

  // Handle duration selection
  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration);
    setSelectedTimeSlot(null); // Reset time slot when duration changes
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    if (isSlotBooked(slot)) return;
    setSelectedTimeSlot(slot);
  };

  // Format time for display
  const formatTime = (t) => {
    const h = Math.floor(t);
    const m = Math.round((t % 1) * 60);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
  };

  // Convert client's selected time back to consultant's timezone for storage
  const convertBackToConsultantTime = (clientTime) => {
    const needsConversion = consultantTimezone && effectiveClientTimezone && 
                           consultantTimezone !== effectiveClientTimezone;
    
    if (!needsConversion) return clientTime;
    
    return convertTimeBetweenTimezones(
      clientTime, 
      effectiveClientTimezone, 
      consultantTimezone, 
      selectedDate
    );
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !clientId) {
      setError('Please select a date, duration, and time slot.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Convert times back to consultant's timezone for storage
      const startTimeToStore = convertBackToConsultantTime(selectedTimeSlot.start);
      const endTimeToStore = convertBackToConsultantTime(selectedTimeSlot.end);

      const bookingData = {
        consultantId,
        clientId,
        clientName: clientName || 'Client',
        clientEmail: clientEmail || '',
        day: selectedDay,
        date: selectedDate,
        startTime: startTimeToStore,  // Stored in consultant's timezone
        endTime: endTimeToStore,      // Stored in consultant's timezone
        duration: selectedDuration,
        consultantTimezone: consultantTimezone || 'UTC',
        clientTimezone: effectiveClientTimezone,
        // Store display times for reference
        clientDisplayStart: selectedTimeSlot.start,
        clientDisplayEnd: selectedTimeSlot.end,
        status: 'pending',
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confirmedAt: null,
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
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
    setSelectedDuration(30);
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

  const showTimezoneNote = consultantTimezone && effectiveClientTimezone && 
                          consultantTimezone !== effectiveClientTimezone;

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
                  {showTimezoneNote && (
                    <div style={styles.timezoneNote}>
                      🌍 Times shown in your timezone ({getTimezoneAbbr(effectiveClientTimezone)})
                    </div>
                  )}
                </div>
              )}

              <p style={styles.subtitle}>
                Select a day, choose your desired duration, then pick a date and time.
              </p>

              {/* Step 1: Select Day */}
              <div>
                <label style={styles.label}>Step 1: Select a day</label>
                <div style={styles.dayGrid}>
                  {DAYS.map((day) => {
                    const isAvailable = availableDays.includes(day);
                    const dayBlock = availableDaysDisplay.find(b => b.day === day);
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

              {/* Step 3: Select Duration */}
              {selectedDay && selectedDate && (
                <div style={styles.durationSection}>
                  <label style={styles.label}>Step 3: Select duration</label>
                  <div style={styles.durationGrid}>
                    {DURATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        style={{
                          ...styles.durationBtn,
                          ...(selectedDuration === option.value && styles.durationBtnSelected),
                        }}
                        onClick={() => handleDurationSelect(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Select Time Slot */}
              {selectedDay && selectedDate && selectedDuration && (
                <div>
                  <label style={styles.label}>Step 4: Select a time slot</label>
                  {timeSlots.length === 0 ? (
                    <p style={styles.errorText}>
                      No {selectedDuration}-minute slots available on this date. Try a different duration or date.
                    </p>
                  ) : (
                    <div style={styles.timeSlotGrid}>
                      {timeSlots.map((slot, idx) => {
                        const booked = isSlotBooked(slot);
                        const selected = selectedTimeSlot?.start === slot.start && 
                                       selectedTimeSlot?.end === slot.end;
                        
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
                            {formatTime(slot.start)}
                            {booked && <div style={{ fontSize: 11, marginTop: 2 }}>Booked</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Selected slot confirmation */}
              {selectedTimeSlot && selectedDate && (
                <div style={styles.selectedSlotInfo}>
                  <strong>Selected:</strong> {selectedDay}, {selectedDate} at {formatTime(selectedTimeSlot.start)} - {formatTime(selectedTimeSlot.end)} ({selectedDuration} min)
                  {showTimezoneNote && (
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      Your timezone: {getTimezoneAbbr(effectiveClientTimezone)}
                    </div>
                  )}
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