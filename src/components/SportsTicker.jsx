import { useState, useEffect } from 'react';

const NBA_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const CBB_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';

const parseEvents = (events, league) =>
  events.flatMap(event => {
    try {
      const comp = event.competitions[0];
      const away = comp.competitors.find(c => c.homeAway === 'away');
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const st = comp.status;
      const name = st.type.name;

      let statusLabel, type;
      if (name === 'STATUS_IN_PROGRESS') {
        statusLabel = st.type.shortDetail || `Q${st.period} ${st.displayClock}`;
        type = 'live';
      } else if (name.includes('FINAL') || name === 'STATUS_FULL_TIME') {
        statusLabel = 'FINAL';
        type = 'final';
      } else {
        const d = new Date(event.date);
        statusLabel = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' ET';
        type = 'pre';
      }

      return [{
        id: event.id,
        league,
        awayAbbr: away?.team?.abbreviation || '?',
        awayLogo: away?.team?.logo || '',
        awayScore: away?.score || '',
        homeAbbr: home?.team?.abbreviation || '?',
        homeLogo: home?.team?.logo || '',
        homeScore: home?.score || '',
        statusLabel,
        type,
      }];
    } catch {
      return [];
    }
  });

const TeamLogo = ({ src, abbr }) => {
  const [err, setErr] = useState(false);
  if (!src || err) return null;
  return (
    <img
      src={src}
      alt={abbr}
      style={{ width: 15, height: 15, objectFit: 'contain', flexShrink: 0 }}
      onError={() => setErr(true)}
    />
  );
};

const TickerItem = ({ item }) => {
  const isLive = item.type === 'live';
  const isPre = item.type === 'pre';
  const isFinal = item.type === 'final';

  return (
    <div style={s.item}>
      {/* League chip */}
      <span style={{ ...s.league, ...(item.league === 'NBA' ? s.lNba : s.lCbb) }}>
        {item.league}
      </span>

      {/* Away */}
      <TeamLogo src={item.awayLogo} abbr={item.awayAbbr} />
      <span style={{ ...s.abbr, ...(isFinal ? s.abbrFinal : {}) }}>{item.awayAbbr}</span>

      {/* Score or vs */}
      {!isPre ? (
        <span style={s.scores}>
          <span style={{ ...s.num, ...(isLive ? s.numLive : isFinal ? s.numFinal : {}) }}>
            {item.awayScore}
          </span>
          <span style={s.dash}>-</span>
          <span style={{ ...s.num, ...(isLive ? s.numLive : isFinal ? s.numFinal : {}) }}>
            {item.homeScore}
          </span>
        </span>
      ) : (
        <span style={s.vs}>vs</span>
      )}

      {/* Home */}
      <span style={{ ...s.abbr, ...(isFinal ? s.abbrFinal : {}) }}>{item.homeAbbr}</span>
      <TeamLogo src={item.homeLogo} abbr={item.homeAbbr} />

      {/* Status badge */}
      <span style={{ ...s.badge, ...(isLive ? s.badgeLive : isFinal ? s.badgeFinal : s.badgePre) }}>
        {isLive && <span style={s.liveDot} />}
        {item.statusLabel}
      </span>

      <span style={s.sep}>|</span>
    </div>
  );
};

const SportsTicker = () => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'empty'

  const fetchScores = async () => {
    try {
      const [nbaRes, cbbRes] = await Promise.allSettled([
        fetch(NBA_URL).then(r => r.json()),
        fetch(CBB_URL).then(r => r.json()),
      ]);

      const nbaEvents = nbaRes.status === 'fulfilled' ? nbaRes.value.events || [] : [];
      const cbbEvents = cbbRes.status === 'fulfilled' ? cbbRes.value.events || [] : [];

      const nba = parseEvents(nbaEvents, 'NBA');
      const cbb = parseEvents(cbbEvents.slice(0, 10), 'NCAAB');

      // Sort: live first, then final, then upcoming
      const all = [
        ...nba.filter(x => x.type === 'live'),
        ...cbb.filter(x => x.type === 'live'),
        ...nba.filter(x => x.type === 'final'),
        ...cbb.filter(x => x.type === 'final').slice(0, 5),
        ...nba.filter(x => x.type === 'pre'),
        ...cbb.filter(x => x.type === 'pre').slice(0, 4),
      ];

      setItems(all);
      setStatus(all.length > 0 ? 'ready' : 'empty');
    } catch {
      setStatus('empty');
    }
  };

  useEffect(() => {
    fetchScores();
    const id = setInterval(fetchScores, 60_000);
    return () => clearInterval(id);
  }, []);

  // Always render the bar to avoid layout shift
  const duration = Math.max(20, items.length * 5);

  return (
    <div style={s.bar}>
      {/* Left label */}
      <div style={s.label}>
        <span style={s.ball}>🏀</span>
        <span style={s.labelText}>SCORES</span>
      </div>

      {/* Content */}
      <div style={s.overflow}>
        {status === 'loading' && (
          <span style={s.placeholder}>Loading scores...</span>
        )}
        {status === 'empty' && (
          <span style={s.placeholder}>No games scheduled right now</span>
        )}
        {status === 'ready' && (
          <div style={{ ...s.track, animationDuration: `${duration}s` }}>
            {[...items, ...items].map((item, i) => (
              <TickerItem key={`${item.id}-${i}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const s = {
  bar: {
    flexShrink: 0,
    height: '28px',
    background: '#080808',
    borderTop: '1px solid #1a1a1a',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    userSelect: 'none',
  },
  label: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '0 10px',
    height: '100%',
    background: '#ff6b1a',
    borderRight: '2px solid rgba(255,107,26,0.6)',
  },
  ball: { fontSize: '11px', lineHeight: 1 },
  labelText: { fontSize: '9px', fontWeight: '900', color: '#fff', letterSpacing: '0.1em' },
  overflow: { flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' },
  placeholder: { fontSize: '10px', color: '#444', paddingLeft: '12px', fontStyle: 'italic' },
  track: {
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    animation: 'ticker-scroll linear infinite',
    willChange: 'transform',
  },
  item: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '0 6px',
    height: '28px',
  },
  league: {
    fontSize: '8px',
    fontWeight: '800',
    padding: '2px 4px',
    borderRadius: '3px',
    letterSpacing: '0.06em',
    flexShrink: 0,
  },
  lNba: {
    background: 'rgba(255,107,26,0.15)',
    color: '#ff8c4a',
    border: '1px solid rgba(255,107,26,0.25)',
  },
  lCbb: {
    background: 'rgba(59,130,246,0.12)',
    color: '#60a5fa',
    border: '1px solid rgba(59,130,246,0.25)',
  },
  abbr: { fontSize: '11px', fontWeight: '700', color: '#d0d0d0', letterSpacing: '0.02em' },
  abbrFinal: { color: '#666' },
  scores: { display: 'inline-flex', alignItems: 'center', gap: '3px' },
  num: { fontSize: '12px', fontWeight: '800', color: '#f0f0f0', fontVariantNumeric: 'tabular-nums' },
  numLive: { color: '#ff6b1a' },
  numFinal: { color: '#888' },
  dash: { fontSize: '10px', color: '#333' },
  vs: { fontSize: '10px', color: '#444', fontWeight: '600', padding: '0 2px' },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '8px',
    fontWeight: '700',
    padding: '2px 5px',
    borderRadius: '3px',
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  badgeLive: {
    background: 'rgba(239,68,68,0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.25)',
  },
  badgeFinal: {
    background: 'transparent',
    color: '#444',
    border: '1px solid #1f1f1f',
  },
  badgePre: {
    background: 'transparent',
    color: '#555',
    border: '1px solid #1f1f1f',
  },
  liveDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#ef4444',
    animation: 'pulse-dot 1.2s ease-in-out infinite',
    flexShrink: 0,
  },
  sep: { fontSize: '14px', color: '#1f1f1f', margin: '0 2px', flexShrink: 0 },
};

export default SportsTicker;
