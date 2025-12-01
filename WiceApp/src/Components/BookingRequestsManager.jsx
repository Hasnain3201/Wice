import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Calendar, Clock, User, Mail, MessageSquare, Check, X } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  },
  emptyIcon: {
    color: '#94a3b8',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  requestCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    transition: 'box-shadow 0.2s',
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusConfirmed: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusDeclined: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#334155',
  },
  detailIcon: {
    color: '#64748b',
  },
  notesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    border: '1px solid #e5e7eb',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  notesText: {
    fontSize: 14,
    color: '#1e293b',
    whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid #e5e7eb',
  },
  confirmBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  declineBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  loadingText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    padding: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    marginTop: 8,
  },
};

export default function BookingRequestsManager({ consultantId }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [declinedBookings, setDeclinedBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Load all bookings for this consultant
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('consultantId', '==', consultantId)
      );
      const snapshot = await getDocs(bookingsQuery);
      
      const pending = [];
      const confirmed = [];
      const declined = [];

      snapshot.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.status === 'pending') {
          pending.push(data);
        } else if (data.status === 'confirmed') {
          confirmed.push(data);
        } else if (data.status === 'declined') {
          declined.push(data);
        }
      });

      // Sort by date (most recent first)
      const sortByDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
      setPendingRequests(pending.sort(sortByDate));
      setConfirmedBookings(confirmed.sort(sortByDate));
      setDeclinedBookings(declined.sort(sortByDate));
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [consultantId]);
  useEffect(() => {
    if (!consultantId) return;
    loadBookings();
  }, [consultantId, loadBookings]);

  const handleConfirm = async (bookingId) => {
    setProcessingId(bookingId);
    setError('');
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await loadBookings();
    } catch (err) {
      console.error('Error confirming booking:', err);
      setError('Failed to confirm booking. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (bookingId) => {
    setProcessingId(bookingId);
    setError('');
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'declined',
        updatedAt: new Date().toISOString(),
      });
      await loadBookings();
    } catch (err) {
      console.error('Error declining booking:', err);
      setError('Failed to decline booking. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (t) => {
    const h = Math.floor(t);
    const m = (t % 1) * 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderBookingCard = (booking, showActions = false) => (
    <div key={booking.id} style={styles.requestCard}>
      <div style={styles.requestHeader}>
        <div style={styles.clientInfo}>
          <div style={styles.clientName}>{booking.clientName || 'Client'}</div>
          <div style={styles.clientEmail}>
            <Mail size={14} style={styles.detailIcon} />
            {booking.clientEmail || 'No email provided'}
          </div>
        </div>
        <div
          style={{
            ...styles.statusBadge,
            ...(booking.status === 'pending' && styles.statusPending),
            ...(booking.status === 'confirmed' && styles.statusConfirmed),
            ...(booking.status === 'declined' && styles.statusDeclined),
          }}
        >
          {booking.status}
        </div>
      </div>

      <div style={styles.detailsGrid}>
        <div style={styles.detailItem}>
          <Calendar size={16} style={styles.detailIcon} />
          {formatDate(booking.date)}
        </div>
        <div style={styles.detailItem}>
          <Clock size={16} style={styles.detailIcon} />
          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
        </div>
      </div>

      {booking.notes && (
        <div style={styles.notesSection}>
          <div style={styles.notesLabel}>Client Notes</div>
          <div style={styles.notesText}>{booking.notes}</div>
        </div>
      )}

      {showActions && booking.status === 'pending' && (
        <div style={styles.actions}>
          <button
            style={styles.confirmBtn}
            onClick={() => handleConfirm(booking.id)}
            disabled={processingId === booking.id}
          >
            <Check size={16} />
            {processingId === booking.id ? 'Confirming...' : 'Confirm'}
          </button>
          <button
            style={styles.declineBtn}
            onClick={() => handleDecline(booking.id)}
            disabled={processingId === booking.id}
          >
            <X size={16} />
            {processingId === booking.id ? 'Declining...' : 'Decline'}
          </button>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <div style={styles.loadingText}>Loading bookings...</div>;
  }

  return (
    <div style={styles.container}>
      {error && <div style={styles.errorText}>{error}</div>}

      {/* Pending Requests */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Pending Requests ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <div style={styles.emptyState}>
            <Calendar size={48} style={styles.emptyIcon} />
            <div style={styles.emptyText}>No pending booking requests</div>
          </div>
        ) : (
          pendingRequests.map(booking => renderBookingCard(booking, true))
        )}
      </div>

      {/* Confirmed Bookings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Confirmed Bookings ({confirmedBookings.length})
        </h2>
        {confirmedBookings.length === 0 ? (
          <div style={styles.emptyState}>
            <Check size={48} style={styles.emptyIcon} />
            <div style={styles.emptyText}>No confirmed bookings yet</div>
          </div>
        ) : (
          confirmedBookings.map(booking => renderBookingCard(booking, false))
        )}
      </div>

      {/* Declined Bookings */}
      {declinedBookings.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Declined Bookings ({declinedBookings.length})
          </h2>
          {declinedBookings.map(booking => renderBookingCard(booking, false))}
        </div>
      )}
    </div>
  );
}
