# Supabase Auth Email With Resend

If register shows `Email rate limit exceeded`, Supabase is using its default demo email sender.

For production, connect Resend as Supabase Auth custom SMTP.

## Resend SMTP values

Use these in Supabase:

```text
SMTP host: smtp.resend.com
SMTP port: 587
SMTP user: resend
SMTP password: your Resend API key
Sender email: onboarding@resend.dev for testing, or your verified domain email
Sender name: MEZOMAI
```

For production, verify your own domain in Resend and use something like:

```text
no-reply@yourdomain.com
```

## Supabase dashboard path

1. Open Supabase project.
2. Go to Authentication.
3. Open SMTP Settings or Email Settings.
4. Enable Custom SMTP.
5. Add the Resend SMTP values.
6. Save.
7. Open Authentication -> Rate Limits and increase email limits if needed.

## Notes

- Supabase's default email sender is not for production.
- Resend API keys must stay server-side or inside Supabase SMTP settings.
- Do not place Resend secret keys in the Vite frontend `.env`.
