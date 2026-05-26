import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { phpApi } from '../utils/api'

export default function LoginPage() {
  const { setToken, setUser, updateSettings, theme, toggleTheme } = useStore()
  const [mode, setMode] = useState('login')
  const [showAuth, setShowAuth] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [demoNotice, setDemoNotice] = useState(false)
  const compact = typeof window !== 'undefined' && window.innerWidth < 980
  const isVerifyRoute = typeof window !== 'undefined' && window.location.pathname === '/verify-email'

  useEffect(() => {
    if (!isVerifyRoute) return
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setError('Verification link is missing its token.')
      return
    }
    setVerifying(true)
    phpApi.post('/auth/verify-email', { token })
      .then(({ data }) => {
        if (!data?.token || !data?.user) throw new Error(data?.message || 'Verification failed.')
        setToken(data.token)
        setUser(data.user)
        updateSettings(userToSettings(data.user))
        window.history.replaceState({}, '', '/')
      })
      .catch((e) => {
        setError(e.response?.data?.error || e.message || 'Verification failed.')
      })
      .finally(() => setVerifying(false))
  }, [isVerifyRoute, setToken, setUser, updateSettings])

  const submit = async () => {
    setLoading(true)
    setError('')
    setNotice('')
    setDemoNotice(false)
    const loginId = (form.email || form.username || '').trim()
    if (mode === 'login' && loginId.toLowerCase() === 'demo' && form.password === 'demo') {
      loginDemoUser()
      return
    }
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await phpApi.post(endpoint, form)
      if (mode === 'register' && data?.requires_verification) {
        setNotice(data.message || 'Account created. Check your email for the verification link.')
        setMode('login')
        setLoading(false)
        return
      }
      if (!data?.token || !data?.user) throw new Error('PHP auth endpoint did not return a session.')
      setToken(data.token)
      setUser(data.user)
      updateSettings(userToSettings(data.user))
    } catch (e) {
      const demoAllowed = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.DEV
      if (!demoAllowed) {
        setError(e.response?.data?.error || 'Login failed. Check backend and credentials.')
        setLoading(false)
        return
      }
      console.warn('REST authentication failed. Demo mode is enabled locally.', e)
      setDemoNotice(true)
      setTimeout(() => {
        loginDemoUser(form.username || form.email.split('@')[0] || 'Operator', form.email || 'operator@mezomai.com')
      }, 700)
    }
  }

  const resendVerification = async () => {
    const email = form.email.trim()
    if (!email) {
      setError('Enter your email first so we can resend the verification link.')
      return
    }
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const { data } = await phpApi.post('/auth/resend-verification', { email })
      setNotice(data.message || 'Verification email sent.')
    } catch (e) {
      setError(e.response?.data?.error || 'Could not send verification email.')
    } finally {
      setLoading(false)
    }
  }

  const loginDemoUser = (username = 'demo', email = 'demo@mezomai.local') => {
    const mockUser = {
      username,
      email,
      avatar_name: 'ARIA',
      avatar_style: 'gold',
      avatar_gender: 'female',
      personality: 'friendly',
      model: 'claude-3-5-sonnet-20241022',
      active_provider: 'anthropic',
    }
    setToken('demo_session_token_xyz')
    setUser(mockUser)
    updateSettings(userToSettings(mockUser))
    setDemoNotice(username === 'demo')
    setLoading(false)
  }

  if (isVerifyRoute) {
    return (
      <div style={pageWrap}>
        <section style={{ ...authPanel(true, true), maxWidth: 460, margin: '18vh auto 0' }}>
          <div style={eyebrow}>Email verification</div>
          <h1 style={{ ...headline, fontSize: 34, lineHeight: 1.1 }}>Confirming your account</h1>
          <p style={subcopy}>{verifying ? 'Checking your confirmation link...' : error || 'Email verified. Opening your workspace...'}</p>
          {error && <button onClick={() => { window.history.replaceState({}, '', '/'); window.location.reload() }} style={secondaryCta}>Back to Login</button>}
        </section>
      </div>
    )
  }

  return (
    <div style={pageWrap}>
      <header style={welcomeTopbar}>
        <button style={brandButton}>
          <span style={logoBox}>M</span>
          <div>
            <div style={brandName}>MEZOMAI</div>
            <div style={brandSub}>AI iOS Workspace</div>
          </div>
        </button>
        <div style={topActions}>
          <button onClick={toggleTheme} style={themeButton}>
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          {['login', 'register'].map((m) => (
            <button key={m} onClick={() => { setMode(m); setShowAuth(true) }} style={topAuthBtn(mode === m && showAuth)}>
              {m === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>
      </header>

      <main style={welcomeGrid(compact)} className="fade-in">
        <section style={welcomeHero(compact)}>
          <div style={phoneMock(compact)}>
            <div style={phoneIsland} />
            <div style={phoneTime}>9:41</div>
            <div style={phoneApps}>
              {[
                ['Chat', '#34d399', '#0f766e'],
                ['Code', '#a78bfa', '#6d28d9'],
                ['Meet', '#fb7185', '#be123c'],
                ['Stats', '#fbbf24', '#d97706'],
              ].map(([label, from, to]) => (
                <div key={label} style={phoneApp}>
                  <span style={{ ...phoneIcon, background: `linear-gradient(145deg, ${from}, ${to})` }} />
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <div style={phoneDock}>
              <span style={dockDot} />
              <span style={dockDot} />
              <span style={dockDot} />
            </div>
          </div>

          <div style={heroCopy}>
            <div style={eyebrow}>Welcome</div>
            <h1 style={headline}>Your AI workspace, arranged like apps.</h1>
            <p style={subcopy}>Open chat, code, meetings, analytics, and settings from a glass dock. MEZOMAI keeps the product feel simple, touch-friendly, and familiar.</p>
            <div style={ctaRow}>
              <button onClick={() => { setMode('login'); setShowAuth(true) }} className="gold-glow-btn" style={primaryCta}>Login</button>
              <button onClick={() => { setMode('register'); setShowAuth(true) }} style={secondaryCta}>Create Account</button>
            </div>
          </div>
        </section>

        <section style={authPanel(showAuth, compact)}>
          <div style={tabWrap}>
            {['login', 'register'].map((m) => (
              <button key={m} onClick={() => { setMode(m); setShowAuth(true) }} style={tabStyle(mode === m)}>
                {m === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <input placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} style={inputStyle}/>
            )}
            <input placeholder={mode === 'login' ? 'Email or demo' : 'Email'} type={mode === 'login' ? 'text' : 'email'} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle}/>
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={inputStyle}
            />
          </div>

          {error && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--red)', fontFamily: 'var(--ff-mono)' }}>{error}</div>}
          {notice && <div style={noticeStyle}>{notice}</div>}
          {demoNotice && <div style={noticeStyle}>Demo workspace opened. Demo ID: demo, password: demo.</div>}

          <button onClick={submit} disabled={loading} className="gold-glow-btn" style={submitBtn}>
            {loading ? 'Processing...' : mode === 'login' ? 'Login to Desktop' : 'Create Account'}
          </button>
          {mode === 'login' && (
            <button onClick={resendVerification} disabled={loading} style={resendBtn}>
              Resend verification email
            </button>
          )}

          <p style={helpText}>Demo ID: `demo`, password: `demo`.</p>
        </section>
      </main>
    </div>
  )
}

function userToSettings(user = {}) {
  return {
    avatarName: user.avatar_name || user.avatarName || 'ARIA',
    avatarStyle: user.avatar_style || user.avatarStyle || 'gold',
    avatarGender: user.avatar_gender || user.avatarGender || 'female',
    personality: user.personality || 'friendly',
    model: user.model || 'claude-3-5-sonnet-20241022',
    systemPrompt: user.system_prompt || user.systemPrompt || undefined,
    voiceName: user.voice_name || user.voiceName || 'Rachel',
    voiceSpeed: Number(user.voice_speed || user.voiceSpeed || 1),
    voicePitch: Number(user.voice_pitch || user.voicePitch || 1),
    activeProvider: user.active_provider || user.activeProvider || 'anthropic',
  }
}

const pageWrap = {
  flex: 1,
  minHeight: '100vh',
  background: `
    radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--gold) 24%, transparent), transparent 30%),
    radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--cyan) 20%, transparent), transparent 28%),
    linear-gradient(160deg, var(--bg), color-mix(in srgb, var(--bg) 82%, #dbeafe 18%))
  `,
  position: 'relative',
  padding: 18,
  overflowY: 'auto',
}

const welcomeTopbar = {
  height: 58,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  padding: 8,
  border: '1px solid color-mix(in srgb, var(--b1) 68%, transparent)',
  borderRadius: 999,
  background: 'color-mix(in srgb, var(--bg1) 74%, transparent)',
  boxShadow: '0 18px 44px rgba(15, 23, 42, .13)',
  backdropFilter: 'blur(24px) saturate(1.2)',
  position: 'relative',
  zIndex: 3,
}

const brandButton = { border: 0, background: 'transparent', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--t1)', padding: 2 }
const topActions = { display: 'flex', alignItems: 'center', gap: 8 }
const topAuthBtn = (active) => ({ border: 0, background: active ? 'var(--t1)' : 'color-mix(in srgb, var(--bg2) 84%, transparent)', color: active ? 'var(--bg1)' : 'var(--t2)', padding: '9px 14px', borderRadius: 999, fontWeight: 800, fontSize: 12 })

const welcomeGrid = (compact) => ({
  minHeight: 'calc(100vh - 94px)',
  display: 'grid',
  gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1fr) minmax(340px, 430px)',
  gap: 22,
  alignItems: 'stretch',
  paddingTop: 18,
})

const welcomeHero = (compact) => ({
  minHeight: 0,
  borderRadius: 34,
  border: '1px solid color-mix(in srgb, var(--b1) 68%, transparent)',
  background: 'color-mix(in srgb, var(--bg1) 54%, transparent)',
  boxShadow: '0 28px 90px rgba(15, 23, 42, .18), inset 0 1px 0 rgba(255,255,255,.48)',
  backdropFilter: 'blur(24px) saturate(1.2)',
  padding: 'min(6vw, 54px)',
  display: 'grid',
  gridTemplateColumns: compact ? '1fr' : 'minmax(260px, 390px) minmax(0, 1fr)',
  gap: 34,
  alignItems: 'center',
  overflow: 'hidden',
})

const phoneMock = (compact) => ({
  width: compact ? 'min(230px, 100%)' : 'min(330px, 100%)',
  aspectRatio: '9 / 16',
  margin: '0 auto',
  borderRadius: 44,
  border: '10px solid #111827',
  background: 'linear-gradient(160deg, #dbeafe, #f8fafc 38%, #bfdbfe)',
  boxShadow: '0 34px 70px rgba(15, 23, 42, .34)',
  position: 'relative',
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
})
const phoneIsland = { position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 82, height: 24, borderRadius: 999, background: '#111827' }
const phoneTime = { marginTop: 22, textAlign: 'center', fontSize: 34, fontWeight: 900, color: '#111827', fontFamily: 'var(--ff-display)' }
const phoneApps = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginTop: 34 }
const phoneApp = { display: 'grid', justifyItems: 'center', gap: 8, color: '#1f2937', fontWeight: 800 }
const phoneIcon = { width: 58, height: 58, borderRadius: 17, boxShadow: '0 12px 24px rgba(15, 23, 42, .18)' }
const phoneDock = { marginTop: 'auto', height: 74, borderRadius: 26, background: 'rgba(255,255,255,.55)', backdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }
const dockDot = { width: 46, height: 46, borderRadius: 15, background: 'rgba(255,255,255,.72)', boxShadow: '0 8px 18px rgba(15,23,42,.12)' }

const heroCopy = { maxWidth: 660 }
const eyebrow = { fontFamily: 'var(--ff-mono)', color: 'var(--gold)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }
const headline = { fontFamily: 'var(--ff-display)', fontSize: 'clamp(38px, 6vw, 78px)', lineHeight: .96, letterSpacing: 0, marginTop: 12 }
const subcopy = { color: 'var(--t2)', fontSize: 16, lineHeight: 1.7, marginTop: 20, maxWidth: 570 }
const ctaRow = { display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }
const primaryCta = { border: 0, padding: '13px 20px', borderRadius: 999, fontWeight: 900 }
const secondaryCta = { border: '1px solid var(--b1)', background: 'color-mix(in srgb, var(--bg1) 72%, transparent)', color: 'var(--t1)', padding: '13px 20px', borderRadius: 999, fontWeight: 900 }

const authPanel = (show, compact) => ({
  alignSelf: 'center',
  width: compact ? 'min(430px, 100%)' : '100%',
  justifySelf: compact ? 'center' : 'stretch',
  background: 'color-mix(in srgb, var(--bg1) 76%, transparent)',
  border: '1px solid color-mix(in srgb, var(--b1) 68%, transparent)',
  borderRadius: 28,
  padding: 26,
  boxShadow: '0 24px 70px rgba(15,23,42,.16)',
  backdropFilter: 'blur(24px) saturate(1.2)',
  opacity: show ? 1 : .96,
})

const themeButton = { border: 0, background: 'color-mix(in srgb, var(--bg2) 84%, transparent)', padding: '9px 14px', color: 'var(--t2)', borderRadius: 999, fontSize: 12, fontWeight: 800 }
const logoBox = { width: 40, height: 40, background: 'linear-gradient(135deg, var(--gold), #0f766e)', borderRadius: 14, display: 'grid', placeItems: 'center', color: '#fff', boxShadow: '0 16px 30px var(--gold-glow)', fontFamily: 'var(--ff-display)', fontWeight: 900 }
const brandName = { fontFamily: 'var(--ff-display)', fontSize: 16, fontWeight: 900, letterSpacing: '.04em' }
const brandSub = { fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.08em' }
const tabWrap = { display: 'flex', gap: 4, marginBottom: 22, background: 'color-mix(in srgb, var(--bg3) 76%, transparent)', borderRadius: 999, padding: 4 }
const tabStyle = (active) => ({ flex: 1, padding: '10px 0', border: 'none', borderRadius: 999, background: active ? 'var(--bg1)' : 'transparent', color: active ? 'var(--t1)' : 'var(--t3)', fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 800, boxShadow: active ? '0 4px 12px rgba(15,23,42,.08)' : 'none' })
const inputStyle = { width: '100%', fontSize: 13, borderRadius: 14, padding: '12px 14px' }
const noticeStyle = { marginTop: 12, fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--ff-mono)' }
const submitBtn = { width: '100%', marginTop: 20, padding: '13px 0', border: 'none', borderRadius: 999, fontFamily: 'var(--ff-display)', fontSize: 14, fontWeight: 900, opacity: 1 }
const resendBtn = { width: '100%', marginTop: 10, border: '1px solid var(--b1)', background: 'color-mix(in srgb, var(--bg2) 84%, transparent)', color: 'var(--t2)', padding: '11px 0', borderRadius: 999, fontFamily: 'var(--ff-display)', fontSize: 12, fontWeight: 800 }
const helpText = { marginTop: 18, fontSize: 11, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.6 }
