const STORAGE_KEY = 'mezomai_admin_config';

export const defaultAdminConfig = {
  phpApiUrl: 'https://your-php-host.com/api',
  pythonApiUrl: 'https://your-python-api.vercel.app',
  supabaseUrl: 'https://uewexsgrkowojoogiwan.supabase.co',
  supabaseAnonKey: '',
  sentryDsn: '',
  resendApiKey: '',
  resendFrom: 'MEZOMAI <no-reply@yourdomain.com>',
  anthropicApiKey: '',
  openAiApiKey: '',
  geminiApiKey: '',
  openRouterApiKey: '',
  deepSeekApiKey: '',
  groqApiKey: '',
  mistralApiKey: '',
  xAiApiKey: '',
  meetingBotApiUrl: 'https://your-meeting-bot-service.com',
  meetingBotApiKey: '',
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
    `ANTHROPIC_API_KEY=${next.anthropicApiKey || 'replace-with-anthropic-key'}`,
    `OPENAI_API_KEY=${next.openAiApiKey || 'replace-with-openai-key'}`,
    `GEMINI_API_KEY=${next.geminiApiKey || 'replace-with-gemini-key'}`,
    `OPENROUTER_API_KEY=${next.openRouterApiKey || 'replace-with-openrouter-key'}`,
    `DEEPSEEK_API_KEY=${next.deepSeekApiKey || 'replace-with-deepseek-key'}`,
    `GROQ_API_KEY=${next.groqApiKey || 'replace-with-groq-key'}`,
    `MISTRAL_API_KEY=${next.mistralApiKey || 'replace-with-mistral-key'}`,
    `XAI_API_KEY=${next.xAiApiKey || 'replace-with-xai-key'}`,
    `MEETING_BOT_API_URL=${next.meetingBotApiUrl}`,
    `MEETING_BOT_API_KEY=${next.meetingBotApiKey || 'replace-with-meeting-bot-secret'}`,
  ].join('\n');
}
