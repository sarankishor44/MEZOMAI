import { Activity } from 'lucide-react';

const agents = [
  { name: 'ARIA', gender: 'Female', style: 'Platinum realism', status: 'Live' },
  { name: 'ORION', gender: 'Male', style: 'Cinematic realism', status: 'Ready' },
];

export default function Characters() {
  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Characters</h1>
          <p className="page-subtitle">Male and female CSS avatars are controlled from the main app identity settings.</p>
        </div>
        <button className="holo-btn">Sync Presets</button>
      </header>

      <section className="stats-grid">
        {agents.map(agent => (
          <div className="cyber-panel character-card" key={agent.name}>
            <div className={`admin-avatar ${agent.gender.toLowerCase()}`}>
              <div className="admin-avatar-shoulders" />
              <div className="admin-avatar-neck" />
              <div className="admin-avatar-hair-back" />
              <div className="admin-avatar-ear left" />
              <div className="admin-avatar-ear right" />
              <div className="admin-avatar-head">
                <div className="admin-avatar-brow left" />
                <div className="admin-avatar-brow right" />
                <div className="admin-avatar-eye left" />
                <div className="admin-avatar-eye right" />
                <div className="admin-avatar-nose" />
                <div className="admin-avatar-mouth" />
              </div>
              <div className="admin-avatar-hair-front" />
            </div>
            <div>
              <div className="stat-title">{agent.gender} Agent</div>
              <div className="stat-value">{agent.name}</div>
              <p className="muted-copy">{agent.style}</p>
              <span className="badge active"><Activity size={12} /> {agent.status}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
