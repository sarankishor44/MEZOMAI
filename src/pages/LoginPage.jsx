import React, { useState } from 'react'
import { useStore } from '../store'
import { phpApi } from '../utils/api'

export default function LoginPage() {
  const { setToken, setUser, theme, toggleTheme } = useStore()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoNotice, setDemoNotice] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError('')
    setDemoNotice(false)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await phpApi.post(endpoint, form)
      setToken(data.token)
      setUser(data.user)
    } catch (e) {
      console.warn('REST authentication failed. Falling back to demo mode.', e)
      setDemoNotice(true)
      setTimeout(() => {
        const mockUser = {
          username: form.username || form.email.split('@')[0] || 'Operator',
          email: form.email || 'operator@mezomai.com',
          avatar_name: 'ARIA',
          avatar_style: 'gold',
          personality: 'friendly',
          model: 'claude-3-5-sonnet-20241022',
        }
        setToken('demo_session_token_xyz')
        setUser(mockUser)
        setLoading(false)
      }, 700)
    }
  }

  return (
    <div style={pageWrap}>
      <button onClick={toggleTheme} style={themeButton}>
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </button>

      <section style={heroPanel} className="fade-in">
        <div style={brandRow}>
          <div style={logoBox}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" width="24" height="24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <div style={brandName}>MEZOMAI</div>
            <div style={brandSub}>AI CHARACTER PLATFORM</div>
          </div>
        </div>

        <div style={tabWrap}>
          {['login', 'register'].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={tabStyle(mode === m)}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} style={inputStyle}/>
          )}
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle}/>
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
        {demoNotice && <div style={noticeStyle}>Backend unavailable. Opening the local demo workspace.</div>}

        <button onClick={submit} disabled={loading} className="gold-glow-btn" style={submitBtn}>
          {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <p style={helpText}>
          Use any demo email and password to explore the client features instantly.
        </p>
      </section>
    </div>
  )
}

const pageWrap = {
  flex: 1,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg)',
  position: 'relative',
  padding: 24,
}

const themeButton = {
  position: 'absolute',
  top: 20,
  right: 20,
  background: 'var(--bg1)',
  border: '1px solid var(--b1)',
  padding: '9px 12px',
  color: 'var(--t2)',
  fontSize: 12,
}

const heroPanel = {
  width: 'min(420px, 100%)',
  background: 'var(--bg1)',
  border: '1px solid var(--b1)',
  borderRadius: 16,
  padding: 34,
  boxShadow: '0 24px 70px rgba(15,23,42,.14)',
}

const brandRow = { display: 'flex', alignItems: 'center', gap: 13, marginBottom: 30 }
const logoBox = { width: 46, height: 46, background: 'linear-gradient(135deg, var(--gold), #0f766e)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 30px var(--gold-glow)' }
const brandName = { fontFamily: 'var(--ff-display)', fontSize: 25, fontWeight: 800, letterSpacing: '.04em' }
const brandSub = { fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em' }
const tabWrap = { display: 'flex', gap: 4, marginBottom: 22, background: 'var(--bg3)', borderRadius: 10, padding: 4 }
const tabStyle = (active) => ({ flex: 1, padding: '9px 0', border: 'none', background: active ? 'var(--bg1)' : 'transparent', color: active ? 'var(--t1)' : 'var(--t3)', fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 700, boxShadow: active ? '0 4px 12px rgba(15,23,42,.08)' : 'none' })
const inputStyle = { width: '100%', fontSize: 13 }
const noticeStyle = { marginTop: 12, fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--ff-mono)' }
const submitBtn = { width: '100%', marginTop: 20, padding: '13px 0', border: 'none', fontFamily: 'var(--ff-display)', fontSize: 14, fontWeight: 800, opacity: 1 }
const helpText = { marginTop: 18, fontSize: 11, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.6 }
