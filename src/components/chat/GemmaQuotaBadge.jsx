/**
 * GemmaQuotaBadge
 * Shows free Gemma usage: remaining requests, time-bar, and live countdown to reset.
 * Hidden when the user has their own API key configured.
 */
import React, { useEffect, useRef, useState } from 'react'
import { PLATFORM_DEFAULT_AI } from '../../utils/aiConfig'

const STORAGE_KEY = 'mezomai_gemma_quota'
const TOTAL = PLATFORM_DEFAULT_AI.dailyRequestLimit   // 25
const WINDOW_MS = PLATFORM_DEFAULT_AI.windowHours * 3600 * 1000  // 24h

function loadQuota() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveQuota(q) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(q))
}

function freshQuota() {
  return { used: 0, resetAt: Date.now() + WINDOW_MS }
}

/**
 * Returns the current quota state, auto-resetting if the window has passed.
 */
export function getQuota() {
  let q = loadQuota()
  if (!q || Date.now() >= q.resetAt) {
    q = freshQuota()
    saveQuota(q)
  }
  return q
}

/**
 * Call this after each successful Gemma default-AI request to decrement quota.
 * Returns the updated quota object.
 */
export function consumeQuota() {
  const q = getQuota()
  q.used = Math.min(q.used + 1, TOTAL)
  saveQuota(q)
  return q
}

/**
 * Returns true if the user has quota remaining.
 */
export function hasQuota() {
  return getQuota().used < TOTAL
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GemmaQuotaBadge({ lastUsedDefault = false }) {
  const [quota, setQuota] = useState(getQuota)
  const [now, setNow] = useState(Date.now())
  const timerRef = useRef(null)

  // Tick every second for countdown display
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const current = getQuota()
      setQuota(current)
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Refresh when a request was just made
  useEffect(() => {
    if (lastUsedDefault) setQuota(getQuota())
  }, [lastUsedDefault])

  const remaining = Math.max(0, TOTAL - quota.used)
  const pct = (remaining / TOTAL) * 100
  const msLeft = Math.max(0, quota.resetAt - now)
  const hLeft = Math.floor(msLeft / 3600000)
  const mLeft = Math.floor((msLeft % 3600000) / 60000)
  const sLeft = Math.floor((msLeft % 60000) / 1000)
  const countdownStr = hLeft > 0
    ? `${hLeft}h ${mLeft}m`
    : mLeft > 0
    ? `${mLeft}m ${sLeft}s`
    : `${sLeft}s`

  const barColor = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444'
  const isExhausted = remaining === 0

  return (
    <div style={wrap}>
      <div style={topRow}>
        <span style={gemmaLabel}>
          <span style={dot} />
          Google Gemma Free
        </span>
        <span style={countBadge(isExhausted)}>
          {isExhausted ? 'Limit reached' : `${remaining} / ${TOTAL} left`}
        </span>
      </div>

      {/* Progress bar */}
      <div style={track}>
        <div style={{ ...fill, width: `${pct}%`, background: barColor }} />
      </div>

      {/* Reset countdown */}
      <div style={footer}>
        <span style={sub}>
          {isExhausted
            ? `Resets in ${countdownStr}`
            : `Resets in ${countdownStr} · Add your key in Settings for unlimited use`}
        </span>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────
const wrap = {
  background: 'var(--bg2)',
  border: '1px solid var(--b1)',
  borderRadius: 12,
  padding: '10px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}
const topRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}
const gemmaLabel = {
  fontFamily: 'var(--ff-mono)',
  fontSize: 10,
  color: 'var(--t2)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
}
const dot = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#22c55e',
  display: 'inline-block',
}
const countBadge = (exhausted) => ({
  fontFamily: 'var(--ff-mono)',
  fontSize: 10,
  fontWeight: 800,
  color: exhausted ? '#ef4444' : 'var(--gold)',
  background: exhausted ? 'rgba(239,68,68,.1)' : 'var(--gold-light)',
  border: `1px solid ${exhausted ? 'rgba(239,68,68,.3)' : 'var(--gold)'}`,
  borderRadius: 999,
  padding: '2px 8px',
})
const track = {
  height: 5,
  background: 'var(--bg3, #1e293b)',
  borderRadius: 999,
  overflow: 'hidden',
}
const fill = {
  height: '100%',
  borderRadius: 999,
  transition: 'width .4s ease, background .4s ease',
}
const footer = {
  display: 'flex',
  justifyContent: 'flex-end',
}
const sub = {
  fontFamily: 'var(--ff-mono)',
  fontSize: 9,
  color: 'var(--t3)',
}
