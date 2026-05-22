import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'

const PERSONALITIES = ['Friendly', 'Developer', 'Coach', 'Professional']

export default function ChatPage() {
  const { messages, addMessage, settings, updateSettings, setAvatarState, avatarState } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPersonality, setSelectedPersonality] = useState('Friendly')
  const [memoryOn, setMemoryOn] = useState(true)
  const [voiceOn, setVoiceOn] = useState(false)
  const bottomRef = useRef(null)
  const taRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  // Mock responses for Demo mode (Vercel)
  const getMockResponse = (userText) => {
    const text = userText.toLowerCase();
    if (text.includes('hello') || text.includes('hi')) {
      return `Hello! I am ${settings.avatarName || 'ARIA'}, your AI companion. I am running in demo mode on Vercel. How can I help you construct something today?`;
    }
    if (text.includes('code') || text.includes('program') || text.includes('write')) {
      return "Sure! I can write Python and Javascript. Hop over to the 'Code IDE' tab to create files and run code in my sandboxed execution terminal!";
    }
    if (text.includes('theme') || text.includes('gold') || text.includes('style')) {
      return "Do you like this style? It is a custom luxury gold design! You can toggle between the Gold Light Theme (cream and brass accents) and Obsidian Gold Dark Theme via the sidebar button in the bottom-left corner.";
    }
    if (text.includes('meeting') || text.includes('call')) {
      return "I can join Daily.co rooms as an automated meeting agent. Switch to the 'Meetings' page to spin up a video grid call and watch me listen, transcribe, and draft summaries!";
    }
    return `Interesting point. As a ${selectedPersonality.toLowerCase()} assistant, I would suggest analyzing this further. Let me know if you would like me to draft some code or help you prepare for a meeting!`;
  }

  const simulateMockStreaming = async (userText) => {
    setLoading(true)
    setAvatarState('thinking')
    await new Promise(r => setTimeout(r, 1200)) // simulate thinking delay
    
    const replyText = getMockResponse(userText)
    const assistantMsg = { role: 'assistant', content: '', id: Date.now() + 1, streaming: true }
    addMessage(assistantMsg)
    setAvatarState('talking')
    setLoading(false)

    // Stream word by word
    const words = replyText.split(' ')
    let currentText = ''
    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 60 + Math.random() * 40))
      currentText += (i === 0 ? '' : ' ') + words[i]
      useStore.setState(s => ({
        messages: s.messages.map(m => m.id === assistantMsg.id ? { ...m, content: currentText, streaming: false } : m)
      }))
    }
    
    // Voice output
    if (voiceOn) {
      speakText(replyText)
    } else {
      setAvatarState('idle')
    }
  }

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return setAvatarState('idle')
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = settings.voiceSpeed || 1.0
    utter.pitch = settings.voicePitch || 1.0
    
    if (settings.voiceName) {
      const voices = window.speechSynthesis.getVoices()
      utter.voice = voices.find(v => v.name === settings.voiceName) || null
    }
    
    setAvatarState('talking')
    window.speechSynthesis.speak(utter)
    utter.onend = () => setAvatarState('idle')
    utter.onerror = () => setAvatarState('idle')
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim(), id: Date.now() }
    addMessage(userMsg)
    const currentInput = input.trim()
    setInput('')

    // Check if API key is provided, if not, fallback to local simulator
    if (!settings.apiKey) {
      simulateMockStreaming(currentInput)
      return
    }

    setLoading(true)
    setAvatarState('thinking')

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const systemPrompt = settings.systemPrompt || `You are ${settings.avatarName}, a ${selectedPersonality.toLowerCase()} AI assistant.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-api-key': settings.apiKey, 
          'anthropic-version': '2023-06-01',
          'dangerously-allow-developer-user-agent-override': 'true' // Allow direct browser calls for BYOK
        },
        body: JSON.stringify({
          model: settings.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: memoryOn ? history : [{ role: 'user', content: userMsg.content }],
          stream: true,
        })
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
                messages: s.messages.map(m => m.id === assistantMsg.id ? { ...m, content: fullText, streaming: false } : m)
              }))
            }
          } catch {}
        }
      }

      if (voiceOn && fullText) {
        speakText(fullText)
      } else {
        setAvatarState('idle')
      }

    } catch (e) {
      addMessage({ role: 'assistant', content: `Error: ${e.message}. Falling back to simulation. (Ensure your Anthropic key is active in Settings).`, id: Date.now() + 2 })
      setAvatarState('idle')
      // fallback simulation on error
      setTimeout(() => simulateMockStreaming(currentInput), 1500)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="fade-in">

      {/* ── CHAT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--b1)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--b1)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>Chat Workspace</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>
              Active Mode: {selectedPersonality} · Memory: {memoryOn ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          {!settings.apiKey && (
            <span style={{ fontSize: 10, background: 'var(--gold-light)', border: '1px solid var(--b2)', color: 'var(--gold)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--ff-mono)' }}>
              Demo Simulator Mode
            </span>
          )}
        </div>

        {/* Message Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: .4 }}>
              <div style={{ fontSize: 40 }}>💬</div>
              <div style={{ fontFamily: 'var(--ff-display)', fontSize: 14, color: 'var(--t2)', fontWeight: 600 }}>Initialize conversation with {settings.avatarName}</div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)' }}>Type hello, theme, or code to test responses.</div>
            </div>
          )}
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} avatarName={settings.avatarName}/>)}
          {loading && (
            <div style={{ display: 'flex', gap: 10, maxWidth: '75%' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }}/>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: 'typing 1.2s infinite', animationDelay: `${i*0.2}s` }}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input Bar */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--b1)', display: 'flex', alignItems: 'flex-end', gap: 10, flexShrink: 0, backgroundColor: 'var(--bg1)' }}>
          <div style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 14, display: 'flex', alignItems: 'flex-end', padding: '10px 14px', gap: 8 }}>
            <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`Message ${settings.avatarName}...`} rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--ff-body)', fontSize: 13, color: 'var(--t1)', lineHeight: 1.5, maxHeight: 120, caretColor: 'var(--gold)' }}
            />
            <MicBtn onTranscript={t => setInput(p => p + t)}/>
          </div>
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="gold-glow-btn" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || loading) ? .5 : 1, flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── RIGHT CONTROL PANEL ── */}
      <div style={{ width: 260, background: 'var(--bg1)', padding: 20, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 20, borderBottom: '1px solid var(--b1)' }}>
          <AvatarFace size={100}/>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>{settings.avatarName}</div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{avatarState}</div>
        </div>

        <div>
          <div style={sectionLabel}>Agent Personality</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {PERSONALITIES.map(p => (
              <button key={p} onClick={() => setSelectedPersonality(p)} style={{
                background: selectedPersonality === p ? 'var(--gold-light)' : 'var(--bg2)',
                border: `1px solid ${selectedPersonality === p ? 'var(--gold)' : 'var(--b1)'}`,
                borderRadius: 8, padding: '8px 6px', fontFamily: 'var(--ff-display)', fontSize: 11, fontWeight: 700,
                color: selectedPersonality === p ? 'var(--gold)' : 'var(--t2)', transition: 'all .2s'
              }}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ToggleRow label="Short-term Memory" sublabel="Retain dialogue history" value={memoryOn} onChange={setMemoryOn}/>
          <ToggleRow label="Voice Output (TTS)" sublabel="Speak back via browser audio" value={voiceOn} onChange={setVoiceOn}/>
        </div>

        <button onClick={() => useStore.getState().clearHistory()} style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 9, padding: '9px 0', fontFamily: 'var(--ff-display)', fontSize: 12, fontWeight: 700, color: 'var(--t2)', transition: 'all .2s', marginTop: 'auto' }}>
          Clear History
        </button>
      </div>

      <style>{`@keyframes typing{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}

function MessageBubble({ msg, avatarName }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', gap: 10, maxWidth: '78%', alignSelf: isUser ? 'flex-end' : 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: 'var(--ff-display)', background: isUser ? 'var(--bg3)' : 'linear-gradient(135deg,var(--gold),#ebdcb9)', border: isUser ? '1px solid var(--b2)' : 'none', color: isUser ? 'var(--t2)' : '#2a1f08' }}>
        {isUser ? 'U' : avatarName[0]}
      </div>
      <div>
        <div style={{ background: isUser ? 'var(--gold-light)' : 'var(--bg2)', border: `1px solid ${isUser ? 'var(--b2)' : 'var(--b1)'}`, borderRadius: 14, padding: '11px 15px', fontSize: 13, color: 'var(--t1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {msg.content || <span style={{ opacity: .4 }}>Streaming response...</span>}
        </div>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', marginTop: 4, padding: '0 4px', textAlign: isUser ? 'right' : 'left' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function MicBtn({ onTranscript }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const toggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return alert('Speech recognition not supported in this browser.')
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US'
    recognition.onresult = e => onTranscript(e.results[0][0].transcript + ' ')
    recognition.onend = () => setListening(false)
    recognition.start(); setListening(true)
    recognitionRef.current = recognition
  }

  return (
    <button onClick={toggle} style={{ background: 'none', border: 'none', color: listening ? 'var(--red)' : 'var(--t3)', display: 'flex', alignItems: 'center', flexShrink: 0, padding: 0 }}>
      <svg viewBox="0 0 24 24" fill={listening ? 'var(--red)' : 'none'} stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
      </svg>
    </button>
  )
}

function ToggleRow({ label, sublabel, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{sublabel}</div>
      </div>
      <div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? 'var(--gold)' : 'var(--bg3)', border: `1px solid ${value ? 'var(--gold)' : 'var(--b2)'}`, cursor: 'pointer', position: 'relative', transition: 'all .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: 'white', top: 2, left: value ? 18 : 2, transition: 'left .2s' }}/>
      </div>
    </div>
  )
}

const sectionLabel = { fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }
