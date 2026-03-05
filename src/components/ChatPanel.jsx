import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── Username color engine ────────────────────────────────────────────────────
const COLORS = [
  '#ff6b1a', '#22c55e', '#3b82f6', '#a855f7',
  '#ef4444', '#eab308', '#06b6d4', '#ec4899',
  '#10b981', '#f97316', '#84cc16', '#e879f9',
];

const getUserColor = (name) => {
  if (!name) return '#999';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};

const relativeTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
};

// ─── Single message row ───────────────────────────────────────────────────────
const MessageRow = ({ msg }) => {
  const color = getUserColor(msg.player_name);
  return (
    <div style={msgS.row}>
      <div style={msgS.line1}>
        <span style={{ ...msgS.name, color }}>{msg.player_name}</span>
        {msg.court_name && (
          <span style={msgS.courtChip}>
            📍 {msg.court_name.split(' ').slice(0, 2).join(' ')}
          </span>
        )}
        <span style={msgS.time}>{relativeTime(msg.created_at)}</span>
      </div>
      <p style={msgS.text}>{msg.message}</p>
    </div>
  );
};

const msgS = {
  row: {
    padding: '7px 14px',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    transition: 'background 0.1s',
  },
  line1: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '3px',
    flexWrap: 'wrap',
  },
  name: {
    fontSize: '12px',
    fontWeight: '800',
    lineHeight: 1,
    flexShrink: 0,
  },
  courtChip: {
    fontSize: '10px',
    color: '#888',
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '1px 6px',
    lineHeight: 1.5,
    flexShrink: 0,
  },
  time: {
    fontSize: '10px',
    color: '#ccc',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  text: {
    fontSize: '13px',
    color: '#444',
    lineHeight: 1.5,
    wordBreak: 'break-word',
    margin: 0,
  },
};

// ─── Main ChatPanel ───────────────────────────────────────────────────────────
const ChatPanel = ({ playerName, checkedInCourt, courts, isMobile }) => {
  const [isOpen, setIsOpen]           = useState(false);
  const [mode, setMode]               = useState('global');
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [unread, setUnread]           = useState(0);
  const [autoScroll, setAutoScroll]   = useState(true);
  const [courtPickId, setCourtPickId] = useState(() => courts[0]?.id ?? null);

  const endRef      = useRef(null);
  const scrollRef   = useRef(null);
  const inputRef    = useRef(null);
  const isOpenRef   = useRef(isOpen);
  isOpenRef.current = isOpen;

  const activeCourtId = mode === 'court'
    ? (checkedInCourt?.id ?? courtPickId)
    : null;

  const activeCourt = mode === 'court'
    ? courts.find(c => c.id === activeCourtId) ?? courts[0]
    : null;

  // ── Fetch + subscribe ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      let q = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(120);

      if (mode === 'global') {
        q = q.eq('chat_type', 'global');
      } else {
        q = q.eq('chat_type', 'court').eq('court_id', activeCourt?.id);
      }

      const { data } = await q;
      if (!cancelled && data) setMessages(data);
    };

    fetch();

    const chanId = mode === 'global' ? 'chat_global' : `chat_court_${activeCourt?.id}`;
    const channel = supabase
      .channel(chanId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const msg = payload.new;
          const relevant = mode === 'global'
            ? msg.chat_type === 'global'
            : msg.chat_type === 'court' && msg.court_id === activeCourt?.id;

          if (!relevant) return;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (!isOpenRef.current) setUnread(n => n + 1);
        })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [mode, activeCourt?.id]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, autoScroll]);

  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(atBottom);
  }, []);

  const scrollToBottom = () => {
    setAutoScroll(true);
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const open = () => {
    setIsOpen(true);
    setUnread(0);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const close = () => setIsOpen(false);

  const send = async () => {
    const text = input.trim();
    if (!text || !playerName) return;
    setInput('');
    await supabase.from('chat_messages').insert({
      player_name: playerName,
      message: text,
      chat_type: mode,
      court_id:   mode === 'court' ? (activeCourt?.id ?? null) : null,
      court_name: mode === 'court'
        ? (activeCourt?.name ?? null)
        : (checkedInCourt?.name ?? null),
    });
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const btnBottom  = isMobile ? '74px' : '50px';
  const panelTop   = isMobile ? '50px' : '57px';
  const panelBot   = isMobile ? '60px' : '33px';
  const panelWidth = isMobile ? '100vw' : '300px';

  return (
    <>
      {/* ── Floating chat button ── */}
      <button
        style={{ ...S.btn, bottom: btnBottom }}
        onClick={isOpen ? close : open}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
        {!isOpen && unread > 0 && (
          <div style={S.badge}>{unread > 99 ? '99+' : unread}</div>
        )}
      </button>

      {/* ── Slide-out panel ── */}
      {isOpen && (
        <div style={{ ...S.panel, top: panelTop, bottom: panelBot, width: panelWidth }}>

          {/* Close bar */}
          <button style={S.closeBar} onClick={close}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span style={S.closeBarText}>Close Chat</span>
          </button>

          {/* Header */}
          <div style={S.header}>
            <div style={S.headerLeft}>
              <div style={S.liveDot} />
              <span style={S.headerTitle}>LIVE CHAT</span>
            </div>
            <div style={S.toggle}>
              <button
                style={{ ...S.toggleBtn, ...(mode === 'global' ? S.toggleOn : {}) }}
                onClick={() => setMode('global')}
              >
                🌍 Global
              </button>
              <button
                style={{ ...S.toggleBtn, ...(mode === 'court' ? S.toggleOn : {}) }}
                onClick={() => setMode('court')}
              >
                🏀 Court
              </button>
            </div>
          </div>

          {/* Court mode: court picker (if not checked in) */}
          {mode === 'court' && !checkedInCourt && (
            <div style={S.courtBar}>
              <select
                value={courtPickId ?? courts[0]?.id}
                onChange={e => setCourtPickId(Number(e.target.value))}
                style={S.courtSelect}
              >
                {courts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Court mode: checked-in label */}
          {mode === 'court' && checkedInCourt && (
            <div style={S.courtBar}>
              <span style={S.courtBarPin}>📍</span>
              <span style={S.courtBarName}>{checkedInCourt.name}</span>
              <span style={S.courtBarLive}>COURT CHAT</span>
            </div>
          )}

          {/* Messages */}
          <div style={S.messages} ref={scrollRef} onScroll={handleScroll}>
            {messages.length === 0 ? (
              <div style={S.empty}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
                <div style={S.emptyTitle}>
                  {mode === 'global' ? 'No messages yet' : 'Court chat is quiet'}
                </div>
                <div style={S.emptySub}>
                  {mode === 'global' ? 'Be the first to say something' : 'Start the conversation at this court'}
                </div>
              </div>
            ) : (
              messages.map(msg => <MessageRow key={msg.id} msg={msg} />)
            )}
            <div ref={endRef} />
          </div>

          {/* Jump to bottom */}
          {!autoScroll && (
            <button style={S.jumpBtn} onClick={scrollToBottom}>
              ↓ New messages
            </button>
          )}

          {/* Input */}
          <div style={S.inputRow}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 200))}
              onKeyDown={onKey}
              placeholder={playerName ? 'Say something...' : 'Set a name to chat'}
              disabled={!playerName}
              style={{ ...S.input, ...(!playerName ? S.inputOff : {}) }}
              maxLength={200}
            />
            <button
              onClick={send}
              disabled={!input.trim() || !playerName}
              style={{ ...S.sendBtn, ...(!input.trim() || !playerName ? S.sendOff : {}) }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  btn: {
    position: 'fixed',
    right: '14px',
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    background: '#ff6b1a',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 450,
    boxShadow: '0 4px 20px rgba(255,107,26,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    background: '#ef4444',
    border: '2px solid #ffffff',
    color: '#fff',
    fontSize: '9px',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
    letterSpacing: '0.02em',
  },
  panel: {
    position: 'fixed',
    right: 0,
    background: '#ffffff',
    borderLeft: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 300,
    animation: 'slideInRight 0.22s ease',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderBottom: '1px solid #e5e5e5',
    flexShrink: 0,
    background: '#fafafa',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  liveDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#ef4444',
    flexShrink: 0,
    boxShadow: '0 0 8px rgba(239,68,68,0.6)',
    animation: 'pulse-ring 1.8s ease infinite',
  },
  headerTitle: {
    fontSize: '11px',
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: '0.1em',
  },
  toggle: {
    flex: 1,
    display: 'flex',
    background: '#f0f0f0',
    borderRadius: '8px',
    padding: '2px',
    gap: '2px',
  },
  toggleBtn: {
    flex: 1,
    padding: '5px 6px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: '#999',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  toggleOn: {
    background: '#ff6b1a',
    color: '#fff',
  },
  closeBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '5px',
    padding: '10px 14px',
    background: '#fff8f5',
    borderBottom: '1px solid #ffe8d6',
    flexShrink: 0,
    border: 'none',
    borderBottom: '1px solid #ffe8d6',
    width: '100%',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#ff6b1a',
    boxSizing: 'border-box',
  },
  closeBarText: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ff6b1a',
  },
  courtBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderBottom: '1px solid #f0f0f0',
    flexShrink: 0,
    background: 'rgba(255,107,26,0.04)',
  },
  courtBarPin: { fontSize: '11px' },
  courtBarName: {
    fontSize: '11px',
    color: '#ff6b1a',
    fontWeight: '600',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  courtBarLive: {
    fontSize: '9px',
    fontWeight: '800',
    color: '#ff6b1a',
    background: 'rgba(255,107,26,0.12)',
    border: '1px solid rgba(255,107,26,0.2)',
    borderRadius: '4px',
    padding: '2px 6px',
    letterSpacing: '0.08em',
    flexShrink: 0,
  },
  courtSelect: {
    flex: 1,
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '7px 10px',
    color: '#1a1a1a',
    fontSize: '12px',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '4px',
    paddingBottom: '4px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#e5e5e5 transparent',
    background: '#ffffff',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#999',
    marginBottom: '6px',
  },
  emptySub: {
    fontSize: '12px',
    color: '#bbb',
    lineHeight: 1.5,
  },
  jumpBtn: {
    margin: '0 10px 8px',
    padding: '7px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255,107,26,0.12)',
    color: '#ff6b1a',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
    animation: 'fadeIn 0.2s ease',
  },
  inputRow: {
    display: 'flex',
    gap: '7px',
    padding: '9px 10px',
    borderTop: '1px solid #e5e5e5',
    flexShrink: 0,
    background: '#fafafa',
  },
  input: {
    flex: 1,
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '9px 11px',
    color: '#1a1a1a',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    minWidth: 0,
  },
  inputOff: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  sendBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    background: '#ff6b1a',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
  sendOff: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
};

export default ChatPanel;
