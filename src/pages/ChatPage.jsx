import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'
import { phpApi, pyApi } from '../utils/api'
import { isSupabaseConfigured } from '../utils/supabase'
import {
  createSupabaseChatSession,
  listSupabaseChatSessions,
  loadSupabaseMessages,
  saveSupabaseMessage,
} from '../utils/supabaseBackend'

const MODES = ['Friendly', 'Developer', 'Coach', 'Professional']
const PROMPTS = ['Review this idea', 'Draft a release note', 'Explain the code', 'Create meeting agenda']

const toUiMessage = (message) => ({
  id: message.uuid || message.id || Date.now(),
  role: message.role,
  content: message.content,
  created_at: message.created_at,
})

export default function ChatPage() {
  const {
    sessions,
    setSessions,
    addSession,
    activeSession,
    setActiveSession,
    messages,
    setMessages,
    settings,
    setAvatarState,
    avatarState,
  } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState('Friendly')
  const [memoryOn, setMemoryOn] = useState(true)
  const [voiceOn, setVoiceOn] = useState(false)
  const [syncState, setSyncState] = useState('Local ready')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  useEffect(() => {
    refreshSessions()
  }, [])

  useEffect(() => {
    if (activeSession && activeSession !== 'default') loadMessages(activeSession)
  }, [activeSession])

  const refreshSessions = async () => {
    try {
      const { data } = await phpApi.get('/chat/sessions')
      const normalized = data.map(s => ({ ...s, id: s.uuid }))
      setSessions(normalized.length ? normalized : sessions)
      if (normalized.length && activeSession === 'default') {
        setActiveSession(normalized[0].uuid)
      }
      setSyncState('Synced with PHP')
    } catch {
      if (isSupabaseConfigured) {
        try {
          const normalized = await listSupabaseChatSessions()
          setSessions(normalized.length ? normalized : sessions)
          if (normalized.length && activeSession === 'default') {
            setActiveSession(normalized[0].uuid)
          }
          setSyncState('Synced with Supabase')
          return
        } catch {}
      }
      setSyncState('Local mode')
    }
  }

  const ensureSession = async () => {
    if (activeSession && activeSession !== 'default') return activeSession
    try {
      const { data } = await phpApi.post('/chat/sessions', {
        title: input.trim().slice(0, 60) || 'New Chat',
        personality: selectedMode.toLowerCase(),
      })
      if (!data?.uuid) throw new Error('PHP chat endpoint did not return a session.')
      const session = { ...data, id: data.uuid }
      addSession(session)
      setActiveSession(data.uuid)
      return data.uuid
    } catch {
      if (isSupabaseConfigured) {
        try {
          const session = await createSupabaseChatSession({
            title: input.trim().slice(0, 60) || 'New Chat',
            personality: selectedMode.toLowerCase(),
          })
          addSession(session)
          setActiveSession(session.uuid)
          setSyncState('Created in Supabase')
          return session.uuid
        } catch {}
      }
      return 'default'
    }
  }

  const loadMessages = async (sessionUuid) => {
    try {
      const { data } = await phpApi.get(`/chat/sessions/${sessionUuid}/messages`)
      setMessages(data.map(toUiMessage))
      setSyncState('Messages loaded from PHP')
    } catch {
      if (isSupabaseConfigured) {
        try {
          const data = await loadSupabaseMessages(sessionUuid)
          setMessages(data.map(toUiMessage))
          setSyncState('Messages loaded from Supabase')
          return
        } catch {}
      }
      setSyncState('Using local messages')
    }
  }

  const saveMessage = async (sessionUuid, message) => {
    if (!sessionUuid || sessionUuid === 'default') return null
    try {
      const { data } = await phpApi.post(`/chat/sessions/${sessionUuid}/message`, {
        role: message.role,
        content: message.content,
        token_count: Math.ceil((message.content || '').length / 4),
      })
      if (!data?.role) throw new Error('PHP chat endpoint did not return a message.')
      setSyncState('Saved')
      return toUiMessage(data)
    } catch {
      if (isSupabaseConfigured) {
        try {
          const data = await saveSupabaseMessage(sessionUuid, message)
          setSyncState('Saved to Supabase')
          return toUiMessage(data)
        } catch {}
      }
      setSyncState('Save failed: local only')
      return null
    }
  }

  const generateReply = async (history, userText) => {
    const systemPrompt = settings.systemPrompt || `You are ${settings.avatarName}, a ${selectedMode.toLowerCase()} AI assistant.`
    if (settings.apiKey || settings.openAiKey || settings.geminiKey) {
      try {
        const { data } = await pyApi.post('/completion', {
          system_prompt: systemPrompt,
          prompt: memoryOn
            ? history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
            : userText,
          model: settings.model,
          provider: settings.activeProvider || 'anthropic',
          api_key: settings.apiKey || undefined,
          openai_key: settings.openAiKey || undefined,
          gemini_key: settings.geminiKey || undefined,
        })
        return data.response
      } catch {}
    }

    const text = userText.toLowerCase()
    if (text.includes('code')) return 'Open Code Studio. Files now load from PHP and Run posts to /code/run for the Python sandbox.'
    if (text.includes('meeting')) return 'Meet Rooms has camera preview, browser transcript, tasks, and generated notes.'
    return `I am ${settings.avatarName || 'ARIA'}. Chat sessions and messages now persist through the PHP backend when it is available.`
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

  const sendMessage = async (override) => {
    const text = (override ?? input).trim()
    if (!text || loading) return
    setLoading(true)
    setAvatarState('thinking')

    const sessionUuid = await ensureSession()
    const userMsg = { role: 'user', content: text, id: Date.now() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    await saveMessage(sessionUuid, userMsg)

    const replyText = await generateReply(nextMessages, text)
    const assistantMsg = { role: 'assistant', content: replyText, id: Date.now() + 1 }
    setMessages([...nextMessages, assistantMsg])
    await saveMessage(sessionUuid, assistantMsg)
    setLoading(false)
    if (voiceOn) speakText(replyText)
    else setAvatarState('idle')
  }

  const newChat = async () => {
    setMessages([])
    try {
      const { data } = await phpApi.post('/chat/sessions', {
        title: 'New Chat',
        personality: selectedMode.toLowerCase(),
      })
      if (!data?.uuid) throw new Error('PHP chat endpoint did not return a session.')
      const session = { ...data, id: data.uuid }
      addSession(session)
      setActiveSession(data.uuid)
    } catch {
      if (isSupabaseConfigured) {
        try {
          const session = await createSupabaseChatSession({
            title: 'New Chat',
            personality: selectedMode.toLowerCase(),
          })
          addSession(session)
          setActiveSession(session.uuid)
          setSyncState('Created in Supabase')
          return
        } catch {}
      }
      setActiveSession('default')
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
      <aside style={sessionsPane}>
        <button onClick={newChat} className="gold-glow-btn" style={newChatBtn}>New Chat</button>
        <div style={sectionLabel}>Sessions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map(session => (
            <button key={session.uuid || session.id} onClick={() => setActiveSession(session.uuid || session.id)} style={sessionBtn(activeSession === (session.uuid || session.id))}>
              <span>{session.title || 'Chat Session'}</span>
              <small>{session.message_count || 0} messages</small>
            </button>
          ))}
        </div>
      </aside>

      <section style={chatShell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>Backend-backed chat</div>
            <h1 style={title}>Chat with {settings.avatarName}</h1>
          </div>
          <span style={badge}>{syncState}</span>
        </header>

        <div style={promptRow}>
          {PROMPTS.map(prompt => <button key={prompt} onClick={() => sendMessage(prompt)} style={promptBtn}>{prompt}</button>)}
        </div>

        <div style={feed}>
          {messages.length === 0 && (
            <div style={emptyState}>
              <div style={emptyOrb}>AI</div>
              <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 22 }}>What should we work on?</h2>
              <p style={{ color: 'var(--t3)', maxWidth: 520, lineHeight: 1.6 }}>Messages are saved through PHP locally or Supabase on Vercel, so refresh keeps your chat.</p>
            </div>
          )}
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} avatarName={settings.avatarName}/>)}
          {loading && <TypingBubble/>}
          <div ref={bottomRef}/>
        </div>

        <footer style={composerWrap}>
          <div style={composer}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${settings.avatarName}...`} rows={1} style={textarea}/>
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
            {MODES.map(mode => <button key={mode} onClick={() => setSelectedMode(mode)} style={modeBtn(selectedMode === mode)}>{mode}</button>)}
          </div>
        </div>
        <ToggleRow label="Memory" sublabel="Use loaded history" value={memoryOn} onChange={setMemoryOn}/>
        <ToggleRow label="Voice" sublabel="Browser text to speech" value={voiceOn} onChange={setVoiceOn}/>
        <button onClick={() => useStore.getState().clearHistory()} style={outlineBtn}>Clear Local View</button>
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
const sessionsPane = { width: 230, background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }
const newChatBtn = { border: 'none', padding: '11px 12px', fontWeight: 800 }
const sessionBtn = (active) => ({ background: active ? 'var(--gold-light)' : 'var(--bg2)', border: `1px solid ${active ? 'var(--gold)' : 'var(--b1)'}`, color: active ? 'var(--gold)' : 'var(--t2)', padding: 10, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 800 })
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
