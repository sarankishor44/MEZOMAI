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
      console.warn("REST authentication failed. Falling back to Demo Mode.", e)
      
      // Auto-fallback to local Demo Mode for Vercel/mock environments
      setDemoNotice(true)
      setTimeout(() => {
        const mockUser = {
          username: form.username || form.email.split('@')[0] || 'AriaOperator',
          email: form.email || 'operator@mezomai.com',
          avatar_name: 'ARIA',
          avatar_style: 'gold',
          personality: 'friendly',
          model: 'claude-3-5-sonnet-20241022'
        }
        setToken('demo_session_token_xyz')
        setUser(mockUser)
        setLoading(false)
      }, 1000)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', height: '100vh' }}>
      
      {/* Theme selector in corner of login page */}
      <button onClick={toggleTheme} style={{
        position: 'absolute', top: 20, right: 20, background: 'var(--bg2)', border: '1px solid var(--b1)',
        borderRadius: 10, padding: 10, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
      }}>
        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </button>

      <div style={{ width: 380, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 20, padding: 40, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} className="fade-in">
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, var(--gold), #aa843c)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px var(--gold-glow)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fffdf6" strokeWidth="2.5" width="24" height="24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--ff-display)', fontSize: 24, fontWeight: 800, letterSpacing: '.06em', color: 'var(--gold)' }}>MEZOMAI</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em' }}>AI CHARACTER PLATFORM</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg1)', borderRadius: 10, padding: 4 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 700,
              background: mode === m ? 'var(--bg3)' : 'transparent',
              color: mode === m ? 'var(--t1)' : 'var(--t3)',
              letterSpacing: '.04em', transition: 'all .2s',
            }}>{m === 'login' ? 'Sign In' : 'Register'}</button>
          ))}
        </div>

        {/* Field Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input placeholder="Username" value={form.username}
              onChange={e => setForm(f => ({...f, username: e.target.value}))}
              style={inputStyle}/>
          )}
          <input placeholder="Email" type="email" value={form.email}
            onChange={e => setForm(f => ({...f, email: e.target.value}))}
            style={inputStyle}/>
          <input placeholder="Password" type="password" value={form.password}
            onChange={e => setForm(f => ({...f, password: e.target.value}))}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={inputStyle}/>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--red)', fontFamily: 'var(--ff-mono)' }}>{error}</div>}
        {demoNotice && <div style={{ marginTop: 12, fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--ff-mono)', fontStyle: 'italic' }}>Connecting to local node... Entering Demo mode!</div>}

        {/* Action Button */}
        <button onClick={submit} disabled={loading} className="gold-glow-btn" style={{
          width: '100%', marginTop: 20, padding: '13px 0', border: 'none', borderRadius: 10, fontFamily: 'var(--ff-display)',
          fontSize: 14, fontWeight: 800, letterSpacing: '.06em', transition: 'all .2s',
          opacity: loading ? .7 : 1,
        }}>
          {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <p style={{ marginTop: 18, fontSize: 10, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.6 }}>
          Tip: You can use any demo email and password to log in and test all client features instantly!
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', background: 'var(--bg1)', border: '1px solid var(--b1)',
  borderRadius: 10, padding: '11px 14px', fontSize: 13, color: 'var(--t1)', outline: 'none',
}
