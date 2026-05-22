import React, { useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'

const SKILLS = [
  { icon: '💬', title: 'Natural Chat', desc: 'Context-aware conversations with memory', color: 'var(--cyan)', active: true },
  { icon: '👁️', title: 'Vision Analytics', desc: 'Analyze images and document payloads', color: 'var(--purple)', active: true },
  { icon: '💻', title: 'Code IDE Sandbox', desc: 'Write, debug, execute and explain code blocks', color: 'var(--green)', active: true },
  { icon: '🎥', title: 'Meeting Integration', desc: 'Join WebRTC rooms as an active AI participant', color: 'var(--gold)', active: true },
  { icon: '🔊', title: 'Neural Synthesis', desc: 'Convert textual agent streams to lifelike voice', color: 'var(--pink)', active: true },
  { icon: '📊', title: 'Analytics Engine', desc: 'Monitor system telemetry, token counters and costs', color: 'var(--t2)', active: true },
]

const ACTIVITY = [
  { icon: '💬', text: <><strong>Chat session</strong> — 24 messages, 3.2k tokens consumed</>, time: '2m ago', color: 'var(--cyan)' },
  { icon: '🎥', text: <><strong>Meeting completed</strong> — 18 min, action summaries generated</>, time: '1h ago', color: 'var(--gold)' },
  { icon: '💻', text: <><strong>Code run</strong> — Python subprocess, 0.3s, exit code 0</>, time: '3h ago', color: 'var(--green)' },
  { icon: '⚙️', text: <><strong>Settings updated</strong> — Model migrated to Sonnet 3.5</>, time: 'Yesterday', color: 'var(--t3)' },
]

export default function DashboardPage() {
  const { setPage, avatarState, settings, user } = useStore()
  const [joinUrl, setJoinUrl] = useState('')

  const handleQuickJoin = () => {
    if (joinUrl.trim()) {
      // Store to local history and navigate
      const newMeeting = {
        id: 'meet_' + Date.now(),
        date: new Date().toLocaleDateString(),
        duration: '00:00',
        platform: joinUrl.includes('meet.google.com') ? 'Google Meet' : joinUrl.includes('zoom.us') ? 'Zoom' : 'Teams',
        link: joinUrl
      }
      useStore.getState().saveRecentMeeting(newMeeting)
      setPage('meetings')
    }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="fade-in">

      {/* ── LEFT MAIN GRID ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--b1)' }}>

        {/* Dashboard Header */}
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Operator Console</div>
            <div style={{ fontFamily: 'var(--ff-display)', fontSize: 24, fontWeight: 800, marginTop: 2, color: 'var(--gold)' }}>
              Welcome back, {user?.username || 'Operator'}
            </div>
          </div>
          <StatusBadge state={avatarState}/>
        </div>

        {/* Quick Join */}
        <div style={{ margin: '16px 28px', flexShrink: 0 }}>
          <QuickJoinBar value={joinUrl} onChange={setJoinUrl} onJoin={handleQuickJoin}/>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--b1)', borderTop: '1px solid var(--b1)', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
          <StatCard icon="💬" value="248" label="Messages Sent" color="var(--cyan)"/>
          <StatCard icon="🎥" value="12" label="Meetings Managed" color="var(--gold)"/>
          <StatCard icon="🔤" value="84.2k" label="Tokens Tracked" color="var(--purple)"/>
          <StatCard icon="💰" value="$1.24" label="Est. Cost (USD)" color="var(--green)"/>
        </div>

        {/* Capabilities grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14 }}>System Capabilities</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {SKILLS.map((sk, i) => <SkillCard key={i} {...sk}/>)}
          </div>
        </div>

        {/* Action button triggers */}
        <div style={{ padding: '14px 28px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 10, flexShrink: 0, backgroundColor: 'var(--bg1)' }}>
          <button onClick={() => setPage('chat')} className="gold-glow-btn" style={btnPrimary}>
            <span>💬</span> Start Live Chat
          </button>
          <button onClick={() => setPage('meetings')} style={btnSecondary}>
            <span>🎥</span> Join WebRTC Room
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ width: 300, background: 'var(--bg1)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Avatar Display */}
        <div style={{ padding: '28px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <AvatarFace size={120}/>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 22, fontWeight: 800, letterSpacing: '.04em', color: 'var(--gold)' }}>{settings.avatarName}</div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: '.12em', textTransform: 'uppercase', background: 'var(--gold-light)', padding: '4px 10px', borderRadius: 20 }}>
            {avatarState}
          </div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--t3)' }}>
            {settings.model.split('-').slice(0, 3).join('-')}
          </div>
        </div>

        {/* Activity Streams */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>System Log Feed</div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--b1)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg2)', border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{a.text}</div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── INNER HELPER COMPONENTS ──────────────────────────────────

function QuickJoinBar({ value, onChange, onJoin }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" width="16" height="16">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder="Paste a Google Meet, Zoom or Teams link..."
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--t1)', caretColor: 'var(--gold)' }}
      />
      <button onClick={onJoin} className="gold-glow-btn" style={{ border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: 'var(--ff-display)', fontSize: 12, fontWeight: 700 }}>
        Join Bot
      </button>
    </div>
  )
}

function StatusBadge({ state }) {
  const colors = {
    idle: 'var(--t3)',
    listening: 'var(--cyan)',
    thinking: 'var(--purple)',
    talking: 'var(--gold)'
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 20, padding: '6px 14px' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[state] || colors.idle, boxShadow: `0 0 8px ${colors[state] || colors.idle}`, animation: 'pulse 2s infinite' }}/>
      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{state}</span>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}

function StatCard({ icon, value, label, color }) {
  return (
    <div style={{ background: 'var(--bg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `var(--gold-light)`, border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 800, lineHeight: 1, color: 'var(--t1)' }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      </div>
    </div>
  )
}

function SkillCard({ icon, title, desc, color, active }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 110 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.transform = 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--bg1)', border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 8, letterSpacing: '.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 4,
          background: active ? 'var(--gold-light)' : 'var(--bg1)', color: active ? 'var(--gold)' : 'var(--t3)',
          border: `1px solid ${active ? 'var(--b2)' : 'var(--b1)'}` }}>
          {active ? 'enabled' : 'disabled'}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 700, marginBottom: 4, color: 'var(--t1)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  )
}

const btnPrimary = { flex: 1, border: 'none', borderRadius: 10, padding: '12px 20px', fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '.04em', cursor: 'pointer' }
const btnSecondary = { flex: 1, background: 'var(--bg2)', color: 'var(--t1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '12px 20px', fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }
