import React, { useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'

const SKILLS = [
  { icon: 'CH', title: 'Natural Chat', desc: 'Context-aware conversations with memory', active: true },
  { icon: 'VA', title: 'Vision Analytics', desc: 'Analyze images and document payloads', active: true },
  { icon: 'IDE', title: 'Code IDE Sandbox', desc: 'Write, debug, execute and explain code blocks', active: true },
  { icon: 'MT', title: 'Meeting Integration', desc: 'Join WebRTC rooms as an active AI participant', active: true },
  { icon: 'VO', title: 'Neural Synthesis', desc: 'Convert text streams to lifelike voice', active: true },
  { icon: 'AN', title: 'Analytics Engine', desc: 'Monitor telemetry, token counters and costs', active: true },
]

const ACTIVITY = [
  { icon: 'CH', text: <><strong>Chat session</strong> - 24 messages, 3.2k tokens consumed</>, time: '2m ago' },
  { icon: 'MT', text: <><strong>Meeting completed</strong> - 18 min, action summary generated</>, time: '1h ago' },
  { icon: 'PY', text: <><strong>Code run</strong> - Python subprocess, 0.3s, exit code 0</>, time: '3h ago' },
  { icon: 'SET', text: <><strong>Settings updated</strong> - Model migrated to Sonnet 3.5</>, time: 'Yesterday' },
]

export default function DashboardPage() {
  const { setPage, avatarState, settings, user } = useStore()
  const [joinUrl, setJoinUrl] = useState('')

  const handleQuickJoin = () => {
    if (!joinUrl.trim()) return
    useStore.getState().saveRecentMeeting({
      id: 'meet_' + Date.now(),
      date: new Date().toLocaleDateString(),
      duration: '00:00',
      platform: joinUrl.includes('meet.google.com') ? 'Google Meet' : joinUrl.includes('zoom.us') ? 'Zoom' : 'Teams',
      link: joinUrl,
    })
    setPage('meetings')
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="fade-in">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--b1)' }}>
        <div style={{ padding: '22px 30px 18px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg1)' }}>
          <div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Operator Console</div>
            <div style={{ fontFamily: 'var(--ff-display)', fontSize: 25, fontWeight: 800, marginTop: 3 }}>
              Welcome back, {user?.username || 'Operator'}
            </div>
          </div>
          <StatusBadge state={avatarState}/>
        </div>

        <div style={{ margin: '18px 30px', flexShrink: 0 }}>
          <QuickJoinBar value={joinUrl} onChange={setJoinUrl} onJoin={handleQuickJoin}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '0 30px 18px', flexShrink: 0 }}>
          <StatCard icon="CH" value="248" label="Messages Sent"/>
          <StatCard icon="MT" value="12" label="Meetings Managed"/>
          <StatCard icon="TK" value="84.2k" label="Tokens Tracked"/>
          <StatCard icon="$" value="$1.24" label="Est. Cost"/>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 30px 22px' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14 }}>System Capabilities</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {SKILLS.map((sk) => <SkillCard key={sk.title} {...sk}/>)}
          </div>
        </div>

        <div style={{ padding: '16px 30px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 12, flexShrink: 0, backgroundColor: 'var(--bg1)' }}>
          <button onClick={() => setPage('chat')} className="gold-glow-btn" style={btnPrimary}>
            Start Live Chat
          </button>
          <button onClick={() => setPage('meetings')} style={btnSecondary}>
            Join WebRTC Room
          </button>
        </div>
      </div>

      <div style={{ width: 310, background: 'var(--bg1)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '30px 22px', borderBottom: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <AvatarFace size={120}/>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 22, fontWeight: 800 }}>{settings.avatarName}</div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: '.12em', textTransform: 'uppercase', background: 'var(--gold-light)', padding: '5px 10px', borderRadius: 999 }}>
            {avatarState}
          </div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--t3)' }}>
            {settings.model.split('-').slice(0, 3).join('-')}
          </div>
        </div>

        <div style={{ padding: '18px 22px' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>System Log Feed</div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--b1)' : 'none' }}>
              <div style={miniBadge}>{a.icon}</div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{a.text}</div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickJoinBar({ value, onChange, onJoin }) {
  return (
    <div style={{ background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 12px 30px rgba(15,23,42,.06)' }}>
      <span style={miniBadge}>MT</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste a Google Meet, Zoom or Teams link..."
        style={{ flex: 1, background: 'none', border: 'none', boxShadow: 'none', fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--t1)' }}
      />
      <button onClick={onJoin} className="gold-glow-btn" style={{ border: 'none', padding: '8px 16px', fontFamily: 'var(--ff-display)', fontSize: 12, fontWeight: 700 }}>
        Join Bot
      </button>
    </div>
  )
}

function StatusBadge({ state }) {
  const colors = { idle: 'var(--t3)', listening: 'var(--cyan)', thinking: 'var(--purple)', talking: 'var(--gold)' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 999, padding: '7px 14px' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[state] || colors.idle }}/>
      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{state}</span>
    </div>
  )
}

function StatCard({ icon, value, label }) {
  return (
    <div style={{ background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 24px rgba(15,23,42,.05)' }}>
      <div style={miniBadge}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--ff-display)', fontSize: 21, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      </div>
    </div>
  )
}

function SkillCard({ icon, title, desc, active }) {
  return (
    <div style={{ background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 12, padding: 16, minHeight: 116, boxShadow: '0 10px 24px rgba(15,23,42,.05)' }} className="glow-card-hover">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={miniBadge}>{icon}</div>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 8, letterSpacing: '.08em', textTransform: 'uppercase', padding: '4px 7px', borderRadius: 6, background: active ? 'var(--gold-light)' : 'var(--bg3)', color: active ? 'var(--gold)' : 'var(--t3)' }}>
          {active ? 'enabled' : 'disabled'}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--ff-display)', fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.45 }}>{desc}</div>
    </div>
  )
}

const miniBadge = {
  width: 34,
  height: 34,
  borderRadius: 8,
  background: 'var(--gold-light)',
  border: '1px solid var(--b1)',
  color: 'var(--gold)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--ff-mono)',
  fontSize: 10,
  fontWeight: 800,
  flexShrink: 0,
}

const btnPrimary = { flex: 1, border: 'none', padding: '12px 20px', fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }
const btnSecondary = { flex: 1, background: 'var(--bg2)', color: 'var(--t1)', border: '1px solid var(--b1)', padding: '12px 20px', fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
