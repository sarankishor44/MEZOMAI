import React, { useState } from 'react'
import { useStore } from '../store'
import AvatarFace from '../components/layout/AvatarFace'
import { phpApi, setBackendUrls } from '../utils/api'


const PRESETS = [
  ['Friendly', 'friendly', (name) => `You are ${name}, a warm and helpful AI assistant. Keep answers clear and practical.`],
  ['Developer', 'developer', (name) => `You are ${name}, a senior software engineer. Explain tradeoffs, find bugs, and produce production-ready code.`],
  ['Coach', 'coach', (name) => `You are ${name}, a focused productivity coach. Ask sharp questions and turn ideas into action.`],
  ['Professional', 'professional', (name) => `You are ${name}, a formal business assistant. Be concise, precise, and operational.`],
]

const AI_KEY_PROVIDERS = new Set(['anthropic', 'openai', 'gemini', 'openrouter', 'deepseek', 'groq', 'mistral', 'xai'])

export default function SettingsPage() {
  const { settings, updateSettings, logout } = useStore()
  const [saving, setSaving] = useState(false)
  const [dbStatus, setDbStatus] = useState('Local settings')
  const voices = typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : []

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data } = await phpApi.get('/settings')
      if (!data?.settings) throw new Error('PHP settings endpoint did not return settings.')
      updateSettings(data.settings)
      setDbStatus('Loaded from DB')
    } catch {
      setDbStatus('Local settings')
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await phpApi.post('/settings', {
        avatar_name: settings.avatarName,
        avatar_style: settings.avatarStyle,
        avatar_gender: settings.avatarGender,
        personality: settings.personality,
        system_prompt: settings.systemPrompt,
        voice_name: settings.voiceName,
        voice_speed: settings.voiceSpeed,
        voice_pitch: settings.voicePitch,
        model: settings.model,
        activeProvider: settings.activeProvider,
      })
      setDbStatus('Saved to DB')
    } catch (e) {
      setDbStatus(e.response?.data?.message || 'DB save failed')
    } finally {
      setSaving(false)
    }
  }

  const testVoice = () => {
    const utter = new SpeechSynthesisUtterance(`Hello, I am ${settings.avatarName}. ${settings.avatarGender === 'male' ? 'Male' : 'Female'} AI agent voice preview is ready.`)
    utter.rate = settings.voiceSpeed
    utter.pitch = settings.voicePitch
    const voice = voices.find(v => v.name === settings.voiceName)
    if (voice) utter.voice = voice
    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  }

  const signOut = async () => {
    logout()
  }

  return (
    <div style={page} className="fade-in">
      <div style={header}>
        <div>
          <div style={eyebrow}>Workspace setup</div>
          <h1 style={title}>Settings</h1>
          <div style={hint}>{dbStatus}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={saveSettings} disabled={saving} className="gold-glow-btn" style={{ ...primaryBtn, marginTop: 0 }}>{saving ? 'Saving...' : 'Save Settings'}</button>
          <button onClick={signOut} style={dangerBtn}>Sign Out</button>
        </div>
      </div>

      <div style={grid}>
        <section style={panel}>
          <SectionTitle title="AI Agent Identity" sub="Choose male or female avatar presentation, name, style, and behavior."/>
          <div style={avatarLayout}>
            <AvatarFace size={148}/>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={label}>Agent Name</label>
              <input value={settings.avatarName} onChange={e => updateSettings({ avatarName: e.target.value })} style={input}/>
              <label style={label}>Avatar Gender</label>
              <div style={segmented}>
                {['female', 'male'].map(gender => (
                  <button key={gender} onClick={() => updateSettings({ avatarGender: gender })} style={segBtn(settings.avatarGender === gender)}>
                    {gender === 'female' ? 'Female Agent' : 'Male Agent'}
                  </button>
                ))}
              </div>
              <label style={label}>Color Style</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['blue','#60a5fa'],['gold','#f8c96b'],['cyan','#22d3ee'],['purple','#a78bfa'],['coral','#fb7185']].map(([name, hex]) => (
                  <button key={name} onClick={() => updateSettings({ avatarStyle: name })} title={name} style={swatch(settings.avatarStyle === name, hex)}/>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={panel}>
          <SectionTitle title="Model and Voice" sub="Select active provider, model and browser TTS voice."/>
          <Row label="Active Provider">
            <select value={settings.activeProvider || 'anthropic'} onChange={e => updateSettings({ activeProvider: e.target.value })} style={select}>
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="openrouter">OpenRouter</option>
              <option value="deepseek">DeepSeek</option>
              <option value="groq">Groq</option>
              <option value="mistral">Mistral</option>
              <option value="xai">xAI</option>
            </select>
          </Row>
          <Row label="Model">
            <select value={settings.model} onChange={e => updateSettings({ model: e.target.value })} style={select}>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="openai/gpt-4o-mini">OpenRouter GPT-4o Mini</option>
              <option value="anthropic/claude-3.5-sonnet">OpenRouter Claude 3.5 Sonnet</option>
              <option value="deepseek-chat">DeepSeek Chat</option>
              <option value="llama-3.1-8b-instant">Groq Llama 3.1 8B</option>
              <option value="mistral-small-latest">Mistral Small</option>
              <option value="grok-2-latest">xAI Grok 2</option>
            </select>
          </Row>
          <Row label="Voice">
            <select value={settings.voiceName} onChange={e => updateSettings({ voiceName: e.target.value })} style={select}>
              <option value="">Browser default</option>
              {voices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
          </Row>
          <Row label={`Speed ${settings.voiceSpeed}x`}>
            <input type="range" min="0.5" max="2" step="0.1" value={settings.voiceSpeed} onChange={e => updateSettings({ voiceSpeed: parseFloat(e.target.value) })} style={range}/>
          </Row>
          <Row label={`Pitch ${settings.voicePitch}`}>
            <input type="range" min="0.5" max="2" step="0.1" value={settings.voicePitch} onChange={e => updateSettings({ voicePitch: parseFloat(e.target.value) })} style={range}/>
          </Row>
          <button onClick={testVoice} className="gold-glow-btn" style={primaryBtn}>Test Voice</button>
        </section>



        <section style={panel}>
          <SectionTitle title="Backend URLs" sub="Configure your remote API endpoints (e.g. Vercel deployment)."/>
          <SecretRow label="Python API (Vercel)" value={settings.pythonApiUrl} onChange={v => { updateSettings({ pythonApiUrl: v }); setBackendUrls({ pythonUrl: v }) }} placeholder="https://mezomai-oao1.vercel.app" />
          <SecretRow label="Meeting Bot API" value={settings.meetingBotUrl} onChange={v => { updateSettings({ meetingBotUrl: v }) }} placeholder="https://mezomai-1iyn.vercel.app" />
        </section>

        <section style={panel}>
          <SectionTitle title="API Keys" sub="Provide keys for the AI providers you want to use. Keys are stored locally."/>
          <SecretRow label="Anthropic Key" value={settings.apiKey} onChange={v => updateSettings({ apiKey: v })} placeholder="sk-ant-..." />
          <SecretRow label="OpenAI Key" value={settings.openAiKey} onChange={v => updateSettings({ openAiKey: v })} placeholder="sk-..." />
          <SecretRow label="Gemini Key" value={settings.geminiKey} onChange={v => updateSettings({ geminiKey: v })} placeholder="AIza..." />
          <SecretRow label="OpenRouter Key" value={settings.openRouterKey} onChange={v => updateSettings({ openRouterKey: v })} placeholder="sk-or-..." />
          <SecretRow label="DeepSeek Key" value={settings.deepSeekKey} onChange={v => updateSettings({ deepSeekKey: v })} placeholder="sk-..." />
          <SecretRow label="Groq Key" value={settings.groqKey} onChange={v => updateSettings({ groqKey: v })} placeholder="gsk_..." />
          <SecretRow label="Mistral Key" value={settings.mistralKey} onChange={v => updateSettings({ mistralKey: v })} placeholder="..." />
          <SecretRow label="xAI Key" value={settings.xAiKey} onChange={v => updateSettings({ xAiKey: v })} placeholder="xai-..." />
        </section>

        <section style={panel}>
          <SectionTitle title="Personality and Data" sub="Prompt presets and local app data controls."/>
          <label style={label}>System Prompt</label>
          <textarea value={settings.systemPrompt} onChange={e => updateSettings({ systemPrompt: e.target.value })} rows={5} style={{ ...input, resize: 'vertical', width: '100%' }}/>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {PRESETS.map(([labelText, personality, makePrompt]) => (
              <button key={personality} onClick={() => updateSettings({ personality, systemPrompt: makePrompt(settings.avatarName) })} style={presetBtn(settings.personality === personality)}>
                {labelText}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={() => exportData()} style={smallBtn}>Export JSON</button>
            <button onClick={() => { if (confirm('Clear chat history?')) useStore.getState().clearHistory() }} style={smallBtn}>Clear Chat</button>
          </div>
        </section>
      </div>
    </div>
  )
}

function exportData() {
  const d = { settings: useStore.getState().settings, messages: useStore.getState().messages }
  const a = document.createElement('a')
  a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(d, null, 2))
  a.download = 'mezomai-data.json'
  a.click()
}

function SectionTitle({ title, sub }) {
  return <div style={{ marginBottom: 16 }}><h2 style={sectionTitle}>{title}</h2><p style={sectionSub}>{sub}</p></div>
}

function Row({ label, children }) {
  return <div style={row}><div style={{ fontWeight: 800, color: 'var(--t2)' }}>{label}</div>{children}</div>
}

function SecretRow({ label, value, onChange, placeholder }) {
  return (
    <Row label={label}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type="password" autoComplete="off" style={{ ...input, width: '100%' }}/>
    </Row>
  )
}



const page = { flex: 1, overflowY: 'auto', padding: 28 }
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }
const eyebrow = { fontFamily: 'var(--ff-mono)', color: 'var(--gold)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase' }
const title = { fontFamily: 'var(--ff-display)', fontSize: 30, fontWeight: 800 }
const grid = { display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(320px,.75fr)', gap: 16, maxWidth: 1180 }
const panel = { background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 16, padding: 20, boxShadow: '0 18px 45px rgba(15,23,42,.08)' }
const sectionTitle = { fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 800 }
const sectionSub = { color: 'var(--t3)', fontSize: 12, marginTop: 4, lineHeight: 1.5 }
const hint = { color: 'var(--t3)', fontSize: 11, marginTop: 3 }
const hintBox = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 9, color: 'var(--t3)', fontSize: 12, lineHeight: 1.5, padding: 12, marginTop: 12 }
const input = { background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 9, padding: '10px 12px', color: 'var(--t1)', minWidth: 0 }
const smallBtn = { background: 'var(--bg2)', border: '1px solid var(--b1)', color: 'var(--t2)', padding: '9px 10px', fontSize: 12, fontWeight: 800 }
const dangerBtn = { background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.25)', color: 'var(--red)', padding: '10px 14px', fontWeight: 800 }
const avatarLayout = { display: 'flex', gap: 22, alignItems: 'center' }
const label = { fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '.1em', textTransform: 'uppercase' }
const segmented = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 10, padding: 4 }
const segBtn = (active) => ({ border: 'none', background: active ? 'var(--gold)' : 'transparent', color: active ? '#fff' : 'var(--t2)', padding: '9px 8px', fontWeight: 800 })
const swatch = (active, hex) => ({ width: 32, height: 32, borderRadius: '50%', background: hex, border: active ? '3px solid var(--t1)' : '3px solid transparent', boxShadow: active ? `0 0 0 3px ${hex}44` : 'none' })
const row = { display: 'grid', gridTemplateColumns: '160px minmax(0,1fr)', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--b1)' }
const select = { width: '100%', background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 9, padding: '9px 12px', color: 'var(--t1)' }
const range = { width: '100%', accentColor: 'var(--gold)' }
const primaryBtn = { border: 'none', padding: '11px 14px', marginTop: 14, fontWeight: 800 }
const presetBtn = (active) => ({ background: active ? 'var(--gold-light)' : 'var(--bg2)', border: `1px solid ${active ? 'var(--gold)' : 'var(--b1)'}`, color: active ? 'var(--gold)' : 'var(--t2)', padding: '8px 12px', fontWeight: 800 })
