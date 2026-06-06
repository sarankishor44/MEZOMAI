import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'
import { createWebSocket, pyApi } from '../utils/api'
import { activeProvider, aiErrorMessage, aiRequestConfig, hasProviderKey, providerModel } from '../utils/aiConfig'

function detectPlatform(value) {
  const text = (value || '').toLowerCase()
  if (text.includes('meet.google.com')) return { name: 'Google Meet', short: 'GM', color: '#16a34a' }
  if (text.includes('zoom.us')) return { name: 'Zoom', short: 'ZM', color: '#2d8cff' }
  if (text.includes('teams.microsoft')) return { name: 'Microsoft Teams', short: 'TM', color: '#6264a7' }
  if (text.includes('meet.jit.si')) return { name: 'Jitsi', short: 'JT', color: '#f97316' }
  if (text.includes('whereby.com')) return { name: 'Whereby', short: 'WB', color: '#d97706' }
  return { name: 'MEZOMAI Room', short: 'AI', color: 'var(--gold)' }
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function MeetingsPage() {
  const {
    settings,
    meetingState,
    setMeetingState,
    activeRoom,
    transcript,
    addTranscriptLine,
    meetingNotes,
    setMeetingNotes,
    recentMeetings,
    saveRecentMeeting,
  } = useStore()

  const [roomInput, setRoomInput] = useState('')
  const [taskInput, setTaskInput] = useState('')
  const [tasks, setTasks] = useState([])
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [listening, setListening] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [botJoinStatus, setBotJoinStatus] = useState('')

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const wsRef = useRef(null)
  const recognitionRef = useRef(null)
  const transcriptEndRef = useRef(null)

  const platform = useMemo(() => detectPlatform(roomInput || activeRoom), [roomInput, activeRoom])
  const meetingHistory = Array.isArray(recentMeetings) ? recentMeetings : []

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0')
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const startMedia = async () => {
    try {
      setMediaError('')
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (e) {
      setMediaError('Camera or microphone permission was blocked. You can still run the meeting companion in text mode.')
    }
  }

  const stopMedia = () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }

  const connectSocket = (roomId) => {
    try {
      const ws = createWebSocket(`/meeting/${encodeURIComponent(roomId)}`)
      wsRef.current = ws
      ws.onopen = () => ws.send(JSON.stringify({ type: 'join', user: 'Operator' }))
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'transcript_line') {
            addTranscriptLine({
              speaker: payload.name || payload.speaker || 'Participant',
              text: payload.text,
              time: nowLabel(),
            })
          }
          if (payload.type === 'bot_speech') {
            addTranscriptLine({
              speaker: settings.avatarName,
              text: payload.text,
              time: nowLabel(),
            })
          }
        } catch {}
      }
    } catch {
      wsRef.current = null
    }
  }

  const generateMeetingReply = async (userText) => {
    const provider = activeProvider(settings)
    if (!hasProviderKey(settings)) {
      return `I captured that. Add a ${provider} API key in Settings if you want live AI meeting responses.`
    }
    const recentTranscript = [...transcript.slice(-8), { speaker: 'You', text: userText }]
      .map(line => `${line.speaker}: ${line.text}`)
      .join('\n')
    try {
      const { data } = await pyApi.post('/completion', {
        system_prompt: settings.systemPrompt || `You are ${settings.avatarName || 'ARIA'}, an AI meeting companion. Respond briefly, capture decisions, and surface action items.`,
        prompt: [
          `Meeting platform: ${platform.name}`,
          'Recent transcript:',
          recentTranscript,
          'Reply in 1-2 concise sentences as the live meeting companion.',
        ].join('\n\n'),
        ...aiRequestConfig(settings),
      })
      return data.response || 'I captured that and will include it in the meeting notes.'
    } catch (error) {
      return `I captured that, but the live AI response failed (${provider} / ${providerModel(settings)}): ${aiErrorMessage(error)}`
    }
  }

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMediaError('Speech recognition is not supported in this browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = async (event) => {
      const result = event.results[event.results.length - 1]
      const text = result?.[0]?.transcript?.trim()
      if (!text) return
      const line = { speaker: 'You', text, time: nowLabel() }
      addTranscriptLine(line)
      wsRef.current?.send(JSON.stringify({ type: 'transcript', speaker: 'You', text }))
      useStore.setState({ avatarState: 'thinking' })
      const reply = await generateMeetingReply(text)
      addTranscriptLine({
        speaker: settings.avatarName,
        text: reply,
        time: nowLabel(),
      })
      useStore.setState({ avatarState: 'talking' })
      window.setTimeout(() => useStore.setState({ avatarState: 'idle' }), 1800)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
    useStore.setState({ avatarState: 'listening' })
  }

  const stopSpeechRecognition = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
    useStore.setState({ avatarState: 'idle' })
  }

  const handleJoin = async (e) => {
    e?.preventDefault()
    const room = roomInput.trim() || `mezomai-room-${Date.now()}`
    useStore.setState({ activeRoom: room, transcript: [], meetingNotes: null })
    setDuration(0)
    setTasks([])
    setMeetingState('incall')
    connectSocket(room)
    await startMedia()
    addTranscriptLine({
      speaker: 'System',
      text: `${platform.name} companion room started. AI agent ${settings.avatarName} is ready as a ${settings.avatarGender || 'female'} avatar.`,
      time: nowLabel(),
    })
    timerRef.current = window.setInterval(() => setDuration(v => v + 1), 1000)
  }

  const handleInviteExternalBot = async () => {
    const meetingUrl = roomInput.trim()
    if (!meetingUrl.startsWith('http')) {
      setBotJoinStatus('Paste a Google Meet, Zoom, Teams, Jitsi, or Whereby URL first.')
      return
    }

    setBotJoinStatus(`Sending ${settings.avatarName} to ${platform.name}...`)
    try {
      const { data } = await pyApi.post('/meeting-bot/join', {
        meeting_url: meetingUrl,
        bot_name: settings.avatarName || 'MEZOMAI AI',
        entry_message: `${settings.avatarName || 'MEZOMAI AI'} joined to capture notes and action items.`,
        avatar: {
          name: settings.avatarName || 'ARIA',
          gender: settings.avatarGender || 'female',
          style: settings.avatarStyle || 'gold',
          personality: settings.personality || 'friendly',
          voice_name: settings.voiceName || '',
        },
      })

      if (data.status === 'joining') {
        setBotJoinStatus(`${settings.avatarName} is joining ${platform.name}. Bot ID: ${data.bot_id || 'pending'}.`)
      } else {
        setBotJoinStatus(data.message || data.details || 'Meeting bot provider is not configured.')
      }
    } catch (e) {
      const detail = e.response?.data?.detail
      if (detail === 'Not Found') {
        setBotJoinStatus('Meeting bot route was not found. Please set your Python API URL in Settings to your Vercel deployment URL (e.g. https://mezomai-sili.vercel.app).')
        return
      }
      setBotJoinStatus(e.response?.data?.message || detail || 'Could not reach the Python meeting-bot backend on Vercel.')
    }
  }

  const handleLeave = async () => {
    window.clearInterval(timerRef.current)
    stopSpeechRecognition()
    stopMedia()
    wsRef.current?.close()
    wsRef.current = null
    setMeetingState('postcall')
    saveRecentMeeting({
      id: Date.now().toString(),
      roomName: activeRoom,
      platform: platform.name,
      duration: formatTime(duration),
      date: new Date().toLocaleString(),
      transcriptLength: transcript.length,
    })
    await generateNotes()
  }

  const generateNotes = async () => {
    setSummaryLoading(true)
    const mapped = transcript
      .filter(line => line.speaker !== 'System')
      .map(line => ({ speaker: line.speaker === settings.avatarName ? 'bot' : 'user', content: line.text }))
    try {
      const { data } = await pyApi.post('/summarize', {
        transcript: mapped,
        bot_name: settings.avatarName,
        ...aiRequestConfig(settings),
      })
      setMeetingNotes({
        summary: data.summary,
        keyPoints: data.key_points || [],
        actionItems: data.action_items || [],
      })
    } catch {
      setMeetingNotes({
        summary: `Meeting with ${settings.avatarName} ended after ${formatTime(duration)}. The conversation covered setup, tasks, and coordination for the current workspace.`,
        keyPoints: [
          `${platform.name} companion room started successfully.`,
          `${transcript.length} transcript lines were captured locally.`,
          `${tasks.length} meeting tasks were tracked.`,
        ],
        actionItems: tasks.length ? tasks.map(t => t.text) : ['Review transcript and convert important decisions into project tasks.'],
      })
    } finally {
      setSummaryLoading(false)
    }
  }

  const addTask = () => {
    if (!taskInput.trim()) return
    setTasks(prev => [{ id: Date.now(), text: taskInput.trim(), done: false }, ...prev])
    setTaskInput('')
  }

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  useEffect(() => () => {
    window.clearInterval(timerRef.current)
    stopSpeechRecognition()
    stopMedia()
    wsRef.current?.close()
  }, [])

  if (meetingState === 'configure') {
    return (
      <div style={page} className="fade-in">
        <div style={hero}>
          <div>
            <div style={eyebrow}>Meet companion</div>
            <h1 style={title}>Launch an AI meeting room</h1>
            <p style={subcopy}>Paste a Zoom, Google Meet, Teams, Jitsi or custom link. MEZOMAI opens a companion workspace with camera preview, mic transcript, AI responses, tasks and notes.</p>
          </div>
          <AvatarFace size={132}/>
        </div>

        <div style={configGrid}>
          <form onSubmit={handleJoin} style={panel}>
            <SectionTitle title="Room setup" sub="The AI companion works beside your call and can be shared into Zoom or Meet."/>
            <label style={label}>Meeting URL or Room ID</label>
            <input value={roomInput} onChange={e => setRoomInput(e.target.value)} placeholder="https://meet.google.com/... or team-daily-sync" style={input}/>
            <div style={platformBadge(platform)}><span>{platform.short}</span>{platform.name}</div>
            <div style={settingsGrid}>
              <Info label="Agent" value={`${settings.avatarName} (${settings.avatarGender || 'female'})`}/>
              <Info label="Voice" value={settings.voiceName || 'Browser default'}/>
              <Info label="Provider" value={settings.activeProvider || 'gemma'}/>
              <Info label="Mode" value={settings.personality || 'friendly'}/>
            </div>
            {mediaError && <div style={warning}>{mediaError}</div>}
            {botJoinStatus && <div style={botStatus}>{botJoinStatus}</div>}
            <div style={buttonRow}>
              <button type="submit" className="gold-glow-btn" style={primaryBtn}>Open Companion Room</button>
              <button type="button" onClick={handleInviteExternalBot} style={secondaryActionBtn}>Invite AI to Link</button>
            </div>
          </form>

          <section style={panel}>
            <SectionTitle title="Recent meetings" sub="Local meeting history from this browser."/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meetingHistory.length === 0 && <div style={emptyBox}>No recent meetings yet.</div>}
              {meetingHistory.slice(0, 6).map(m => (
                <div key={m.id} style={recentRow}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{m.roomName}</div>
                    <div style={muted}>{m.platform || 'MEZOMAI Room'} - {m.date}</div>
                  </div>
                  <div style={{ color: 'var(--gold)', fontFamily: 'var(--ff-mono)', fontSize: 11 }}>{m.duration}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (meetingState === 'incall') {
    return (
      <div style={callPage} className="fade-in">
        <main style={callMain}>
          <header style={callHeader}>
            <div>
              <div style={eyebrow}>Live meeting</div>
              <h1 style={callTitle}>{activeRoom}</h1>
            </div>
            <div style={timerBadge}><span style={liveDot}/>{formatTime(duration)}</div>
          </header>

          <section style={videoGrid}>
            <div style={tile}>
              {cameraOff ? (
                <div style={cameraOffBox}>Camera Off</div>
              ) : (
                <video ref={videoRef} autoPlay muted playsInline style={video}/>
              )}
              <div style={tileLabel}>{muted ? 'Muted' : 'Microphone active'}</div>
            </div>
            <div style={tile}>
              <AvatarFace size={190}/>
              <div style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 800, marginTop: 10 }}>{settings.avatarName}</div>
              <div style={aiBadge}>AI Agent</div>
            </div>
          </section>

          <div style={controls}>
            <button onClick={() => setMuted(v => !v)} style={controlBtn(muted)}>{muted ? 'Unmute' : 'Mute'}</button>
            <button onClick={() => setCameraOff(v => !v)} style={controlBtn(cameraOff)}>{cameraOff ? 'Camera On' : 'Camera Off'}</button>
            <button onClick={listening ? stopSpeechRecognition : startSpeechRecognition} style={controlBtn(listening)}>{listening ? 'Stop Transcript' : 'Start Transcript'}</button>
            <button onClick={handleLeave} style={leaveBtn}>Leave</button>
          </div>
        </main>

        <aside style={side}>
          <div style={sideSection}>
            <SectionTitle title="Live transcript" sub="SpeechRecognition lines and AI responses."/>
            <div style={transcriptBox}>
              {transcript.map((line, index) => (
                <div key={index} style={lineBox(line.speaker === settings.avatarName)}>
                  <div style={lineMeta}><strong>{line.speaker}</strong><span>{line.time}</span></div>
                  <div>{line.text}</div>
                </div>
              ))}
              <div ref={transcriptEndRef}/>
            </div>
          </div>

          <div style={sideSection}>
            <SectionTitle title="Tasks" sub="Capture action items during the call."/>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={taskInput} onChange={e => setTaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Add task..." style={input}/>
              <button onClick={addTask} style={smallBtn}>Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {tasks.map(task => (
                <label key={task.id} style={taskRow}>
                  <input type="checkbox" checked={task.done} onChange={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}/>
                  <span style={{ textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>
      </div>
    )
  }

  return (
    <div style={page} className="fade-in">
      <div style={postShell}>
        <div style={{ textAlign: 'center' }}>
          <div style={eyebrow}>Post call</div>
          <h1 style={title}>Meeting notes generated</h1>
          <p style={subcopy}>Room: {activeRoom} - Duration: {formatTime(duration)}</p>
        </div>
        {summaryLoading && <div style={emptyBox}>Generating notes...</div>}
        {meetingNotes && (
          <>
            <NoteCard title="Summary">{meetingNotes.summary}</NoteCard>
            <ListCard title="Key Points" items={meetingNotes.keyPoints}/>
            <ListCard title="Action Items" items={meetingNotes.actionItems}/>
          </>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => downloadNotes(activeRoom, duration, meetingNotes)} className="gold-glow-btn" style={primaryBtn}>Download Notes</button>
          <button onClick={() => setMeetingState('configure')} style={secondaryBtn}>New Meeting</button>
        </div>
      </div>
    </div>
  )
}

function downloadNotes(room, duration, notes) {
  if (!notes) return
  const text = `MEZOMAI Meeting Notes\nRoom: ${room}\nDuration: ${duration}\n\nSummary:\n${notes.summary}\n\nKey Points:\n${notes.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nAction Items:\n${notes.actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  a.download = `meeting-notes-${Date.now()}.txt`
  a.click()
}

function SectionTitle({ title, sub }) {
  return <div style={{ marginBottom: 14 }}><h2 style={sectionTitle}>{title}</h2><p style={sectionSub}>{sub}</p></div>
}
function Info({ label, value }) {
  return <div style={infoBox}><div style={muted}>{label}</div><div style={{ fontWeight: 800 }}>{value}</div></div>
}
function NoteCard({ title, children }) {
  return <section style={panel}><SectionTitle title={title} sub="Generated from the captured transcript."/><p style={{ lineHeight: 1.7, color: 'var(--t2)' }}>{children}</p></section>
}
function ListCard({ title, items }) {
  const safeItems = Array.isArray(items) ? items : []
  return <section style={panel}><SectionTitle title={title} sub="Review before sharing."/><ul style={{ paddingLeft: 18, lineHeight: 1.7, color: 'var(--t2)' }}>{safeItems.map((item, i) => <li key={i}>{item}</li>)}</ul></section>
}

const page = { flex: 1, overflowY: 'auto', padding: 28 }
const hero = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 18, padding: 26, boxShadow: '0 24px 70px rgba(15,23,42,.12)', marginBottom: 18 }
const eyebrow = { fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.14em' }
const title = { fontFamily: 'var(--ff-display)', fontSize: 32, fontWeight: 800, marginTop: 6 }
const subcopy = { color: 'var(--t3)', lineHeight: 1.6, maxWidth: 720, marginTop: 8 }
const configGrid = { display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(320px,.9fr)', gap: 16 }
const panel = { background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 16, padding: 20, boxShadow: '0 18px 46px rgba(15,23,42,.08)' }
const sectionTitle = { fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 800 }
const sectionSub = { fontSize: 12, color: 'var(--t3)', marginTop: 4, lineHeight: 1.5 }
const label = { display: 'block', fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 7 }
const input = { width: '100%', background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 10, color: 'var(--t1)', padding: '10px 12px', minWidth: 0 }
const platformBadge = (platform) => ({ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--bg2)', border: `1px solid ${platform.color}`, borderRadius: 999, padding: '8px 12px', color: 'var(--t2)', fontWeight: 800 })
const settingsGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }
const infoBox = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, padding: 12 }
const muted = { fontSize: 11, color: 'var(--t3)' }
const warning = { marginTop: 12, background: 'rgba(217,119,6,.1)', border: '1px solid rgba(217,119,6,.25)', color: 'var(--amber)', borderRadius: 10, padding: 12, fontSize: 12 }
const botStatus = { marginTop: 12, background: 'var(--bg2)', border: '1px solid var(--b1)', color: 'var(--t2)', borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 1.5 }
const buttonRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }
const primaryBtn = { border: 'none', padding: '12px 16px', fontWeight: 800, marginTop: 18 }
const secondaryActionBtn = { background: 'var(--bg2)', border: '1px solid var(--b1)', color: 'var(--t2)', padding: '12px 16px', fontWeight: 800, marginTop: 18 }
const secondaryBtn = { background: 'var(--bg2)', border: '1px solid var(--b1)', color: 'var(--t2)', padding: '12px 16px', fontWeight: 800, flex: 1 }
const emptyBox = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, padding: 16, color: 'var(--t3)', textAlign: 'center' }
const recentRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 12, padding: 12 }
const callPage = { flex: 1, display: 'flex', overflow: 'hidden', gap: 16, padding: 16 }
const callMain = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#0b1020', border: '1px solid var(--b1)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 70px rgba(15,23,42,.16)' }
const callHeader = { height: 78, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 22px', borderBottom: '1px solid rgba(255,255,255,.08)' }
const callTitle = { fontFamily: 'var(--ff-display)', color: '#fff', fontSize: 20, fontWeight: 800, marginTop: 4 }
const timerBadge = { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(22,163,74,.12)', border: '1px solid rgba(74,222,128,.35)', color: '#86efac', borderRadius: 999, padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontWeight: 800 }
const liveDot = { width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 12px #ef4444' }
const videoGrid = { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: 18 }
const tile = { position: 'relative', background: 'linear-gradient(145deg,#111827,#020617)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#fff' }
const video = { width: '100%', height: '100%', objectFit: 'cover' }
const cameraOffBox = { width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 24, fontWeight: 'bold' }
const tileLabel = { position: 'absolute', left: 14, bottom: 14, background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 999, padding: '7px 11px', fontSize: 12 }
const aiBadge = { position: 'absolute', left: 14, bottom: 14, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', borderRadius: 999, padding: '7px 11px', fontSize: 12, fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)' }
const controls = { height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderTop: '1px solid rgba(255,255,255,.08)' }
const controlBtn = (active) => ({ background: active ? 'var(--gold)' : 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', color: '#fff', padding: '11px 15px', fontWeight: 800 })
const leaveBtn = { background: '#dc2626', border: 'none', color: '#fff', padding: '11px 18px', fontWeight: 800 }
const side = { width: 390, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }
const sideSection = { background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 16, padding: 16, minHeight: 0 }
const transcriptBox = { height: 390, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }
const lineBox = (ai) => ({ background: ai ? 'var(--gold-light)' : 'var(--bg2)', border: `1px solid ${ai ? 'var(--gold)' : 'var(--b1)'}`, borderRadius: 12, padding: 11, color: 'var(--t2)', lineHeight: 1.5 })
const lineMeta = { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginBottom: 5 }
const smallBtn = { background: 'var(--bg2)', border: '1px solid var(--b1)', color: 'var(--t2)', padding: '10px 12px', fontWeight: 800 }
const taskRow = { display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 10, padding: 10, color: 'var(--t2)', fontSize: 12 }
const postShell = { maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }
