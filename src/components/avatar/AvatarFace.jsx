import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'

export default function AvatarFace({ size = 120, showGlow = true }) {
  const { avatarState, settings, theme } = useStore()
  const [blink, setBlink] = useState(false)
  const [mouthOpen, setMouthOpen] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 2800 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (avatarState !== 'talking') { setMouthOpen(0); return }
    const interval = setInterval(() => {
      setMouthOpen(Math.random() * 8)
    }, 120)
    return () => clearInterval(interval)
  }, [avatarState])

  const colorMap = {
    cyan: '#00d4ff',
    purple: '#c084fc',
    coral: '#f87171',
    gold: '#d4af37'
  }
  const color = colorMap[settings.avatarStyle] || '#d4af37'

  const glowColor = avatarState === 'talking' ? '#00e676'
    : avatarState === 'listening' ? (theme === 'light' ? '#00838f' : '#00d4ff')
    : avatarState === 'thinking' ? '#c084fc'
    : color

  const eyeScaleY = blink ? 0.08 : 1

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {showGlow && (
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          background: `conic-gradient(${glowColor}, transparent, ${glowColor})`,
          animation: 'spin 4s linear infinite', opacity: avatarState === 'idle' ? 0.35 : 0.75,
          transition: 'all .5s',
          boxShadow: `0 0 15px ${glowColor}55`
        }}>
          <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', background: 'var(--bg1)' }}/>
        </div>
      )}
      <div style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        background: theme === 'light' 
          ? 'linear-gradient(145deg, #faf6eb, #ebdcb9)' 
          : 'linear-gradient(145deg, #18140a, #0c0a06)',
        border: `2px solid var(--b2)`, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)'
      }}>
        <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 80 80">
          <ellipse cx="40" cy="42" rx="28" ry="30" fill="var(--bg2)" stroke={color} strokeWidth="1" opacity="0.65"/>
          <g transform={`translate(26, 33) scale(1, ${eyeScaleY})`} style={{ transformOrigin: '0 4px', transition: 'transform .08s' }}>
            <ellipse cx="0" cy="4" rx="5" ry="5" fill={color} opacity="0.9"/>
            <ellipse cx="0" cy="3" rx="2" ry="2" fill="var(--bg1)"/>
            <circle cx="1.2" cy="2" r="0.8" fill="white" opacity="0.85"/>
          </g>
          <g transform={`translate(54, 33) scale(1, ${eyeScaleY})`} style={{ transformOrigin: '0 4px', transition: 'transform .08s' }}>
            <ellipse cx="0" cy="4" rx="5" ry="5" fill={color} opacity="0.9"/>
            <ellipse cx="0" cy="3" rx="2" ry="2" fill="var(--bg1)"/>
            <circle cx="1.2" cy="2" r="0.8" fill="white" opacity="0.85"/>
          </g>
          <path d={avatarState === 'thinking' ? 'M21 25 Q26 21 31 25' : 'M21 26 Q26 23 31 26'}
            fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
          <path d={avatarState === 'thinking' ? 'M49 25 Q54 21 59 25' : 'M49 26 Q54 23 59 26'}
            fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
          <path
            d={`M30 57 Q40 ${57 + mouthOpen + (avatarState === 'talking' ? 2 : 3)} 50 57`}
            fill={mouthOpen > 3 ? 'var(--bg)' : 'none'}
            stroke={color} strokeWidth="2.2" strokeLinecap="round"
            style={{ transition: 'all .1s' }}
          />
          {avatarState !== 'idle' && (
            <rect x="12" y="0" width="56" height="2.5" fill={color} opacity="0.12">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,80;0,0" dur="2.2s" repeatCount="indefinite"/>
            </rect>
          )}
          <path d="M12 42 L5 42 L5 55" fill="none" stroke={color} strokeWidth="0.8" opacity="0.35"/>
          <path d="M68 42 L75 42 L75 55" fill="none" stroke={color} strokeWidth="0.8" opacity="0.35"/>
          <circle cx="5" cy="55" r="1.5" fill={color} opacity="0.5"/>
          <circle cx="75" cy="55" r="1.5" fill={color} opacity="0.5"/>
        </svg>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
