import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN
const isEnabled = Boolean(dsn)

if (isEnabled) {
  Sentry.init({
    dsn,
    sendDefaultPii: import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII === 'true',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.2),
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/mezomai\.vercel\.app/,
      /^https:\/\/.*\.supabase\.co/,
    ],
    replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE ?? 0.1),
    replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE ?? 1.0),
    enableLogs: true,
    environment: import.meta.env.MODE,
  })
}

export { Sentry, isEnabled as isSentryEnabled }
