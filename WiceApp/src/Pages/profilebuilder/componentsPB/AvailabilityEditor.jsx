import { useState, useRef, useCallback, useEffect } from 'react';
import { db } from '../../../firebase'; // Adjust this path to your firebase config file
import { doc, setDoc, getDoc } from 'firebase/firestore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_HEIGHT = 20;

const styles = {
  container: {
    userSelect: 'none',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    paddingBottom: 12,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  chevron: {
    color: '#64748b',
    fontSize: 12,
    transition: 'transform 0.2s',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 16,
    marginTop: 0,
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
  },
  addBtn: {
    padding: '8px 16px',
    backgroundColor: '#1e293b',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#334155',
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 4,
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
  },
  gridWrapper: {
    display: 'flex',
    backgroundColor: '#fef9e7',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  timeColumn: {
    width: 50,
    backgroundColor: '#fef9e7',
    borderRight: '1px solid #e5e0c9',
    position: 'relative',
  },
  timeLabel: {
    position: 'absolute',
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
    paddingRight: 8,
    width: '100%',
    transform: 'translateY(-50%)',
  },
  dayColumn: {
    flex: 1,
    minWidth: 0,
  },
  dayHeader: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 0',
    backgroundColor: '#fef9e7',
    borderBottom: '1px solid #e5e0c9',
  },
  dayGrid: {
    position: 'relative',
    backgroundColor: '#fef9e7',
  },
  hourLine: {
    position: 'absolute',
    width: '100%',
    borderTop: '1px solid #e5e0c9',
  },
  block: {
    position: 'absolute',
    left: 2,
    right: 2,
    backgroundColor: '#334155',
    borderRadius: 4,
    cursor: 'move',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  blockTime: {
    padding: '2px 4px',
    fontSize: 11,
    color: '#fff',
    pointerEvents: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    fontSize: 14,
    color: '#fff',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  resizeHandle: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    cursor: 'ns-resize',
  },
  creatingBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    backgroundColor: '#64748b',
    opacity: 0.7,
    borderRadius: 4,
    pointerEvents: 'none',
  },
  summaryBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef9e7',
    borderRadius: 8,
    border: '1px solid #e5e0c9',
  },
  summaryTitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    marginTop: 0,
  },
  summaryEmpty: {
    color: '#64748b',
    fontSize: 13,
    margin: 0,
  },
  summaryTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 13,
    color: '#334155',
    border: '1px solid #e5e0c9',
  },
  summaryTagDelete: {
    color: '#94a3b8',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
    lineHeight: 1,
  },
  content: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
  },
};

export default function AvailabilityEditor({ userId, onSave }) {
  console.log("AvailabilityEditor userId:", userId)

  const [blocks, setBlocks] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [creating, setCreating] = useState(null);
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const gridRef = useRef(null);
  const nextId = useRef(1);

  // Load existing availability from Firestore on mount
  useEffect(() => {
    const loadAvailability = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'availabilities', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.blocks && Array.isArray(data.blocks)) {
            const loadedBlocks = data.blocks.map((b, idx) => ({
              ...b,
              day: DAYS.indexOf(b.day), // Convert 'Mon' back to index 1
              id: idx + 1
            }));
            setBlocks(loadedBlocks);
            nextId.current = loadedBlocks.length + 1;
          }
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, [userId]);

  // Save blocks to Firestore whenever they change
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    const saveToFirestore = async () => {
      if (!userId) return;
      
      setIsSaving(true);
      
      try {
        const availabilityData = {
          blocks: blocks.map(b => ({
            day: DAYS[b.day], // Store as 'Mon', 'Tue', etc.
            start: b.start,
            end: b.end
          })),
          updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'availabilities', userId), availabilityData);
        
        if (onSave) {
          onSave(availabilityData);
        }
        
        console.log('Availability saved:', availabilityData);
      } catch (error) {
        console.error('Error saving availability:', error);
      } finally {
        setIsSaving(false);
      }
    };

    const timeoutId = setTimeout(saveToFirestore, 1000);
    return () => clearTimeout(timeoutId);
  }, [blocks, userId, onSave, isLoading]);

  const getTimeFromY = useCallback((y, dayEl) => {
    const rect = dayEl.getBoundingClientRect();
    const relY = y - rect.top;
    return Math.max(0, Math.min(24, Math.round((relY / SLOT_HEIGHT) * 2) / 2));
  }, []);

  const handleMouseDown = (e, block) => {
    if (e.target.dataset.resize) {
      setResizing({ id: block.id, edge: e.target.dataset.resize, startY: e.clientY, orig: block });
    } else {
      setDragging({ id: block.id, offsetY: e.clientY, orig: block });
    }
    e.stopPropagation();
  };

  const handleGridMouseDown = (e, dayIdx) => {
    if (e.target.closest('[data-block]')) return;
    const dayEl = e.currentTarget;
    const time = getTimeFromY(e.clientY, dayEl);
    setCreating({ day: dayIdx, start: time, end: time + 0.5, dayEl });
  };

  const handleMouseMove = useCallback((e) => {
    if (dragging) {
      const delta = (e.clientY - dragging.offsetY) / SLOT_HEIGHT;
      const newStart = Math.max(0, Math.min(23.5, dragging.orig.start + delta));
      const duration = dragging.orig.end - dragging.orig.start;
      const snappedStart = Math.round(newStart * 2) / 2;
      const newEnd = Math.min(24, snappedStart + duration);
      setBlocks(b => b.map(bl => bl.id === dragging.id ? { ...bl, start: snappedStart, end: newEnd } : bl));
    } else if (resizing) {
      const dayEl = gridRef.current?.querySelector(`[data-day="${blocks.find(b => b.id === resizing.id)?.day}"]`);
      if (!dayEl) return;
      const time = getTimeFromY(e.clientY, dayEl);
      setBlocks(b => b.map(bl => {
        if (bl.id !== resizing.id) return bl;
        if (resizing.edge === 'top') {
          const newStart = Math.min(time, bl.end - 0.5);
          return { ...bl, start: Math.max(0, newStart) };
        } else {
          const newEnd = Math.max(time, bl.start + 0.5);
          return { ...bl, end: Math.min(24, newEnd) };
        }
      }));
    } else if (creating) {
      const time = getTimeFromY(e.clientY, creating.dayEl);
      setCreating(c => ({
        ...c,
        end: Math.max(c.start + 0.5, Math.min(24, time))
      }));
    }
  }, [dragging, resizing, creating, blocks, getTimeFromY]);

  const handleMouseUp = useCallback(() => {
    if (creating && creating.end > creating.start) {
      setBlocks(b => [...b, { id: nextId.current++, day: creating.day, start: creating.start, end: creating.end }]);
    }
    setDragging(null);
    setResizing(null);
    setCreating(null);
  }, [creating]);

  const deleteBlock = (id, e) => {
    e.stopPropagation();
    setBlocks(b => b.filter(bl => bl.id !== id));
  };

  const addBlock = () => {
    setBlocks(b => [...b, { id: nextId.current++, day: 0, start: 9, end: 10 }]);
  };

  const clearAll = () => setBlocks([]);

  const formatTime = (t) => {
    const h = Math.floor(t);
    const m = (t % 1) * 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
  };

  const formatHourLabel = (h) => {
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}${ampm}`;
  };

  const gridHeight = SLOT_HEIGHT * 24;

  if (isLoading) {
    return (
      <div style={styles.container}>
        <p style={styles.subtitle}>Loading availability...</p>
      </div>
    );
  }

  return (
    <div
      style={styles.container}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div style={styles.titleRow}>
          <span style={{ ...styles.chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          <h3 style={styles.title}>Availability Schedule</h3>
          {isSaving && <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>Saving...</span>}
        </div>
      </div>

      <div style={{ ...styles.content, maxHeight: isOpen ? 1000 : 0 }}>
        <p style={styles.subtitle}>
          Click and drag on the calendar to add availability blocks. Drag blocks to move them, or drag edges to resize.
        </p>

        <div style={styles.buttonRow}>
          <button style={styles.addBtn} onClick={addBlock}>+ Add Block</button>
          <button style={styles.clearBtn} onClick={clearAll}>Clear All</button>
        </div>

        <div ref={gridRef} style={styles.gridWrapper}>
          <div style={{ ...styles.timeColumn, height: gridHeight + 33 }}>
            {HOURS.map(h => (
              <div key={h} style={{ ...styles.timeLabel, top: 33 + h * SLOT_HEIGHT }}>
                {formatHourLabel(h)}
              </div>
            ))}
          </div>
          {DAYS.map((day, dayIdx) => (
            <div key={day} style={styles.dayColumn}>
              <div style={styles.dayHeader}>{day}</div>
              <div
                data-day={dayIdx}
                style={{ ...styles.dayGrid, height: gridHeight }}
                onMouseDown={(e) => handleGridMouseDown(e, dayIdx)}
              >
                {HOURS.map(h => (
                  <div key={h} style={{ ...styles.hourLine, top: h * SLOT_HEIGHT }} />
                ))}
                {blocks.filter(b => b.day === dayIdx).map(block => (
                  <div
                    key={block.id}
                    data-block
                    style={{
                      ...styles.block,
                      top: block.start * SLOT_HEIGHT + 1,
                      height: (block.end - block.start) * SLOT_HEIGHT - 2,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, block)}
                    onMouseEnter={() => setHoveredBlock(block.id)}
                    onMouseLeave={() => setHoveredBlock(null)}
                  >
                    <div data-resize="top" style={{ ...styles.resizeHandle, top: 0 }} />
                    <div style={styles.blockTime}>{formatTime(block.start)}</div>
                    <button
                      style={{ ...styles.deleteBtn, opacity: hoveredBlock === block.id ? 1 : 0 }}
                      onClick={(e) => deleteBlock(block.id, e)}
                    >
                      ×
                    </button>
                    <div data-resize="bottom" style={{ ...styles.resizeHandle, bottom: 0 }} />
                  </div>
                ))}
                {creating && creating.day === dayIdx && (
                  <div
                    style={{
                      ...styles.creatingBlock,
                      top: creating.start * SLOT_HEIGHT,
                      height: (creating.end - creating.start) * SLOT_HEIGHT,
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.summaryBox}>
          <p style={styles.summaryTitle}>Current Availability</p>
          {blocks.length === 0 ? (
            <p style={styles.summaryEmpty}>No availability blocks added yet.</p>
          ) : (
            <div style={styles.summaryTags}>
              {blocks.map(b => (
                <span key={b.id} style={styles.summaryTag}>
                  {DAYS[b.day]} {formatTime(b.start)} - {formatTime(b.end)}
                  <button style={styles.summaryTagDelete} onClick={(e) => deleteBlock(b.id, e)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}