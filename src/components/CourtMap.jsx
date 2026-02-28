import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { getCourtStatus } from '../data/courts';

const MAP_CENTER = { lat: 40.7380, lng: -74.0320 };

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0d0d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#141414' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#000000' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#333333' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#111111' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#222222' }] },
];

const createMarkerSvg = (court, isSelected) => {
  const status = getCourtStatus(court);
  const fillColor = court.needPlayers ? '#ff6b1a' : '#141414';
  const strokeColor = isSelected ? '#ffffff' : court.needPlayers ? '#ff8540' : status.color;
  const size = isSelected ? 42 : 36;
  const anchorH = isSelected ? 51 : 44;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${anchorH}" viewBox="0 0 36 44">
    <defs>
      <filter id="sh" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${strokeColor}" flood-opacity="0.45"/>
      </filter>
    </defs>
    <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 44 18 44C18 44 36 31.5 36 18C36 8.06 27.94 0 18 0Z"
      fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" filter="url(#sh)"/>
    <text x="18" y="24" text-anchor="middle" font-size="15" font-family="Arial,sans-serif">🏀</text>
    ${court.needPlayers ? `<circle cx="29" cy="7" r="6" fill="#ff6b1a" stroke="#0d0d0d" stroke-width="1.5"/>
    <text x="29" y="11" text-anchor="middle" font-size="9" font-family="Arial,sans-serif" fill="white" font-weight="bold">!</text>` : ''}
  </svg>`;
  return { svg, size, anchorH };
};

// InfoWindow popup shown on desktop when marker is clicked
const CourtInfoWindow = ({ court, onDetails }) => {
  const status = getCourtStatus(court);
  const fill = Math.round((court.checkedIn / court.maxPlayers) * 100);
  const barColor = fill >= 75 ? '#ef4444' : fill >= 40 ? '#eab308' : fill > 0 ? '#22c55e' : '#555';

  return (
    <div style={iw.wrap}>
      <div style={iw.header}>
        <div style={iw.name}>{court.name}</div>
        <span style={{ ...iw.badge, color: status.color, background: status.bg }}>{status.label}</span>
      </div>
      <div style={iw.address}>{court.address}</div>

      <div style={iw.stats}>
        <div style={iw.stat}>
          <div style={{ ...iw.statVal, color: barColor }}>{court.checkedIn}</div>
          <div style={iw.statLbl}>players</div>
        </div>
        <div style={iw.statDivider} />
        <div style={iw.stat}>
          <div style={iw.statVal}>{court.courts}</div>
          <div style={iw.statLbl}>courts</div>
        </div>
        <div style={iw.statDivider} />
        <div style={iw.stat}>
          <div style={{ ...iw.statVal, color: '#eab308' }}>★{court.rating}</div>
          <div style={iw.statLbl}>rating</div>
        </div>
      </div>

      <div style={iw.barTrack}>
        <div style={{ ...iw.barFill, width: `${fill}%`, background: barColor }} />
      </div>

      {court.needPlayers && (
        <div style={iw.needAlert}>📣 {court.needPlayersMessage}</div>
      )}

      <div style={iw.actions}>
        <a href={court.googleMapsUrl} target="_blank" rel="noreferrer" style={iw.mapsBtn}>
          🗺️ Open in Maps
        </a>
        <button onClick={onDetails} style={iw.detailBtn}>
          Details →
        </button>
      </div>
    </div>
  );
};

const iw = {
  wrap: { padding: '14px', minWidth: '220px', maxWidth: '260px', fontFamily: "'Inter', system-ui, sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' },
  name: { fontSize: '14px', fontWeight: '800', color: '#f0f0f0', lineHeight: 1.3 },
  badge: { fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0 },
  address: { fontSize: '11px', color: '#555', marginBottom: '12px' },
  stats: { display: 'flex', alignItems: 'center', gap: '0', marginBottom: '10px' },
  stat: { flex: 1, textAlign: 'center' },
  statVal: { fontSize: '20px', fontWeight: '900', color: '#f0f0f0', lineHeight: 1 },
  statLbl: { fontSize: '9px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' },
  statDivider: { width: '1px', height: '32px', background: '#2a2a2a', flexShrink: 0 },
  barTrack: { height: '4px', background: '#2a2a2a', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' },
  barFill: { height: '100%', borderRadius: '2px' },
  needAlert: { fontSize: '11px', color: '#ff6b1a', background: 'rgba(255,107,26,0.08)', border: '1px solid rgba(255,107,26,0.2)', borderRadius: '6px', padding: '6px 8px', marginBottom: '10px', lineHeight: 1.4 },
  actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  mapsBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#888', fontSize: '11px', fontWeight: '600', textDecoration: 'none', fontFamily: 'inherit' },
  detailBtn: { padding: '8px', borderRadius: '8px', border: 'none', background: '#ff6b1a', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' },
};

const CourtMap = ({ courts, onCourtSelect, selectedCourt, checkedInCourt, isMobile }) => {
  const [mapType, setMapType] = useState('roadmap');
  const [activeInfoId, setActiveInfoId] = useState(null);
  const [locating, setLocating] = useState(false);
  const [authError, setAuthError] = useState(false);
  const mapRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Catch Google Maps auth failures (invalid key, API not enabled, referrer blocked)
  useEffect(() => {
    window.gm_authFailure = () => setAuthError(true);
    return () => { delete window.gm_authFailure; };
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' ? apiKey.trim() : '',
  });

  const onMapLoad = useCallback(map => {
    mapRef.current = map;
  }, []);

  // Pan to court when selected from list or other views
  useEffect(() => {
    if (selectedCourt && mapRef.current) {
      mapRef.current.panTo({ lat: selectedCourt.lat, lng: selectedCourt.lng });
      mapRef.current.setZoom(16);
    }
  }, [selectedCourt]);

  const handleMarkerClick = (court) => {
    onCourtSelect(court);
    if (!isMobile) setActiveInfoId(court.id);
  };

  const handleLocate = () => {
    if (!mapRef.current || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        mapRef.current.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mapRef.current.setZoom(15);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const getMarkerIcon = (court) => {
    const isSelected = selectedCourt?.id === court.id;
    const { svg, size, anchorH } = createMarkerSvg(court, isSelected);
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(size, anchorH),
      anchor: new window.google.maps.Point(size / 2, anchorH),
    };
  };

  const activeCourt = courts.find(c => c.id === activeInfoId);

  // No API key — show setup prompt
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <div style={styles.placeholder}>
        <div style={styles.placeholderIcon}>🗺️</div>
        <div style={styles.placeholderTitle}>Google Maps API Key Required</div>
        <div style={styles.placeholderText}>
          Add your key to <code style={styles.code}>.env</code>:<br />
          <code style={styles.code}>VITE_GOOGLE_MAPS_API_KEY=your_key</code>
        </div>
        <a
          href="https://developers.google.com/maps/documentation/javascript/get-api-key"
          target="_blank"
          rel="noreferrer"
          style={styles.placeholderLink}
        >
          Get a free API key →
        </a>
      </div>
    );
  }

  if (authError || loadError) {
    return (
      <div style={styles.placeholder}>
        <div style={styles.placeholderIcon}>⚠️</div>
        <div style={styles.placeholderTitle}>Maps API Error</div>
        <div style={styles.placeholderText}>
          Your API key was rejected. Most likely fix:<br /><br />
          1. Go to <strong style={{ color: '#f0f0f0' }}>Google Cloud Console</strong><br />
          2. Search for <strong style={{ color: '#f0f0f0' }}>"Maps JavaScript API"</strong><br />
          3. Click <strong style={{ color: '#f0f0f0' }}>Enable</strong><br />
          4. Make sure the key has <strong style={{ color: '#f0f0f0' }}>no HTTP referrer restrictions</strong> (or add <code style={styles.code}>localhost</code>)
        </div>
        <a
          href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
          target="_blank"
          rel="noreferrer"
          style={styles.placeholderLink}
        >
          Enable Maps JavaScript API →
        </a>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={styles.placeholder}>
        <div style={styles.placeholderIcon}>⏳</div>
        <div style={styles.placeholderTitle}>Loading map…</div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        center={MAP_CENTER}
        zoom={14}
        mapTypeId={mapType}
        options={{
          styles: mapType === 'roadmap' ? DARK_MAP_STYLES : undefined,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_CENTER,
          },
          gestureHandling: 'greedy',
          clickableIcons: false,
        }}
        onLoad={onMapLoad}
        onClick={() => setActiveInfoId(null)}
      >
        {courts.map(court => (
          <Marker
            key={court.id}
            position={{ lat: court.lat, lng: court.lng }}
            icon={getMarkerIcon(court)}
            onClick={() => handleMarkerClick(court)}
            zIndex={selectedCourt?.id === court.id ? 10 : 1}
          />
        ))}

        {!isMobile && activeCourt && (
          <InfoWindow
            position={{ lat: activeCourt.lat, lng: activeCourt.lng }}
            onCloseClick={() => setActiveInfoId(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -(selectedCourt?.id === activeCourt.id ? 51 : 44) - 4),
              disableAutoPan: false,
            }}
          >
            <CourtInfoWindow
              court={activeCourt}
              onDetails={() => {
                onCourtSelect(activeCourt);
                setActiveInfoId(null);
              }}
            />
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map / Satellite toggle */}
      <div style={styles.toggle}>
        <button
          onClick={() => setMapType('roadmap')}
          style={{ ...styles.toggleBtn, ...(mapType === 'roadmap' ? styles.toggleBtnActive : {}) }}
        >
          🗺️ Map
        </button>
        <button
          onClick={() => setMapType('hybrid')}
          style={{ ...styles.toggleBtn, ...(mapType === 'hybrid' ? styles.toggleBtnActive : {}) }}
        >
          🛰️ Satellite
        </button>
      </div>

      {/* Locate me */}
      <button onClick={handleLocate} style={styles.locateBtn} title="Go to my location">
        {locating ? '⏳' : '📍'}
      </button>
    </div>
  );
};

const styles = {
  wrapper: { position: 'relative', height: '100%', width: '100%' },
  placeholder: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0d0d0d',
    gap: '12px',
    padding: '32px',
    textAlign: 'center',
  },
  placeholderIcon: { fontSize: '48px' },
  placeholderTitle: { fontSize: '18px', fontWeight: '700', color: '#f0f0f0' },
  placeholderText: { fontSize: '13px', color: '#555', lineHeight: 1.7 },
  placeholderLink: {
    marginTop: '8px',
    display: 'inline-block',
    padding: '10px 20px',
    borderRadius: '10px',
    background: '#ff6b1a',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '700',
    textDecoration: 'none',
  },
  code: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '2px 6px', fontFamily: 'monospace', color: '#ff6b1a', fontSize: '12px' },
  toggle: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    display: 'flex',
    background: 'rgba(13,13,13,0.92)',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    overflow: 'hidden',
    zIndex: 10,
    backdropFilter: 'blur(8px)',
  },
  toggleBtn: {
    padding: '8px 14px',
    background: 'transparent',
    border: 'none',
    color: '#666',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  toggleBtnActive: {
    background: 'rgba(255,107,26,0.15)',
    color: '#ff6b1a',
  },
  locateBtn: {
    position: 'absolute',
    bottom: '80px',
    right: '12px',
    zIndex: 10,
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    background: 'rgba(13,13,13,0.92)',
    color: '#f0f0f0',
    fontSize: '16px',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
  },
};

export default CourtMap;
