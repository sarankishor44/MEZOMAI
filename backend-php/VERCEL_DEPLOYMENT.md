# MEZOMAI PHP API on Vercel

Use a separate Vercel project for this folder.

## Vercel Import Settings

- Root Directory: `backend-php`
- Framework Preset: `Other`
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: `composer install --no-dev --optimize-autoloader`

Vercel reads `backend-php/vercel.json` and uses the community PHP runtime:

```json
"runtime": "vercel-php@0.7.4"
```

## Required Environment Variables

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-php-api.vercel.app
JWT_SECRET=replace-with-long-random-secret

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=your-db-name
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

PYTHON_BACKEND_URL=https://your-python-api.vercel.app
RESEND_API_KEY=replace-with-resend-api-key
RESEND_FROM="MEZOMAI <no-reply@yourdomain.com>"
```

## Status Link

After deploy, open:

```text
https://your-php-api.vercel.app/health
```

or, if your frontend config includes `/api`:

```text
https://your-php-api.vercel.app/api/health
```

Expected JSON:

```json
{
  "status": "online",
  "service": "MEZOMAI PHP API",
  "version": "1.0.0",
  "python_backend_url": "https://your-python-api.vercel.app"
}
```
