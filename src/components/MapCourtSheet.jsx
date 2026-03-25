import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { formatArrivalTime } from '../data/courts';

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#ff6b1a', '#22c55e', '#3b82f6', '#a855f7',
  '#ef4444', '#eab308', '#06b6d4', '#ec4899',
];

const avatarColor = (name) => {
  if (!name) return '#ccc';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const elapsed = (iso) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Just arrived';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r}m ago` : `${h}h ago`;
};

const LEVEL = {
  Competitive:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  Intermediate:  { color: '#eab308', bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.2)'   },
  Casual:        { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
};

// ── Component ─────────────────────────────────────────────────────────────────
const MapCourtSheet = ({
  court,
  plannedVisits = [],
  checkedInCourt,
  myPlanCourtId,
  onCheckIn,
  onCheckOut,
  onPlanToGo,
  onCancelPlan,
  onClose,
}) => {
  const [checkIns, setCheckIns]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [dragY, setDragY]         = useState(0);
  const [closing, setClosing]     = useState(false);
  const touchStartY               = useRef(null);
  const isDragging                = useRef(false);

  // ── Fetch live check-ins for this court ──────────────────────────────────
  const fetchCheckIns = useCallback(async () => {
    if (!court) return;
    const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('check_ins')
      .select('*')
      .eq('court_id', court.id)
      .eq('is_active', true)
      .gte('checked_in_at', cutoff)
      .order('checked_in_at', { ascending: true });
    setCheckIns(data || []);
    setLoading(false);
  }, [court?.id]);

  useEffect(() => {
    setLoading(true);
    fetchCheckIns();

    const channel = supabase
      .channel(`map_sheet_${court?.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'check_ins',
        filter: `court_id=eq.${court?.id}`,
      }, fetchCheckIns)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchCheckIns]);

  // ── Animated close ───────────────────────────────────────────────────────
  const animateClose = () => {
    setClosing(true);
    setTimeout(onClose, 240);
  };

  // ── Drag-to-close gesture ────────────────────────────────────────────────
  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };
  const onTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) { setDragY(delta); isDragging.current = true; }
  };
  const onTouchEnd = () => {
    if (dragY > 90) { animateClose(); }
    setDragY(0);
    touchStartY.current = null;
  };

  if (!court) return null;

  const isCheckedIn      = checkedInCourt === court.id;
  const isPlanning       = myPlanCourtId  === court.id;
  const courtPVs         = plannedVisits.filter(p => p.court_id === court.id);
  const fillPct          = Math.round((court.checkedIn / court.maxPlayers) * 100);
  const barColor         = fillPct >= 75 ? '#ef4444' : fillPct >= 40 ? '#eab308' : fillPct > 0 ? '#22c55e' : '#e5e5e5';
  const levelStyle       = LEVEL[court.level] || { color: '#888', bg: 'rgba(136,136,136,0.08)', border: 'rgba(136,136,136,0.2)' };

  const sheetStyle = {
    ...S.sheet,
    transform:  `translateY(${closing ? '100%' : dragY + 'px'})`,
    transition: dragY === 0 ? 'transform 0.28s cubic-bezier(0.32,0.72,0,1)' : 'none',
  };

  return (
    <div style={S.backdrop} onClick={animateClose}>
      <div
        style={sheetStyle}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle */}
        <div style={S.handleWrap}>
          <div style={S.handle} />
        </div>

        {/* ── Court header ── */}
        <div style={S.header}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={S.name}>{court.name}</h2>
            <p style={S.address}>{court.address}</p>
            <div style={S.badgeRow}>
              <span style={{
                ...S.typeBadge,
                color:       court.indoor ? '#3b82f6' : '#16a34a',
                background:  court.indoor ? 'rgba(59,130,246,0.08)' : 'rgba(34,197,94,0.08)',
                borderColor: court.indoor ? 'rgba(59,130,246,0.2)'  : 'rgba(34,197,94,0.2)',
              }}>
                {court.indoor ? '🏛️ Indoor' : '🌳 Outdoor'}
              </span>
              <span style={{ ...S.levelBadge, color: levelStyle.color, background: levelStyle.bg, borderColor: levelStyle.border }}>
                ⚡ {court.level}
              </span>
              <span style={S.ratingBadge}>★ {court.rating}</span>
            </div>
          </div>
          <button style={S.closeBtn} onClick={animateClose}>✕</button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={S.body}>

          {/* ══ HERE NOW ══════════════════════════════════════════════════════ */}
          <div style={S.section}>
            <div style={S.sectionHead}>
              <span style={S.sectionIcon}>✅</span>
              <span style={S.sectionTitle}>Here Now</span>
              <span style={S.hereCount}>
                <span style={{ color: '#1a1a1a', fontWeight: '700' }}>{court.checkedIn}</span>
                <span style={{ color: '#ccc' }}>/{court.maxPlayers}</span>
              </span>
            </div>

            {/* fill bar */}
            <div style={S.barTrack}>
              <div style={{ ...S.barFill, width: `${fillPct}%`, background: barColor }} />
            </div>

            {/* player rows */}
            {loading ? (
              <div style={S.rowMsg}>Loading players…</div>
            ) : checkIns.length === 0 ? (
              <div style={S.rowMsg}>Nobody checked in yet</div>
            ) : (
              checkIns.map((ci, i) => {
                const ac = avatarColor(ci.player_name);
                return (
                  <div key={ci.id} style={{ ...S.playerRow, ...(i > 0 ? S.rowBorder : {}) }}>
                    <div style={{ ...S.avatar, background: ac }}>
                      {(ci.player_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={S.playerInfo}>
                      <span style={S.playerName}>{ci.player_name || 'Anonymous'}</span>
                      <span style={S.playerMeta}>{elapsed(ci.checked_in_at)}</span>
                    </div>
                    <div style={S.playerRight}>
                      <span style={{ ...S.skillBadge, color: levelStyle.color, background: levelStyle.bg, borderColor: levelStyle.border }}>
                        {court.level}
                      </span>
                      <span style={S.stayBadge}>
                        {ci.duration === 'all' ? 'All day' : `${ci.duration}h`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={S.divider} />

          {/* ══ PLANNING TO GO ════════════════════════════════════════════════ */}
          <div style={S.section}>
            <div style={S.sectionHead}>
              <span style={S.sectionIcon}>🕐</span>
              <span style={S.sectionTitle}>Planning to Go</span>
              {courtPVs.length > 0 && (
                <span style={S.planCount}>{courtPVs.length}</span>
              )}
            </div>

            {courtPVs.length === 0 ? (
              <div style={S.planEmpty}>
                No one has planned a visit yet — be the first!
              </div>
            ) : (
              courtPVs.map((pv, i) => (
                <div key={pv.id} style={{ ...S.pvRow, ...(i > 0 ? S.rowBorder : {}) }}>
                  <span style={S.pvName}>{pv.player_name}</span>
                  <div style={S.pvMeta}>
                    {/* clock icon */}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ff6b1a"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span style={S.pvTime}>{formatArrivalTime(pv.arrival_time)}</span>
                    {pv.duration && (
                      <span style={S.pvBadge}>{pv.duration === 'all' ? 'All day' : `${pv.duration}h`}</span>
                    )}
                    {pv.game_type && (
                      <span style={S.pvBadge}>{pv.game_type}</span>
                    )}
                  </div>
                  {pv.message && <div style={S.pvMsg}>"{pv.message}"</div>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div style={S.actions}>
          {isCheckedIn ? (
            <button style={S.checkoutBtn} onClick={() => { onCheckOut(); animateClose(); }}>
              Check Out
            </button>
          ) : (
            <button
              style={{ ...S.checkInBtn, ...(checkedInCourt && !isCheckedIn ? S.checkInOff : {}) }}
              disabled={!!checkedInCourt && !isCheckedIn}
              onClick={() => { onCheckIn(court.id); animateClose(); }}
            >
              ✅ Check In Now
            </button>
          )}
          {isPlanning ? (
            <button style={S.cancelPlanBtn} onClick={onCancelPlan}>
              😕 I Changed My Mind
            </button>
          ) : (
            <button style={S.planBtn} onClick={() => onPlanToGo(court)}>
              🗓️ Planning to Go
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(2px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    animation: 'fadeIn 0.18s ease',
  },
  sheet: {
    width: '100%',
    maxWidth: '520px',
    maxHeight: '82vh',
    background: '#ffffff',
    borderRadius: '20px 20px 0 0',
    border: '1px solid #e5e5e5',
    borderBottom: 'none',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
  },
  handleWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: '10px 0 4px',
    flexShrink: 0,
    cursor: 'grab',
  },
  handle: {
    width: '36px',
    height: '4px',
    background: '#e0e0e0',
    borderRadius: '2px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '10px 18px 14px',
    borderBottom: '1px solid #f0f0f0',
    flexShrink: 0,
  },
  name: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#1a1a1a',
    margin: 0,
    lineHeight: 1.2,
    marginBottom: '3px',
  },
  address: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
    marginBottom: '8px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  typeBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '20px',
    border: '1px solid',
    whiteSpace: 'nowrap',
  },
  levelBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '20px',
    border: '1px solid',
    whiteSpace: 'nowrap',
  },
  ratingBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#eab308',
  },
  closeBtn: {
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    color: '#999',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13px',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    scrollbarWidth: 'thin',
    scrollbarColor: '#e5e5e5 transparent',
  },
  section: {
    padding: '14px 18px',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '10px',
  },
  sectionIcon: {
    fontSize: '13px',
    lineHeight: 1,
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    flex: 1,
  },
  hereCount: {
    fontSize: '13px',
  },
  barTrack: {
    height: '4px',
    background: '#f0f0f0',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  barFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.4s ease',
  },
  rowBorder: {
    borderTop: '1px solid #f5f5f5',
  },
  rowMsg: {
    fontSize: '13px',
    color: '#bbb',
    fontStyle: 'italic',
    padding: '6px 0',
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 0',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '800',
    color: '#fff',
    flexShrink: 0,
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  playerName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 1.2,
  },
  playerMeta: {
    fontSize: '11px',
    color: '#aaa',
  },
  playerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    flexShrink: 0,
  },
  skillBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '20px',
    border: '1px solid',
    whiteSpace: 'nowrap',
  },
  stayBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#aaa',
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '1px 6px',
    whiteSpace: 'nowrap',
  },
  divider: {
    height: '1px',
    background: '#f0f0f0',
    margin: '0 18px',
  },
  planCount: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#ff6b1a',
    background: 'rgba(255,107,26,0.08)',
    border: '1px solid rgba(255,107,26,0.18)',
    borderRadius: '10px',
    padding: '1px 8px',
  },
  planEmpty: {
    fontSize: '13px',
    color: '#bbb',
    fontStyle: 'italic',
    padding: '6px 0 2px',
    lineHeight: 1.5,
  },
  pvRow: {
    padding: '9px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  pvName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ff6b1a',
    lineHeight: 1.2,
  },
  pvMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    flexWrap: 'wrap',
  },
  pvTime: {
    fontSize: '12px',
    color: '#ff6b1a',
    fontWeight: '600',
  },
  pvBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#888',
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '1px 6px',
    whiteSpace: 'nowrap',
  },
  pvMsg: {
    fontSize: '12px',
    color: '#aaa',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    padding: '12px 18px 18px',
    borderTop: '1px solid #f0f0f0',
    flexShrink: 0,
    paddingBottom: 'max(18px, env(safe-area-inset-bottom, 18px))',
  },
  checkInBtn: {
    padding: '13px',
    borderRadius: '12px',
    border: 'none',
    background: '#22c55e',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    letterSpacing: '0.01em',
  },
  checkInOff: {
    opacity: 0.35,
    cursor: 'not-allowed',
    background: '#ccc',
  },
  checkoutBtn: {
    padding: '13px',
    borderRadius: '12px',
    border: '1px solid rgba(239,68,68,0.25)',
    background: 'rgba(239,68,68,0.06)',
    color: '#ef4444',
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  planBtn: {
    padding: '13px',
    borderRadius: '12px',
    border: 'none',
    background: '#ff6b1a',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    letterSpacing: '0.01em',
  },
  cancelPlanBtn: {
    padding: '13px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    background: '#f5f5f5',
    color: '#999',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default MapCourtSheet;
