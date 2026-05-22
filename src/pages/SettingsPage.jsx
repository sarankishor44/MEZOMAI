import React, { useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'

export default function SettingsPage() {
  const { settings, updateSettings, logout } = useStore()
  const [showKey, setShowKey] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const testKey = async () => {
    if (!settings.apiKey) return
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': settings.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: settings.model, max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] })
      })
      const data = await res.json()
      setTestResult(data.error ? { ok: false, msg: data.error.message } : { ok: true, msg: `✓ Connected — ${settings.model}` })
    } catch (e) {
      setTestResult({ ok: false, msg: e.message })
    } finally { setTesting(false) }
  }

  const testVoice = () => {
    const utter = new SpeechSynthesisUtterance(`Hello, I am ${settings.avatarName}. Voice output is working correctly.`)
    utter.rate = settings.voiceSpeed; utter.pitch = settings.voicePitch
    if (settings.voiceName) {
      const v = speechSynthesis.getVoices().find(v => v.name === settings.voiceName)
      if (v) utter.voice = v
    }
    speechSynthesis.speak(utter)
  }

  const voices = typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : []

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }} className="fade-in">
      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: 'var(--ff)', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Settings</div>

        {/* API Key */}
        <Section title="🔑 API Key" icon>
          <Row label="Anthropic API Key" sub="Your key is stored locally and never sent to our servers">
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              <div style={{ flex: 1, background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 8, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, height: 38 }}>
                <input type={showKey ? 'text' : 'password'} value={settings.apiKey} onChange={e => updateSettings({ apiKey: e.target.value })}
                  placeholder="sk-ant-api03-..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--t1)', letterSpacing: showKey ? 0 : '.1em' }}/>
                <button onClick={() => setShowKey(s => !s)} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 13 }}>{showKey ? '🙈' : '👁'}</button>
              </div>
              <button onClick={testKey} disabled={testing || !settings.apiKey} style={{ background: 'rgba(0,230,118,.1)', border: '1px solid rgba(0,230,118,.2)', borderRadius: 8, padding: '0 16px', fontFamily: 'var(--ff)', fontSize: 12, fontWeight: 600, color: 'var(--green)', whiteSpace: 'nowrap', opacity: (!settings.apiKey || testing) ? .5 : 1 }}>
                {testing ? 'Testing…' : 'Test Key'}
              </button>
            </div>
          </Row>
          {testResult && (
            <div style={{ margin: '0 20px 14px', padding: '10px 14px', background: testResult.ok ? 'rgba(0,230,118,.08)' : 'rgba(255,71,87,.08)', border: `1px solid ${testResult.ok ? 'rgba(0,230,118,.2)' : 'rgba(255,71,87,.2)'}`, borderRadius: 8, fontFamily: 'var(--fm)', fontSize: 11, color: testResult.ok ? 'var(--green)' : 'var(--red)' }}>
              {testResult.msg}
            </div>
          )}
        </Section>

        {/* Model */}
        <Section title="🧠 AI Model">
          <Row label="Model" sub="Affects response quality and cost">
            <select value={settings.model} onChange={e => updateSettings({ model: e.target.value })} style={selectStyle}>
              <option value="claude-opus-4-20250514">Claude Opus 4 — Most powerful</option>
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4 — Balanced</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 — Fastest</option>
            </select>
          </Row>
        </Section>

        {/* Voice */}
        <Section title="🔊 Voice">
          <Row label="Voice" sub="Browser text-to-speech voice">
            <select value={settings.voiceName} onChange={e => updateSettings({ voiceName: e.target.value })} style={selectStyle}>
              <option value="">Default</option>
              {voices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
          </Row>
          <Row label="Speed" sub={`${settings.voiceSpeed}x`}>
            <input type="range" min="0.5" max="2" step="0.1" value={settings.voiceSpeed} onChange={e => updateSettings({ voiceSpeed: parseFloat(e.target.value) })} style={rangeStyle}/>
          </Row>
          <Row label="Pitch" sub={`${settings.voicePitch}`}>
            <input type="range" min="0.5" max="2" step="0.1" value={settings.voicePitch} onChange={e => updateSettings({ voicePitch: parseFloat(e.target.value) })} style={rangeStyle}/>
          </Row>
          <div style={{ padding: '8px 20px 16px' }}>
            <button onClick={testVoice} style={{ background: 'var(--bg3)', border: '1px solid var(--b1)', borderRadius: 8, padding: '9px 18px', fontFamily: 'var(--ff)', fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>🔊 Test Voice</button>
          </div>
        </Section>

        {/* Avatar */}
        <Section title="🤖 Avatar">
          <div style={{ padding: '16px 20px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <AvatarFace size={90} showGlow/>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelSt}>Name</label>
                <input value={settings.avatarName} onChange={e => updateSettings({ avatarName: e.target.value })} style={{ ...inputStyle, width: '100%' }}/>
              </div>
              <div>
                <label style={labelSt}>Color Style</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {[['cyan','#00d4ff'],['purple','#c084fc'],['coral','#f87171']].map(([name, hex]) => (
                    <button key={name} onClick={() => updateSettings({ avatarStyle: name })} style={{ width: 28, height: 28, borderRadius: '50%', background: hex, border: settings.avatarStyle === name ? `3px solid white` : '3px solid transparent', cursor: 'pointer', boxShadow: settings.avatarStyle === name ? `0 0 10px ${hex}` : 'none' }}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Personality */}
        <Section title="💬 Personality">
          <div style={{ padding: 16 }}>
            <label style={labelSt}>System Prompt</label>
            <textarea value={settings.systemPrompt} onChange={e => updateSettings({ systemPrompt: e.target.value })} rows={4}
              style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: 12 }}/>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                ['Friendly', `You are ${settings.avatarName}, a warm and helpful AI assistant.`],
                ['Developer', `You are ${settings.avatarName}, an expert software engineer and technical assistant.`],
                ['Coach', `You are ${settings.avatarName}, a motivational life and productivity coach.`],
                ['Professional', `You are ${settings.avatarName}, a formal and precise professional assistant.`],
              ].map(([label, prompt]) => (
                <button key={label} onClick={() => updateSettings({ systemPrompt: prompt, personality: label.toLowerCase() })}
                  style={{ background: settings.personality === label.toLowerCase() ? 'var(--cyang)' : 'var(--bg3)', border: `1px solid ${settings.personality === label.toLowerCase() ? 'var(--cyan)' : 'var(--b1)'}`, borderRadius: 7, padding: '6px 14px', fontFamily: 'var(--ff)', fontSize: 12, fontWeight: 600, color: settings.personality === label.toLowerCase() ? 'var(--cyan)' : 'var(--t2)', cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Data */}
        <Section title="🗂 Data">
          <Row label="Export All Data" sub="Download your chat history and settings as JSON">
            <button onClick={() => { const d = { settings: useStore.getState().settings, messages: useStore.getState().messages }; const a = document.createElement('a'); a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(d,null,2)); a.download = 'aria-data.json'; a.click() }} style={outlineBtn}>Export JSON</button>
          </Row>
          <Row label="Clear Chat History" sub="Delete all messages (cannot be undone)">
            <button onClick={() => { if (confirm('Clear all chat history?')) useStore.setState({ messages: [], sessions: [] }) }} style={{ ...outlineBtn, color: 'var(--amber)', borderColor: 'rgba(255,179,0,.3)' }}>Clear History</button>
          </Row>
          <Row label="Sign Out" sub="Log out of your account">
            <button onClick={logout} style={{ ...outlineBtn, color: 'var(--red)', borderColor: 'rgba(255,71,87,.3)' }}>Sign Out</button>
          </Row>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--ff)', fontSize: 14, fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, sub, children }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--t2)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

const selectStyle = { background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--t1)', outline: 'none', minWidth: 200 }
const rangeStyle = { width: 140, accentColor: 'var(--cyan)' }
const inputStyle = { background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--t1)', outline: 'none', fontFamily: 'var(--fb)' }
const labelSt = { fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }
const outlineBtn = { background: 'var(--bg3)', border: '1px solid var(--b1)', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--ff)', fontSize: 12, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer', whiteSpace: 'nowrap' }
