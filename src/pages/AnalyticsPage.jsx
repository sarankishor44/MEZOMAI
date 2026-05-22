import React, { useState } from 'react'

const MOCK_SESSIONS = [12,8,15,22,18,30,25,14,20,28,35,19,24,32,16,22,29,18,25,33,20,15,28,35,22,18,24,30]
const MOCK_TOKENS  = [3200,1800,4500,6200,3800,8100,5500,2900,5200,7400,9200,4100,6300,8500,3700,5900,7800,4200,6500,8900,5100,3400,7200,9500,5800,4300,6100,8200]

const HISTORY = [
  { date: 'Today 10:00', duration: '18 min', msgs: 24, platform: '🟢' },
  { date: 'Yesterday 2:00 PM', duration: '42 min', msgs: 58, platform: '🔵' },
  { date: 'Mon 10:00 AM', duration: '1h 5min', msgs: 93, platform: '🟣' },
  { date: 'Fri 3:00 PM', duration: '28 min', msgs: 36, platform: '🟢' },
  { date: 'Thu 11:00 AM', duration: '55 min', msgs: 71, platform: '🔵' },
]

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d')
  const ranges = ['7d','30d','90d','all']

  const sliced = range === '7d' ? MOCK_SESSIONS.slice(-7) : range === '30d' ? MOCK_SESSIONS : MOCK_SESSIONS
  const maxS = Math.max(...sliced)
  const maxT = Math.max(...MOCK_TOKENS)

  return (
    <div style={{ flex: 1, overflowY: 'auto' }} className="fade-in">
      {/* Header */}
      <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--ff)', fontSize: 18, fontWeight: 800 }}>Analytics</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {ranges.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ background: range === r ? 'var(--cyang)' : 'var(--bg2)', border: `1px solid ${range === r ? 'var(--cyan)' : 'var(--b1)'}`, borderRadius: 7, padding: '5px 12px', fontFamily: 'var(--fm)', fontSize: 11, color: range === r ? 'var(--cyan)' : 'var(--t3)', cursor: 'pointer', transition: 'all .2s' }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Total Sessions', value: '248', delta: '+12%', color: 'var(--cyan)' },
            { label: 'Messages Sent', value: '3,842', delta: '+8%', color: 'var(--purple)' },
            { label: 'Tokens Used', value: '284k', delta: '+21%', color: 'var(--amber)' },
            { label: 'Est. Cost', value: '$4.18', delta: '+19%', color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--ff)', fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--green)' }}>{s.delta} this {range}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Sessions chart */}
          <ChartCard title="Sessions Over Time">
            <MiniChart data={sliced} max={maxS} color="var(--cyan)"/>
          </ChartCard>

          {/* Token chart */}
          <ChartCard title="Token Usage">
            <MiniChart data={MOCK_TOKENS.slice(-sliced.length)} max={maxT} color="var(--purple)"/>
          </ChartCard>
        </div>

        {/* Resource bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartCard title="Resource Usage">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ResourceBar label="Input Tokens" used={184000} total={500000} color="var(--cyan)"/>
              <ResourceBar label="Output Tokens" used={100000} total={200000} color="var(--purple)"/>
              <ResourceBar label="Voice Characters" used={24000} total={100000} color="var(--pink)"/>
              <ResourceBar label="Meeting Minutes" used={280} total={600} color="var(--amber)"/>
            </div>
          </ChartCard>

          {/* Cost breakdown */}
          <ChartCard title="Cost Breakdown">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontFamily: 'var(--ff)', fontSize: 28, fontWeight: 800, color: 'var(--green)', marginBottom: 4 }}>$4.18</div>
              {[
                { label: 'Input tokens (184k)', cost: '$0.55', pct: 13 },
                { label: 'Output tokens (100k)', cost: '$1.50', pct: 36 },
                { label: 'Meetings (280 min)', cost: '$1.82', pct: 44 },
                { label: 'Voice synthesis', cost: '$0.31', pct: 7 },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--t2)' }}>{item.label}</div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--t1)', minWidth: 40, textAlign: 'right' }}>{item.cost}</div>
                  <div style={{ width: 60, height: 4, background: 'var(--b1)', borderRadius: 2 }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', background: 'var(--green)', borderRadius: 2 }}/>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Meeting history */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--ff)', fontSize: 13, fontWeight: 700 }}>Meeting History</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--b1)' }}>
                {['Date','Duration','Messages','Platform','Notes'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.08em', fontWeight: 400, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < HISTORY.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                  <td style={td}>{row.date}</td>
                  <td style={{ ...td, fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--cyan)' }}>{row.duration}</td>
                  <td style={td}>{row.msgs}</td>
                  <td style={td}>{row.platform}</td>
                  <td style={td}><button style={{ background: 'var(--bg3)', border: '1px solid var(--b1)', borderRadius: 5, padding: '4px 10px', fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--t2)', cursor: 'pointer' }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, padding: 20 }}>
      <div style={{ fontFamily: 'var(--ff)', fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 16, letterSpacing: '.04em' }}>{title}</div>
      {children}
    </div>
  )
}

function MiniChart({ data, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
      {data.map((v, i) => (
        <div key={i} title={v} style={{ flex: 1, background: `${color}20`, border: `1px solid ${color}40`, borderRadius: '3px 3px 0 0', height: `${(v / max) * 100}%`, minHeight: 4, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={e => e.target.style.background = `${color}40`}
          onMouseLeave={e => e.target.style.background = `${color}20`}
        />
      ))}
    </div>
  )
}

function ResourceBar({ label, used, total, color }) {
  const pct = Math.round((used / total) * 100)
  const fmt = n => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--t2)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--t3)' }}>{fmt(used)} / {fmt(total)}</span>
      </div>
      <div style={{ height: 5, background: 'var(--b1)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, boxShadow: `0 0 6px ${color}60`, transition: 'width .5s' }}/>
      </div>
    </div>
  )
}

const td = { padding: '12px 20px', fontSize: 12, color: 'var(--t2)' }
