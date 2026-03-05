import { COURTS as STATIC_COURTS, getCourtStatus } from '../data/courts';

const StatCard = ({ label, value, sub, accent }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statValue, color: accent || '#1a1a1a' }}>{value}</div>
    <div style={styles.statLabel}>{label}</div>
    {sub && <div style={styles.statSub}>{sub}</div>}
  </div>
);

const CourtRow = ({ court, rank }) => {
  const status = getCourtStatus(court);
  const fill = Math.round((court.checkedIn / court.maxPlayers) * 100);
  const barColor = fill >= 75 ? '#ef4444' : fill >= 40 ? '#eab308' : fill > 0 ? '#22c55e' : '#e5e5e5';

  return (
    <div style={styles.courtRow}>
      <div style={styles.courtRank}>#{rank}</div>
      <div style={styles.courtBody}>
        <div style={styles.courtTop}>
          <span style={styles.courtName}>{court.name}</span>
          <span style={{ ...styles.statusChip, color: status.color, background: status.bg }}>
            {status.label}
          </span>
        </div>
        <div style={styles.courtBar}>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${fill}%`, background: barColor }} />
          </div>
          <span style={styles.barLabel}>
            <span style={{ color: '#1a1a1a', fontWeight: 700 }}>{court.checkedIn}</span>
            <span style={{ color: '#ccc' }}>/{court.maxPlayers}</span>
            <span style={{ color: '#999', marginLeft: 6 }}>{fill}%</span>
          </span>
        </div>
      </div>
      {court.needPlayers && <span style={styles.broadcastTag}>📣</span>}
    </div>
  );
};

const Stats = ({ courts, isMobile }) => {

  const totalPlayers = courts.reduce((sum, c) => sum + c.checkedIn, 0);
  const totalCapacity = courts.reduce((sum, c) => sum + c.maxPlayers, 0);
  const activeCourts = courts.filter(c => c.checkedIn > 0).length;
  const needPlayersCourts = courts.filter(c => c.needPlayers).length;
  const avgRating = (courts.reduce((sum, c) => sum + c.rating, 0) / courts.length).toFixed(1);
  const overallFill = Math.round((totalPlayers / totalCapacity) * 100);
  const sorted = [...courts].sort((a, b) => b.checkedIn - a.checkedIn);

  return (
  <div style={styles.wrapper}>
    <div style={styles.header}>
      <h2 style={styles.title}>Stats Dashboard</h2>
      <p style={styles.subtitle}>Live snapshot across all nearby courts</p>
    </div>

    <div style={styles.scroll}>
      <div style={{ ...styles.statGrid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }}>
        <StatCard
          label="Total Players"
          value={totalPlayers}
          sub={`of ${totalCapacity} capacity`}
          accent="#ff6b1a"
        />
        <StatCard
          label="Overall Fill"
          value={`${overallFill}%`}
          sub="network utilization"
        />
        <StatCard
          label="Active Courts"
          value={`${activeCourts}/${courts.length}`}
          sub="have players now"
          accent="#22c55e"
        />
        <StatCard
          label="Need Players"
          value={needPlayersCourts}
          sub="broadcasting now"
          accent="#eab308"
        />
        <StatCard
          label="Avg Rating"
          value={`★ ${avgRating}`}
          sub="across all courts"
          accent="#eab308"
        />
        <StatCard
          label="Total Courts"
          value={STATIC_COURTS.reduce((s, c) => s + c.courts, 0)}
          sub={`${STATIC_COURTS.reduce((s, c) => s + c.hoops, 0)} hoops total`}
        />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Network Fill Rate</span>
          <span style={styles.sectionValue}>{totalPlayers} / {totalCapacity} players</span>
        </div>
        <div style={styles.bigBarTrack}>
          <div style={{
            ...styles.bigBarFill,
            width: `${overallFill}%`,
            background: overallFill >= 75
              ? 'linear-gradient(90deg, #eab308, #ef4444)'
              : overallFill >= 40
              ? 'linear-gradient(90deg, #22c55e, #eab308)'
              : 'linear-gradient(90deg, #ff6b1a, #22c55e)',
          }} />
        </div>
        <div style={styles.bigBarLabels}>
          <span style={styles.barCaption}>0</span>
          <span style={styles.barCaption}>25%</span>
          <span style={styles.barCaption}>50%</span>
          <span style={styles.barCaption}>75%</span>
          <span style={styles.barCaption}>100%</span>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Courts by Player Count</span>
          <span style={styles.sectionValue}>ranked by activity</span>
        </div>
        <div style={styles.courtList}>
          {sorted.map((court, i) => (
            <CourtRow key={court.id} court={court} rank={i + 1} />
          ))}
        </div>
      </div>

      <div style={{ ...styles.twoCol, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>By Skill Level</span>
          </div>
          {['Competitive', 'Intermediate', 'Mixed', 'Casual'].map(level => {
            const levelCourts = courts.filter(c => c.level === level);
            const players = levelCourts.reduce((s, c) => s + c.checkedIn, 0);
            return (
              <div key={level} style={styles.levelRow}>
                <span style={styles.levelName}>{level}</span>
                <div style={styles.levelBar}>
                  <div style={{
                    ...styles.levelBarFill,
                    width: `${totalPlayers ? Math.round((players / totalPlayers) * 100) : 0}%`,
                  }} />
                </div>
                <span style={styles.levelCount}>{players}</span>
              </div>
            );
          })}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>By Surface</span>
          </div>
          {['Asphalt', 'Concrete', 'Rubber', 'Sport Court'].map(surface => {
            const surfaceCourts = courts.filter(c => c.surface === surface);
            const players = surfaceCourts.reduce((s, c) => s + c.checkedIn, 0);
            return (
              <div key={surface} style={styles.levelRow}>
                <span style={styles.levelName}>{surface}</span>
                <div style={styles.levelBar}>
                  <div style={{
                    ...styles.levelBarFill,
                    width: `${totalPlayers ? Math.round((players / totalPlayers) * 100) : 0}%`,
                    background: '#ff6b1a',
                  }} />
                </div>
                <span style={styles.levelCount}>{players}</span>
              </div>
            );
          })}
        </div>
      </div>
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
  header: {
    padding: '20px 20px 16px',
    borderBottom: '1px solid #e5e5e5',
    flexShrink: 0,
    background: '#ffffff',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#999',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '900',
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#888',
  },
  statSub: {
    fontSize: '11px',
    color: '#bbb',
    marginTop: '2px',
  },
  section: {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  sectionValue: {
    fontSize: '12px',
    color: '#bbb',
  },
  bigBarTrack: {
    height: '10px',
    background: '#f0f0f0',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  bigBarFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.5s ease',
  },
  bigBarLabels: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  barCaption: {
    fontSize: '11px',
    color: '#bbb',
  },
  courtList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  courtRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  courtRank: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ccc',
    width: '24px',
    flexShrink: 0,
    textAlign: 'right',
  },
  courtBody: {
    flex: 1,
    minWidth: 0,
  },
  courtTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
    gap: '8px',
  },
  courtName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statusChip: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '1px 7px',
    borderRadius: '20px',
    flexShrink: 0,
  },
  courtBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  barTrack: {
    flex: 1,
    height: '5px',
    background: '#f0f0f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.4s ease',
  },
  barLabel: {
    fontSize: '12px',
    flexShrink: 0,
  },
  broadcastTag: {
    fontSize: '14px',
    flexShrink: 0,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  levelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  levelName: {
    fontSize: '12px',
    color: '#888',
    width: '90px',
    flexShrink: 0,
  },
  levelBar: {
    flex: 1,
    height: '5px',
    background: '#f0f0f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: '3px',
    background: '#22c55e',
    transition: 'width 0.4s ease',
  },
  levelCount: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1a1a1a',
    width: '20px',
    textAlign: 'right',
    flexShrink: 0,
  },
};

export default Stats;
