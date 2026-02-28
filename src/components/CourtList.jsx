import { useState } from 'react';
import { getCourtStatus } from '../data/courts';

const CourtCard = ({ court, isSelected, onSelect, checkedInCourt }) => {
  const status = getCourtStatus(court);
  const isCheckedIn = checkedInCourt === court.id;
  const fillPercent = Math.round((court.checkedIn / court.maxPlayers) * 100);

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
            <span style={{ color: '#f0f0f0', fontWeight: '600' }}>{court.checkedIn}</span>
            <span style={{ color: '#555' }}>/{court.maxPlayers}</span>
          </span>
        </div>
        <div style={styles.barTrack}>
          <div style={{
            ...styles.barFill,
            width: `${fillPercent}%`,
            background: fillPercent >= 75 ? '#ef4444' : fillPercent >= 40 ? '#eab308' : fillPercent > 0 ? '#22c55e' : '#333',
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
  const [sort, setSort] = useState('active');

  const filters = [
    { id: 'all', label: 'All Courts' },
    { id: 'needPlayers', label: '📣 Need Players' },
    { id: 'active', label: 'Active' },
    { id: 'lights', label: '💡 Lights' },
  ];

  const filtered = courts.filter(c => {
    if (filter === 'needPlayers') return c.needPlayers;
    if (filter === 'active') return c.checkedIn > 0;
    if (filter === 'lights') return c.lights;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
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
  },
  topBar: {
    padding: '16px 20px 12px',
    borderBottom: '1px solid #1f1f1f',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
  },
  filterRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid #2a2a2a',
    background: 'transparent',
    color: '#888',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  filterBtnActive: {
    background: 'rgba(255, 107, 26, 0.12)',
    color: '#ff6b1a',
    borderColor: 'rgba(255, 107, 26, 0.3)',
  },
  sortRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sortLabel: {
    fontSize: '12px',
    color: '#555',
  },
  sortSelect: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    color: '#888',
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
    background: '#141414',
    border: '1px solid #1f1f1f',
    borderRadius: '14px',
    padding: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    animation: 'fadeIn 0.3s ease',
  },
  cardSelected: {
    borderColor: 'rgba(255, 107, 26, 0.4)',
    background: 'rgba(255, 107, 26, 0.05)',
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
    color: '#f0f0f0',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardAddress: {
    fontSize: '12px',
    color: '#555',
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
    color: '#888',
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
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  barCount: {
    fontSize: '12px',
  },
  barTrack: {
    height: '4px',
    background: '#2a2a2a',
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
    color: '#777',
  },
  needAlert: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    background: 'rgba(255, 107, 26, 0.08)',
    border: '1px solid rgba(255, 107, 26, 0.2)',
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
    color: '#555',
    fontSize: '14px',
  },
};

export default CourtList;
