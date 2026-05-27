import React, { useMemo } from 'react'
import { useStore } from '../../store'

const STYLE_COLORS = {
  cyan: '#22d3ee',
  purple: '#a78bfa',
  coral: '#fb7185',
  gold: '#f8c96b',
  blue: '#60a5fa',
}

export default function AvatarFace({ size = 120, showGlow = true }) {
  const { avatarState, settings } = useStore()
  const gender = settings.avatarGender === 'male' ? 'male' : 'female'
  const accent = STYLE_COLORS[settings.avatarStyle] || STYLE_COLORS.gold
  const stateColor = avatarState === 'talking'
    ? '#22c55e'
    : avatarState === 'listening'
      ? '#22d3ee'
      : avatarState === 'thinking'
        ? '#a78bfa'
        : accent

  const cssVars = useMemo(() => ({
    '--avatar-size': `${size}px`,
    '--avatar-accent': accent,
    '--avatar-state': stateColor,
  }), [accent, size, stateColor])

  const avatarSrc = gender === 'male' ? '/avatars/male.png' : '/avatars/female.png'

  return (
    <div
      className={`mez-avatar mez-avatar-${gender} mez-avatar-${avatarState}`}
      style={cssVars}
      aria-label={`${settings.avatarName || 'MEZOMAI'} ${gender} AI avatar`}
      role="img"
    >
      {showGlow && <div className="mez-avatar-glow" />}
      <div className="mez-avatar-card">
        <img src={avatarSrc} alt="AI Avatar" className="mez-avatar-img" />
        <div className="mez-avatar-label">AI Agent</div>
      </div>
      <style>{avatarCss}</style>
    </div>
  )
}

const avatarCss = `
.mez-avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
  min-width: var(--avatar-size);
  position: relative;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.mez-avatar-glow {
  position: absolute;
  inset: calc(var(--avatar-size) * -0.055);
  border-radius: 22%;
  background:
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--avatar-state), transparent 54%), transparent 62%),
    conic-gradient(from 160deg, transparent 0 14%, var(--avatar-state), transparent 44% 62%, var(--avatar-state), transparent 88%);
  filter: blur(calc(var(--avatar-size) * 0.02));
  opacity: .82;
  animation: mezAvatarGlow 4.8s linear infinite;
  z-index: -1;
}

.mez-avatar-card {
  width: var(--avatar-size);
  height: var(--avatar-size);
  position: relative;
  overflow: hidden;
  border-radius: 12%;
  background: #111827;
  border: 1px solid color-mix(in srgb, var(--avatar-accent), #111827 48%);
  box-shadow:
    0 calc(var(--avatar-size) * .08) calc(var(--avatar-size) * .24) rgba(2, 6, 23, .34),
    inset 0 calc(var(--avatar-size) * .01) calc(var(--avatar-size) * .08) rgba(255,255,255,.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mez-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease-out;
}

.mez-avatar-talking .mez-avatar-img {
  transform: scale(1.02);
  animation: mezAvatarTalk 220ms ease-in-out infinite alternate;
}

.mez-avatar-label {
  position: absolute;
  left: 5%;
  bottom: 4%;
  padding: .18em .58em .24em;
  border-radius: 999px;
  background: rgba(255, 250, 214, .84);
  color: #3f3412;
  font-family: var(--ff-mono, monospace);
  font-size: calc(var(--avatar-size) * .055);
  font-weight: 800;
  letter-spacing: 0;
  box-shadow: 0 2px 8px rgba(24, 18, 8, .18);
  opacity: .82;
  z-index: 2;
}

.mez-avatar-listening .mez-avatar-card,
.mez-avatar-talking .mez-avatar-card {
  box-shadow:
    0 calc(var(--avatar-size) * .08) calc(var(--avatar-size) * .24) rgba(2, 6, 23, .34),
    0 0 calc(var(--avatar-size) * .08) color-mix(in srgb, var(--avatar-state), transparent 45%),
    inset 0 0 calc(var(--avatar-size) * .08) rgba(255,255,255,.16);
}

@keyframes mezAvatarGlow { to { transform: rotate(360deg); } }
@keyframes mezAvatarTalk {
  from { transform: translateY(0); }
  to { transform: translateY(calc(var(--avatar-size) * .006)); }
}
`
