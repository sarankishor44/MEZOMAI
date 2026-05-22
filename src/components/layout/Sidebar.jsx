import React from 'react'
import { useStore } from '../../store'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: GridIcon },
  { id: 'chat', label: 'Claude Chat', icon: ChatIcon },
  { id: 'code', label: 'Code Studio', icon: CodeIcon },
  { id: 'meetings', label: 'Meet Rooms', icon: VideoIcon },
  { id: 'analytics', label: 'Analytics', icon: ChartIcon },
  { id: 'settings', label: 'Settings', icon: GearIcon },
]

export default function Sidebar({ open, onToggle }) {
  const { page, setPage, user, theme, toggleTheme } = useStore()

  return (
    <nav style={styles.sidebar(open)}>
      <div style={styles.top(open)}>
        <button style={styles.logo(open)} onClick={() => setPage('dashboard')} title="MEZOMAI">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" width="22" height="22">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </button>
        {open && (
          <div style={{ minWidth: 0 }}>
            <div style={styles.brand}>MEZOMAI</div>
            <div style={styles.brandSub}>Premium Workspace</div>
          </div>
        )}
        <button style={styles.collapseBtn} onClick={onToggle} title={open ? 'Close sidebar' : 'Open sidebar'}>
          {open ? <ChevronLeftIcon/> : <MenuIcon/>}
        </button>
      </div>

      <div style={styles.navList}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = page === id
          return (
            <button key={id} title={label} style={styles.navItem(active, open)} onClick={() => setPage(id)}>
              <Icon/>
              {open && <span style={styles.navLabel}>{label}</span>}
              {active && <span style={styles.activePill}/>}
            </button>
          )
        })}
      </div>

      <div style={styles.bottom(open)}>
        <button style={styles.utilityBtn(open)} onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}>
          {theme === 'light' ? <MoonIcon/> : <SunIcon/>}
          {open && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>

        <div style={styles.quota(open)} title="Daily API quota usage">
          <svg width="34" height="34" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--bg3)" strokeWidth="3"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" strokeDasharray="88" strokeDashoffset="26"/>
          </svg>
          {open && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800 }}>70% quota</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>Daily usage</div>
            </div>
          )}
        </div>

        <div style={styles.profile(open)} title={user?.username || 'Profile'}>
          <div style={styles.avatar}>{(user?.username?.[0] || 'M').toUpperCase()}</div>
          {open && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username || 'Operator'}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>Online</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

const styles = {
  sidebar: (open) => ({
    width: open ? 246 : 72,
    background: 'linear-gradient(180deg, var(--bg1), color-mix(in srgb, var(--bg1) 88%, var(--bg) 12%))',
    borderRight: '1px solid var(--b1)',
    display: 'flex',
    flexDirection: 'column',
    padding: open ? '16px 12px' : '16px 10px',
    gap: 14,
    flexShrink: 0,
    zIndex: 10,
    transition: 'width .22s ease, padding .22s ease',
    boxShadow: '12px 0 34px rgba(15,23,42,.08)',
  }),
  top: (open) => ({ display: 'grid', gridTemplateColumns: open ? '42px 1fr 34px' : '1fr', alignItems: 'center', gap: 10 }),
  logo: (open) => ({ width: 42, height: 42, border: 'none', background: 'linear-gradient(135deg, #60a5fa, #0f766e)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 34px var(--gold-glow)', cursor: 'pointer', justifySelf: open ? 'auto' : 'center' }),
  brand: { fontFamily: 'var(--ff-display)', fontSize: 16, fontWeight: 800, letterSpacing: '.04em' },
  brandSub: { fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.08em', textTransform: 'uppercase' },
  collapseBtn: { width: 34, height: 34, border: '1px solid var(--b1)', background: 'var(--bg2)', color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'center', justifySelf: 'center' },
  navList: { display: 'flex', flexDirection: 'column', gap: 6 },
  navItem: (active, open) => ({ height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center', gap: 11, cursor: 'pointer', color: active ? 'var(--gold)' : 'var(--t3)', background: active ? 'var(--gold-light)' : 'transparent', position: 'relative', border: active ? '1px solid var(--gold)' : '1px solid transparent', outline: 'none', padding: open ? '0 12px' : 0 }),
  navLabel: { fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' },
  activePill: { position: 'absolute', right: 7, width: 5, height: 18, background: 'var(--gold)', borderRadius: 999 },
  bottom: (open) => ({ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: open ? 'stretch' : 'center', gap: 10 }),
  utilityBtn: (open) => ({ minHeight: 38, border: '1px solid var(--b1)', background: 'var(--bg2)', color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center', gap: 10, padding: open ? '0 11px' : 0, fontSize: 12, fontWeight: 800 }),
  quota: (open) => ({ display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center', gap: 10, padding: open ? '8px 10px' : 0, border: open ? '1px solid var(--b1)' : 'none', background: open ? 'var(--bg2)' : 'transparent', borderRadius: 10 }),
  profile: (open) => ({ display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center', gap: 10, padding: open ? '8px 10px' : 0, border: open ? '1px solid var(--b1)' : 'none', background: open ? 'var(--bg2)' : 'transparent', borderRadius: 10 }),
  avatar: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), #0f766e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-display)', fontSize: 12, fontWeight: 800, flexShrink: 0 },
}

function Svg({ children }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">{children}</svg>
}
function GridIcon(){ return <Svg><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Svg> }
function ChatIcon(){ return <Svg><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg> }
function CodeIcon(){ return <Svg><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></Svg> }
function VideoIcon(){ return <Svg><path d="m23 7-7 5 7 5V7Z"/><rect x="1" y="5" width="15" height="14" rx="2"/></Svg> }
function ChartIcon(){ return <Svg><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Svg> }
function GearIcon(){ return <Svg><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></Svg> }
function MoonIcon(){ return <Svg><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></Svg> }
function SunIcon(){ return <Svg><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></Svg> }
function ChevronLeftIcon(){ return <Svg><path d="m15 18-6-6 6-6"/></Svg> }
function MenuIcon(){ return <Svg><path d="M4 6h16M4 12h16M4 18h16"/></Svg> }
