import React from 'react'
import { useStore } from '../../store'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: 'chat', label: 'Chat',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  { id: 'code', label: 'Code IDE',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
  { id: 'meetings', label: 'Meetings',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
  { id: 'analytics', label: 'Analytics',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id: 'deployment', label: 'Deploy',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20 6 9 17l-5-5"/><path d="M14 6h6v6"/></svg> },
  { id: 'settings', label: 'Settings',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
]

const s = {
  sidebar: {
    width: 68,
    background: 'var(--bg1)',
    borderRight: '1px solid var(--b1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 0',
    gap: 8,
    flexShrink: 0,
    zIndex: 10
  },
  logo: {
    width: 40,
    height: 40,
    background: 'linear-gradient(135deg, var(--gold), #8c621d)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    boxShadow: '0 0 15px var(--gold-glow)',
    cursor: 'pointer'
  },
  navItem: (active) => ({
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all .2s',
    color: active ? 'var(--gold)' : 'var(--t3)',
    background: active ? 'var(--gold-light)' : 'transparent',
    position: 'relative',
    border: 'none',
    outline: 'none'
  }),
  activeLine: {
    position: 'absolute',
    right: -1,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 3,
    height: 24,
    background: 'var(--gold)',
    borderRadius: '2px 0 0 2px'
  },
  bottom: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    border: '1px solid var(--b1)',
    background: 'var(--bg2)',
    color: 'var(--t2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--gold), #ebdcb9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--ff-display)',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    border: '2px solid var(--b2)',
    color: '#2a1f08'
  },
}

export default function Sidebar() {
  const { page, setPage, user, theme, toggleTheme } = useStore()

  return (
    <nav style={s.sidebar}>
      <div style={s.logo} onClick={() => setPage('dashboard')} title="MEZOMAI">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fffdf6" strokeWidth="2.5" width="22" height="22">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>

      {NAV.map(({ id, label, icon }) => (
        <button key={id} title={label} style={s.navItem(page === id)} onClick={() => setPage(id)}>
          {icon}
          {page === id && <span style={s.activeLine}/>}
        </button>
      ))}

      <div style={s.bottom}>
        {/* Theme Toggle Button */}
        <button style={s.themeBtn} onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}>
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        {/* Token Circular Progress */}
        <div style={{ position: 'relative', width: 36, height: 36 }} title="Daily API Quota Usage">
          <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--bg2)" strokeWidth="3"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray="88" strokeDashoffset="26"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontFamily: 'var(--ff-mono)', color: 'var(--t2)' }}>
            70%
          </div>
        </div>

        <div style={s.avatar} title={user?.username || 'Profile'}>
          {(user?.username?.[0] || 'M').toUpperCase()}
        </div>
      </div>
    </nav>
  )
}
