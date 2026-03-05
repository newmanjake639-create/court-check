import { useState, useEffect } from 'react';
import { getCourtStatus } from '../data/courts';

const haversineMi = (lat1, lng1, lat2, lng2) => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const CourtCard = ({ court, isSelected, onSelect, checkedInCourt, userLoc }) => {
  const status = getCourtStatus(court);
  const isCheckedIn = checkedInCourt === court.id;
  const fillPercent = Math.round((court.checkedIn / court.maxPlayers) * 100);
  const distance = userLoc
    ? haversineMi(userLoc.lat, userLoc.lng, court.lat, court.lng)
    : null;

  return (
    <div
      onClick={() => onSelect(court)}
      style={{
        ...styles.card,
        ...(isSelected ? styles.cardSelected : {}),
        ...(isCheckedIn ? styles.cardCheckedIn : {}),
      }}
    >
      {isCheckedIn && (
        <div style={styles.checkedInBanner}>
          <span style={{ fontSize: '12px' }}>✅</span>
          <span>You're here</span>
        </div>
      )}

      <div style={styles.cardHeader}>
        <div style={styles.cardTitleGroup}>
          <h3 style={styles.cardName}>{court.name}</h3>
          <p style={styles.cardAddress}>{court.address}</p>
          <div style={styles.cardMeta2}>
            <span style={{
              ...styles.typeBadge,
              background: court.indoor ? 'rgba(59,130,246,0.08)' : 'rgba(34,197,94,0.08)',
              color: court.indoor ? '#3b82f6' : '#16a34a',
              borderColor: court.indoor ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)',
            }}>
              {court.indoor ? '🏛️ Indoor' : '🌳 Outdoor'}
            </span>
            {court.city && <span style={styles.cityLabel}>{court.city}</span>}
            {distance !== null && (
              <span style={styles.distLabel}>{distance < 0.1 ? '<0.1' : distance.toFixed(1)} mi</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{
            ...styles.statusBadge,
            color: status.color,
            background: status.bg,
          }}>
            {status.label}
          </span>
          <div style={styles.ratingRow}>
            <span style={styles.star}>★</span>
            <span style={styles.rating}>{court.rating}</span>
          </div>
        </div>
      </div>

      {/* Player bar */}
      <div style={styles.barSection}>
        <div style={styles.barHeader}>
          <span style={styles.barLabel}>Players</span>
          <span style={styles.barCount}>
            <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{court.checkedIn}</span>
            <span style={{ color: '#ccc' }}>/{court.maxPlayers}</span>
          </span>
        </div>
        <div style={styles.barTrack}>
          <div style={{
            ...styles.barFill,
            width: `${fillPercent}%`,
            background: fillPercent >= 75 ? '#ef4444' : fillPercent >= 40 ? '#eab308' : fillPercent > 0 ? '#22c55e' : '#e5e5e5',
          }} />
        </div>
      </div>

      <div style={styles.cardMeta}>
        <div style={styles.metaItem}>
          <span style={styles.metaIcon}>🏀</span>
          <span style={styles.metaText}>{court.courts} {court.courts === 1 ? 'court' : 'courts'}</span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaIcon}>🏗️</span>
          <span style={styles.metaText}>{court.surface}</span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaIcon}>{court.lights ? '💡' : '🌙'}</span>
          <span style={styles.metaText}>{court.lights ? 'Lights' : 'No lights'}</span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaIcon}>⚡</span>
          <span style={styles.metaText}>{court.level}</span>
        </div>
      </div>

      {court.needPlayers && (
        <div style={styles.needAlert}>
          <span style={{ fontSize: '13px', flexShrink: 0 }}>📣</span>
          <span style={styles.needAlertText}>{court.needPlayersMessage}</span>
        </div>
      )}
    </div>
  );
};

const CourtList = ({ courts, onCourtSelect, selectedCourt, checkedInCourt }) => {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('nearest');
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setSort('active'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setSort(s => s === 'nearest' ? 'active' : s),
      { timeout: 6000, maximumAge: 300000 }
    );
  }, []);

  const filters = [
    { id: 'all', label: 'All Courts' },
    { id: 'outdoor', label: '🌳 Outdoor' },
    { id: 'indoor', label: '🏛️ Indoor' },
    { id: 'needPlayers', label: '📣 Need Players' },
    { id: 'active', label: 'Active' },
    { id: 'lights', label: '💡 Lights' },
  ];

  const filtered = courts.filter(c => {
    if (filter === 'needPlayers') return c.needPlayers;
    if (filter === 'active') return c.checkedIn > 0;
    if (filter === 'lights') return c.lights;
    if (filter === 'outdoor') return !c.indoor;
    if (filter === 'indoor') return c.indoor;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'nearest') {
      if (!userLoc) return b.checkedIn - a.checkedIn;
      return haversineMi(userLoc.lat, userLoc.lng, a.lat, a.lng) -
             haversineMi(userLoc.lat, userLoc.lng, b.lat, b.lng);
    }
    if (sort === 'active') return b.checkedIn - a.checkedIn;
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div style={styles.wrapper}>
      <div style={styles.topBar}>
        <div style={styles.filterRow}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                ...styles.filterBtn,
                ...(filter === f.id ? styles.filterBtnActive : {}),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={styles.sortRow}>
          <span style={styles.sortLabel}>Sort:</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="nearest">📍 Nearest</option>
            <option value="active">Most Active</option>
            <option value="rating">Top Rated</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div style={styles.list}>
        {sorted.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏀</div>
            <p style={styles.emptyText}>No courts match this filter</p>
          </div>
        ) : (
          sorted.map(court => (
            <CourtCard
              key={court.id}
              court={court}
              isSelected={selectedCourt?.id === court.id}
              onSelect={onCourtSelect}
              checkedInCourt={checkedInCourt}
              userLoc={userLoc}
            />
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
    background: '#f5f5f5',
  },
  topBar: {
    padding: '16px 20px 12px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
    background: '#ffffff',
  },
  filterRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid #e5e5e5',
    background: '#ffffff',
    color: '#999',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  filterBtnActive: {
    background: 'rgba(255, 107, 26, 0.10)',
    color: '#ff6b1a',
    borderColor: 'rgba(255, 107, 26, 0.25)',
  },
  sortRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sortLabel: {
    fontSize: '12px',
    color: '#999',
  },
  sortSelect: {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    color: '#666',
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '6px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '14px',
    padding: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    animation: 'fadeIn 0.3s ease',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  cardSelected: {
    borderColor: 'rgba(255, 107, 26, 0.4)',
    background: 'rgba(255, 107, 26, 0.03)',
    boxShadow: '0 2px 12px rgba(255,107,26,0.12)',
  },
  cardCheckedIn: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  checkedInBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#22c55e',
    fontWeight: '600',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
  },
  cardTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardAddress: {
    fontSize: '12px',
    color: '#999',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statusBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '20px',
    marginBottom: '4px',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    justifyContent: 'flex-end',
  },
  star: {
    fontSize: '12px',
    color: '#eab308',
  },
  rating: {
    fontSize: '12px',
    color: '#999',
    fontWeight: '600',
  },
  barSection: {
    marginBottom: '12px',
  },
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
  },
  barLabel: {
    fontSize: '11px',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  barCount: {
    fontSize: '12px',
  },
  barTrack: {
    height: '4px',
    background: '#f0f0f0',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.4s ease',
  },
  cardMeta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    marginBottom: '10px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  metaIcon: {
    fontSize: '12px',
  },
  metaText: {
    fontSize: '12px',
    color: '#888',
  },
  cardMeta2: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '5px',
    flexWrap: 'wrap',
  },
  typeBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 7px',
    borderRadius: '20px',
    border: '1px solid',
    whiteSpace: 'nowrap',
  },
  cityLabel: {
    fontSize: '10px',
    color: '#bbb',
    whiteSpace: 'nowrap',
  },
  distLabel: {
    fontSize: '10px',
    color: '#999',
    whiteSpace: 'nowrap',
    marginLeft: 'auto',
  },
  needAlert: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    background: 'rgba(255, 107, 26, 0.07)',
    border: '1px solid rgba(255, 107, 26, 0.18)',
    borderRadius: '8px',
    padding: '8px 10px',
  },
  needAlertText: {
    fontSize: '12px',
    color: '#ff6b1a',
    lineHeight: 1.4,
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyText: {
    color: '#999',
    fontSize: '14px',
  },
};

export default CourtList;
