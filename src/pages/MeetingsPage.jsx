import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'

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
    saveRecentMeeting,
  } = useStore()

  // Local state
  const [roomIdInput, setRoomIdInput] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [inCallDuration, setInCallDuration] = useState(0)
  const [simulatedSpeakers, setSimulatedSpeakers] = useState([])
  
  const timerRef = useRef(null)
  const transcriptEndRef = useRef(null)
  
  // Daily.co URL or simulated Room URL
  const roomUrl = activeRoom ? `https://mezomai.daily.co/${activeRoom}` : ''

  // Format seconds
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Join call handler
  const handleJoinCall = (e) => {
    e?.preventDefault()
    const finalRoom = roomIdInput.trim() || 'mezomai-general-room'
    
    // Clear previous call states
    useStore.setState({ 
      activeRoom: finalRoom,
      transcript: [],
      meetingNotes: null 
    })
    setInCallDuration(0)
    setMeetingState('incall')
  }

  // Effect to manage duration timer and mock dialogue during call
  useEffect(() => {
    if (meetingState === 'incall') {
      timerRef.current = setInterval(() => {
        setInCallDuration((prev) => prev + 1)
      }, 1000)

      // Seed initial transcript line
      addTranscriptLine({
        speaker: 'System',
        text: `Secure WebRTC Connection established in room: "${activeRoom}"`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })

      // Set up dialogue scripts that fire periodically to simulate a live meeting transcript
      const dialogues = [
        { delay: 3, speaker: 'User', text: "Hello! Can you hear me clearly? I'm testing the audio and camera settings." },
        { delay: 8, speaker: 'bot', text: `Hi there! Yes, I hear you loud and clear. My name is ${settings.avatarName}. I've joined your meeting room and I am currently transcribing this discussion in real-time.` },
        { delay: 15, speaker: 'User', text: "Fantastic. Let's outline the agenda for the next MEZOMAI release. We need to ship the frontend on Vercel, link up the API fallbacks, and complete the Docker Compose setup." },
        { delay: 22, speaker: 'bot', text: "Understood. I will note down that the critical objectives are: 1. Deploy the React SPA to Vercel, 2. Validate API key storage fallback, and 3. Verify Docker orchestration packages." },
        { delay: 30, speaker: 'User', text: "Perfect. We also need to list all component counts to make sure we didn't miss anything. Let's make sure the client metrics show up correctly in the analytics page too." },
        { delay: 37, speaker: 'bot', text: "Got it. I'll make sure to add component tracking and analytics updates to the action items list in our meeting summary." }
      ]

      const timeouts = dialogues.map((d) => {
        return setTimeout(() => {
          addTranscriptLine({
            speaker: d.speaker === 'bot' ? settings.avatarName : 'You',
            text: d.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          })
          // Trigger avatar talking or listening states
          if (d.speaker === 'bot') {
            useStore.setState({ avatarState: 'talking' })
            setTimeout(() => useStore.setState({ avatarState: 'idle' }), 3500)
          } else {
            useStore.setState({ avatarState: 'listening' })
            setTimeout(() => useStore.setState({ avatarState: 'idle' }), 2000)
          }
        }, d.delay * 1000)
      })

      return () => {
        clearInterval(timerRef.current)
        timeouts.forEach(clearTimeout)
      }
    }
  }, [meetingState, activeRoom])

  // Scroll transcript to bottom on update
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Leave Call and Generate Summary
  const handleLeaveCall = () => {
    clearInterval(timerRef.current)
    setMeetingState('postcall')
    
    // Save meeting to history list
    const finishedMeeting = {
      id: Date.now().toString(),
      roomName: activeRoom,
      duration: formatTime(inCallDuration),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      transcriptLength: transcript.length,
    }
    saveRecentMeeting(finishedMeeting)

    // Simulate Claude generating summary & action items
    setMeetingNotes({
      summary: `In this session, the operator and ${settings.avatarName} established a WebRTC meeting room to review the launch requirements for the MEZOMAI AI Character Platform. The discussion focused on SPA deployment settings, local emulator support, component tracking metrics, and Docker configurations.`,
      keyPoints: [
        "Verified low-latency WebRTC streams using native browser audio-capture APIs.",
        `Configured ${settings.avatarName} as an active participant to transcribe audio inputs and speak outputs.`,
        "Discussed hosting the React static app on Vercel with direct client-side fallback triggers.",
      ],
      actionItems: [
        "Deploy React frontend directory to Vercel via vercel.json overrides.",
        "Ensure local settings support entering Claude API keys for direct browser-to-Anthropic connections.",
        "Compile docker-compose file configuration containing the 6 primary core services.",
        "Push finished codebase to the sarankishor44/MEZOMAI remote repository."
      ]
    })
  }

  // Download Notes helper
  const handleDownloadNotes = () => {
    if (!meetingNotes) return
    const text = `
=============================================
MEZOMAI MEETING SUMMARY & NOTES
Room: ${activeRoom}
Date: ${new Date().toLocaleDateString()}
Duration: ${formatTime(inCallDuration)}
=============================================

SUMMARY:
${meetingNotes.summary}

KEY POINTS:
${meetingNotes.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

ACTION ITEMS:
${meetingNotes.actionItems.map((a, i) => `- [ ] ${a}`).join('\n')}
    `
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-notes-${activeRoom}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // RENDER CONFIGURATION VIEW
  if (meetingState === 'configure') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="fade-in">
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--ff)', fontSize: 24, color: 'var(--gold)', fontWeight: 800, marginBottom: 6 }}>Video Meetings</h1>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
              Start an instant WebRTC conference room. Your custom AI Character ({settings.avatarName}) will join as an active participant to transcribe your call, converse dynamically, and export meeting notes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
            {/* Form Column */}
            <form onSubmit={handleJoinCall} style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontFamily: 'var(--ff)', fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--b1)', paddingBottom: 10 }}>Room Settings</div>
              
              <div>
                <label style={labelStyle}>Room ID / Meeting Link</label>
                <input 
                  placeholder="e.g. daily-development-scrum" 
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  style={{ width: '100%', marginTop: 6 }}
                />
              </div>

              <div style={{ background: 'var(--bg1)', padding: 14, borderRadius: 10, fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>
                ✨ <strong>Instant Platform Detection</strong>: Paste a Daily.co, Zoom, Teams, or Google Meet URL to pre-load configuration settings dynamically.
              </div>

              <button type="submit" className="gold-glow-btn" style={{ padding: '12px', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', marginTop: 10 }}>
                🚀 Join Room & Launch Avatar
              </button>
            </form>

            {/* Preview Column */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontFamily: 'var(--ff)', fontSize: 12, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Bot Companion Preview</div>
              
              <div style={{ width: 140, height: 140, background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--gold-glow)' }}>
                <AvatarFace size={110} showGlow />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--ff)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{settings.avatarName}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'capitalize', marginTop: 2 }}>{settings.personality} Agent • {settings.voiceName} Voice</div>
              </div>
            </div>
          </div>

          {/* History */}
          {recentMeetings.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontFamily: 'var(--ff)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Recent Room Logs</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentMeetings.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 16px', fontSize: 12 }}>
                    <div>
                      <strong style={{ color: 'var(--gold)' }}>{m.roomName}</strong>
                      <span style={{ color: 'var(--t3)', marginLeft: 8 }}>({m.date})</span>
                    </div>
                    <div style={{ color: 'var(--t2)' }}>
                      <span>⏱ {m.duration}</span>
                      <span style={{ marginLeft: 12 }}>💬 {m.transcriptLength} lines</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // RENDER IN CALL VIEW
  if (meetingState === 'incall') {
    return (
      <div style={{ flex: 1, display: 'flex', height: '100%' }} className="fade-in">
        {/* Main call grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#080603', position: 'relative' }}>
          {/* Header info */}
          <div style={{ padding: '16px 24px', display: 'flex', justifyItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--b1)', background: 'var(--bg1)' }}>
            <div>
              <span style={{ fontFamily: 'var(--ff)', fontWeight: 800, fontSize: 16, color: 'var(--gold)' }}>Room: {activeRoom}</span>
              <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 10 }}>• Encrypted Live Session</span>
            </div>
            <div style={{ fontFamily: 'var(--fm)', color: 'var(--green)', background: 'rgba(0, 230, 118, 0.1)', padding: '4px 10px', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}/>
              {formatTime(inCallDuration)}
            </div>
          </div>

          {/* Videos Grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 24, contentVisibility: 'auto' }}>
            {/* User stream */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 16, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isVideoOff ? (
                <div style={{ fontSize: 13, color: 'var(--t3)' }}>🎥 Camera Off</div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    👤
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 600 }}>Local Host (You)</div>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 6, fontSize: 11, color: '#fff' }}>
                {isMuted ? '🔇 Muted' : '🎙️ Microphone Active'}
              </div>
            </div>

            {/* AI Agent Stream */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 16, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 150, height: 150, background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--gold-glow)' }}>
                <AvatarFace size={120} showGlow />
              </div>
              <div style={{ fontFamily: 'var(--ff)', fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>
                {settings.avatarName} (AI Companion)
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 6, fontSize: 11, color: '#fff' }}>
                🔊 Speaker Mode Active
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: 12, borderTop: '1px solid var(--b1)', background: 'var(--bg1)' }}>
            <button onClick={() => setIsMuted(!isMuted)} style={{ background: isMuted ? 'var(--red)' : 'var(--bg3)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 18px', color: isMuted ? '#fff' : 'var(--t1)', fontSize: 12 }}>
              {isMuted ? '🎙️ Unmute' : '🔇 Mute'}
            </button>
            <button onClick={() => setIsVideoOff(!isVideoOff)} style={{ background: isVideoOff ? 'var(--red)' : 'var(--bg3)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 18px', color: isVideoOff ? '#fff' : 'var(--t1)', fontSize: 12 }}>
              {isVideoOff ? '📹 Video On' : '🚫 Stop Video'}
            </button>
            <button onClick={handleLeaveCall} style={{ background: 'var(--red)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: 12, fontWeight: 700 }}>
              🔴 Leave Meeting
            </button>
          </div>
        </div>

        {/* Sidebar Transcript */}
        <div style={{ width: 360, borderLeft: '1px solid var(--b1)', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)' }}>
            <div style={{ fontFamily: 'var(--ff)', fontSize: 13, fontWeight: 800, color: 'var(--gold)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Live Transcription</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {transcript.map((line, i) => (
              <div key={i} style={{ background: line.speaker === 'System' ? 'transparent' : 'var(--bg1)', border: line.speaker === 'System' ? 'none' : '1px solid var(--b1)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10 }}>
                  <strong style={{ color: line.speaker === 'System' ? 'var(--t3)' : line.speaker === 'You' ? 'var(--t1)' : 'var(--gold)' }}>
                    {line.speaker}
                  </strong>
                  <span style={{ color: 'var(--t3)' }}>{line.time}</span>
                </div>
                <div style={{ fontSize: 12, color: line.speaker === 'System' ? 'var(--t3)' : 'var(--t2)', fontStyle: line.speaker === 'System' ? 'italic' : 'normal', lineHeight: 1.4 }}>
                  {line.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>
    )
  }

  // RENDER POST CALL VIEW
  if (meetingState === 'postcall') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="fade-in">
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <h1 style={{ fontFamily: 'var(--ff)', fontSize: 24, fontWeight: 800, color: 'var(--gold)' }}>Meeting Notes Generated</h1>
            <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Call room: {activeRoom} • Duration: {formatTime(inCallDuration)}</p>
          </div>

          {meetingNotes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 14, padding: 20 }}>
                <div style={sectionTitleStyle}>Executive Summary</div>
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{meetingNotes.summary}</p>
              </div>

              {/* Key points */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 14, padding: 20 }}>
                <div style={sectionTitleStyle}>Key Points Discussed</div>
                <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {meetingNotes.keyPoints.map((item, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 14, padding: 20 }}>
                <div style={sectionTitleStyle}>Action Items</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {meetingNotes.actionItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <input type="checkbox" style={{ marginTop: 3, accentColor: 'var(--gold)' }} defaultChecked={false} />
                      <span style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button onClick={handleDownloadNotes} className="gold-glow-btn" style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>
                  📥 Download Notes (.txt)
                </button>
                <button onClick={() => setMeetingState('configure')} style={{ flex: 1, padding: '12px 0', background: 'var(--bg3)', border: '1px solid var(--b1)', borderRadius: 10, fontSize: 13, color: 'var(--t1)', cursor: 'pointer' }}>
                  🔄 Start New Meeting
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)' }}>
              🤖 Synthesizing notes with Claude... Please wait.
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

const labelStyle = {
  fontFamily: 'var(--fm)',
  fontSize: 10,
  color: 'var(--t3)',
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  display: 'block',
}

const sectionTitleStyle = {
  fontFamily: 'var(--ff)',
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--gold)',
  marginBottom: 12,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
}
