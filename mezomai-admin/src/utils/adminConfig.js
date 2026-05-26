const STORAGE_KEY = 'mezomai_admin_config';

export const defaultAdminConfig = {
  phpApiUrl: 'https://your-php-host.com/api',
  pythonApiUrl: 'https://your-python-api.vercel.app',
  supabaseUrl: 'https://uewexsgrkowojoogiwan.supabase.co',
  supabaseAnonKey: '',
  sentryDsn: '',
  resendApiKey: '',
  resendFrom: 'MEZOMAI <no-reply@yourdomain.com>',
  meetingBotProvider: 'meetingbaas',
  meetingBaasKey: '',
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
    `VITE_SUPABASE_URL=${next.supabaseUrl}`,
    `VITE_SUPABASE_ANON_KEY=${next.supabaseAnonKey || 'your-supabase-publishable-key'}`,
    `VITE_PHP_API=${next.phpApiUrl}`,
    `VITE_PYTHON_API=${next.pythonApiUrl}`,
    'VITE_DEMO_MODE=false',
    next.sentryDsn ? `VITE_SENTRY_DSN=${next.sentryDsn}` : 'VITE_SENTRY_DSN=',
    '',
    '# Backend-only secrets stay on PHP/Python hosts, not in frontend Vercel.',
    'JWT_SECRET=replace-with-long-random-secret',
    `PYTHON_BACKEND_URL=${next.pythonApiUrl}`,
    `RESEND_API_KEY=${next.resendApiKey || 'replace-with-resend-secret'}`,
    `RESEND_FROM="${next.resendFrom}"`,
    `MEETING_BOT_PROVIDER=${next.meetingBotProvider}`,
    `MEETINGBAAS_API_KEY=${next.meetingBaasKey || 'replace-with-meetingbaas-secret'}`,
  ].join('\n');
}
