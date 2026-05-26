# Vercel + Supabase Setup

## 1. Create the Supabase database

1. Open Supabase SQL Editor.
2. Run `database/supabase/schema.sql`.
3. In Authentication, keep Email auth enabled.

The schema enables Row Level Security so users can only access their own profiles, settings, chats, code files, meetings, transcripts, and analytics rows.

## 2. Add Vercel environment variables

Set these in Vercel Project Settings -> Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_DEMO_MODE=false
VITE_SENTRY_DSN=https://090fb32f2a0d83e7dad226626d9cc8f4@o4511444565032960.ingest.de.sentry.io/4511444580499536
VITE_SENTRY_SEND_DEFAULT_PII=false
VITE_SENTRY_TRACES_SAMPLE_RATE=0.2
VITE_SENTRY_REPLAY_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE=1.0
```

Optional, if the PHP and Python APIs are deployed separately:

```env
VITE_PHP_API=https://your-php-api.example.com/api
VITE_PYTHON_API=https://your-python-api.example.com
```

Optional, on the deployed Python/FastAPI backend, if you want MEZOMAI to join a pasted Google Meet/Zoom/Teams URL as a real bot participant:

```env
MEETING_BOT_API_URL=https://your-meeting-bot-service.com
MEETING_BOT_API_KEY=your-meeting-bot-secret
```

Deploy `meeting-bot-service/` separately on a long-running Docker host. Vercel serverless is not a good fit for a browser bot.

## 3. What runs where

Vercel hosts the React app.

Supabase handles:

- Login/register
- User profile and settings
- Multiple provider key rows
- Chat sessions and messages
- Code file storage
- Meeting/analytics tables for production persistence

The existing PHP and Python services still handle:

- Laravel REST API when running locally or deployed separately
- Python AI/completion endpoints
- Real code sandbox execution for `/code/run`
- WebSocket meeting/chat services

## 4. Demo login

The app includes a fixed demo workspace:

```text
ID: demo
Password: demo
```

That demo account is local-browser state only. Supabase persistence starts after a real Supabase email login/register.

## 5. Production API keys

The browser can save per-user provider keys to Supabase under RLS. For a stricter production security model, move API-key writes/reads behind a Supabase Edge Function or your own backend so keys can be encrypted server-side before storage.
