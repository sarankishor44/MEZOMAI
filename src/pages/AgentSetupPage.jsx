import React, { useState } from 'react'

const STYLE_COLORS = {
  cyan: '#22d3ee',
  purple: '#a78bfa',
  coral: '#fb7185',
  gold: '#f8c96b',
  blue: '#60a5fa',
}

export default function AgentSetupPage() {
  const [step, setStep] = useState(1)
  const [agentData, setAgentData] = useState({
    name: '',
    image: null,
    voiceSample: null,
    vibe: '',
    aspirations: '',
    skills: {
      videoChat: true,
      stickerGen: false,
      capsuleWardrobe: false,
      pptSkill: false
    },
    connections: {
      telegram: false,
      slack: false,
      googleSuite: false,
      instagram: false,
      whatsapp: false,
      github: false
    }
  })

  const handleNext = () => setStep(s => Math.min(s + 1, 4))
  const handlePrev = () => setStep(s => Math.max(s - 1, 1))

  const toggleSkill = (skill) => {
    setAgentData(prev => ({
      ...prev,
      skills: { ...prev.skills, [skill]: !prev.skills[skill] }
    }))
  }

  const toggleConnection = (conn) => {
    setAgentData(prev => ({
      ...prev,
      connections: { ...prev.connections, [conn]: !prev.connections[conn] }
    }))
  }

  const handleGenerate = async () => {
    alert("Generating AI Agent via our PHP API...");
    // Future integration with PHP backend
  }

  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', fontStyle: 'italic', background: 'linear-gradient(to right, #c084fc, #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          CREATE YOUR AI SELF AGENT
        </h1>
        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Step-by-step guide to building your custom digital representative.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{ flex: 1, height: '4px', background: s <= step ? '#a855f7' : '#374151', borderRadius: '2px', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2rem' }}>
        {step === 1 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: STYLE_COLORS.purple }}>Step 01: Establish Visual Identity</h2>
            <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Provide an image of yourself or take a selfie. This data helps form the basis of your digital representative.</p>
            <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '16px', padding: '3rem', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
              <p style={{ fontWeight: 'bold' }}>Click to upload selfie</p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>JPG, PNG up to 10MB</p>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Agent Name</label>
              <input 
                value={agentData.name}
                onChange={e => setAgentData({...agentData, name: e.target.value})}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }}
                placeholder="Name your agent..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: STYLE_COLORS.purple }}>Step 02: Voice Training</h2>
            <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Record your speech by reading the text presented below. The system captures your vocal patterns.</p>
            <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <p style={{ fontStyle: 'italic', color: '#d1d5db', lineHeight: '1.6' }}>
                "Hello! I am creating my digital self to assist with meetings, tasks, and communications. I am excited to see how AI can transform my workflow."
              </p>
            </div>
            <button style={{ width: '100%', background: '#ef4444', color: '#fff', border: 'none', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#fff', borderRadius: '50%' }} /> Start Recording
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: STYLE_COLORS.purple }}>Step 03: Define Vibe and Aspirations</h2>
            <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Describe who you want to be. Share likes, dislikes, and your future goals.</p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Vibe / Personality</label>
              <textarea 
                rows={3}
                value={agentData.vibe}
                onChange={e => setAgentData({...agentData, vibe: e.target.value})}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
                placeholder="e.g., Professional, witty, and highly organized..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Aspirations & Goals</label>
              <textarea 
                rows={3}
                value={agentData.aspirations}
                onChange={e => setAgentData({...agentData, aspirations: e.target.value})}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
                placeholder="What should your digital self aim to achieve?"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: STYLE_COLORS.purple }}>Step 04: Skills & Connections</h2>
            <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Equip your agent with capabilities and connect them to external platforms.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#e5e7eb' }}>Community Skills</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries({ videoChat: 'Real-Time Video Chat', stickerGen: 'Sticker Gen', capsuleWardrobe: 'Capsule Wardrobe', pptSkill: 'PPT Skill' }).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                      <span>{label}</span>
                      <input type="checkbox" checked={agentData.skills[key]} onChange={() => toggleSkill(key)} />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#e5e7eb' }}>External Connections</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {Object.entries({ telegram: 'Telegram', slack: 'Slack', googleSuite: 'Google Suite', instagram: 'Instagram', whatsapp: 'WhatsApp', github: 'GitHub' }).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                      <span style={{ fontSize: '0.875rem' }}>{label}</span>
                      <input type="checkbox" checked={agentData.connections[key]} onChange={() => toggleConnection(key)} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'linear-gradient(to right, rgba(168,85,247,0.1), rgba(0,0,0,0))', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '12px' }}>
              <h3 style={{ fontWeight: 'bold', color: '#c084fc', marginBottom: '0.5rem' }}>Ready to Generate</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>Clicking generate will finalize your digital avatar and begin cloning your voice profile using our custom AI backend.</p>
              <button onClick={handleGenerate} style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '99px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
                Generate Custom Agent
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button 
          onClick={handlePrev} 
          style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0.5 : 1 }}
          disabled={step === 1}
        >
          Previous
        </button>
        {step < 4 && (
          <button 
            onClick={handleNext} 
            style={{ padding: '0.75rem 1.5rem', background: '#fff', border: 'none', color: '#000', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  )
}
