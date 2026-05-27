import React from 'react'

export default function WalletPage() {
  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', fontStyle: 'italic', color: '#fff' }}>
          WALLET & EARNINGS
        </h1>
        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Monetize your custom AI Agent and track interaction credits.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'linear-gradient(145deg, #1f2937, #111827)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '24px' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.05em', marginBottom: '0.5rem' }}>Total Balance</div>
          <div style={{ fontSize: '3rem', fontWeight: 'black', background: 'linear-gradient(to right, #4ade80, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            $1,248.50
          </div>
          <button style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Withdraw Funds</button>
        </div>

        <div style={{ background: 'linear-gradient(145deg, #1f2937, #111827)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '24px' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.05em', marginBottom: '0.5rem' }}>Interaction Credits</div>
          <div style={{ fontSize: '3rem', fontWeight: 'black', color: '#fff' }}>
            45,290
          </div>
          <div style={{ marginTop: '1rem', color: '#34d399', fontSize: '0.875rem', fontWeight: 'bold' }}>+1,200 this week</div>
        </div>

        <div style={{ background: 'linear-gradient(145deg, #1f2937, #111827)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '24px' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.05em', marginBottom: '0.5rem' }}>Active Agent</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ width: '60px', height: '60px', background: '#374151', borderRadius: '50%', border: '2px solid #a855f7' }}></div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>MEZOMAI Custom</div>
              <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Level 4 Professional</div>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Income Breakdown</h2>
      
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', overflow: 'hidden' }}>
        {[
          { type: 'Chat Session', desc: 'Consultation with User_892', amount: '+$15.00', date: 'Today, 2:30 PM', icon: '💬' },
          { type: 'Skill Usage', desc: 'PPT Generation Skill', amount: '+$5.50', date: 'Today, 11:15 AM', icon: '⚡' },
          { type: 'Image Generation', desc: 'Avatar Request', amount: '+$2.00', date: 'Yesterday', icon: '🎨' },
          { type: 'Video Meeting', desc: 'Joined Google Meet (45 mins)', amount: '+$45.00', date: 'Yesterday', icon: '🎥' },
        ].map((tx, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: i !== 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                {tx.icon}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{tx.type}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{tx.desc} • {tx.date}</div>
              </div>
            </div>
            <div style={{ fontWeight: 'bold', color: '#4ade80' }}>
              {tx.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
