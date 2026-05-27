const STORAGE_KEY = 'mezomai_admin_config';

export const defaultAdminConfig = {
  phpApiUrl: 'https://your-php-host.com/api',
  pythonApiUrl: 'https://your-python-api.vercel.app',
  dbHost: 'mysql.railway.internal',
  dbPort: '3306',
  dbDatabase: 'mezomai',
  dbUsername: 'root',
  dbPassword: '',
};

export function loadAdminConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultAdminConfig, ...JSON.parse(stored) } : defaultAdminConfig;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return defaultAdminConfig;
  }
}

export function saveAdminConfig(config) {
  const next = { ...defaultAdminConfig, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem('aria_php_api_url', next.phpApiUrl.replace(/\/$/, ''));
  localStorage.setItem('aria_py_api_url', next.pythonApiUrl.replace(/\/$/, ''));
  return next;
}

export function exportEnv(config) {
  const next = { ...defaultAdminConfig, ...config };
  return [
    `VITE_PHP_API=${next.phpApiUrl}`,
    `VITE_PYTHON_API=${next.pythonApiUrl}`,
    'VITE_DEMO_MODE=false',
    '',
    '# Backend Deployment Secrets (.env for PHP / Laravel)',
    'APP_ENV=production',
    'APP_DEBUG=false',
    'JWT_SECRET=replace-with-long-random-secret',
    `PYTHON_BACKEND_URL=${next.pythonApiUrl}`,
    '',
    '# Cloud Database Configuration',
    `DB_HOST=${next.dbHost}`,
    `DB_PORT=${next.dbPort}`,
    `DB_DATABASE=${next.dbDatabase}`,
    `DB_USERNAME=${next.dbUsername}`,
    `DB_PASSWORD=${next.dbPassword}`,
  ].join('\n');
}
