import { useMemo, useState } from 'react';
import { Copy, Database, KeyRound, Server, ShieldCheck } from 'lucide-react';
import { exportEnv, loadAdminConfig, saveAdminConfig } from '../utils/adminConfig';

const fields = [
  ['phpApiUrl', 'PHP API URL', 'https://your-php-host.com/api', Server],
  ['pythonApiUrl', 'Python API URL', 'https://your-python-api.vercel.app', Server],
  ['supabaseUrl', 'Supabase URL', 'https://your-project.supabase.co', Database],
  ['supabaseAnonKey', 'Supabase publishable key', 'sb_publishable_...', KeyRound],
  ['sentryDsn', 'Sentry DSN', 'https://...@...ingest.sentry.io/...', ShieldCheck],
  ['anthropicKey', 'Anthropic API key', 'sk-ant-api03-...', KeyRound],
  ['openAiKey', 'OpenAI API key', 'sk-...', KeyRound],
  ['geminiKey', 'Gemini API key', 'AIza...', KeyRound],
  ['elevenLabsKey', 'ElevenLabs API key', 'voice key...', KeyRound],
  ['resendApiKey', 'Resend API key', 're_...', KeyRound],
  ['resendFrom', 'Resend From', 'MEZOMAI <no-reply@yourdomain.com>', KeyRound],
  ['meetingBotProvider', 'Meeting Bot Provider', 'meetingbaas', Server],
  ['meetingBaasKey', 'MeetingBaas API key', 'mb_live_...', KeyRound],
];

export default function Settings() {
  const [config, setConfig] = useState(() => loadAdminConfig());
  const [status, setStatus] = useState('Ready');
  const envText = useMemo(() => exportEnv(config), [config]);

  const update = (key, value) => setConfig(current => ({ ...current, [key]: value }));

  const save = () => {
    const next = saveAdminConfig(config);
    setConfig(next);
    setStatus('Saved. Frontend browser overrides updated.');
  };

  const copyEnv = async () => {
    await navigator.clipboard.writeText(envText);
    setStatus('Environment template copied.');
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Backend Control</h1>
          <p className="page-subtitle">Configure private PHP/Python endpoints and deployment keys from admin only.</p>
        </div>
        <button className="holo-btn" onClick={save}>Save Config</button>
      </header>

      <section className="admin-grid">
        <div className="cyber-panel config-panel">
          <h2>API Routing</h2>
          <p className="muted-copy">User settings no longer expose backend URLs. Admin controls the routes here.</p>
          <div className="config-form">
            {fields.map(([key, label, placeholder, Icon]) => (
              <label key={key} className="config-field">
                <span><Icon /> {label}</span>
                <input
                  value={config[key] || ''}
                  onChange={event => update(key, event.target.value)}
                  placeholder={placeholder}
                  type={key.toLowerCase().includes('key') ? 'password' : 'text'}
                />
              </label>
            ))}
          </div>
          <div className="status-strip">{status}</div>
        </div>

        <div className="cyber-panel config-panel">
          <h2>Deployment Env</h2>
          <p className="muted-copy">Paste public Vite vars into Vercel. Keep backend secrets only on backend hosts.</p>
          <pre className="env-preview">{envText}</pre>
          <button className="holo-btn" onClick={copyEnv}><Copy size={16} /> Copy Env</button>
        </div>
      </section>
    </div>
  );
}
