import { Users, Activity, Cpu } from 'lucide-react';

const Dashboard = () => {
  return (
    <div>
      <header className="page-header">
        <h1>Overview</h1>
        <button className="holo-btn">Export Report</button>
      </header>

      <section className="stats-grid">
        <div className="cyber-panel stat-card">
          <div className="stat-title">Total Users</div>
          <div className="stat-value">12,490</div>
          <div style={{ color: 'var(--accent-cyan)', fontSize: '12px' }}>+12% this week</div>
        </div>
        <div className="cyber-panel stat-card">
          <div className="stat-title">Active AI Sessions</div>
          <div className="stat-value">1,240</div>
          <div style={{ color: 'var(--accent-purple)', fontSize: '12px' }}>Stable</div>
        </div>
        <div className="cyber-panel stat-card">
          <div className="stat-title">Compute Load</div>
          <div className="stat-value">78%</div>
          <div style={{ color: '#f87171', fontSize: '12px' }}>Warning: High Load</div>
        </div>
      </section>

      <section className="cyber-panel">
        <h2 style={{ marginBottom: '16px', color: 'var(--accent-cyan)' }}>Recent Activity</h2>
        <p style={{ color: 'var(--text-secondary)' }}>System operating nominally. Database replication delay: 0.04s.</p>
      </section>
    </div>
  );
};

export default Dashboard;
