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
    ignoreErrors: [
      "Object [object Object] has no method 'updateFrom'",
      'ResizeObserver loop completed with undelivered notifications.',
      'ResizeObserver loop limit exceeded',
    ],
    beforeSend(event) {
      const values = event.exception?.values || []
      const stackFrames = values.flatMap(value => value.stacktrace?.frames || [])
      const hasSentryInjectedFrame = stackFrames.some(frame =>
        String(frame.filename || '').includes('/sentry/scripts/views.js') ||
        String(frame.filename || '').includes('../../sentry/scripts/views.js')
      )

      if (hasSentryInjectedFrame) return null

      return event
    },
  })
}

export { Sentry, isEnabled as isSentryEnabled }
