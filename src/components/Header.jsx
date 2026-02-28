const Header = ({ activeTab, setActiveTab, playerName, onProfileClick, checkedInCourt, isMobile }) => {
  const tabs = [
    { id: 'map', label: 'Court Map', icon: '🗺️' },
    { id: 'courts', label: 'Courts', icon: '🏀' },
    { id: 'checkin', label: 'Check In', icon: '✅' },
    { id: 'broadcast', label: 'Need Players', icon: '📣' },
    { id: 'stats', label: 'Stats', icon: '📊' },
  ];

  const initials = playerName ? playerName.slice(0, 2).toUpperCase() : '?';

  return (
    <header style={styles.header}>
      <div style={{ ...styles.inner, padding: isMobile ? '8px 14px' : '10px 16px' }}>
        <div style={styles.brand}>
          <div style={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ff6b1a" strokeWidth="2"/>
              <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke="#ff6b1a" strokeWidth="1.5"/>
              <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke="#ff6b1a" strokeWidth="1.5"/>
              <path d="M2 12H22" stroke="#ff6b1a" strokeWidth="1.5"/>
              <path d="M3.5 7H20.5" stroke="#ff6b1a" strokeWidth="1" strokeOpacity="0.6"/>
              <path d="M3.5 17H20.5" stroke="#ff6b1a" strokeWidth="1" strokeOpacity="0.6"/>
            </svg>
          </div>
          <div>
            <h1 style={{ ...styles.title, fontSize: isMobile ? '16px' : '18px' }}>Court Check</h1>
            {!isMobile && <p style={styles.subtitle}>Find your run</p>}
          </div>
        </div>

        {!isMobile && (
          <nav style={styles.nav}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ ...styles.navBtn, ...(activeTab === tab.id ? styles.navBtnActive : {}) }}
              >
                <span style={styles.tabIcon}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

        <div style={styles.rightControls}>
          {isMobile && (
            <div style={styles.mobileActiveLabel}>
              {tabs.find(t => t.id === activeTab)?.label}
            </div>
          )}
          <button onClick={onProfileClick} style={styles.avatar} title={playerName || 'Set your profile'}>
            {checkedInCourt && <div style={styles.avatarDot} />}
            <span style={styles.avatarText}>{initials}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: { backgroundColor: '#0d0d0d', borderBottom: '1px solid #1f1f1f', flexShrink: 0, position: 'relative', zIndex: 100 },
  inner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  logo: { width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '800', color: '#f0f0f0', letterSpacing: '-0.3px', lineHeight: 1.2 },
  subtitle: { fontSize: '10px', color: '#ff6b1a', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' },
  nav: { display: 'flex', gap: '2px', flex: 1, justifyContent: 'center' },
  navBtn: { display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '1px solid transparent', background: 'transparent', color: '#666', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  navBtnActive: { background: 'rgba(255,107,26,0.12)', color: '#ff6b1a', borderColor: 'rgba(255,107,26,0.25)' },
  tabIcon: { fontSize: '13px' },
  rightControls: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  mobileActiveLabel: { fontSize: '13px', fontWeight: '700', color: '#888' },
  avatar: { position: 'relative', width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' },
  avatarText: { fontSize: '12px', fontWeight: '800', color: '#ff6b1a' },
  avatarDot: { position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', border: '2px solid #0d0d0d' },
};

export default Header;
