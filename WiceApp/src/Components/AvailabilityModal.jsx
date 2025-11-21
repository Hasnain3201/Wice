import { useState, useRef, useCallback, useEffect } from 'react';
import { db } from '../firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_HEIGHT = 20;

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
    maxWidth: 1000,
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
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  saveBtn: {
    padding: '10px 24px',
    backgroundColor: '#1e293b',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
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
  savingText: {
    fontSize: 13,
    color: '#64748b',
  },
};

export default function AvailabilityModal({ isOpen, onClose, userId }) {
  const [blocks, setBlocks] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [creating, setCreating] = useState(null);
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const gridRef = useRef(null);
  const nextId = useRef(1);
  const originalBlocks = useRef([]);

  // Load existing availability from Firestore when modal opens
  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadAvailability = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'availabilities', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.blocks && Array.isArray(data.blocks)) {
            const loadedBlocks = data.blocks.map((b, idx) => ({
              ...b,
              day: DAYS.indexOf(b.day),
              id: idx + 1
            }));
            setBlocks(loadedBlocks);
            originalBlocks.current = JSON.parse(JSON.stringify(loadedBlocks));
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
  }, [isOpen, userId]);

  // Track changes
  useEffect(() => {
    if (isLoading) return;
    const changed = JSON.stringify(blocks) !== JSON.stringify(originalBlocks.current);
    setHasUnsavedChanges(changed);
  }, [blocks, isLoading]);

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

  const handleSave = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      const availabilityData = {
        blocks: blocks.map(b => ({
          day: DAYS[b.day],
          start: b.start,
          end: b.end
        })),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'availabilities', userId), availabilityData);
      originalBlocks.current = JSON.parse(JSON.stringify(blocks));
      setHasUnsavedChanges(false);
      console.log('Availability saved:', availabilityData);
      
      // Close modal after successful save
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

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

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleCancel}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>Update Your Availability</h2>
          <button style={styles.closeBtn} onClick={handleCancel}>×</button>
        </div>

        <div style={styles.body}>
          {isLoading ? (
            <p style={styles.subtitle}>Loading availability...</p>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div style={styles.footer}>
          <div>
            {isSaving && <span style={styles.savingText}>Saving...</span>}
            {hasUnsavedChanges && !isSaving && (
              <span style={styles.savingText}>You have unsaved changes</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
            <button 
              style={{...styles.saveBtn, opacity: isSaving ? 0.6 : 1 }}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}