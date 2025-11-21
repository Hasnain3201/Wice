import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef9e7',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1e293b',
    minWidth: 180,
  },
  navButtons: {
    display: 'flex',
    gap: 8,
  },
  navBtn: {
    padding: 8,
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggle: {
    display: 'flex',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 4,
    border: '1px solid #e5e7eb',
  },
  viewBtn: {
    padding: '6px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: '#64748b',
    transition: 'all 0.2s',
  },
  viewBtnActive: {
    backgroundColor: '#1e293b',
    color: '#fff',
  },
  daysHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fef9e7',
  },
  dayName: {
    padding: 12,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridAutoRows: 'minmax(100px, auto)',
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridAutoRows: 'minmax(120px, auto)',
  },
  dayCell: {
    border: '1px solid #e5e7eb',
    padding: 8,
    minHeight: 100,
    backgroundColor: '#fff',
    position: 'relative',
  },
  dayCellOtherMonth: {
    backgroundColor: '#f8fafc',
    opacity: 0.6,
  },
  dayCellToday: {
    backgroundColor: '#fef3c7',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 4,
  },
  dayNumberOtherMonth: {
    color: '#94a3b8',
  },
  todayBadge: {
    display: 'inline-block',
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 999,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: '24px',
    fontSize: 13,
  },
  eventsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginTop: 4,
  },
  event: {
    padding: '4px 6px',
    backgroundColor: '#334155',
    color: '#fff',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s',
  },
  eventTime: {
    fontWeight: 600,
    marginRight: 4,
  },
  moreEvents: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    cursor: 'pointer',
  },
};

export default function CalendarView({ bookings, userRole }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  const formatTime = (t) => {
    const h = Math.floor(t);
    const m = (t % 1) * 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}${m === 0 ? '' : ':' + m.toString().padStart(2, '0')}${ampm}`;
  };

  const getEventTitle = (booking) => {
    if (booking.title) {
      return booking.title;
    }
    if (userRole === 'consultant') {
      return `Meeting with ${booking.clientName || 'Client'}`;
    } else {
      return `Meeting with Consultant`;
    }
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === dateStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderTitle = () => {
    if (view === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      const weekDays = getWeekDays();
      const start = weekDays[0];
      const end = weekDays[6];
      
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
      }
    }
  };

  const renderDayCell = (date) => {
    const dayBookings = getBookingsForDate(date);
    const today = isToday(date);
    const sameMonth = isSameMonth(date);
    const maxVisible = view === 'month' ? 2 : 4;
    
    return (
      <div
        key={date.toISOString()}
        style={{
          ...styles.dayCell,
          ...(today && styles.dayCellToday),
          ...(!sameMonth && view === 'month' && styles.dayCellOtherMonth),
        }}
      >
        <div style={{
          ...styles.dayNumber,
          ...(!sameMonth && view === 'month' && styles.dayNumberOtherMonth),
        }}>
          {today ? (
            <span style={styles.todayBadge}>{date.getDate()}</span>
          ) : (
            date.getDate()
          )}
        </div>
        
        <div style={styles.eventsContainer}>
          {dayBookings.slice(0, maxVisible).map((booking, idx) => (
            <div key={booking.id || idx} style={styles.event} title={getEventTitle(booking)}>
              <span style={styles.eventTime}>{formatTime(booking.startTime)}</span>
              {getEventTitle(booking)}
            </div>
          ))}
          {dayBookings.length > maxVisible && (
            <div style={styles.moreEvents}>
              +{dayBookings.length - maxVisible} more
            </div>
          )}
        </div>
      </div>
    );
  };

  const days = view === 'month' ? getMonthDays() : getWeekDays();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.monthTitle}>{getHeaderTitle()}</div>
          <div style={styles.navButtons}>
            <button style={styles.navBtn} onClick={goToPrevious}>
              <ChevronLeft size={20} />
            </button>
            <button style={styles.navBtn} onClick={goToToday}>
              Today
            </button>
            <button style={styles.navBtn} onClick={goToNext}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.viewBtn,
              ...(view === 'month' && styles.viewBtnActive),
            }}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button
            style={{
              ...styles.viewBtn,
              ...(view === 'week' && styles.viewBtnActive),
            }}
            onClick={() => setView('week')}
          >
            Week
          </button>
        </div>
      </div>

      <div style={styles.daysHeader}>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} style={styles.dayName}>{day}</div>
        ))}
      </div>

      <div style={view === 'month' ? styles.monthGrid : styles.weekGrid}>
        {days.map(date => renderDayCell(date))}
      </div>
    </div>
  );
}