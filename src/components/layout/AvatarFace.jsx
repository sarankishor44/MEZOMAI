import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'

export default function AvatarFace({ size = 120, showGlow = true }) {
  const { avatarState, settings, theme } = useStore()
  const [blink, setBlink] = useState(false)
  const [mouthOpen, setMouthOpen] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 140)
    }, 2600 + Math.random() * 1800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (avatarState !== 'talking') {
      setMouthOpen(0)
      return
    }
    const interval = setInterval(() => setMouthOpen(Math.random() * 8), 110)
    return () => clearInterval(interval)
  }, [avatarState])

  const colorMap = {
    cyan: '#22d3ee',
    purple: '#a78bfa',
    coral: '#fb7185',
    gold: '#f8c96b',
    blue: '#60a5fa',
  }
  const color = colorMap[settings.avatarStyle] || colorMap.blue
  const gender = settings.avatarGender || 'female'
  const glowColor = avatarState === 'talking' ? '#4ade80'
    : avatarState === 'listening' ? '#22d3ee'
    : avatarState === 'thinking' ? '#a78bfa'
    : color
  const eyeScaleY = blink ? 0.08 : 1
  const dark = theme === 'dark'

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {showGlow && (
        <div style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          background: `conic-gradient(from 180deg, ${glowColor}, transparent 35%, ${glowColor})`,
          animation: 'avatarSpin 5s linear infinite',
          opacity: avatarState === 'idle' ? 0.38 : 0.82,
          boxShadow: `0 0 28px ${glowColor}55`,
        }}>
          <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: 'var(--bg1)' }}/>
        </div>
      )}

      <div style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `1px solid ${color}`,
        background: dark ? '#111827' : '#f8fafc',
        boxShadow: 'inset 0 0 18px rgba(15,23,42,.28)',
      }}>
        <svg width={size} height={size} viewBox="0 0 120 120">
          <defs>
            <linearGradient id={`skin-${gender}-${size}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gender === 'male' ? '#f1c7a7' : '#ffd7c2'} />
              <stop offset="100%" stopColor={gender === 'male' ? '#c98f6c' : '#e9a18f'} />
            </linearGradient>
            <linearGradient id={`hair-${gender}-${size}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gender === 'male' ? '#1f2937' : '#f8fafc'} />
              <stop offset="100%" stopColor={gender === 'male' ? '#475569' : '#dbeafe'} />
            </linearGradient>
          </defs>

          <rect width="120" height="120" fill={dark ? '#0f172a' : '#e0f2fe'} />
          <circle cx="60" cy="62" r="47" fill={`url(#skin-${gender}-${size})`} />

          {gender === 'female' ? (
            <>
              <path d="M13 61C15 20 43 5 61 7c23 2 41 21 43 58-12-18-24-27-44-27-20 0-35 8-47 23Z" fill={`url(#hair-${gender}-${size})`} />
              <path d="M18 59c1 26 9 44 20 55-15-4-26-18-30-38-2-11 2-18 10-17ZM102 59c-1 26-9 44-20 55 15-4 26-18 30-38 2-11-2-18-10-17Z" fill={`url(#hair-${gender}-${size})`} opacity=".95"/>
              <path d="M25 29h70c-4 13-16 18-35 18S29 42 25 29Z" fill={`url(#hair-${gender}-${size})`} />
            </>
          ) : (
            <>
              <path d="M20 53C22 23 42 11 61 12c25 1 39 17 40 43-10-10-21-15-39-15-19 0-31 4-42 13Z" fill={`url(#hair-${gender}-${size})`} />
              <path d="M28 42c8-20 48-26 64-3-18-4-45-3-64 3Z" fill={`url(#hair-${gender}-${size})`} />
            </>
          )}

          <g transform={`translate(42, 55) scale(1, ${eyeScaleY})`} style={{ transformOrigin: '42px 59px', transition: 'transform .08s' }}>
            <ellipse cx="0" cy="4" rx={gender === 'female' ? 8 : 6.5} ry="7" fill="#fff" />
            <circle cx="1" cy="4" r="4.2" fill={color} />
            <circle cx="2" cy="3" r="1.5" fill="#fff" />
          </g>
          <g transform={`translate(78, 55) scale(1, ${eyeScaleY})`} style={{ transformOrigin: '78px 59px', transition: 'transform .08s' }}>
            <ellipse cx="0" cy="4" rx={gender === 'female' ? 8 : 6.5} ry="7" fill="#fff" />
            <circle cx="1" cy="4" r="4.2" fill={color} />
            <circle cx="2" cy="3" r="1.5" fill="#fff" />
          </g>

          <path d={avatarState === 'thinking' ? 'M33 48q9-6 18-1' : 'M34 49q8-4 16 0'} fill="none" stroke={gender === 'male' ? '#334155' : '#475569'} strokeWidth="2.5" strokeLinecap="round" />
          <path d={avatarState === 'thinking' ? 'M69 47q9-5 18 1' : 'M70 49q8-4 16 0'} fill="none" stroke={gender === 'male' ? '#334155' : '#475569'} strokeWidth="2.5" strokeLinecap="round" />
          {gender === 'female' && (
            <>
              <path d="M31 56q10-7 21 0" fill="none" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" opacity=".65"/>
              <path d="M68 56q10-7 21 0" fill="none" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" opacity=".65"/>
              <circle cx="20" cy="71" r="5" fill="none" stroke={color} strokeWidth="2"/>
              <circle cx="100" cy="71" r="5" fill="none" stroke={color} strokeWidth="2"/>
            </>
          )}

          <path d="M57 63q4 4 0 9" fill="none" stroke="#b87563" strokeWidth="1.8" strokeLinecap="round" opacity=".65"/>
          <path
            d={`M43 83 Q60 ${92 + mouthOpen} 77 83`}
            fill={mouthOpen > 3 ? '#111827' : 'none'}
            stroke={gender === 'female' ? '#9f1239' : '#7f1d1d'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {mouthOpen > 3 && <path d="M48 84h24" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".9"/>}
          <text x="60" y="112" textAnchor="middle" fill={color} fontSize="7" fontFamily="monospace" fontWeight="700">AI AGENT</text>
        </svg>
      </div>

      <style>{`@keyframes avatarSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
