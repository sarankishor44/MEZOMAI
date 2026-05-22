import React, { useMemo, useState } from 'react'

const CHECKS = [
  {
    title: 'Authorization',
    short: 'Users locked to their own data',
    meaning: 'Authentication proves who the user is. Authorization decides what that user can touch. Every protected endpoint should verify ownership before returning or mutating a resource.',
    risk: 'Missing ownership checks create IDOR bugs. If an endpoint returns /api/orders/123 without checking the caller owns order 123, another user can enumerate resources and read private data.',
    actions: ['Match resource owner IDs against the authenticated user UUID.', 'Add tests for cross-user access attempts.', 'Never rely on UUIDs alone as the security boundary.'],
  },
  {
    title: 'Password Reset Links',
    short: 'Short-lived and single use',
    meaning: 'Reset tokens should expire quickly, become invalid after use, and be replaced whenever a new reset is requested.',
    risk: 'A non-expiring reset link is a standing account backdoor if email is forwarded, cached, screenshotted, or leaked.',
    actions: ['Set token TTL to 15-60 minutes.', 'Invalidate tokens after successful reset.', 'Invalidate older reset tokens when a new one is requested.'],
  },
  {
    title: 'Input Validation',
    short: 'SQL injection and XSS defenses',
    meaning: 'Treat all client values as hostile. Validate types, lengths, and formats. Use parameterized queries or ORM bindings, and escape or sanitize rendered output.',
    risk: 'SQL injection can expose or destroy data. XSS can steal tokens, hijack sessions, and turn one forgotten field into account takeover.',
    actions: ['Use parameterized queries everywhere.', 'Validate request bodies at the API boundary.', 'Escape or sanitize user content before rendering HTML.'],
  },
  {
    title: 'CORS',
    short: 'Lock API origins to production domains',
    meaning: 'Production CORS should allow only trusted app origins. Development origins and wildcard policies should not ship.',
    risk: 'Wide-open CORS can let malicious sites issue authenticated browser requests to your API. CORS is not a replacement for authentication or authorization.',
    actions: ['Replace * with an allowlist of production domains.', 'Remove localhost from production config.', 'Test browser calls from the deployed frontend domain.'],
  },
  {
    title: 'Rate Limiting',
    short: 'Cap abusive and expensive endpoints',
    meaning: 'Limit requests by IP, user, or API key. Apply tighter windows to login, reset, signup, search, email/SMS, and expensive AI endpoints.',
    risk: 'Without limits, brute force, credential stuffing, denial of service, and surprise cloud bills become much easier.',
    actions: ['Add strict limits to auth endpoints.', 'Add cost-aware limits to AI and search routes.', 'Return clear 429 responses with retry guidance.'],
  },
  {
    title: 'Error Handling',
    short: 'No debug pages in production',
    meaning: 'Failure states should return clean pages or structured JSON. Internal exceptions, stack traces, framework debug pages, and database errors should stay server-side.',
    risk: 'Debug output leaks file paths, library versions, environment details, query fragments, and sometimes secrets.',
    actions: ['Disable debug mode in production.', 'Create 400, 401, 403, 404, 429, and 500 responses.', 'Log internal errors with request IDs.'],
  },
  {
    title: 'Database Performance',
    short: 'Indexes on hot queries',
    meaning: 'Add targeted indexes on columns used in frequent WHERE, JOIN, and ORDER BY clauses, especially foreign keys and ownership fields.',
    risk: 'A 5ms dev query can become a 30-second production scan, locking connections and taking the app down under real traffic.',
    actions: ['Index foreign keys and owner_id columns.', 'Review hot routes with EXPLAIN.', 'Avoid indexing every column because writes and storage get slower.'],
  },
  {
    title: 'Logging and Monitoring',
    short: 'Know before users tell you',
    meaning: 'Logging records what happened. Monitoring and alerting detect when something is broken: error spikes, latency jumps, 5xx surges, failed jobs, or uptime failures.',
    risk: 'Without logs you debug blind. Without alerts, customers become your monitoring system.',
    actions: ['Emit structured JSON logs.', 'Add alerts for 5xx rate, latency, failed jobs, and uptime.', 'Include request IDs across frontend, API, and worker logs.'],
  },
  {
    title: 'Rollback Strategy',
    short: 'Blue-green or tested equivalent',
    meaning: 'Deploy to an idle environment, verify it, then switch traffic. Keep the previous environment warm so rollback is a fast traffic flip.',
    risk: 'Without rollback, incident response becomes fixing forward under pressure, which turns small deploy mistakes into long outages.',
    actions: ['Document the rollback command or load balancer flip.', 'Test rollback before launch day.', 'Keep migrations backward compatible where possible.'],
  },
]

export default function DeploymentChecklistPage() {
  const [done, setDone] = useState(() => new Set())
  const completed = done.size
  const percent = useMemo(() => Math.round((completed / CHECKS.length) * 100), [completed])

  const toggle = (title) => {
    setDone((current) => {
      const next = new Set(current)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 34px' }} className="fade-in">
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrow}>Production Readiness</div>
            <h1 style={titleStyle}>Pre-Deployment Checklist</h1>
            <p style={introStyle}>
              Shipping to production is where small oversights become public incidents. Review each control, mark what is ready, and keep the unresolved items visible before deploy.
            </p>
          </div>
          <div style={scoreCard}>
            <div style={{ fontFamily: 'var(--ff-display)', fontSize: 36, fontWeight: 800 }}>{percent}%</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>{completed} of {CHECKS.length} checks complete</div>
            <div style={progressTrack}><div style={{ ...progressFill, width: `${percent}%` }}/></div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          {CHECKS.map((item, index) => {
            const isDone = done.has(item.title)
            return (
              <article key={item.title} style={cardStyle(isDone)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={numberStyle}>{String(index + 1).padStart(2, '0')}</div>
                    <h2 style={cardTitle}>{item.title}</h2>
                    <div style={cardSub}>{item.short}</div>
                  </div>
                  <button onClick={() => toggle(item.title)} style={checkButton(isDone)} aria-label={`Mark ${item.title} ready`}>
                    {isDone ? 'Ready' : 'Open'}
                  </button>
                </div>
                <div style={sectionLabel}>What It Means</div>
                <p style={bodyText}>{item.meaning}</p>
                <div style={sectionLabel}>Why It Matters</div>
                <p style={bodyText}>{item.risk}</p>
                <div style={sectionLabel}>Verify</div>
                <ul style={actionList}>
                  {item.actions.map((action) => <li key={action}>{action}</li>)}
                </ul>
              </article>
            )
          })}
        </div>

        <section style={tlDrStyle}>
          <div style={sectionLabel}>TL;DR</div>
          <p style={{ color: 'var(--t2)', lineHeight: 1.6 }}>
            Before deploy: enforce ownership, expire reset tokens, validate input, lock CORS, rate-limit abuse paths, hide stack traces, index hot queries, ship logs and alerts, and keep rollback tested. The item marked "later" is usually the one that breaks first.
          </p>
        </section>
      </div>
    </div>
  )
}

const headerStyle = { display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'stretch', background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 16, padding: 24, boxShadow: '0 18px 46px rgba(15,23,42,.08)' }
const eyebrow = { fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }
const titleStyle = { fontFamily: 'var(--ff-display)', fontSize: 30, fontWeight: 800, margin: 0 }
const introStyle = { marginTop: 10, color: 'var(--t2)', lineHeight: 1.65, maxWidth: 760 }
const scoreCard = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }
const progressTrack = { height: 8, background: 'var(--bg3)', borderRadius: 999, overflow: 'hidden', marginTop: 6 }
const progressFill = { height: '100%', background: 'linear-gradient(90deg, var(--gold), #0f766e)', borderRadius: 999, transition: 'width .2s ease' }
const cardStyle = (done) => ({ background: 'var(--bg1)', border: `1px solid ${done ? 'var(--gold)' : 'var(--b1)'}`, borderRadius: 14, padding: 18, boxShadow: '0 12px 32px rgba(15,23,42,.06)', display: 'flex', flexDirection: 'column', gap: 10 })
const numberStyle = { fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.12em' }
const cardTitle = { fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 800, marginTop: 5 }
const cardSub = { fontSize: 12, color: 'var(--t3)', marginTop: 3 }
const checkButton = (done) => ({ border: `1px solid ${done ? 'var(--gold)' : 'var(--b1)'}`, background: done ? 'var(--gold-light)' : 'var(--bg2)', color: done ? 'var(--gold)' : 'var(--t2)', padding: '7px 10px', fontSize: 11, fontWeight: 800, fontFamily: 'var(--ff-display)' })
const sectionLabel = { fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 3 }
const bodyText = { fontSize: 12, color: 'var(--t2)', lineHeight: 1.55 }
const actionList = { paddingLeft: 18, color: 'var(--t2)', fontSize: 12, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 5 }
const tlDrStyle = { background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 14, padding: 20, boxShadow: '0 12px 32px rgba(15,23,42,.06)' }
