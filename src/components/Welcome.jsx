import { useState } from 'react';
import LegalModal from './LegalModal';

const Welcome = ({ onComplete, initialName = '' }) => {
  const [name, setName] = useState(initialName);
  const [agreed, setAgreed] = useState(false);
  const [legalPage, setLegalPage] = useState(null);

  const handleSubmit = () => {
    if (!agreed) return;
    onComplete(name.trim());
  };

  return (
    <div style={styles.overlay}>
      {legalPage && <LegalModal page={legalPage} onClose={() => setLegalPage(null)} />}

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ff6b1a" strokeWidth="2"/>
              <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke="#ff6b1a" strokeWidth="1.5"/>
              <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke="#ff6b1a" strokeWidth="1.5"/>
              <path d="M2 12H22" stroke="#ff6b1a" strokeWidth="1.5"/>
              <path d="M3.5 7H20.5" stroke="#ff6b1a" strokeWidth="1" strokeOpacity="0.6"/>
              <path d="M3.5 17H20.5" stroke="#ff6b1a" strokeWidth="1" strokeOpacity="0.6"/>
            </svg>
          </div>
        </div>

        <h1 style={styles.appName}>Court Check</h1>
        <p style={styles.tagline}>FIND YOUR RUN</p>

        <p style={styles.welcome}>
          The real-time community app for pickup basketball. See who's out, check in to courts, and broadcast when you need players.
        </p>

        <div style={styles.divider} />

        {/* Name input */}
        <div style={styles.field}>
          <label style={styles.fieldLabel}>What do they call you? <span style={styles.optional}>(optional)</span></label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Hooper, MJ23, Big Mike..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agreed && handleSubmit()}
            style={styles.input}
            maxLength={24}
          />
        </div>

        {/* ToS agreement */}
        <button style={styles.checkboxRow} onClick={() => setAgreed(a => !a)}>
          <div style={{ ...styles.checkbox, ...(agreed ? styles.checkboxOn : {}) }}>
            {agreed && <span style={styles.checkmark}>✓</span>}
          </div>
          <span style={styles.checkboxText}>
            I agree to the{' '}
            <span
              style={styles.link}
              onClick={e => { e.stopPropagation(); setLegalPage('tos'); }}
            >
              Terms of Service
            </span>
            {' '}and{' '}
            <span
              style={styles.link}
              onClick={e => { e.stopPropagation(); setLegalPage('privacy'); }}
            >
              Privacy Policy
            </span>
          </span>
        </button>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!agreed}
          style={{ ...styles.btn, ...(!agreed ? styles.btnDisabled : {}) }}
        >
          Let's Ball →
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#0d0d0d',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    textAlign: 'center',
  },
  logoWrap: {
    marginBottom: '2px',
  },
  logoIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(255,107,26,0.12)',
    border: '1px solid rgba(255,107,26,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: '34px',
    fontWeight: '900',
    color: '#f0f0f0',
    letterSpacing: '-0.5px',
    margin: 0,
    lineHeight: 1,
  },
  tagline: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#ff6b1a',
    letterSpacing: '0.2em',
    margin: 0,
  },
  welcome: {
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.65,
    margin: 0,
    maxWidth: '300px',
  },
  divider: {
    width: '100%',
    height: '1px',
    background: '#1a1a1a',
    margin: '2px 0',
  },
  field: {
    width: '100%',
    textAlign: 'left',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  },
  optional: {
    fontWeight: '400',
    textTransform: 'none',
    color: '#444',
    letterSpacing: 0,
  },
  input: {
    width: '100%',
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '13px 16px',
    color: '#f0f0f0',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  checkboxRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '12px 14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'border-color 0.2s',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    borderRadius: '5px',
    border: '1.5px solid #333',
    background: 'transparent',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '1px',
    transition: 'all 0.15s',
  },
  checkboxOn: {
    background: '#ff6b1a',
    borderColor: '#ff6b1a',
  },
  checkmark: {
    fontSize: '11px',
    color: '#fff',
    fontWeight: '900',
    lineHeight: 1,
  },
  checkboxText: {
    fontSize: '13px',
    color: '#888',
    lineHeight: 1.5,
  },
  link: {
    color: '#ff6b1a',
    fontWeight: '600',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    cursor: 'pointer',
  },
  btn: {
    width: '100%',
    padding: '15px',
    borderRadius: '12px',
    border: 'none',
    background: '#ff6b1a',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '800',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.2s',
    letterSpacing: '0.01em',
  },
  btnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
};

export default Welcome;
