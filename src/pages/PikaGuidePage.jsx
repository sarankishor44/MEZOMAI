import React from 'react';

export default function PikaGuidePage() {
  return (
    <div className="fade-in" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Documentation</div>
          <h1 style={titleStyle}>Creating Your Pika AI Self Agent</h1>
          <p style={subtitleStyle}>Step-by-step guide to building your digital representative on Pika.me and earning through AI interaction.</p>
        </div>
      </header>

      <div style={contentGrid}>
        <section style={panelStyle}>
          <h2 style={sectionTitle}>Account & Identity Setup</h2>
          
          <div style={stepCard}>
            <div style={stepNumber}>01</div>
            <div>
              <h3>Access and Account Setup</h3>
              <p>Visit Pika.me and select the "Start on web" option. You can create a new account or log in if you already have one. This is the starting point for your digital presence.</p>
            </div>
          </div>
          
          <div style={stepCard}>
            <div style={stepNumber}>02</div>
            <div>
              <h3>Establish Visual Identity</h3>
              <p>After logging in, provide an image of yourself by uploading a file or taking a selfie on the site. This data helps form the basis of your digital representative.</p>
            </div>
          </div>

          <div style={stepCard}>
            <div style={stepNumber}>03</div>
            <div>
              <h3>Voice Training</h3>
              <p>Record your speech by reading the text presented on the screen. The system captures your vocal patterns to ensure your Pika agent speaks in your unique tone.</p>
            </div>
          </div>

          <div style={stepCard}>
            <div style={stepNumber}>04</div>
            <div>
              <h3>Define Vibe and Aspirations</h3>
              <p>Describe who you want to be. Share likes, dislikes, and your future goals. This information shapes the character and behavior of your agent.</p>
              <p style={hintStyle}>Optional: Add up to 10 photos to show your style or connect social profiles like LinkedIn and Instagram.</p>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>Capabilities & Connections</h2>
          <p>Once you submit your data, the system begins building your Pika AI Agent. When finished, you can message and chat with your digital self directly.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
            <div style={subPanel}>
              <h4 style={subPanelTitle}>Pika Skills</h4>
              <ul style={listStyle}>
                <li>Community Skills</li>
                <li>Real-Time Video Chat</li>
                <li>Google Meet Integration</li>
                <li>Sticker Gen & Animated Expressions</li>
                <li>Capsule Wardrobe & Store Management</li>
                <li>PPT Skill & Presentation Editing</li>
              </ul>
            </div>
            <div style={subPanel}>
              <h4 style={subPanelTitle}>External Connections</h4>
              <ul style={listStyle}>
                <li>Telegram</li>
                <li>Slack</li>
                <li>Google Suite</li>
                <li>Instagram</li>
                <li>WhatsApp</li>
                <li>GitHub</li>
              </ul>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>Monetizing Your Agent</h2>
          <p>You can generate income by sharing your profile. When others interact with your agent, you earn credits. This applies to standard chat sessions, skill usage, or when people request images from your digital representative.</p>
          
          <div style={calloutBox}>
            <strong>Interaction Credits:</strong> Earn from every chat session.<br/>
            <strong>Skill Usage:</strong> Income from specialized actions.<br/>
            Check your stats in the wallet area. Whether your agent acts as a business coach or an influencer, every engagement contributes to your earnings.
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>The Technology Behind Real-Time Interaction</h2>
          
          <h3 style={subHeader}>Dynamic Digital Avatars</h3>
          <p style={paragraph}>The most visible component of PikaStream AI is the digital avatar system. Unlike standard meeting participants who appear as static icons or basic video feeds, PikaStream AI renders a live, animated presence. This avatar is not a pre-recorded loop. It is a dynamic entity that responds to the audio input of the agent.</p>
          <p style={paragraph}>The avatar can be generated on demand using advanced image models. By providing a simple text description, users can create a professional representative that matches the tone of the meeting. This visual presence is crucial for building trust in professional settings.</p>

          <h3 style={subHeader}>Personalized Voice Profiles</h3>
          <p style={paragraph}>PikaStream AI includes a sophisticated voice cloning system that allows the AI agent to speak with a personalized voice. By processing a short audio sample, the system creates a digital voice profile that captures the unique characteristics of a specific person.</p>

          <h3 style={subHeader}>Memory and Personality Preservation</h3>
          <p style={paragraph}>When your agent joins a call, it carries the context of your previous work. It knows who the participants are if they have met before. It understands the history of the project and the specific priorities you have established.</p>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>Technical Command Reference</h2>
          
          <div style={codeBlock}>
            <div style={codeComment}># Joining a Meeting</div>
            <code>python scripts/pikastreaming_videomeeting.py join --meet-url [URL] --bot-name [Name] --image [Path]</code>
          </div>

          <div style={codeBlock}>
            <div style={codeComment}># Leaving a Meeting</div>
            <code>python scripts/pikastreaming_videomeeting.py leave --session-id [ID]</code>
          </div>

          <div style={codeBlock}>
            <div style={codeComment}># Generating an Avatar</div>
            <code>python scripts/pikastreaming_videomeeting.py generate-avatar --output [Path] --prompt [Desc]</code>
          </div>

          <div style={codeBlock}>
            <div style={codeComment}># Cloning a Voice</div>
            <code>python scripts/pikastreaming_videomeeting.py clone-voice --audio [File] --name [ProfileName]</code>
          </div>
        </section>
      </div>
    </div>
  );
}

// Styling Constants
const pageStyle = { flex: 1, overflowY: 'auto', padding: '32px', maxWidth: '1200px', margin: '0 auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' };
const eyebrowStyle = { fontFamily: 'var(--ff-mono)', color: 'var(--gold)', fontSize: '11px', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '8px' };
const titleStyle = { fontFamily: 'var(--ff-display)', fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0' };
const subtitleStyle = { color: 'var(--t3)', fontSize: '15px', maxWidth: '600px', lineHeight: 1.5 };

const contentGrid = { display: 'grid', gridTemplateColumns: '1fr', gap: '24px' };
const panelStyle = { background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: '16px', padding: '28px', boxShadow: '0 12px 30px rgba(0,0,0,.15)' };
const sectionTitle = { fontFamily: 'var(--ff-display)', fontSize: '22px', fontWeight: 800, marginBottom: '20px', color: 'var(--t1)', borderBottom: '1px solid var(--b1)', paddingBottom: '12px' };

const stepCard = { display: 'flex', gap: '16px', marginBottom: '20px', background: 'var(--bg2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--b1)' };
const stepNumber = { fontSize: '24px', fontWeight: 900, color: 'var(--gold)', opacity: 0.8, fontFamily: 'var(--ff-mono)' };
const hintStyle = { fontSize: '12px', color: 'var(--t3)', marginTop: '8px', fontStyle: 'italic' };

const subPanel = { background: 'var(--bg2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--b1)' };
const subPanelTitle = { fontSize: '14px', fontWeight: 800, marginBottom: '12px', color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.05em' };
const listStyle = { listStyleType: 'disc', paddingLeft: '20px', color: 'var(--t2)', lineHeight: 1.6, fontSize: '14px' };

const calloutBox = { background: 'rgba(248,201,107,.1)', border: '1px solid rgba(248,201,107,.2)', borderRadius: '12px', padding: '16px', color: 'var(--gold)', fontSize: '14px', lineHeight: 1.6 };

const subHeader = { fontSize: '16px', fontWeight: 800, marginTop: '24px', marginBottom: '8px', color: 'var(--t1)' };
const paragraph = { fontSize: '14px', color: 'var(--t2)', lineHeight: 1.7, marginBottom: '16px' };

const codeBlock = { background: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '12px', fontFamily: 'monospace', fontSize: '13px', color: '#38bdf8', border: '1px solid #1e293b' };
const codeComment = { color: '#64748b', marginBottom: '8px' };
