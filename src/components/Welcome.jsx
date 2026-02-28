import { useState } from 'react';

const Welcome = ({ onComplete }) => {
  const [name, setName] = useState('');

  const submit = () => {
    if (name.trim()) onComplete(name.trim());
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.ball}>🏀</div>
        <h1 style={styles.title}>Court Check</h1>
        <p style={styles.sub}>Find runs. Check in. Let people know you're balling.</p>

        <div style={styles.field}>
          <label style={styles.label}>What do they call you?</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Hooper, MJ23, Big Mike..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={styles.input}
            maxLength={24}
          />
        </div>

        <button onClick={submit} disabled={!name.trim()} style={{ ...styles.btn, ...(!name.trim() ? styles.btnDisabled : {}) }}>
          Let's Ball →
        </button>
        <button onClick={() => onComplete('')} style={styles.skip}>Skip for now</button>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: '#0d0d0d', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  card: { width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
  ball: { fontSize: '52px', marginBottom: '4px' },
  title: { fontSize: '32px', fontWeight: '900', color: '#f0f0f0', letterSpacing: '-0.5px', margin: 0 },
  sub: { fontSize: '14px', color: '#555', lineHeight: 1.6, margin: 0, maxWidth: '300px' },
  field: { width: '100%', textAlign: 'left', marginTop: '8px' },
  label: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' },
  input: { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '14px 16px', color: '#f0f0f0', fontSize: '16px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#ff6b1a', color: '#fff', fontSize: '16px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' },
  btnDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  skip: { background: 'transparent', border: 'none', color: '#444', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', padding: '4px' },
};

export default Welcome;
