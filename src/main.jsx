import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Sentry } from './utils/sentry'

// ── One-time localStorage migrations ──────────────────────────────────────────

// 1. Clear stale wrong Python API URL
;(function clearStalePyUrl() {
  const staleUrls = ['https://mezomai-oao1.vercel.app', 'http://localhost:8000']
  const cached = localStorage.getItem('aria_py_api_url')
  if (cached && staleUrls.includes(cached.trim())) {
    localStorage.removeItem('aria_py_api_url')
  }
})()

// 2. Upgrade stale settings: fix deprecated model names + set better defaults
;(function migrateSettings() {
  try {
    const raw = localStorage.getItem('aria_settings')
    if (!raw) return
    const s = JSON.parse(raw)
    let changed = false

    // gemini-1.5-flash was deprecated — upgrade to gemini-2.0-flash
    if (s.model === 'gemini-1.5-flash') {
      s.model = 'gemini-2.0-flash'
      changed = true
    }
    // If provider is anthropic but no Anthropic key set, switch to gemini
    if (s.activeProvider === 'anthropic' && !s.apiKey) {
      s.activeProvider = 'gemini'
      if (!s.model || s.model.startsWith('claude')) s.model = 'gemini-2.0-flash'
      changed = true
    }

    if (changed) localStorage.setItem('aria_settings', JSON.stringify(s))
  } catch (_) { /* ignore parse errors */ }
})()


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<FatalError />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)

function FatalError() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      background: 'var(--bg, #080b12)',
      color: 'var(--t1, #f8fafc)',
      fontFamily: 'var(--ff-display, system-ui)',
    }}>
      <div style={{
        maxWidth: 440,
        border: '1px solid var(--b1, rgba(148,163,184,.24))',
        background: 'var(--bg1, #101624)',
        borderRadius: 16,
        padding: 24,
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>MEZOMAI hit an error</h1>
        <p style={{ color: 'var(--t3, #94a3b8)', lineHeight: 1.6 }}>
          The issue was captured for review. Refresh the page to try again.
        </p>
      </div>
    </div>
  )
}
