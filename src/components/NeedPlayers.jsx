import { useState, useEffect } from 'react';
import { COURTS } from '../data/courts';
import { supabase } from '../lib/supabase';

const formatRelativeTime = (isoString) => {
  if (!isoString) return 'Just now';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

const formatBroadcast = (row) => ({
  id: row.id,
  name: row.player_name,
  court: row.court_name,
  message: row.message,
  playersNeeded: row.players_needed,
  level: row.skill_level,
  runType: row.run_type,
  time: formatRelativeTime(row.created_at),
});

const SKILL_LEVELS = ['Any level', 'Beginner', 'Casual', 'Intermediate', 'Competitive', 'Elite'];
const RUN_TYPES = ['Full Court 5v5', 'Half Court 3v3', '1v1', '2v2', 'Pickup', 'Drills only'];

const BroadcastCard = ({ broadcast, onDismiss }) => {
  const [responded, setResponded] = useState(false);

  return (
    <div style={{
      ...styles.broadcastCard,
      ...(responded ? styles.broadcastCardResponded : {}),
    }}>
      <div style={styles.bcHeader}>
        <div style={styles.bcUser}>
          <div style={styles.avatar}>
            {broadcast.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.bcName}>{broadcast.name}</div>
            <div style={styles.bcTime}>{broadcast.time}</div>
          </div>
        </div>
        <div style={styles.bcBadge}>📣 LIVE</div>
      </div>

      <div style={styles.bcCourt}>
        <span style={styles.bcCourtIcon}>📍</span>
        <span style={styles.bcCourtName}>{broadcast.court}</span>
      </div>

      <p style={styles.bcMessage}>{broadcast.message}</p>

      <div style={styles.bcTags}>
        <div style={styles.bcTag}>
          <span>👥</span>
          <span>Need {broadcast.playersNeeded} players</span>
        </div>
        <div style={styles.bcTag}>
          <span>⚡</span>
          <span>{broadcast.level}</span>
        </div>
        <div style={styles.bcTag}>
          <span>🏀</span>
          <span>{broadcast.runType}</span>
        </div>
      </div>

      <div style={styles.bcActions}>
        {responded ? (
          <div style={styles.respondedMsg}>
            <span style={{ fontSize: '16px' }}>✅</span>
            <span>You're in! They'll see you on the court.</span>
          </div>
        ) : (
          <>
            <button
              onClick={() => setResponded(true)}
              style={styles.imInBtn}
            >
              🏀 I'm In!
            </button>
            <button
              onClick={() => onDismiss(broadcast.id)}
              style={styles.dismissBtn}
            >
              Not this time
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const NeedPlayers = ({ checkedInCourt, playerName }) => {
  const [broadcasts, setBroadcasts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    court: '',
    message: '',
    name: playerName || '',
    playersNeeded: '2',
    level: 'Any level',
    runType: 'Full Court 5v5',
  });

  const selectedCourtForBroadcast = checkedInCourt
    ? COURTS.find(c => c.id === checkedInCourt)
    : null;

  // Load broadcasts from Supabase and subscribe to real-time inserts
  useEffect(() => {
    const fetchBroadcasts = async () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('is_active', true)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false });

      if (data) setBroadcasts(data.map(formatBroadcast));
    };

    fetchBroadcasts();

    const channel = supabase
      .channel('broadcasts_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
        const incoming = formatBroadcast(payload.new);
        setBroadcasts(prev =>
          prev.some(b => b.id === incoming.id) ? prev : [incoming, ...prev]
        );
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleDismiss = (id) => {
    setBroadcasts(prev => prev.filter(b => b.id !== id));
  };

  const handleSubmit = async () => {
    if (!form.message.trim() || !form.name.trim()) return;

    const courtName = selectedCourtForBroadcast
      ? selectedCourtForBroadcast.name
      : form.court || 'Unknown Court';

    const { data, error } = await supabase
      .from('broadcasts')
      .insert({
        court_id: checkedInCourt || null,
        court_name: courtName,
        player_name: form.name,
        message: form.message,
        players_needed: form.playersNeeded,
        skill_level: form.level,
        run_type: form.runType,
      })
      .select()
      .single();

    if (!error) {
      if (data) {
        setBroadcasts(prev =>
          prev.some(b => b.id === data.id) ? prev : [formatBroadcast(data), ...prev]
        );
      }
      setShowForm(false);
      setSubmitted(true);
      setForm({ court: '', message: '', playersNeeded: '2', level: 'Any level', runType: 'Full Court 5v5', name: playerName || '' });
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Submit success */}
      {submitted && (
        <div style={styles.successToast}>
          <span style={{ fontSize: '18px' }}>📣</span>
          <div>
            <div style={styles.toastTitle}>Broadcast sent!</div>
            <div style={styles.toastSub}>Players nearby will see your call</div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h2 style={styles.title}>Need Players</h2>
            <p style={styles.subtitle}>{broadcasts.length} active broadcast{broadcasts.length !== 1 ? 's' : ''} nearby</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={styles.broadcastBtn}
          >
            {showForm ? '✕ Cancel' : '📣 Broadcast'}
          </button>
        </div>

        {/* Broadcast Form */}
        {showForm && (
          <div style={styles.form}>
            <div style={styles.formTitle}>
              {selectedCourtForBroadcast
                ? `📍 Broadcasting from ${selectedCourtForBroadcast.name}`
                : '📍 Send a broadcast'}
            </div>

            {!selectedCourtForBroadcast && (
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Court Name</label>
                <input
                  type="text"
                  placeholder="Which court are you at?"
                  value={form.court}
                  onChange={e => setForm(f => ({ ...f, court: e.target.value }))}
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Your Name / Handle</label>
              <input
                type="text"
                placeholder="e.g. Hooper, MJ23..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Message</label>
              <textarea
                placeholder="What's the situation? e.g. 'Need 3 more for 5v5, been running all day, competitive vibe'"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div style={styles.formRow}>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.fieldLabel}>Players Needed</label>
                <div style={styles.numRow}>
                  {['1', '2', '3', '4', '5', '6+'].map(n => (
                    <button
                      key={n}
                      onClick={() => setForm(f => ({ ...f, playersNeeded: n }))}
                      style={{
                        ...styles.numBtn,
                        ...(form.playersNeeded === n ? styles.numBtnActive : {}),
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.fieldLabel}>Skill Level</label>
                <select
                  value={form.level}
                  onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                  style={styles.select}
                >
                  {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.fieldLabel}>Run Type</label>
                <select
                  value={form.runType}
                  onChange={e => setForm(f => ({ ...f, runType: e.target.value }))}
                  style={styles.select}
                >
                  {RUN_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!form.message.trim() || !form.name.trim()}
              style={{
                ...styles.submitBtn,
                ...(!form.message.trim() || !form.name.trim() ? styles.submitBtnDisabled : {}),
              }}
            >
              📣 Send Broadcast
            </button>
          </div>
        )}
      </div>

      {/* Broadcasts feed */}
      <div style={styles.feed}>
        {broadcasts.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏀</div>
            <h3 style={styles.emptyTitle}>No broadcasts yet</h3>
            <p style={styles.emptyText}>
              Check in to a court and broadcast when you need players
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={styles.emptyBtn}
            >
              Be the first to broadcast
            </button>
          </div>
        ) : (
          broadcasts.map(b => (
            <BroadcastCard key={b.id} broadcast={b} onDismiss={handleDismiss} />
          ))
        )}
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
  successToast: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 200,
    background: '#1a1a1a',
    border: '1px solid rgba(255, 107, 26, 0.4)',
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
    color: '#ff6b1a',
  },
  toastSub: {
    fontSize: '12px',
    color: '#888',
  },
  header: {
    padding: '20px 20px 0',
    borderBottom: '1px solid #1f1f1f',
    flexShrink: 0,
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
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
  },
  broadcastBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#ff6b1a',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  form: {
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '16px',
    animation: 'fadeIn 0.2s ease',
  },
  formTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ff6b1a',
    marginBottom: '16px',
  },
  fieldGroup: {
    marginBottom: '14px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#555',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '7px',
  },
  input: {
    width: '100%',
    background: '#0d0d0d',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#f0f0f0',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    background: '#0d0d0d',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#f0f0f0',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.5,
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  numRow: {
    display: 'flex',
    gap: '6px',
  },
  numBtn: {
    width: '36px',
    height: '36px',
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
  numBtnActive: {
    background: 'rgba(255, 107, 26, 0.15)',
    color: '#ff6b1a',
    borderColor: 'rgba(255, 107, 26, 0.4)',
  },
  select: {
    width: '100%',
    background: '#0d0d0d',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#f0f0f0',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
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
    marginTop: '4px',
  },
  submitBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  feed: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  broadcastCard: {
    background: '#141414',
    border: '1px solid #1f1f1f',
    borderRadius: '16px',
    padding: '16px',
    animation: 'fadeIn 0.3s ease',
    transition: 'all 0.2s',
  },
  broadcastCardResponded: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    background: 'rgba(34, 197, 94, 0.04)',
  },
  bcHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  bcUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(255, 107, 26, 0.15)',
    border: '1px solid rgba(255, 107, 26, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: '800',
    color: '#ff6b1a',
    flexShrink: 0,
  },
  bcName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#f0f0f0',
  },
  bcTime: {
    fontSize: '11px',
    color: '#555',
  },
  bcBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#ff6b1a',
    background: 'rgba(255, 107, 26, 0.1)',
    border: '1px solid rgba(255, 107, 26, 0.25)',
    borderRadius: '20px',
    padding: '3px 10px',
    letterSpacing: '0.05em',
    animation: 'pulse-ring 2s infinite',
  },
  bcCourt: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
  },
  bcCourtIcon: {
    fontSize: '13px',
  },
  bcCourtName: {
    fontSize: '13px',
    color: '#ff6b1a',
    fontWeight: '600',
  },
  bcMessage: {
    fontSize: '14px',
    color: '#ccc',
    lineHeight: 1.5,
    marginBottom: '12px',
  },
  bcTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '14px',
  },
  bcTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: '#888',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '20px',
    padding: '4px 10px',
  },
  bcActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  imInBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: '#ff6b1a',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  dismissBtn: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    background: 'transparent',
    color: '#555',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  respondedMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#22c55e',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#f0f0f0',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '24px',
    lineHeight: 1.6,
  },
  emptyBtn: {
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    background: '#ff6b1a',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default NeedPlayers;
