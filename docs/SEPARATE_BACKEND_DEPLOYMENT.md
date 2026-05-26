# Separate Backend Deployment

This setup keeps MEZOMAI data routed through your own infrastructure:

```text
React frontend on Vercel
  -> Supabase for auth/database
  -> PHP API on your PHP host
  -> Python/FastAPI API on a separate Vercel account or Python host
```

## Frontend Vercel environment variables

Set these on the React Vercel project:

```env
VITE_SUPABASE_URL=https://uewexsgrkowojoogiwan.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key
VITE_PHP_API=https://your-php-host.com/api
VITE_PYTHON_API=https://your-python-api.vercel.app
VITE_DEMO_MODE=false
```

Important:

- `VITE_PHP_API` must include `/api`.
- `VITE_PYTHON_API` should be the root Python URL. The app adds `/ai` for AI routes and `/ws` for websocket routes.
- Do not put backend secret keys in React/Vite variables unless they are intentionally public.

You can also change these at runtime in the app:

```text
Settings -> Backend API URLs
```

Those overrides are saved in the browser and are useful while testing new backend URLs.

## PHP backend environment variables

Set these on your PHP host:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-php-host.com
JWT_SECRET=replace-with-long-random-secret

DB_CONNECTION=mysql
DB_HOST=your-mysql-host
DB_PORT=3306
DB_DATABASE=your-db
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

PYTHON_BACKEND_URL=https://your-python-api.vercel.app
ALLOWED_ORIGINS=https://mezomai.vercel.app

RESEND_API_KEY=replace-with-resend-key
RESEND_FROM="MEZOMAI <no-reply@yourdomain.com>"
```

If using InfinityFree or similar PHP hosting, confirm it supports:

- PHP 8.1+
- Composer dependencies or uploaded `vendor/`
- MySQL
- Public rewrite to Laravel `public/index.php`
- Outgoing HTTP requests from PHP to your Python API
- Custom response headers or `.htaccess` CORS headers

Many free PHP hosts restrict Composer, long-running jobs, and outbound API calls. If that blocks Laravel, use Railway, Render, VPS, or a cPanel host with Composer support.

## Python backend environment variables

Set these on the Python API deployment:

```env
APP_ENV=production
ALLOWED_ORIGINS=https://mezomai.vercel.app

MEETING_BOT_API_URL=https://your-meeting-bot-service.com
MEETING_BOT_API_KEY=replace-with-meeting-bot-secret
```

Deploy `meeting-bot-service/` separately on a long-running Docker host. The main React app does not call this service directly; it calls the Python API, and the Python API forwards the request to your bot service with `MEETING_BOT_API_KEY`.

For Vercel Python serverless, REST endpoints can work. Long-running WebSockets and sandbox code execution are better on Render, Railway, Fly.io, or a VPS.

## Data leak prevention checklist

- Keep `RESEND_API_KEY`, `MEETING_BOT_API_KEY`, DB passwords, JWT secrets, and service-role keys only on backend hosts.
- Keep only publishable keys in Vercel React variables.
- Set CORS to your frontend domain, not `*`.
- Use HTTPS URLs for PHP and Python APIs in production.
- Rotate any secret accidentally pasted into chat or committed anywhere.
