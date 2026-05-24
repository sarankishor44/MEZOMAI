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
```

Optional, if the PHP and Python APIs are deployed separately:

```env
VITE_PHP_API=https://your-php-api.example.com/api
VITE_PYTHON_API=https://your-python-api.example.com
```

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
