import React, { useState } from 'react'
import { useStore } from '../store'
import { phpApi } from '../utils/api'
import { isSupabaseConfigured } from '../utils/supabase'
import { supabaseLogin, supabaseRegister } from '../utils/supabaseBackend'

export default function LoginPage() {
  const { setToken, setUser, updateSettings, theme, toggleTheme } = useStore()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoNotice, setDemoNotice] = useState(false)
  const [registerCooldownUntil, setRegisterCooldownUntil] = useState(0)

  const submit = async () => {
    if (mode === 'register' && Date.now() < registerCooldownUntil) {
      setError('Supabase email limit is cooling down. Wait a few minutes, or enable Resend SMTP in Supabase Auth.')
      return
    }
    setLoading(true)
    setError('')
    setDemoNotice(false)
    const loginId = (form.email || form.username || '').trim()
    if (mode === 'login' && loginId.toLowerCase() === 'demo' && form.password === 'demo') {
      loginDemoUser()
      return
    }
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await phpApi.post(endpoint, form)
      if (!data?.token || !data?.user) throw new Error('PHP auth endpoint did not return a session.')
      setToken(data.token)
      setUser(data.user)
      updateSettings(userToSettings(data.user))
    } catch (e) {
      if (isSupabaseConfigured) {
        try {
          const authEmail = form.email.trim()
          if (!authEmail.includes('@')) throw new Error('Use an email address for Supabase login, or use demo / demo.')
          const data = mode === 'login'
            ? await supabaseLogin(authEmail, form.password)
            : await supabaseRegister({ email: authEmail, password: form.password, username: form.username })
          if (!data.token) throw new Error('Check your email to confirm the Supabase account before signing in.')
          setToken(data.token)
          setUser(data.user)
          updateSettings(userToSettings(data.user))
          setLoading(false)
          return
        } catch (supabaseError) {
          const message = formatSupabaseAuthError(supabaseError)
          if (message.includes('email limit')) setRegisterCooldownUntil(Date.now() + 5 * 60 * 1000)
          setError(message)
          setLoading(false)
          return
        }
      }
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
        {demoNotice && <div style={noticeStyle}>Demo workspace opened. Demo ID: demo, password: demo.</div>}

        <button onClick={submit} disabled={loading} className="gold-glow-btn" style={submitBtn}>
          {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <p style={helpText}>
          Supabase works on Vercel when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Demo ID: `demo`, password: `demo`.
        </p>
      </section>
    </div>
  )
}

function formatSupabaseAuthError(error) {
  const raw = error?.message || 'Supabase authentication failed.'
  const lower = raw.toLowerCase()
  if (lower.includes('email rate limit')) {
    return 'Supabase email limit exceeded. Wait a few minutes, or connect Resend as custom SMTP in Supabase Auth.'
  }
  if (lower.includes('signup is disabled')) {
    return 'Signup is disabled in Supabase Auth settings.'
  }
  if (lower.includes('email not confirmed') || lower.includes('confirm')) {
    return raw
  }
  return raw
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
