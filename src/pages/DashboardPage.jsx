import React from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'

const LOGS = [
  { text: 'Auth session verified. User: Operator', time: 'Just now', type: 'info' },
  { text: 'Connected to Laravel PHP Cluster.', time: '1m ago', type: 'success' },
  { text: 'AI neural engine initialized.', time: '3m ago', type: 'success' },
]

export default function DashboardPage() {
  const { setPage, avatarState, settings, user } = useStore()

  return (
    <div style={container} className="fade-in">
      {/* HUD HEADER */}
      <header style={header}>
        <div>
          <div style={eyebrow}>Mezomai Operational Command</div>
          <h1 style={title}>Welcome back, {user?.username || 'Operator'}</h1>
        </div>
        <StatusBadge state={avatarState}/>
      </header>

      {/* COMMAND CORE */}
      <div style={grid}>
        {/* LEFT COLUMN: ACTIVE NODES & QUICK RUNNERS */}
        <div style={leftCol}>
          <div style={introCard}>
            <div style={cyberGridPattern} />
            <h2 style={cardTitle}>Cognitive AI Core Workspace</h2>
            <p style={cardText}>
              A unified cybernetic command console. Open secure modules to chat with {settings.avatarName || 'ARIA'}, code inside sandbox environments, or coordinate meetings.
            </p>
            <div style={actionRow}>
              <button onClick={() => setPage('chat')} className="gold-glow-btn" style={actionBtn}>
                Launch Chat Portal
              </button>
              <button onClick={() => setPage('code')} style={secondaryBtn}>
                Open Codex IDE
              </button>
            </div>
          </div>

          <div style={subGrid}>
            <div style={miniCard} onClick={() => setPage('meetings')}>
              <div style={miniBadge}>MT</div>
              <div>
                <div style={miniTitle}>Meet Rooms</div>
                <div style={miniDesc}>Join live WebRTC bot session</div>
              </div>
            </div>

            <div style={miniCard} onClick={() => setPage('analytics')}>
              <div style={miniBadge}>ST</div>
              <div>
                <div style={miniTitle}>Analytics Feed</div>
                <div style={miniDesc}>View system cost & token logs</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CORE STATUS & TELEMETRY */}
        <div style={rightCol}>
          <div style={avatarSection}>
            <div style={avatarBackgroundRing} />
            <AvatarFace size={150}/>
            <h2 style={avatarName}>{settings.avatarName || 'ARIA'}</h2>
            <span style={avatarSubtitle}>{settings.model.split('-').slice(0, 3).join(' ')}</span>
            <div style={avatarStatePill(avatarState)}>{avatarState}</div>
          </div>

          <div style={telemetrySection}>
            <div style={telemetryTitle}>System Console Logs</div>
            <div style={logList}>
              {LOGS.map((log, i) => (
                <div key={i} style={logLine}>
                  <span style={logDot(log.type)}/>
                  <div style={{ flex: 1 }}>{log.text}</div>
                  <span style={logTime}>{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ state }) {
  const colors = { idle: 'var(--t3)', listening: 'var(--cyan)', thinking: 'var(--purple)', talking: 'var(--gold)' }
  return (
    <div style={statusBadge}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[state] || colors.idle, boxShadow: `0 0 8px ${colors[state]}` }}/>
      <span style={statusText}>{state}</span>
    </div>
  )
}

// REDESIGNED HUD STYLING
const container = {
  flex: 1,
  padding: 30,
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  overflowY: 'auto',
  background: 'var(--bg)',
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--b1)',
  paddingBottom: 16,
}

const eyebrow = {
  fontFamily: 'var(--ff-mono)',
  fontSize: 10,
  color: 'var(--gold)',
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  fontWeight: 950,
}

const title = {
  fontFamily: 'var(--ff-display)',
  fontSize: 24,
  fontWeight: 800,
  marginTop: 4,
}

const statusBadge = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'var(--bg1)',
  border: '1px solid var(--b1)',
  borderRadius: 999,
  padding: '6px 14px',
}

const statusText = {
  fontFamily: 'var(--ff-mono)',
  fontSize: 10,
  color: 'var(--t2)',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.25fr) minmax(310px, 0.75fr)',
  gap: 22,
  flex: 1,
  alignItems: 'start',
}

const leftCol = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const introCard = {
  background: 'linear-gradient(135deg, var(--bg1) 60%, rgba(248, 201, 107, 0.05))',
  border: '1px solid var(--b1)',
  borderRadius: 18,
  padding: 28,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
}

const cyberGridPattern = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundImage: 'radial-gradient(var(--b1) 1px, transparent 0)',
  backgroundSize: '16px 16px',
  opacity: 0.15,
  pointerEvents: 'none',
}

const cardTitle = {
  fontFamily: 'var(--ff-display)',
  fontSize: 19,
  fontWeight: 800,
  marginBottom: 10,
}

const cardText = {
  fontSize: 13,
  color: 'var(--t3)',
  lineHeight: 1.6,
  marginBottom: 22,
  maxWidth: 480,
}

const actionRow = {
  display: 'flex',
  gap: 12,
}

const actionBtn = {
  border: 'none',
  padding: '12px 24px',
  borderRadius: 999,
  fontFamily: 'var(--ff-display)',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer',
}

const secondaryBtn = {
  background: 'var(--bg2)',
  border: '1px solid var(--b1)',
  color: 'var(--t2)',
  padding: '12px 24px',
  borderRadius: 999,
  fontFamily: 'var(--ff-display)',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
}

const subGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 14,
}

const miniCard = {
  background: 'var(--bg1)',
  border: '1px solid var(--b1)',
  borderRadius: 14,
  padding: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  cursor: 'pointer',
  transition: 'transform 0.2s, border-color 0.2s',
  boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
}

const miniBadge = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'var(--gold-light)',
  border: '1px solid var(--b1)',
  color: 'var(--gold)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--ff-mono)',
  fontSize: 10,
  fontWeight: 900,
}

const miniTitle = {
  fontSize: 13,
  fontWeight: 700,
}

const miniDesc = {
  fontSize: 10,
  color: 'var(--t3)',
  marginTop: 2,
}

const rightCol = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const avatarSection = {
  background: 'var(--bg1)',
  border: '1px solid var(--b1)',
  borderRadius: 18,
  padding: '30px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
}

const avatarBackgroundRing = {
  position: 'absolute',
  width: 170,
  height: 170,
  borderRadius: '50%',
  border: '1px dashed var(--b1)',
  top: '20px',
  animation: 'spin 20s linear infinite',
  pointerEvents: 'none',
  opacity: 0.4,
}

const avatarName = {
  fontFamily: 'var(--ff-display)',
  fontSize: 18,
  fontWeight: 800,
  marginTop: 14,
}

const avatarSubtitle = {
  fontFamily: 'var(--ff-mono)',
  fontSize: 9,
  color: 'var(--t3)',
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  marginTop: 4,
}

const avatarStatePill = (state) => {
  const colors = { idle: 'var(--t3)', listening: 'var(--cyan)', thinking: 'var(--purple)', talking: 'var(--gold)' }
  const bg = { idle: 'var(--bg3)', listening: 'rgba(34,211,238,.1)', thinking: 'rgba(167,139,250,.1)', talking: 'rgba(248,201,107,.1)' }
  return {
    fontFamily: 'var(--ff-mono)',
    fontSize: 9,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: 999,
    background: bg[state] || bg.idle,
    color: colors[state] || colors.idle,
    marginTop: 12,
    fontWeight: 800,
  }
}

const telemetrySection = {
  background: 'var(--bg1)',
  border: '1px solid var(--b1)',
  borderRadius: 18,
  padding: 18,
}

const telemetryTitle = {
  fontFamily: 'var(--ff-mono)',
  fontSize: 9,
  color: 'var(--t3)',
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  marginBottom: 12,
  fontWeight: 800,
}

const logList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const logLine = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 12,
  color: 'var(--t2)',
  gap: 8,
}

const logDot = (type) => ({
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: type === 'success' ? 'var(--green)' : 'var(--cyan)',
  boxShadow: `0 0 6px ${type === 'success' ? 'var(--green)' : 'var(--cyan)'}`,
})

const logTime = {
  fontFamily: 'var(--ff-mono)',
  fontSize: 9,
  color: 'var(--t3)',
}
