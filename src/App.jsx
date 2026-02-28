import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import CourtMap from './components/CourtMap';
import CourtList from './components/CourtList';
import CheckIn from './components/CheckIn';
import NeedPlayers from './components/NeedPlayers';
import Stats from './components/Stats';
import Profile from './components/Profile';
import Welcome from './components/Welcome';
import { COURTS } from './data/courts';
import { useIsMobile } from './hooks/useIsMobile';
import { supabase } from './lib/supabase';
import './App.css';

const App = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('map');
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [playerName, setPlayerName] = useState(() => localStorage.getItem('cc_playerName') ?? null);
  const showWelcome = playerName === null;

  const [checkedInCourt, setCheckedInCourt] = useState(() => {
    const s = localStorage.getItem('cc_checkedIn');
    return s ? parseInt(s, 10) : null;
  });
  const [checkInTime, setCheckInTime] = useState(() => {
    const s = localStorage.getItem('cc_checkInTime');
    return s ? new Date(s) : null;
  });

  const [courtCounts, setCourtCounts] = useState(() =>
    Object.fromEntries(COURTS.map(c => [c.id, 0]))
  );

  const [checkInRecordId, setCheckInRecordId] = useState(() =>
    localStorage.getItem('cc_checkInRecordId')
  );

  // Load live check-in counts from Supabase and subscribe to real-time changes
  useEffect(() => {
    const fetchCounts = async () => {
      const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('check_ins')
        .select('court_id')
        .eq('is_active', true)
        .gte('checked_in_at', cutoff);

      if (data) {
        const counts = Object.fromEntries(COURTS.map(c => [c.id, 0]));
        data.forEach(row => {
          counts[row.court_id] = (counts[row.court_id] || 0) + 1;
        });
        setCourtCounts(counts);
      }
    };

    fetchCounts();

    const channel = supabase
      .channel('check_ins_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const courts = useMemo(() =>
    COURTS.map(c => ({ ...c, checkedIn: courtCounts[c.id] ?? c.checkedIn })),
    [courtCounts]
  );

  const handleSetCheckedInCourt = async (id, duration = '2', name = '') => {
    // Optimistic local update for instant UI feedback
    setCourtCounts(prev => {
      const next = { ...prev };
      if (checkedInCourt) next[checkedInCourt] = Math.max(0, (next[checkedInCourt] ?? 0) - 1);
      if (id) next[id] = (next[id] ?? 0) + 1;
      return next;
    });

    if (id) {
      const now = new Date();
      setCheckedInCourt(id);
      setCheckInTime(now);
      localStorage.setItem('cc_checkedIn', id);
      localStorage.setItem('cc_checkInTime', now.toISOString());

      const { data } = await supabase
        .from('check_ins')
        .insert({
          court_id: id,
          player_name: name || playerName || 'Anonymous',
          duration,
        })
        .select('id')
        .single();

      if (data) {
        setCheckInRecordId(data.id);
        localStorage.setItem('cc_checkInRecordId', data.id);
      }
    } else {
      const recordId = checkInRecordId;
      setCheckedInCourt(null);
      setCheckInTime(null);
      setCheckInRecordId(null);
      localStorage.removeItem('cc_checkedIn');
      localStorage.removeItem('cc_checkInTime');
      localStorage.removeItem('cc_checkInRecordId');

      if (recordId) {
        await supabase
          .from('check_ins')
          .update({ is_active: false, checked_out_at: new Date().toISOString() })
          .eq('id', recordId);
      }
    }
  };

  const handleSetPlayerName = (name) => {
    setPlayerName(name);
    localStorage.setItem('cc_playerName', name);
  };

  const handleWelcomeComplete = (name) => {
    setPlayerName(name || '');
    localStorage.setItem('cc_playerName', name || '');
  };

  const checkedInCourtData = courts.find(c => c.id === checkedInCourt) || null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCourt(null);
  };

  if (showWelcome) {
    return <Welcome onComplete={handleWelcomeComplete} />;
  }

  const detailCourt = selectedCourt
    ? courts.find(c => c.id === selectedCourt.id) || selectedCourt
    : null;

  return (
    <div style={styles.app}>
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        playerName={playerName}
        onProfileClick={() => setProfileOpen(true)}
        checkedInCourt={checkedInCourt}
        isMobile={isMobile}
      />

      <main style={styles.main}>
        {activeTab === 'map' && (
          <div style={styles.splitLayout}>
            <div style={styles.mapContainer}>
              <CourtMap
                courts={courts}
                onCourtSelect={setSelectedCourt}
                selectedCourt={selectedCourt}
                checkedInCourt={checkedInCourt}
                isMobile={isMobile}
              />
            </div>
            {!isMobile && selectedCourt && (
              <div style={styles.sidebar}>
                <CourtDetailPanel
                  court={detailCourt}
                  onClose={() => setSelectedCourt(null)}
                  checkedInCourt={checkedInCourt}
                  setCheckedInCourt={handleSetCheckedInCourt}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'courts' && (
          isMobile ? (
            <div style={styles.full}>
              <CourtList
                courts={courts}
                onCourtSelect={setSelectedCourt}
                selectedCourt={selectedCourt}
                checkedInCourt={checkedInCourt}
              />
            </div>
          ) : (
            <div style={styles.splitLayout}>
              <div style={{ ...styles.listContainer, borderRight: selectedCourt ? '1px solid #1f1f1f' : 'none' }}>
                <CourtList
                  courts={courts}
                  onCourtSelect={setSelectedCourt}
                  selectedCourt={selectedCourt}
                  checkedInCourt={checkedInCourt}
                />
              </div>
              {selectedCourt && (
                <div style={styles.sidebar}>
                  <CourtDetailPanel
                    court={detailCourt}
                    onClose={() => setSelectedCourt(null)}
                    checkedInCourt={checkedInCourt}
                    setCheckedInCourt={handleSetCheckedInCourt}
                  />
                </div>
              )}
            </div>
          )
        )}

        {activeTab === 'checkin' && (
          <div style={styles.fullPanel}>
            <CheckIn
              courts={courts}
              checkedInCourt={checkedInCourt}
              setCheckedInCourt={handleSetCheckedInCourt}
              checkInTime={checkInTime}
              playerName={playerName}
              setPlayerName={handleSetPlayerName}
            />
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div style={styles.fullPanel}>
            <NeedPlayers checkedInCourt={checkedInCourt} playerName={playerName} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div style={styles.fullPanel}>
            <Stats courts={courts} isMobile={isMobile} />
          </div>
        )}
      </main>

      {/* Mobile bottom tab bar */}
      {isMobile ? (
        <MobileTabBar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          checkedInCourt={checkedInCourt}
        />
      ) : (
        <div style={styles.statusBar}>
          <div style={styles.statusLeft}>
            <div style={styles.onlineDot} />
            <span style={styles.statusText}>{courts.filter(c => c.checkedIn > 0).length} courts active</span>
          </div>
          {checkedInCourtData && (
            <div style={styles.statusCheckedIn}>
              <span style={{ fontSize: '11px' }}>📍</span>
              <span style={styles.statusCheckedInText}>{checkedInCourtData.name}</span>
              <button onClick={() => handleSetCheckedInCourt(null)} style={styles.statusCheckoutBtn}>✕</button>
            </div>
          )}
          <div style={styles.statusRight}>
            <span style={styles.statusText}>{courts.reduce((s, c) => s + c.checkedIn, 0)} players out</span>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet for court detail */}
      {isMobile && selectedCourt && (
        <MobileBottomSheet
          court={detailCourt}
          onClose={() => setSelectedCourt(null)}
          checkedInCourt={checkedInCourt}
          setCheckedInCourt={handleSetCheckedInCourt}
        />
      )}

      {profileOpen && (
        <Profile
          playerName={playerName}
          setPlayerName={handleSetPlayerName}
          checkedInCourt={checkedInCourtData}
          checkInTime={checkInTime}
          onCheckOut={() => handleSetCheckedInCourt(null)}
          onClose={() => setProfileOpen(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

// Mobile bottom tab bar
const TABS = [
  { id: 'map', icon: '🗺️', label: 'Map' },
  { id: 'courts', icon: '🏀', label: 'Courts' },
  { id: 'checkin', icon: '✅', label: 'Check In' },
  { id: 'broadcast', icon: '📣', label: 'Players' },
  { id: 'stats', icon: '📊', label: 'Stats' },
];

const MobileTabBar = ({ activeTab, setActiveTab, checkedInCourt }) => (
  <nav style={tabBarStyles.bar}>
    {TABS.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        style={{ ...tabBarStyles.btn, ...(activeTab === tab.id ? tabBarStyles.btnActive : {}) }}
      >
        {tab.id === 'checkin' && checkedInCourt && <div style={tabBarStyles.dot} />}
        <span style={tabBarStyles.icon}>{tab.icon}</span>
        <span style={{ ...tabBarStyles.label, ...(activeTab === tab.id ? tabBarStyles.labelActive : {}) }}>
          {tab.label}
        </span>
      </button>
    ))}
  </nav>
);

const tabBarStyles = {
  bar: {
    flexShrink: 0,
    display: 'flex',
    background: '#0a0a0a',
    borderTop: '1px solid #1a1a1a',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  btn: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    padding: '10px 4px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnActive: {
    background: 'rgba(255,107,26,0.06)',
  },
  dot: {
    position: 'absolute',
    top: '8px',
    right: 'calc(50% - 14px)',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#22c55e',
    border: '1.5px solid #0a0a0a',
  },
  icon: { fontSize: '18px', lineHeight: 1 },
  label: { fontSize: '10px', color: '#555', fontWeight: '500' },
  labelActive: { color: '#ff6b1a', fontWeight: '700' },
};

// Mobile bottom sheet
const MobileBottomSheet = ({ court, onClose, checkedInCourt, setCheckedInCourt }) => (
  <div style={sheetStyles.backdrop} onClick={onClose}>
    <div style={sheetStyles.sheet} onClick={e => e.stopPropagation()}>
      <div style={sheetStyles.handle} />
      <CourtDetailPanel
        court={court}
        onClose={onClose}
        checkedInCourt={checkedInCourt}
        setCheckedInCourt={setCheckedInCourt}
      />
    </div>
  </div>
);

const sheetStyles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(2px)',
    zIndex: 200,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '72vh',
    background: '#0d0d0d',
    borderRadius: '20px 20px 0 0',
    border: '1px solid #2a2a2a',
    borderBottom: 'none',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideInBottom 0.25s ease',
  },
  handle: {
    width: '36px',
    height: '4px',
    background: '#2a2a2a',
    borderRadius: '2px',
    margin: '10px auto 0',
    flexShrink: 0,
  },
};

// Court detail panel (shared desktop sidebar + mobile sheet)
const CourtDetailPanel = ({ court, onClose, checkedInCourt, setCheckedInCourt }) => {
  const isCheckedIn = checkedInCourt === court.id;
  const fillPercent = Math.round((court.checkedIn / court.maxPlayers) * 100);
  const statusColor = fillPercent >= 75 ? '#ef4444' : fillPercent >= 40 ? '#eab308' : fillPercent > 0 ? '#22c55e' : '#555';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(court.name + ' ' + court.address)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(`${court.name} — ${court.address}`).catch(() => {});
  };

  return (
    <div style={panelStyles.wrapper}>
      <div style={panelStyles.header}>
        <div style={{ minWidth: 0 }}>
          <h2 style={panelStyles.name}>{court.name}</h2>
          <p style={panelStyles.address}>{court.address}</p>
        </div>
        <button onClick={onClose} style={panelStyles.closeBtn}>✕</button>
      </div>

      <div style={panelStyles.activityCard}>
        <div style={panelStyles.activityRow}>
          <div style={panelStyles.activityStat}>
            <div style={{ ...panelStyles.bigNum, color: statusColor }}>{court.checkedIn}</div>
            <div style={panelStyles.bigLabel}>players now</div>
          </div>
          <div style={panelStyles.activityDivider} />
          <div style={panelStyles.activityStat}>
            <div style={panelStyles.bigNum}>{court.maxPlayers}</div>
            <div style={panelStyles.bigLabel}>capacity</div>
          </div>
          <div style={panelStyles.activityDivider} />
          <div style={panelStyles.activityStat}>
            <div style={{ ...panelStyles.bigNum, color: '#eab308' }}>★{court.rating}</div>
            <div style={panelStyles.bigLabel}>rating</div>
          </div>
        </div>
        <div style={panelStyles.barTrack}>
          <div style={{ ...panelStyles.barFill, width: `${fillPercent}%`, background: statusColor }} />
        </div>
        <div style={panelStyles.barCaption}>
          {fillPercent}% full · {Math.max(0, court.maxPlayers - court.checkedIn)} spots remaining
        </div>
      </div>

      <div style={panelStyles.detailGrid}>
        <div style={panelStyles.detailItem}>
          <span style={panelStyles.detailIcon}>🏀</span>
          <div>
            <div style={panelStyles.detailVal}>{court.courts} courts</div>
            <div style={panelStyles.detailLbl}>{court.hoops} hoops</div>
          </div>
        </div>
        <div style={panelStyles.detailItem}>
          <span style={panelStyles.detailIcon}>🏗️</span>
          <div>
            <div style={panelStyles.detailVal}>{court.surface}</div>
            <div style={panelStyles.detailLbl}>Surface</div>
          </div>
        </div>
        <div style={panelStyles.detailItem}>
          <span style={panelStyles.detailIcon}>{court.lights ? '💡' : '🌙'}</span>
          <div>
            <div style={panelStyles.detailVal}>{court.lights ? 'Available' : 'No lights'}</div>
            <div style={panelStyles.detailLbl}>Lighting</div>
          </div>
        </div>
        <div style={panelStyles.detailItem}>
          <span style={panelStyles.detailIcon}>⚡</span>
          <div>
            <div style={panelStyles.detailVal}>{court.level}</div>
            <div style={panelStyles.detailLbl}>Skill level</div>
          </div>
        </div>
      </div>

      <div style={panelStyles.tags}>
        {court.tags.map(tag => <span key={tag} style={panelStyles.tag}>{tag}</span>)}
      </div>

      {court.needPlayers && (
        <div style={panelStyles.needAlert}>
          <span style={{ fontSize: '16px' }}>📣</span>
          <div>
            <div style={panelStyles.needAlertTitle}>Players Needed!</div>
            <div style={panelStyles.needAlertMsg}>{court.needPlayersMessage}</div>
          </div>
        </div>
      )}

      <div style={panelStyles.actions}>
        <div style={panelStyles.secondaryActions}>
          <a href={mapsUrl} target="_blank" rel="noreferrer" style={panelStyles.dirBtn}>
            🗺️ Directions
          </a>
          <button onClick={copyLink} style={panelStyles.shareBtn}>
            📋 Copy
          </button>
        </div>
        {isCheckedIn ? (
          <button onClick={() => setCheckedInCourt(null)} style={panelStyles.checkoutBtn}>
            Check Out
          </button>
        ) : (
          <button
            onClick={() => setCheckedInCourt(court.id)}
            disabled={!!checkedInCourt && !isCheckedIn}
            style={{ ...panelStyles.checkInBtn, ...(checkedInCourt && !isCheckedIn ? panelStyles.checkInBtnDisabled : {}) }}
          >
            ✅ Check In Here
          </button>
        )}
      </div>
    </div>
  );
};

const panelStyles = {
  wrapper: { height: '100%', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  name: { fontSize: '19px', fontWeight: '800', color: '#f0f0f0', marginBottom: '3px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  address: { fontSize: '12px', color: '#555' },
  closeBtn: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', flexShrink: 0 },
  activityCard: { background: '#141414', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '16px' },
  activityRow: { display: 'flex', alignItems: 'center', marginBottom: '14px' },
  activityStat: { flex: 1, textAlign: 'center' },
  activityDivider: { width: '1px', height: '40px', background: '#2a2a2a' },
  bigNum: { fontSize: '28px', fontWeight: '900', color: '#f0f0f0', lineHeight: 1.1 },
  bigLabel: { fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' },
  barTrack: { height: '6px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' },
  barFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },
  barCaption: { fontSize: '12px', color: '#555', textAlign: 'center' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  detailItem: { background: '#141414', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' },
  detailIcon: { fontSize: '18px' },
  detailVal: { fontSize: '13px', fontWeight: '700', color: '#f0f0f0' },
  detailLbl: { fontSize: '11px', color: '#555', marginTop: '1px' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tag: { fontSize: '11px', color: '#888', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '3px 10px' },
  needAlert: { display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255,107,26,0.08)', border: '1px solid rgba(255,107,26,0.25)', borderRadius: '12px', padding: '12px' },
  needAlertTitle: { fontSize: '13px', fontWeight: '700', color: '#ff6b1a', marginBottom: '3px' },
  needAlertMsg: { fontSize: '12px', color: '#cc7a40', lineHeight: 1.4 },
  actions: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  secondaryActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  dirBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#141414', color: '#888', fontSize: '12px', fontWeight: '600', textDecoration: 'none', fontFamily: 'inherit' },
  shareBtn: { padding: '10px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#141414', color: '#888', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  checkInBtn: { width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#ff6b1a', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
  checkInBtnDisabled: { opacity: 0.35, cursor: 'not-allowed', background: '#333' },
  checkoutBtn: { width: '100%', padding: '13px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
};

const styles = {
  app: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d0d0d', overflow: 'hidden' },
  main: { flex: 1, overflow: 'hidden', position: 'relative' },
  full: { height: '100%' },
  splitLayout: { display: 'flex', height: '100%' },
  mapContainer: { flex: 1, position: 'relative', minWidth: 0 },
  listContainer: { flex: 1, minWidth: 0, overflow: 'hidden' },
  sidebar: { width: '340px', flexShrink: 0, borderLeft: '1px solid #1f1f1f', background: '#0d0d0d', overflowY: 'auto' },
  fullPanel: { height: '100%', overflow: 'hidden' },
  statusBar: { flexShrink: 0, height: '32px', background: '#0a0a0a', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', gap: '8px' },
  statusLeft: { display: 'flex', alignItems: 'center', gap: '7px' },
  onlineDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 },
  statusText: { fontSize: '11px', color: '#444', whiteSpace: 'nowrap' },
  statusCheckedIn: { display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,107,26,0.1)', border: '1px solid rgba(255,107,26,0.2)', borderRadius: '20px', padding: '2px 6px 2px 10px', maxWidth: '200px', overflow: 'hidden' },
  statusCheckedInText: { fontSize: '11px', color: '#ff6b1a', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statusCheckoutBtn: { background: 'transparent', border: 'none', color: '#ff6b1a', cursor: 'pointer', fontSize: '11px', padding: '0 2px', fontFamily: 'inherit', opacity: 0.7, flexShrink: 0 },
  statusRight: { display: 'flex', alignItems: 'center', flexShrink: 0 },
};

export default App;
