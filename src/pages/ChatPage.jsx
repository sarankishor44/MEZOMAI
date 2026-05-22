import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'

const MODES = ['Friendly', 'Developer', 'Coach', 'Professional']
const PROMPTS = ['Review this idea', 'Draft a release note', 'Explain the code', 'Create meeting agenda']

export default function ChatPage() {
  const { messages, addMessage, settings, setAvatarState, avatarState } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState('Friendly')
  const [memoryOn, setMemoryOn] = useState(true)
  const [voiceOn, setVoiceOn] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const getMockResponse = (userText) => {
    const text = userText.toLowerCase()
    if (text.includes('code')) return 'Open Code Studio and I can help explain, refactor, or generate a focused patch against the active file.'
    if (text.includes('meeting')) return 'Use Meet Rooms to simulate a premium call workspace with live transcript, AI companion, and generated notes.'
    if (text.includes('deploy')) return 'I can help review production readiness against auth, reset tokens, CORS, rate limits, errors, indexes, logging, and rollback. The checklist is an engineering audit now, not a UI page.'
    return `I am ${settings.avatarName || 'ARIA'}, running in demo mode. I can help with product planning, code review, meetings, deployment checks, and concise drafting.`
  }

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return setAvatarState('idle')
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = settings.voiceSpeed || 1
    utter.pitch = settings.voicePitch || 1
    setAvatarState('talking')
    window.speechSynthesis.speak(utter)
    utter.onend = () => setAvatarState('idle')
    utter.onerror = () => setAvatarState('idle')
  }

  const simulateMockStreaming = async (userText) => {
    setLoading(true)
    setAvatarState('thinking')
    await new Promise(r => setTimeout(r, 650))
    const replyText = getMockResponse(userText)
    const assistantMsg = { role: 'assistant', content: '', id: Date.now() + 1, streaming: true }
    addMessage(assistantMsg)
    setAvatarState('talking')
    setLoading(false)

    let currentText = ''
    for (const [index, word] of replyText.split(' ').entries()) {
      await new Promise(r => setTimeout(r, 34))
      currentText += (index === 0 ? '' : ' ') + word
      useStore.setState(s => ({
        messages: s.messages.map(m => m.id === assistantMsg.id ? { ...m, content: currentText, streaming: false } : m),
      }))
    }
    if (voiceOn) speakText(replyText)
    else setAvatarState('idle')
  }

  const sendMessage = async (override) => {
    const text = (override ?? input).trim()
    if (!text || loading) return
    const userMsg = { role: 'user', content: text, id: Date.now() }
    addMessage(userMsg)
    setInput('')

    if (!settings.apiKey) {
      simulateMockStreaming(text)
      return
    }

    setLoading(true)
    setAvatarState('thinking')
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-developer-user-agent-override': 'true',
        },
        body: JSON.stringify({
          model: settings.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: settings.systemPrompt || `You are ${settings.avatarName}, a ${selectedMode.toLowerCase()} AI assistant.`,
          messages: memoryOn ? history : [{ role: 'user', content: text }],
          stream: true,
        }),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const assistantMsg = { role: 'assistant', content: '', id: Date.now() + 1, streaming: true }
      addMessage(assistantMsg)
      setAvatarState('talking')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data:'))
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(5))
            if (data.type === 'content_block_delta' && data.delta?.text) {
              fullText += data.delta.text
              useStore.setState(s => ({
                messages: s.messages.map(m => m.id === assistantMsg.id ? { ...m, content: fullText, streaming: false } : m),
              }))
            }
          } catch {}
        }
      }
      if (voiceOn && fullText) speakText(fullText)
      else setAvatarState('idle')
    } catch (e) {
      addMessage({ role: 'assistant', content: `API unavailable: ${e.message}. I switched back to the local demo simulator.`, id: Date.now() + 2 })
      setAvatarState('idle')
      setTimeout(() => simulateMockStreaming(text), 800)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={page} className="fade-in">
      <section style={chatShell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>Claude-style workspace</div>
            <h1 style={title}>Chat with {settings.avatarName}</h1>
          </div>
          {!settings.apiKey && <span style={badge}>Demo Simulator</span>}
        </header>

        <div style={promptRow}>
          {PROMPTS.map(prompt => <button key={prompt} onClick={() => sendMessage(prompt)} style={promptBtn}>{prompt}</button>)}
        </div>

        <div style={feed}>
          {messages.length === 0 && (
            <div style={emptyState}>
              <div style={emptyOrb}>AI</div>
              <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 22 }}>What should we work on?</h2>
              <p style={{ color: 'var(--t3)', maxWidth: 520, lineHeight: 1.6 }}>Ask for product strategy, code help, meeting prep, deployment review, or a clear next step.</p>
            </div>
          )}
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} avatarName={settings.avatarName}/>)}
          {loading && <TypingBubble/>}
          <div ref={bottomRef}/>
        </div>

        <footer style={composerWrap}>
          <div style={composer}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${settings.avatarName}...`}
              rows={1}
              style={textarea}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="gold-glow-btn" style={sendBtn}>Send</button>
          </div>
        </footer>
      </section>

      <aside style={sidePanel}>
        <AvatarFace size={104}/>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 800 }}>{settings.avatarName}</div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', marginTop: 4 }}>{avatarState}</div>
        </div>

        <div style={controlBlock}>
          <div style={sectionLabel}>Mode</div>
          <div style={modeGrid}>
            {MODES.map(mode => (
              <button key={mode} onClick={() => setSelectedMode(mode)} style={modeBtn(selectedMode === mode)}>{mode}</button>
            ))}
          </div>
        </div>

        <ToggleRow label="Memory" sublabel="Use chat history" value={memoryOn} onChange={setMemoryOn}/>
        <ToggleRow label="Voice" sublabel="Browser text to speech" value={voiceOn} onChange={setVoiceOn}/>

        <button onClick={() => useStore.getState().clearHistory()} style={outlineBtn}>Clear History</button>
      </aside>
    </div>
  )
}

function MessageBubble({ msg, avatarName }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={bubble(isUser)}>
        <div style={bubbleMeta}>{isUser ? 'You' : avatarName}</div>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{msg.content || 'Streaming response...'}</div>
      </div>
    </div>
  )
}

function TypingBubble() {
  return <div style={bubble(false)}><div style={bubbleMeta}>Assistant</div><div style={{ color: 'var(--t3)' }}>Thinking...</div></div>
}

function ToggleRow({ label, sublabel, value, onChange }) {
  return (
    <div style={toggleRow}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{sublabel}</div>
      </div>
      <button onClick={() => onChange(!value)} style={switchTrack(value)}><span style={switchKnob(value)}/></button>
    </div>
  )
}

const page = { display: 'flex', flex: 1, overflow: 'hidden', padding: 18, gap: 18 }
const chatShell = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 60px rgba(15,23,42,.10)' }
const header = { padding: '20px 24px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const eyebrow = { fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase' }
const title = { fontFamily: 'var(--ff-display)', fontSize: 23, fontWeight: 800, marginTop: 4 }
const badge = { fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--gold)', background: 'var(--gold-light)', border: '1px solid var(--gold)', padding: '6px 9px', borderRadius: 999 }
const promptRow = { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 24px', borderBottom: '1px solid var(--b1)', background: 'var(--bg2)' }
const promptBtn = { border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t2)', padding: '8px 11px', fontSize: 12, fontWeight: 800 }
const feed = { flex: 1, overflowY: 'auto', padding: '26px min(7vw, 78px)', display: 'flex', flexDirection: 'column', gap: 18 }
const emptyState = { flex: 1, minHeight: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }
const emptyOrb = { width: 58, height: 58, borderRadius: 18, background: 'linear-gradient(135deg, var(--gold), #0f766e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-mono)', fontWeight: 800 }
const bubble = (user) => ({ maxWidth: '760px', background: user ? 'var(--gold)' : 'var(--bg2)', color: user ? '#fff' : 'var(--t1)', border: `1px solid ${user ? 'transparent' : 'var(--b1)'}`, borderRadius: user ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '14px 16px', boxShadow: '0 12px 32px rgba(15,23,42,.08)' })
const bubbleMeta = { fontFamily: 'var(--ff-mono)', fontSize: 10, opacity: .72, textTransform: 'uppercase', marginBottom: 6 }
const composerWrap = { padding: 18, borderTop: '1px solid var(--b1)', background: 'var(--bg1)' }
const composer = { display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 16, padding: 10 }
const textarea = { flex: 1, minHeight: 40, maxHeight: 130, border: 'none', background: 'transparent', resize: 'none', boxShadow: 'none', lineHeight: 1.5 }
const sendBtn = { border: 'none', padding: '11px 16px', fontWeight: 800 }
const sidePanel = { width: 294, background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', boxShadow: '0 24px 60px rgba(15,23,42,.08)' }
const controlBlock = { display: 'flex', flexDirection: 'column', gap: 9 }
const sectionLabel = { fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase' }
const modeGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }
const modeBtn = (active) => ({ background: active ? 'var(--gold-light)' : 'var(--bg2)', border: `1px solid ${active ? 'var(--gold)' : 'var(--b1)'}`, color: active ? 'var(--gold)' : 'var(--t2)', padding: '8px 7px', fontSize: 11, fontWeight: 800 })
const toggleRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, padding: 12 }
const switchTrack = (on) => ({ width: 40, height: 22, borderRadius: 999, border: '1px solid var(--b1)', background: on ? 'var(--gold)' : 'var(--bg3)', padding: 2 })
const switchKnob = (on) => ({ display: 'block', width: 16, height: 16, borderRadius: '50%', background: '#fff', transform: on ? 'translateX(17px)' : 'translateX(0)', transition: 'transform .16s ease' })
const outlineBtn = { marginTop: 'auto', background: 'var(--bg2)', border: '1px solid var(--b1)', color: 'var(--t2)', padding: '10px 12px', fontWeight: 800 }
