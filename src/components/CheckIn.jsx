import { useState } from 'react';
import { getCourtStatus } from '../data/courts';
import LegalModal from './LegalModal';

const CheckIn = ({ courts, checkedInCourt, setCheckedInCourt, checkInTime, playerName: savedName, setPlayerName: persistName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playerName, setPlayerName] = useState(savedName || '');
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingCourt, setPendingCourt] = useState(null);
  const [localCheckInTime, setLocalCheckInTime] = useState(null);
  const effectiveCheckInTime = checkInTime || localCheckInTime;
  const [duration, setDuration] = useState('2');
  const [showSuccess, setShowSuccess] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [legalPage, setLegalPage] = useState(null);

  const checkedInCourtData = courts.find(c => c.id === checkedInCourt);

  const filtered = courts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckInClick = (court) => {
    setPendingCourt(court);
    setShowNameInput(true);
    setTosChecked(false);
  };

  const handleConfirmCheckIn = () => {
    if (!playerName.trim()) return;
    persistName(playerName.trim());
    setCheckedInCourt(pendingCourt.id, duration, playerName.trim());
    setLocalCheckInTime(new Date());
    setShowNameInput(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCheckOut = () => {
    setCheckedInCourt(null);
    setPendingCourt(null);
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.wrapper}>
      {/* Success Toast */}
      {showSuccess && (
        <div style={styles.toast}>
          <span style={{ fontSize: '18px' }}>🎉</span>
          <div>
            <div style={styles.toastTitle}>Checked in!</div>
            <div style={styles.toastSub}>You're at {pendingCourt?.name}</div>
          </div>
        </div>
      )}

      {/* Currently Checked In */}
      {checkedInCourtData && (
        <div style={styles.activeCheckin}>
          <div style={styles.activeHeader}>
            <div style={styles.activePulse}>
              <div style={styles.pulseCore} />
              <div style={styles.pulseRing} />
            </div>
            <div>
              <div style={styles.activeLabel}>Currently at</div>
              <div style={styles.activeName}>{checkedInCourtData.name}</div>
            </div>
          </div>
          <div style={styles.activeDetails}>
            <div style={styles.activeDetail}>
              <span style={styles.detailIcon}>🕐</span>
              <span style={styles.detailText}>Checked in at {formatTime(effectiveCheckInTime)}</span>
            </div>
            <div style={styles.activeDetail}>
              <span style={styles.detailIcon}>⏱️</span>
              <span style={styles.detailText}>Playing for ~{duration}hrs</span>
            </div>
            <div style={styles.activeDetail}>
              <span style={styles.detailIcon}>👥</span>
              <span style={styles.detailText}>{checkedInCourtData.checkedIn + 1} players on court</span>
            </div>
          </div>
          <button onClick={handleCheckOut} style={styles.checkoutBtn}>
            Check Out
          </button>
        </div>
      )}

      {/* Legal Modal */}
      {legalPage && <LegalModal page={legalPage} onClose={() => setLegalPage(null)} />}

      {/* Name Input Modal */}
      {showNameInput && (
        <div style={styles.modalOverlay} onClick={() => setShowNameInput(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalIcon}>🏀</div>
            <h3 style={styles.modalTitle}>Check in to</h3>
            <p style={styles.modalCourtName}>{pendingCourt?.name}</p>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Your Name / Handle</label>
              <input
                type="text"
                placeholder="e.g. Hooper, MJ23..."
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmCheckIn()}
                style={styles.input}
                autoFocus
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>How long are you playing?</label>
              <div style={styles.durationRow}>
                {['1', '2', '3', '4+'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    style={{
                      ...styles.durationBtn,
                      ...(duration === d ? styles.durationBtnActive : {}),
                    }}
                  >
                    {d}hr{d !== '1' ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* ToS checkbox */}
            <button style={styles.tosRow} onClick={() => setTosChecked(c => !c)}>
              <div style={{ ...styles.tosCheckbox, ...(tosChecked ? styles.tosCheckboxOn : {}) }}>
                {tosChecked && <span style={styles.tosCheckmark}>✓</span>}
              </div>
              <span style={styles.tosText}>
                I agree to the{' '}
                <span
                  style={styles.tosLink}
                  onClick={e => { e.stopPropagation(); setLegalPage('tos'); }}
                >
                  Terms of Service
                </span>
              </span>
            </button>

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowNameInput(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckIn}
                disabled={!playerName.trim() || !tosChecked}
                style={{
                  ...styles.confirmBtn,
                  ...(playerName.trim() && tosChecked ? {} : styles.confirmBtnDisabled),
                }}
              >
                Check In ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Check In</h2>
        <p style={styles.subtitle}>Let the community know where you're balling</p>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search courts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Court list */}
      <div style={styles.list}>
        {filtered.map(court => {
          const status = getCourtStatus(court);
          const isCheckedIn = checkedInCourt === court.id;
          const isOtherCheckedIn = checkedInCourt && checkedInCourt !== court.id;

          return (
            <div
              key={court.id}
              style={{
                ...styles.courtRow,
                ...(isCheckedIn ? styles.courtRowActive : {}),
              }}
            >
              <div style={styles.courtInfo}>
                <div style={styles.courtLeft}>
                  <div style={styles.courtIconWrap}>
                    <span style={{ fontSize: '18px' }}>🏀</span>
                  </div>
                  <div>
                    <div style={styles.courtName}>{court.name}</div>
                    <div style={styles.courtAddr}>{court.address}</div>
                  </div>
                </div>
                <div style={styles.courtRight}>
                  <span style={{
                    ...styles.statusPill,
                    color: status.color,
                    background: status.bg,
                  }}>
                    {status.label}
                  </span>
                  <div style={styles.playerCount}>
                    <span style={{ color: '#f0f0f0', fontWeight: '700' }}>{court.checkedIn}</span>
                    <span style={{ color: '#444' }}>/{court.maxPlayers}</span>
                  </div>
                </div>
              </div>

              {isCheckedIn ? (
                <div style={styles.checkedInRow}>
                  <span style={styles.checkedInTag}>✅ You're here</span>
                  <button onClick={handleCheckOut} style={styles.smallCheckoutBtn}>
                    Check Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleCheckInClick(court)}
                  disabled={!!isOtherCheckedIn}
                  style={{
                    ...styles.checkInBtn,
                    ...(isOtherCheckedIn ? styles.checkInBtnDisabled : {}),
                  }}
                >
                  {isOtherCheckedIn ? 'Already checked in elsewhere' : 'Check In Here'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  toast: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 200,
    background: '#1a1a1a',
    border: '1px solid rgba(34, 197, 94, 0.4)',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    animation: 'slideInRight 0.3s ease',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  toastTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#22c55e',
  },
  toastSub: {
    fontSize: '12px',
    color: '#888',
  },
  activeCheckin: {
    margin: '16px',
    background: 'linear-gradient(135deg, rgba(255, 107, 26, 0.12), rgba(255, 107, 26, 0.06))',
    border: '1px solid rgba(255, 107, 26, 0.3)',
    borderRadius: '16px',
    padding: '16px',
    flexShrink: 0,
  },
  activeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  activePulse: {
    position: 'relative',
    width: '36px',
    height: '36px',
    flexShrink: 0,
  },
  pulseCore: {
    position: 'absolute',
    inset: '8px',
    borderRadius: '50%',
    background: '#ff6b1a',
  },
  pulseRing: {
    position: 'absolute',
    inset: '0',
    borderRadius: '50%',
    border: '2px solid #ff6b1a',
    opacity: 0.5,
    animation: 'pulse-ring 1.5s ease infinite',
  },
  activeLabel: {
    fontSize: '11px',
    color: '#ff6b1a',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  activeName: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#f0f0f0',
  },
  activeDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '14px',
  },
  activeDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  detailIcon: {
    fontSize: '13px',
  },
  detailText: {
    fontSize: '13px',
    color: '#888',
  },
  checkoutBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '20px',
    padding: '28px 24px',
    width: '100%',
    maxWidth: '380px',
    animation: 'fadeIn 0.2s ease',
  },
  modalIcon: {
    fontSize: '36px',
    textAlign: 'center',
    marginBottom: '12px',
  },
  modalTitle: {
    fontSize: '13px',
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: '4px',
  },
  modalCourtName: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#f0f0f0',
    textAlign: 'center',
    marginBottom: '24px',
  },
  fieldGroup: {
    marginBottom: '18px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#555',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#f0f0f0',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  durationRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  durationBtn: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    background: 'transparent',
    color: '#888',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  durationBtnActive: {
    background: 'rgba(255, 107, 26, 0.15)',
    color: '#ff6b1a',
    borderColor: 'rgba(255, 107, 26, 0.4)',
  },
  tosRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    padding: '11px 13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    marginBottom: '4px',
  },
  tosCheckbox: {
    width: '17px',
    height: '17px',
    borderRadius: '4px',
    border: '1.5px solid #333',
    background: 'transparent',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  tosCheckboxOn: {
    background: '#ff6b1a',
    borderColor: '#ff6b1a',
  },
  tosCheckmark: {
    fontSize: '10px',
    color: '#fff',
    fontWeight: '900',
    lineHeight: 1,
  },
  tosText: {
    fontSize: '12px',
    color: '#777',
    lineHeight: 1.4,
  },
  tosLink: {
    color: '#ff6b1a',
    fontWeight: '600',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '10px',
    marginTop: '4px',
  },
  cancelBtn: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #2a2a2a',
    background: 'transparent',
    color: '#888',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  confirmBtn: {
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: '#ff6b1a',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  header: {
    padding: '20px 20px 16px',
    borderBottom: '1px solid #1f1f1f',
    flexShrink: 0,
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#f0f0f0',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#555',
    marginBottom: '14px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '14px',
  },
  searchInput: {
    width: '100%',
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    padding: '10px 14px 10px 36px',
    color: '#f0f0f0',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  courtRow: {
    background: '#141414',
    border: '1px solid #1f1f1f',
    borderRadius: '12px',
    padding: '12px',
    animation: 'fadeIn 0.3s ease',
  },
  courtRowActive: {
    borderColor: 'rgba(255, 107, 26, 0.3)',
    background: 'rgba(255, 107, 26, 0.05)',
  },
  courtInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '8px',
  },
  courtLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
  },
  courtIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  courtName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#f0f0f0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  courtAddr: {
    fontSize: '11px',
    color: '#555',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  courtRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    flexShrink: 0,
  },
  statusPill: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  playerCount: {
    fontSize: '13px',
  },
  checkInBtn: {
    width: '100%',
    padding: '9px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 107, 26, 0.3)',
    background: 'rgba(255, 107, 26, 0.1)',
    color: '#ff6b1a',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  checkInBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
    borderColor: '#2a2a2a',
    background: 'transparent',
    color: '#555',
  },
  checkedInRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  checkedInTag: {
    fontSize: '12px',
    color: '#22c55e',
    fontWeight: '600',
  },
  smallCheckoutBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default CheckIn;
