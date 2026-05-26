# MEZOMAI Meeting Bot Service

Self-hosted browser bot API for joining meeting links.

It supports provider-specific join flows for:

- Google Meet
- Zoom web join
- Microsoft Teams web join
- Jitsi
- Whereby
- Generic meeting links with common Join buttons

This service must run on a long-running host with Chromium support. Use Docker on a VPS, Render, Railway, Fly.io, or a similar container host. Do not deploy this to Vercel serverless for production meeting bots.

## Run Locally

```bash
cd meeting-bot-service
pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --host 0.0.0.0 --port 8010
```

## Run With Docker

```bash
docker build -t mezomai-meeting-bot .
docker run --env-file .env -p 8010:8010 mezomai-meeting-bot
```

## API

```http
POST /bots/join
Authorization: Bearer your-key
Content-Type: application/json
```

```json
{
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "bot_name": "ARIA",
  "entry_message": "ARIA joined to capture notes and action items.",
  "avatar": {
    "name": "ARIA",
    "gender": "female",
    "style": "gold",
    "personality": "friendly",
    "voice_name": "Rachel"
  }
}
```

Response:

```json
{
  "bot_id": "mezobot_xxxxx",
  "platform": "google_meet",
  "status": "queued"
}
```

Check status:

```http
GET /bots/{bot_id}
```

## Connect To MEZOMAI

Set these on the Python backend:

```env
MEETING_BOT_API_URL=https://your-meeting-bot-service.com
MEETING_BOT_API_KEY=the-same-key-from-this-service
```

Then the main app's Meet page button `Invite AI to Link` will call:

```text
React -> Python API -> meeting-bot-service -> browser joins meeting
```

## Important Limits

Some meeting links may require:

- Host approval from waiting room
- Login
- Captcha
- Organization restrictions
- Browser permission prompts

The service handles common web flows, but cannot bypass security or host approval.
