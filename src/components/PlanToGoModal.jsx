import { useState } from 'react';

const getDefaultTime = () => {
  const now = new Date();
  const minutes = Math.ceil((now.getMinutes() + 1) / 15) * 15;
  const adjusted = new Date(now);
  adjusted.setMinutes(minutes, 0, 0);
  return `${adjusted.getHours().toString().padStart(2, '0')}:${adjusted.getMinutes().toString().padStart(2, '0')}`;
};

const PlanToGoModal = ({ court, playerName, onSubmit, onClose }) => {
  const [time, setTime] = useState(getDefaultTime);
  const [duration, setDuration] = useState('2');
  const [gameType, setGameType] = useState('Open run');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!time || submitting) return;
    setSubmitting(true);
    const [h, m] = time.split(':').map(Number);
    const arrival = new Date();
    arrival.setHours(h, m, 0, 0);
    if (arrival <= new Date()) arrival.setDate(arrival.getDate() + 1);
    await onSubmit({ court, arrivalTime: arrival.toISOString(), duration, gameType, message: message.trim() });
    setSubmitting(false);
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <div style={S.title}>Planning to Go</div>
            <div style={S.courtName}>{court.name}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.fields}>
          <div style={S.field}>
            <label style={S.label}>Arrival time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={S.input}
            />
          </div>

          <div style={S.fieldRow}>
            <div style={{ ...S.field, flex: 1 }}>
              <label style={S.label}>How long?</label>
              <select value={duration} onChange={e => setDuration(e.target.value)} style={S.select}>
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="all">All day</option>
              </select>
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <label style={S.label}>Game type</label>
              <select value={gameType} onChange={e => setGameType(e.target.value)} style={S.select}>
                <option>3v3</option>
                <option>5v5</option>
                <option>21</option>
                <option>Open run</option>
              </select>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>
              Message <span style={S.optional}>(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 120))}
              placeholder="e.g. Bringing 4 players, need 2 more"
              style={S.textarea}
              rows={2}
            />
          </div>
        </div>

        <div style={S.actions}>
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            style={{ ...S.submitBtn, ...(submitting ? S.btnDisabled : {}) }}
            onClick={handleSubmit}
            disabled={submitting || !time}
          >
            {submitting ? 'Saving...' : "🗓️ I'm Going"}
          </button>
        </div>
      </div>
    </div>
  );
};

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(3px)',
    zIndex: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '380px',
    background: '#ffffff',
    borderRadius: '18px',
    border: '1px solid #e5e5e5',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '18px 18px 14px',
    borderBottom: '1px solid #f0f0f0',
  },
  title: { fontSize: '17px', fontWeight: '800', color: '#1a1a1a' },
  courtName: { fontSize: '12px', color: '#ff6b1a', fontWeight: '600', marginTop: '2px' },
  closeBtn: {
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    color: '#999',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13px',
    flexShrink: 0,
  },
  fields: {
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '13px',
  },
  fieldRow: {
    display: 'flex',
    gap: '10px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  optional: {
    fontWeight: '400',
    textTransform: 'none',
    color: '#ccc',
    letterSpacing: 0,
  },
  input: {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#1a1a1a',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  select: {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#1a1a1a',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  textarea: {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#1a1a1a',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'none',
    width: '100%',
    boxSizing: 'border-box',
    lineHeight: 1.5,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.6fr',
    gap: '10px',
    padding: '14px 18px 18px',
    borderTop: '1px solid #f0f0f0',
  },
  cancelBtn: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e5e5e5',
    background: '#f5f5f5',
    color: '#999',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  submitBtn: {
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: '#ff6b1a',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
};

export default PlanToGoModal;
