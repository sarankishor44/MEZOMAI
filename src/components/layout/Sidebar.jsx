import React from 'react'
import { useStore } from '../../store'

const NAV = [
  { id: 'dashboard', label: 'Home', icon: GridIcon, color: ['#60a5fa', '#2563eb'] },
  { id: 'chat', label: 'Chat', icon: ChatIcon, color: ['#34d399', '#0f766e'] },
  { id: 'code', label: 'Code', icon: CodeIcon, color: ['#a78bfa', '#6d28d9'] },
  { id: 'meetings', label: 'Meet', icon: VideoIcon, color: ['#fb7185', '#be123c'] },
  { id: 'pika-guide', label: 'Pika', icon: BookIcon, color: ['#f472b6', '#db2777'] },
  { id: 'analytics', label: 'Stats', icon: ChartIcon, color: ['#fbbf24', '#d97706'] },
  { id: 'settings', label: 'Settings', icon: GearIcon, color: ['#94a3b8', '#475569'] },
]

export default function Sidebar() {
  const { page, setPage, user, theme, toggleTheme, logout } = useStore()

  return (
    <>
      <header className="ios-statusbar">
        <button className="ios-brand-chip" onClick={() => setPage('dashboard')} title="Open Home">
          <span className="ios-brand-icon">M</span>
          <span>
            <strong>MEZOMAI</strong>
            <small>iOS Workspace</small>
          </span>
        </button>
        <div className="ios-top-actions">
          <button className="ios-round-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button className="ios-profile-pill" onClick={() => setPage('settings')} title="Profile and settings">
            <span>{(user?.username?.[0] || 'M').toUpperCase()}</span>
            <strong>{user?.username || 'Operator'}</strong>
          </button>
          <button className="ios-round-btn" onClick={logout} title="Sign out">
            <PowerIcon />
          </button>
        </div>
      </header>

      <nav className="ios-dock" aria-label="App Dock">
        {NAV.map(({ id, label, icon: Icon, color }) => {
          const active = page === id
          return (
            <button key={id} className={`ios-dock-app ${active ? 'active' : ''}`} onClick={() => setPage(id)} title={label}>
              <span className="ios-app-icon" style={{ background: `linear-gradient(145deg, ${color[0]}, ${color[1]})` }}>
                <Icon />
              </span>
              <small>{label}</small>
            </button>
          )
        })}
      </nav>
    </>
  )
}

function Svg({ children }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">{children}</svg>
}
function GridIcon(){ return <Svg><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Svg> }
function ChatIcon(){ return <Svg><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg> }
function CodeIcon(){ return <Svg><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></Svg> }
function VideoIcon(){ return <Svg><path d="m23 7-7 5 7 5V7Z"/><rect x="1" y="5" width="15" height="14" rx="2"/></Svg> }
function ChartIcon(){ return <Svg><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Svg> }
function GearIcon(){ return <Svg><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></Svg> }
function MoonIcon(){ return <Svg><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></Svg> }
function SunIcon(){ return <Svg><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></Svg> }
function PowerIcon(){ return <Svg><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/></Svg> }
function BookIcon(){ return <Svg><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></Svg> }
