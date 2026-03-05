import { useState } from 'react';
import LegalModal from './LegalModal';

const Profile = ({ playerName, setPlayerName, checkedInCourt, checkInTime, onCheckOut, onClose, isMobile }) => {
  const [editing, setEditing] = useState(!playerName);
  const [draft, setDraft] = useState(playerName);
  const [legalPage, setLegalPage] = useState(null);

  const save = () => {
    if (draft.trim()) {
      setPlayerName(draft.trim());
      setEditing(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (date) => {
    if (!date) return '';
    const mins = Math.round((Date.now() - new Date(date)) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const initials = playerName ? playerName.slice(0, 2).toUpperCase() : '?';

  return (
    <div style={styles.overlay} onClick={onClose}>
      {legalPage && <LegalModal page={legalPage} onClose={() => setLegalPage(null)} />}
      <div style={{ ...styles.panel, width: isMobile ? '100%' : '320px' }} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>Profile</span>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.avatarSection}>
          <div style={styles.avatar}>
            <span style={styles.avatarText}>{initials}</span>
          </div>
          {editing ? (
            <div style={styles.editRow}>
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()}
                placeholder="Your name / handle..."
                style={styles.nameInput}
              />
              <button onClick={save} disabled={!draft.trim()} style={styles.saveBtn}>Save</button>
            </div>
          ) : (
            <div style={styles.nameRow}>
              <span style={styles.name}>{playerName || 'No name set'}</span>
              <button onClick={() => setEditing(true)} style={styles.editBtn}>Edit</button>
            </div>
          )}
        </div>

        <div style={styles.divider} />

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Current Session</div>
          {checkedInCourt ? (
            <div style={styles.checkinCard}>
              <div style={styles.checkinLive}>
                <div style={styles.liveDot} />
                <span style={styles.liveText}>Live</span>
              </div>
              <div style={styles.checkinCourt}>{checkedInCourt.name}</div>
              <div style={styles.checkinMeta}>
                Checked in at {formatTime(checkInTime)} · {formatDuration(checkInTime)} ago
              </div>
              <button onClick={() => { onCheckOut(); onClose(); }} style={styles.checkoutBtn}>
                Check Out
              </button>
            </div>
          ) : (
            <div style={styles.noSession}>
              <span style={{ fontSize: '28px' }}>🏀</span>
              <span style={styles.noSessionText}>Not checked in anywhere</span>
            </div>
          )}
        </div>

        <div style={styles.divider} />

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Today</div>
          <div style={styles.statRow}>
            <div style={styles.statItem}>
              <div style={styles.statVal}>{checkedInCourt ? '1' : '0'}</div>
              <div style={styles.statLbl}>Courts visited</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statVal}>{checkInTime ? formatDuration(checkInTime) : '—'}</div>
              <div style={styles.statLbl}>Time on court</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statVal}>{checkedInCourt ? checkedInCourt.checkedIn : '—'}</div>
              <div style={styles.statLbl}>Players around</div>
            </div>
          </div>
        </div>

        <div style={styles.legalSection}>
          <button onClick={() => setLegalPage('tos')} style={styles.legalLink}>Terms of Service</button>
          <span style={styles.legalDot}>·</span>
          <button onClick={() => setLegalPage('privacy')} style={styles.legalLink}>Privacy Policy</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', justifyContent: 'flex-end' },
  panel: { width: '320px', height: '100%', background: '#ffffff', borderLeft: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.22s ease', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.10)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #e5e5e5' },
  headerTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a1a' },
  closeBtn: { background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit', padding: '4px' },
  avatarSection: { padding: '28px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' },
  avatar: { width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(255,107,26,0.10)', border: '2px solid rgba(255,107,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: '26px', fontWeight: '900', color: '#ff6b1a' },
  nameRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  name: { fontSize: '18px', fontWeight: '700', color: '#1a1a1a' },
  editBtn: { background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '6px', color: '#999', fontSize: '11px', fontWeight: '600', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' },
  editRow: { display: 'flex', gap: '8px', width: '100%' },
  nameInput: { flex: 1, background: '#f5f5f5', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '9px 12px', color: '#1a1a1a', fontSize: '14px', fontFamily: 'inherit', outline: 'none' },
  saveBtn: { padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#ff6b1a', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' },
  divider: { height: '1px', background: '#f0f0f0', margin: '0 20px' },
  section: { padding: '20px' },
  sectionLabel: { fontSize: '11px', fontWeight: '700', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' },
  checkinCard: { background: '#fafafa', border: '1px solid rgba(255,107,26,0.15)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' },
  checkinLive: { display: 'flex', alignItems: 'center', gap: '6px' },
  liveDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-ring 1.5s ease infinite' },
  liveText: { fontSize: '11px', fontWeight: '700', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' },
  checkinCourt: { fontSize: '16px', fontWeight: '700', color: '#1a1a1a' },
  checkinMeta: { fontSize: '12px', color: '#999' },
  checkoutBtn: { marginTop: '8px', padding: '9px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  noSession: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#f9f9f9', borderRadius: '12px', border: '1px solid #f0f0f0' },
  noSessionText: { fontSize: '13px', color: '#999' },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  statItem: { background: '#f9f9f9', border: '1px solid #f0f0f0', borderRadius: '10px', padding: '12px 8px', textAlign: 'center' },
  statVal: { fontSize: '20px', fontWeight: '800', color: '#ff6b1a', marginBottom: '4px' },
  statLbl: { fontSize: '10px', color: '#999', lineHeight: 1.3 },
  legalSection: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 20px 24px', marginTop: 'auto' },
  legalLink: { background: 'transparent', border: 'none', color: '#bbb', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 },
  legalDot: { color: '#ddd', fontSize: '12px' },
};

export default Profile;
