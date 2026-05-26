import { useState } from 'react';
import { Activity, LockKeyhole } from 'lucide-react';

const ADMIN_SESSION_KEY = 'mezomai_admin_session';

export function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'active';
}

export function setAdminLoggedIn(value) {
  if (value) localStorage.setItem(ADMIN_SESSION_KEY, 'active');
  else localStorage.removeItem(ADMIN_SESSION_KEY);
}

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const expectedUser = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin';

    if (username.trim() === expectedUser && password === expectedPassword) {
      setAdminLoggedIn(true);
      onLogin();
      return;
    }

    setError('Invalid admin username or password.');
  };

  return (
    <main className="login-shell">
      <form className="cyber-panel login-panel" onSubmit={submit}>
        <div className="login-brand">
          <Activity />
          <span>MEZOMAI Admin</span>
        </div>
        <div>
          <h1>Admin Login</h1>
          <p className="muted-copy">Sign in to manage deployment settings and platform data.</p>
        </div>
        <label className="config-field">
          <span>Username</span>
          <input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" />
        </label>
        <label className="config-field">
          <span>Password</span>
          <input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="current-password" />
        </label>
        {error && <div className="error-strip">{error}</div>}
        <button className="holo-btn" type="submit"><LockKeyhole size={16} /> Login</button>
      </form>
    </main>
  );
}
