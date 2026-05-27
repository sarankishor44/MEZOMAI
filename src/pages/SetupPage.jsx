import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { getBackendUrls, setBackendUrls } from '../utils/api'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

export default function SetupPage() {
  const { setPage, token } = useStore()

  // Load values
  const [phpUrl, setPhpUrl] = useState(() => localStorage.getItem('aria_php_api_url') || import.meta.env.VITE_PHP_API || 'http://localhost:8000/api')
  const [pythonUrl, setPythonUrl] = useState(() => localStorage.getItem('aria_py_api_url') || import.meta.env.VITE_PYTHON_API || 'http://localhost:8001')
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('aria_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '')
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('aria_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '')

  // Health check statuses: 'idle' | 'testing' | 'success' | 'error'
  const [phpStatus, setPhpStatus] = useState('idle')
  const [pythonStatus, setPythonStatus] = useState('idle')
  const [supabaseStatus, setSupabaseStatus] = useState('idle')

  const [logs, setLogs] = useState([])

  const addLog = (text, type = 'info') => {
    setLogs(prev => [{ text, type, time: new Date().toLocaleTimeString() }, ...prev])
  }

  const testPhp = async () => {
    setPhpStatus('testing')
    addLog(`Pinging PHP Backend at ${phpUrl}/health...`, 'info')
    try {
      const res = await axios.get(`${phpUrl.replace(/\/$/, '')}/health`, { timeout: 4000 })
      if (res.data?.status === 'online') {
        setPhpStatus('success')
        addLog(`PHP Backend connected successfully. Version: ${res.data.version || '1.0.0'}.`, 'success')
      } else {
        throw new Error('Invalid response structure from backend health route.')
      }
    } catch (e) {
      setPhpStatus('error')
      addLog(`PHP Connection failed: ${e.response?.data?.message || e.message}`, 'error')
    }
  }

  const testPython = async () => {
    setPythonStatus('testing')
    addLog(`Pinging Python Backend at ${pythonUrl}...`, 'info')
    try {
      // Check either root or /ai health
      const cleanUrl = pythonUrl.replace(/\/$/, '')
      const res = await axios.get(`${cleanUrl}/`, { timeout: 4000 })
      setPythonStatus('success')
      addLog(`Python Backend connected successfully. Services online.`, 'success')
    } catch (e) {
      // Fallback check to /ai
      try {
        const cleanUrl = pythonUrl.replace(/\/$/, '')
        await axios.get(`${cleanUrl}/ai`, { timeout: 3000 })
        setPythonStatus('success')
        addLog(`Python Backend /ai route is reachable.`, 'success')
      } catch (err) {
        setPythonStatus('error')
        addLog(`Python Connection failed: ${err.message}`, 'error')
      }
    }
  }

  const testSupabase = async () => {
    setSupabaseStatus('testing')
    addLog('Initializing temporary Supabase client...', 'info')
    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL or Anon key is missing.')
      }
      const client = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await client.auth.getSession()
      if (error) throw error
      setSupabaseStatus('success')
      addLog('Supabase authentication handshakes completed successfully.', 'success')
    } catch (e) {
      setSupabaseStatus('error')
      addLog(`Supabase Connection failed: ${e.message}`, 'error')
    }
  }

  const testAll = () => {
    testPhp()
    testPython()
    testSupabase()
  }

  useEffect(() => {
    addLog('Setup panel loaded. Review your cluster node addresses below.', 'info')
    testAll()
  }, [])

  const handleSave = () => {
    localStorage.setItem('aria_php_api_url', phpUrl.trim())
    localStorage.setItem('aria_py_api_url', pythonUrl.trim())
    localStorage.setItem('aria_supabase_url', supabaseUrl.trim())
    localStorage.setItem('aria_supabase_anon_key', supabaseKey.trim())
    addLog('Configuration saved to localStorage client registries. Reloading...', 'success')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const handleClear = () => {
    localStorage.removeItem('aria_php_api_url')
    localStorage.removeItem('aria_py_api_url')
    localStorage.removeItem('aria_supabase_url')
    localStorage.removeItem('aria_supabase_anon_key')
    addLog('Local custom configuration wiped. Restoring original env fallbacks.', 'info')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div style={pageWrap} className="fade-in">
      <header style={headerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={logoBox}>S</span>
          <div>
            <h1 style={title}>Workspace Cluster Node Setup</h1>
            <div style={subtitle}>Configure local ports, cloud databases, and test system cluster connectivity</div>
          </div>
        </div>
        <button onClick={() => setPage(token ? 'dashboard' : 'login')} style={backBtn}>
          {token ? 'Back to Dashboard' : 'Back to Login'}
        </button>
      </header>

      <div style={grid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={panel}>
            <h2 style={sectionTitle}>API Cluster Node Registry</h2>
            <p style={sectionDesc}>Mount and link your custom microservice APIs to route serverless calls safely.</p>
            
            <div style={formGroup}>
              <label style={label}>PHP / Laravel Backend Root Endpoint</label>
              <input value={phpUrl} onChange={e => setPhpUrl(e.target.value)} style={input} placeholder="e.g. http://localhost:8000/api"/>
            </div>

            <div style={formGroup}>
              <label style={label}>Python / FastAPI Sandbox & AI Services</label>
              <input value={pythonUrl} onChange={e => setPythonUrl(e.target.value)} style={input} placeholder="e.g. http://localhost:8001"/>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={testPhp} disabled={phpStatus === 'testing'} style={pingBtn}>Ping PHP Node</button>
              <button onClick={testPython} disabled={pythonStatus === 'testing'} style={pingBtn}>Ping Python Node</button>
            </div>
          </section>

          <section style={panel}>
            <h2 style={sectionTitle}>Supabase Cloud Database Creds</h2>
            <p style={sectionDesc}>Save secure anon keys dynamically. Avoid recompiling or shipping client secrets.</p>

            <div style={formGroup}>
              <label style={label}>Supabase Project URL</label>
              <input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} style={input} placeholder="e.g. https://xxx.supabase.co"/>
            </div>

            <div style={formGroup}>
              <label style={label}>Supabase Anon Key</label>
              <input value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} type="password" style={input} placeholder="sb_publishable_..."/>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={testSupabase} disabled={supabaseStatus === 'testing'} style={pingBtn}>Ping Supabase Node</button>
            </div>
          </section>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={handleSave} className="gold-glow-btn" style={saveBtn}>Save Cluster Registry</button>
            <button onClick={handleClear} style={clearBtn}>Restore Defaults</button>
            <button onClick={testAll} style={testAllBtn}>Test All Nodes</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={panel}>
            <h2 style={sectionTitle}>Node Health Metrics</h2>
            <p style={sectionDesc}>Telemetry check ping status indicators</p>

            <div style={statusRows}>
              <StatusRow label="Laravel PHP API Controller" status={phpStatus} url={phpUrl} />
              <StatusRow label="FastAPI Python Sandbox" status={pythonStatus} url={pythonUrl} />
              <StatusRow label="Supabase Auth & Database" status={supabaseStatus} url={supabaseUrl || 'Not set'} />
            </div>
          </section>

          <section style={{ ...panel, flex: 1, minHeight: 220, display: 'flex', flexDirection: 'column' }}>
            <h2 style={sectionTitle}>Live Diagnostic Logs</h2>
            <p style={sectionDesc}>Live telemetry and configuration console trace logs</p>
            <div style={terminalBody}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--t3)', fontFamily: 'var(--ff-mono)' }}>No diagnostic diagnostics reported yet. Click test nodes to query.</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} style={logLine(log.type)}>
                    <span style={logTime}>[{log.time}]</span>
                    <span>{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, status, url }) {
  const badgeColors = {
    idle: { bg: 'var(--bg3)', text: 'var(--t3)', dot: 'var(--t3)' },
    testing: { bg: 'rgba(234,179,8,.1)', text: 'var(--gold)', dot: 'var(--gold)' },
    success: { bg: 'rgba(34,197,94,.1)', text: 'var(--green)', dot: 'var(--green)' },
    error: { bg: 'rgba(239,68,68,.1)', text: 'var(--red)', dot: 'var(--red)' },
  }

  const badge = badgeColors[status] || badgeColors.idle

  return (
    <div style={statusRow}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--ff-mono)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{url}</div>
      </div>
      <span style={statusBadge(badge.bg, badge.text)}>
        <span style={statusDot(badge.dot)}/>
        <span style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 9, fontWeight: 900 }}>{status}</span>
      </span>
    </div>
  )
}

// Cybernetic Setup Page Styling
const pageWrap = {
  flex: 1,
  minHeight: '100vh',
  background: 'var(--bg)',
  padding: 30,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
}

const headerBar = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--b1)',
  paddingBottom: 18,
  flexShrink: 0,
}

const logoBox = {
  width: 44,
  height: 44,
  background: 'linear-gradient(135deg, var(--gold), #be123c)',
  borderRadius: 14,
  display: 'grid',
  placeItems: 'center',
  color: '#fff',
  fontFamily: 'var(--ff-display)',
  fontWeight: 900,
  fontSize: 18,
  boxShadow: '0 0 20px rgba(248, 201, 107, 0.25)',
}

const title = {
  fontFamily: 'var(--ff-display)',
  fontSize: 22,
  fontWeight: 800,
}

const subtitle = {
  fontSize: 12,
  color: 'var(--t3)',
  marginTop: 4,
}

const backBtn = {
  background: 'var(--bg2)',
  border: '1px solid var(--b1)',
  color: 'var(--t2)',
  padding: '10px 18px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)',
  gap: 22,
  flex: 1,
}

const panel = {
  background: 'var(--bg1)',
  border: '1px solid var(--b1)',
  borderRadius: 16,
  padding: 22,
  boxShadow: '0 10px 30px rgba(15,23,42,.04)',
}

const sectionTitle = {
  fontFamily: 'var(--ff-display)',
  fontSize: 16,
  fontWeight: 800,
}

const sectionDesc = {
  fontSize: 11,
  color: 'var(--t3)',
  marginTop: 4,
  marginBottom: 16,
  lineHeight: 1.5,
}

const formGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 14,
}

const label = {
  fontFamily: 'var(--ff-mono)',
  fontSize: 10,
  color: 'var(--t3)',
  letterSpacing: '.08em',
  textTransform: 'uppercase',
}

const input = {
  background: 'var(--bg2)',
  border: '1px solid var(--b1)',
  borderRadius: 10,
  padding: '11px 13px',
  color: 'var(--t1)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'var(--ff-mono)',
}

const pingBtn = {
  background: 'var(--bg2)',
  border: '1px solid var(--b1)',
  color: 'var(--t2)',
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 800,
  cursor: 'pointer',
}

const saveBtn = {
  flex: 1.5,
  border: 'none',
  padding: '13px 0',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 900,
  cursor: 'pointer',
}

const clearBtn = {
  flex: 1,
  background: 'rgba(220,38,38,.08)',
  border: '1px solid rgba(220,38,38,.2)',
  color: 'var(--red)',
  padding: '13px 0',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
}

const testAllBtn = {
  flex: 1,
  background: 'var(--bg2)',
  border: '1px solid var(--b1)',
  color: 'var(--t2)',
  padding: '13px 0',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
}

const statusRows = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const statusRow = {
  display: 'flex',
  alignItems: 'center',
  padding: 12,
  background: 'var(--bg2)',
  border: '1px solid var(--b1)',
  borderRadius: 12,
}

const statusBadge = (bg, color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  background: bg,
  color: color,
  borderRadius: 999,
})

const statusDot = (color) => ({
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: color,
  boxShadow: `0 0 10px ${color}`,
})

const terminalBody = {
  flex: 1,
  background: 'var(--bg)',
  border: '1px solid var(--b1)',
  borderRadius: 12,
  padding: 14,
  overflowY: 'auto',
  maxHeight: 280,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const logLine = (type) => {
  const colors = {
    info: 'var(--t2)',
    success: 'var(--green)',
    error: 'var(--red)',
  }
  return {
    fontFamily: 'var(--ff-mono)',
    fontSize: 11,
    color: colors[type] || colors.info,
    lineHeight: 1.5,
  }
}

const logTime = {
  color: 'var(--t3)',
  marginRight: 8,
}
