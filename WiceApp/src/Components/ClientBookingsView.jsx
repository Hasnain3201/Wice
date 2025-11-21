import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';

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
  bookingCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  consultantInfo: {
    flex: 1,
  },
  consultantName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 4,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
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
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#dc2626',
    border: '1px solid #dc2626',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
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
  helpText: {
    fontSize: 14,
    color: '#64748b',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    marginBottom: 16,
  },
};

export default function ClientBookingsView({ clientId }) {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [declinedBookings, setDeclinedBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    loadBookings();
  }, [clientId]);

  const loadBookings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('clientId', '==', clientId)
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

      const sortByDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
      setPendingBookings(pending.sort(sortByDate));
      setConfirmedBookings(confirmed.sort(sortByDate));
      setDeclinedBookings(declined.sort(sortByDate));
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) {
      return;
    }

    setDeletingId(bookingId);
    setError('');
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
      await loadBookings();
    } catch (err) {
      console.error('Error canceling booking:', err);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setDeletingId(null);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle size={14} />;
      case 'confirmed':
        return <CheckCircle size={14} />;
      case 'declined':
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const renderBookingCard = (booking, showActions = false) => (
    <div key={booking.id} style={styles.bookingCard}>
      <div style={styles.bookingHeader}>
        <div style={styles.consultantInfo}>
          <div style={styles.consultantName}>
            Meeting with Consultant
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
          {getStatusIcon(booking.status)}
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
          <div style={styles.notesLabel}>Your Notes</div>
          <div style={styles.notesText}>{booking.notes}</div>
        </div>
      )}

      {showActions && (
        <div style={styles.actions}>
          <button
            style={styles.deleteBtn}
            onClick={() => handleCancelBooking(booking.id)}
            disabled={deletingId === booking.id}
          >
            <Trash2 size={16} />
            {deletingId === booking.id ? 'Canceling...' : 'Cancel Request'}
          </button>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <div style={styles.loadingText}>Loading your bookings...</div>;
  }

  return (
    <div style={styles.container}>
      {error && <div style={styles.errorText}>{error}</div>}

      {/* Pending Bookings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Pending Requests ({pendingBookings.length})
        </h2>
        <div style={styles.helpText}>
          These booking requests are waiting for the consultant to confirm.
        </div>
        {pendingBookings.length === 0 ? (
          <div style={styles.emptyState}>
            <AlertCircle size={48} style={styles.emptyIcon} />
            <div style={styles.emptyText}>No pending booking requests</div>
          </div>
        ) : (
          pendingBookings.map(booking => renderBookingCard(booking, true))
        )}
      </div>

      {/* Confirmed Bookings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Confirmed Bookings ({confirmedBookings.length})
        </h2>
        <div style={styles.helpText}>
          These meetings have been confirmed by the consultant.
        </div>
        {confirmedBookings.length === 0 ? (
          <div style={styles.emptyState}>
            <CheckCircle size={48} style={styles.emptyIcon} />
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
            Declined Requests ({declinedBookings.length})
          </h2>
          <div style={styles.helpText}>
            These booking requests were declined by the consultant.
          </div>
          {declinedBookings.map(booking => renderBookingCard(booking, false))}
        </div>
      )}
    </div>
  );
}