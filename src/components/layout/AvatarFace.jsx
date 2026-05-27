import React, { useEffect, useMemo, useState } from 'react'
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
  const [blink, setBlink] = useState(false)
  const [talkFrame, setTalkFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true)
      window.setTimeout(() => setBlink(false), 130)
    }, 2400 + Math.random() * 2200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (avatarState !== 'talking') {
      setTalkFrame(0)
      return undefined
    }
    const interval = setInterval(() => setTalkFrame(Math.random()), 95)
    return () => clearInterval(interval)
  }, [avatarState])

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
    '--avatar-scale': size / 220,
    '--avatar-accent': accent,
    '--avatar-state': stateColor,
    '--mouth-open': avatarState === 'talking' ? `${12 + talkFrame * 16}px` : gender === 'female' ? '11px' : '8px',
    '--mouth-radius': avatarState === 'talking' ? `${16 + talkFrame * 18}px` : '999px',
    '--eye-scale': blink ? 0.08 : 1,
  }), [accent, avatarState, blink, size, stateColor, talkFrame])

  return (
    <div
      className={`mez-avatar mez-avatar-${gender} mez-avatar-${avatarState}`}
      style={cssVars}
      aria-label={`${settings.avatarName || 'MEZOMAI'} ${gender} AI avatar`}
      role="img"
    >
      {showGlow && <div className="mez-avatar-glow" />}
      <div className="mez-avatar-card">
        <div className="mez-avatar-bg" />
        <div className="mez-avatar-shoulders" />
        <div className="mez-avatar-neck" />
        <div className="mez-avatar-hair-back" />
        <div className="mez-avatar-ear mez-avatar-ear-left" />
        <div className="mez-avatar-ear mez-avatar-ear-right" />
        {gender === 'female' && (
          <>
            <div className="mez-avatar-hoop mez-avatar-hoop-left" />
            <div className="mez-avatar-hoop mez-avatar-hoop-right" />
          </>
        )}
        <div className="mez-avatar-face">
          <div className="mez-avatar-cheek mez-avatar-cheek-left" />
          <div className="mez-avatar-cheek mez-avatar-cheek-right" />
          <div className="mez-avatar-brow mez-avatar-brow-left" />
          <div className="mez-avatar-brow mez-avatar-brow-right" />
          <Eye side="left" gender={gender} />
          <Eye side="right" gender={gender} />
          <div className="mez-avatar-nose" />
          <div className="mez-avatar-mouth">
            <div className="mez-avatar-teeth" />
            <div className="mez-avatar-tongue" />
          </div>
        </div>
        <Hair gender={gender} />
        <div className="mez-avatar-label">AI Agent</div>
      </div>
      <style>{avatarCss}</style>
    </div>
  )
}

function Eye({ side, gender }) {
  return (
    <div className={`mez-avatar-eye mez-avatar-eye-${side} mez-avatar-eye-${gender}`}>
      <div className="mez-avatar-eye-shine" />
      <div className="mez-avatar-iris">
        <span />
      </div>
      <div className="mez-avatar-lashes" />
    </div>
  )
}

function Hair({ gender }) {
  if (gender === 'male') {
    return (
      <>
        <div className="mez-avatar-hair-front mez-avatar-hair-male-front" />
        <div className="mez-avatar-quiff mez-avatar-quiff-1" />
        <div className="mez-avatar-quiff mez-avatar-quiff-2" />
        <div className="mez-avatar-quiff mez-avatar-quiff-3" />
      </>
    )
  }

  return (
    <>
      <div className="mez-avatar-hair-front mez-avatar-hair-female-front" />
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className={`mez-avatar-bang mez-avatar-bang-${index + 1}`} />
      ))}
      <div className="mez-avatar-side-lock mez-avatar-side-lock-left" />
      <div className="mez-avatar-side-lock mez-avatar-side-lock-right" />
    </>
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
  background: #221713;
  border: 1px solid color-mix(in srgb, var(--avatar-accent), #111827 48%);
  box-shadow:
    0 calc(var(--avatar-size) * .08) calc(var(--avatar-size) * .24) rgba(2, 6, 23, .34),
    inset 0 calc(var(--avatar-size) * .01) calc(var(--avatar-size) * .08) rgba(255,255,255,.18);
}

.mez-avatar-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(10,7,5,.42), transparent 28% 72%, rgba(10,7,5,.48)),
    radial-gradient(circle at 50% 33%, rgba(255,230,198,.42), transparent 36%),
    radial-gradient(circle at 23% 24%, rgba(255,213,151,.32), transparent 20%),
    radial-gradient(circle at 78% 24%, rgba(240,185,108,.22), transparent 18%),
    linear-gradient(145deg, #3f2b22 0%, #8a6241 50%, #1b1310 100%);
}

.mez-avatar-bg::before,
.mez-avatar-bg::after {
  content: "";
  position: absolute;
  top: 20%;
  width: 18%;
  height: 56%;
  border-radius: 5%;
  background:
    repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 2px, transparent 2px 10px),
    rgba(21, 12, 8, .42);
  filter: blur(.2px);
}
.mez-avatar-bg::before { left: 7%; }
.mez-avatar-bg::after { right: 7%; }

.mez-avatar-shoulders {
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: -10%;
  height: 27%;
  border-radius: 50% 50% 0 0;
  background:
    radial-gradient(circle at 50% 8%, rgba(255,255,255,.96), rgba(241,232,220,.76) 45%, rgba(178,190,203,.5) 82%),
    linear-gradient(90deg, rgba(255,255,255,.34), transparent, rgba(255,255,255,.24));
  filter: drop-shadow(0 -2px 4px rgba(65, 35, 22, .18));
}
.mez-avatar-male .mez-avatar-shoulders {
  background:
    linear-gradient(135deg, #192338, #263854 52%, #111827),
    radial-gradient(circle at 50% 0, rgba(255,255,255,.18), transparent 46%);
}

.mez-avatar-neck {
  position: absolute;
  left: 41.5%;
  top: 69%;
  width: 17%;
  height: 17%;
  border-radius: 0 0 44% 44%;
  background: linear-gradient(90deg, #d69a7e, #ffd0b7 46%, #bd7964);
  box-shadow: inset 0 8px 10px rgba(125,64,47,.18);
}

.mez-avatar-hair-back {
  position: absolute;
  left: 11%;
  top: 5%;
  width: 78%;
  height: 88%;
  border-radius: 44% 44% 38% 38%;
  background:
    repeating-linear-gradient(92deg, rgba(255,255,255,.42) 0 2px, transparent 2px 9px),
    linear-gradient(105deg, #fbfbff, #dfeaff 45%, #9fb6da);
  box-shadow: inset -18px -20px 22px rgba(74, 92, 135, .18), inset 15px 0 15px rgba(255,255,255,.5);
}
.mez-avatar-male .mez-avatar-hair-back {
  left: 20%;
  top: 6%;
  width: 60%;
  height: 34%;
  border-radius: 48% 52% 36% 30%;
  background: linear-gradient(135deg, #172033, #31415b 56%, #0f172a);
  box-shadow: inset 10px 4px 12px rgba(255,255,255,.08), inset -12px -8px 12px rgba(0,0,0,.28);
}

.mez-avatar-face {
  position: absolute;
  left: 23%;
  top: 17%;
  width: 54%;
  height: 64%;
  border-radius: 49% 49% 47% 47% / 42% 42% 58% 58%;
  background:
    radial-gradient(circle at 28% 46%, rgba(120,67,48,.16) 0 .9%, transparent 1.2%),
    radial-gradient(circle at 72% 47%, rgba(120,67,48,.13) 0 .8%, transparent 1.1%),
    radial-gradient(circle at 39% 60%, rgba(152,84,58,.12) 0 .7%, transparent 1%),
    radial-gradient(circle at 61% 61%, rgba(152,84,58,.12) 0 .7%, transparent 1%),
    radial-gradient(circle at 36% 31%, rgba(255,255,255,.46), transparent 12%),
    radial-gradient(circle at 64% 34%, rgba(255,255,255,.28), transparent 12%),
    radial-gradient(circle at 50% 68%, rgba(255,255,255,.2), transparent 30%),
    radial-gradient(circle at 31% 56%, rgba(255,134,154,.24), transparent 15%),
    radial-gradient(circle at 69% 56%, rgba(255,134,154,.24), transparent 15%),
    linear-gradient(115deg, #dc9274, #ffd2ba 41%, #bd6f59 100%);
  box-shadow:
    inset -10px -10px 15px rgba(138, 73, 54, .17),
    inset 10px 4px 16px rgba(255,255,255,.32),
    0 4px 14px rgba(63, 31, 24, .16);
}
.mez-avatar-face::before {
  content: "";
  position: absolute;
  inset: 5% 11% auto;
  height: 38%;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,.24), transparent 78%);
  pointer-events: none;
}
.mez-avatar-face::after {
  content: "";
  position: absolute;
  left: 30%;
  right: 30%;
  top: 86%;
  height: 8%;
  border-radius: 50%;
  background: rgba(117, 54, 45, .12);
  filter: blur(3px);
}
.mez-avatar-male .mez-avatar-face {
  top: 20%;
  height: 61%;
  width: 51%;
  left: 24.5%;
  border-radius: 44% 44% 50% 50% / 38% 38% 62% 62%;
  clip-path: polygon(8% 11%, 92% 11%, 96% 58%, 78% 93%, 50% 100%, 22% 93%, 4% 58%);
  background:
    radial-gradient(circle at 50% 66%, rgba(255,255,255,.16), transparent 24%),
    linear-gradient(115deg, #d89f7d, #f1c09f 44%, #be765d 100%);
}

.mez-avatar-ear {
  position: absolute;
  top: 45%;
  width: 8%;
  height: 14%;
  border-radius: 50%;
  background: linear-gradient(145deg, #e5a386, #ffc6aa);
  box-shadow: inset -2px -2px 4px rgba(111,55,43,.16);
}
.mez-avatar-ear-left { left: 20%; }
.mez-avatar-ear-right { right: 20%; }
.mez-avatar-male .mez-avatar-ear-left { left: 22%; }
.mez-avatar-male .mez-avatar-ear-right { right: 22%; }

.mez-avatar-hoop {
  position: absolute;
  top: 54%;
  width: 8%;
  height: 13%;
  border: calc(var(--avatar-size) * .012) solid #e1a83d;
  border-radius: 50%;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,.22));
}
.mez-avatar-hoop-left { left: 16.8%; }
.mez-avatar-hoop-right { right: 16.8%; }

.mez-avatar-hair-front {
  position: absolute;
  pointer-events: none;
}
.mez-avatar-hair-female-front {
  left: 15%;
  top: 3.5%;
  width: 70%;
  height: 31%;
  border-radius: 48% 48% 16% 16%;
  background:
    repeating-linear-gradient(92deg, rgba(255,255,255,.7) 0 2px, rgba(211,224,249,.28) 2px 7px),
    linear-gradient(105deg, #ffffff, #edf3ff 48%, #becdea);
  box-shadow: inset -10px -10px 16px rgba(101, 116, 154, .18), inset 10px 2px 12px rgba(255,255,255,.9);
}
.mez-avatar-hair-male-front {
  left: 23%;
  top: 8%;
  width: 54%;
  height: 24%;
  border-radius: 54% 46% 42% 24%;
  background: linear-gradient(130deg, #26364d, #111827 68%);
  transform: rotate(-3deg);
}

.mez-avatar-bang {
  position: absolute;
  top: 9%;
  width: 5.5%;
  height: 29%;
  border-radius: 40% 40% 70% 70%;
  background:
    linear-gradient(90deg, rgba(255,255,255,.78), transparent 46%),
    linear-gradient(90deg, #ffffff, #dbe6fb);
  transform-origin: top center;
  box-shadow: inset -2px 0 3px rgba(76,93,132,.12);
}
.mez-avatar-bang-1 { left: 27%; height: 26%; transform: rotate(7deg); }
.mez-avatar-bang-2 { left: 32%; height: 31%; transform: rotate(4deg); }
.mez-avatar-bang-3 { left: 37%; height: 33%; transform: rotate(2deg); }
.mez-avatar-bang-4 { left: 42%; height: 34%; transform: rotate(1deg); }
.mez-avatar-bang-5 { left: 47%; height: 35%; }
.mez-avatar-bang-6 { left: 52%; height: 34%; transform: rotate(-1deg); }
.mez-avatar-bang-7 { left: 57%; height: 33%; transform: rotate(-2deg); }
.mez-avatar-bang-8 { left: 62%; height: 31%; transform: rotate(-4deg); }
.mez-avatar-bang-9 { left: 67%; height: 28%; transform: rotate(-6deg); }
.mez-avatar-bang-10 { left: 72%; height: 24%; transform: rotate(-9deg); }

.mez-avatar-side-lock {
  position: absolute;
  top: 17%;
  width: 8%;
  height: 67%;
  border-radius: 60% 40% 50% 50%;
  background: linear-gradient(90deg, #ffffff, #ccd9f0);
  filter: drop-shadow(0 4px 4px rgba(24, 37, 61, .16));
}
.mez-avatar-side-lock-left { left: 9%; transform: rotate(11deg); }
.mez-avatar-side-lock-right { right: 9%; transform: rotate(-11deg); }

.mez-avatar-quiff {
  position: absolute;
  background: linear-gradient(135deg, #384966, #111827);
  border-radius: 80% 20% 70% 30%;
  transform-origin: bottom right;
}
.mez-avatar-quiff-1 { left: 34%; top: 5%; width: 19%; height: 20%; transform: rotate(-30deg); }
.mez-avatar-quiff-2 { left: 43%; top: 4%; width: 23%; height: 22%; transform: rotate(-8deg); }
.mez-avatar-quiff-3 { left: 54%; top: 7%; width: 18%; height: 18%; transform: rotate(24deg); }

.mez-avatar-eye {
  position: absolute;
  top: 40%;
  width: 21%;
  height: 17.5%;
  border-radius: 52% 48% 50% 50%;
  background: #fff;
  box-shadow:
    inset 0 -2px 3px rgba(64, 40, 60, .16),
    0 1px 2px rgba(59, 29, 45, .14);
  transform: scaleY(var(--eye-scale));
  transition: transform .08s ease;
  overflow: hidden;
}
.mez-avatar-eye-left { left: 19%; }
.mez-avatar-eye-right { right: 19%; }
.mez-avatar-eye-female {
  width: 24%;
  height: 19.5%;
  border-top: 2px solid #211827;
}
.mez-avatar-eye-male {
  width: 19%;
  height: 15%;
  top: 41%;
}

.mez-avatar-iris {
  position: absolute;
  left: 32%;
  top: 16%;
  width: 46%;
  height: 66%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 24%, #fff 0 9%, transparent 10%),
    radial-gradient(circle at 62% 70%, rgba(255,255,255,.54) 0 5%, transparent 6%),
    radial-gradient(circle, #1f1530 0 16%, var(--avatar-accent) 18% 52%, #3b256d 56% 100%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.28), 0 0 8px color-mix(in srgb, var(--avatar-accent), transparent 42%);
}
.mez-avatar-iris span {
  position: absolute;
  left: 34%;
  top: 34%;
  width: 32%;
  height: 32%;
  border-radius: 50%;
  background: #111827;
}
.mez-avatar-eye-shine {
  position: absolute;
  left: 20%;
  top: 14%;
  width: 24%;
  height: 24%;
  border-radius: 50%;
  background: rgba(255,255,255,.9);
  z-index: 2;
}
.mez-avatar-lashes {
  display: none;
  position: absolute;
  left: -8%;
  right: -8%;
  top: -18%;
  height: 40%;
  border-top: 2px solid #15111a;
  border-radius: 50%;
}
.mez-avatar-eye-female .mez-avatar-lashes { display: block; }

.mez-avatar-brow {
  position: absolute;
  top: 34.5%;
  width: 21%;
  height: 3%;
  border-radius: 999px;
  background: color-mix(in srgb, var(--avatar-accent), #2b1d20 48%);
}
.mez-avatar-brow-left { left: 21%; transform: rotate(-8deg); }
.mez-avatar-brow-right { right: 21%; transform: rotate(8deg); }
.mez-avatar-thinking .mez-avatar-brow-left { transform: rotate(7deg) translateY(-2px); }
.mez-avatar-thinking .mez-avatar-brow-right { transform: rotate(-7deg) translateY(-2px); }

.mez-avatar-nose {
  position: absolute;
  left: 46.5%;
  top: 53%;
  width: 8%;
  height: 14%;
  border-radius: 54% 44% 50% 50%;
  background: linear-gradient(120deg, rgba(255,255,255,.12), rgba(165,85,63,.24));
  box-shadow:
    2px 2px 0 rgba(151,75,56,.18),
    -1px 0 0 rgba(255,255,255,.2);
}
.mez-avatar-nose::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: 5%;
  height: 22%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 25% 50%, rgba(90,45,36,.24) 0 18%, transparent 19%),
    radial-gradient(circle at 75% 50%, rgba(90,45,36,.24) 0 18%, transparent 19%);
}

.mez-avatar-cheek {
  position: absolute;
  top: 58%;
  width: 15%;
  height: 9%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,117,150,.26), transparent 70%);
}
.mez-avatar-cheek-left { left: 15%; }
.mez-avatar-cheek-right { right: 15%; }
.mez-avatar-male .mez-avatar-cheek { opacity: .4; }

.mez-avatar-mouth {
  position: absolute;
  left: 29%;
  top: 72.5%;
  width: 42%;
  height: var(--mouth-open);
  min-height: 3px;
  border: 2px solid #be3454;
  border-top: 0;
  border-radius: 0 0 var(--mouth-radius) var(--mouth-radius);
  background:
    radial-gradient(circle at 50% 110%, rgba(244,114,182,.62), transparent 38%),
    linear-gradient(180deg, #7b1830, #2f0711);
  overflow: hidden;
  box-shadow: 0 2px 3px rgba(101, 39, 45, .18);
  transition: height .1s ease, border-radius .1s ease;
}
.mez-avatar-mouth::before {
  content: "";
  position: absolute;
  left: -4%;
  right: -4%;
  top: -3px;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(90deg, #a92142, #e86f86 45%, #9f1239);
  box-shadow: 0 1px 2px rgba(75, 22, 32, .22);
}
.mez-avatar-female .mez-avatar-mouth {
  top: 72%;
  left: 27%;
  width: 46%;
}
.mez-avatar-male .mez-avatar-mouth { border-color: #7f1d1d; }
.mez-avatar-teeth {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 0;
  height: 58%;
  border-radius: 0 0 12px 12px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.98), rgba(238,245,255,.92)),
    repeating-linear-gradient(90deg, transparent 0 13%, rgba(190,190,190,.35) 13% 15%, transparent 15% 28%),
    #fff;
}
.mez-avatar-teeth::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 47%;
  height: 1px;
  background: rgba(156,163,175,.45);
}
.mez-avatar-tongue {
  position: absolute;
  left: 27%;
  right: 27%;
  bottom: -16%;
  height: 42%;
  border-radius: 50%;
  background: #f472b6;
  opacity: .76;
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
}

.mez-avatar-listening .mez-avatar-card,
.mez-avatar-talking .mez-avatar-card {
  box-shadow:
    0 calc(var(--avatar-size) * .08) calc(var(--avatar-size) * .24) rgba(2, 6, 23, .34),
    0 0 calc(var(--avatar-size) * .08) color-mix(in srgb, var(--avatar-state), transparent 45%),
    inset 0 0 calc(var(--avatar-size) * .08) rgba(255,255,255,.16);
}
.mez-avatar-talking .mez-avatar-face {
  animation: mezAvatarTalk 220ms ease-in-out infinite alternate;
}

@keyframes mezAvatarGlow { to { transform: rotate(360deg); } }
@keyframes mezAvatarTalk {
  from { transform: translateY(0); }
  to { transform: translateY(calc(var(--avatar-size) * .006)); }
}
`
