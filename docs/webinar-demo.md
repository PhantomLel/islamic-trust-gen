# Webinar demonstration account

The live demonstration uses a fabricated family on staging. Never the production app, and never a real client record.

## Reset the account

`DATABASE_URL` must be the staging database. `PROD_DATABASE_HOST` is the production database hostname. The script refuses to run when those hosts match, including a Neon `-pooler` hostname. It also refuses unless `DEMO_SEED_ALLOWED=true`.

```bash
DEMO_SEED_ALLOWED=true PROD_DATABASE_HOST=your-production-host.example.net node scripts/seed-demo-account.mjs
```

Running it again deletes that client's trust and sessions, then inserts a new one. The account is:

- Email: `demo.family@example.com`
- Password: `Demo-Webinar-1`
- Role: client
- Trust: joint, married couple. Invented names Ahmed Khan and Fatima Khan, Harris County, Texas. Trust name "Khan Family Trust". Status `review`.

Sign in at `/login` with email and password before you share the screen. The password stays in this note. It must not be visible in the shared screen.

## Screen-share checklist (V3 11.3)

- Staging only. Confirm the host is not production before you start.
- The family on screen is the invented Khan trust from this script. No real client record is open.
- Notifications are off or do-not-disturb is on.
- No other browser tabs are open.
- No credentials, password managers, or this document are visible.
- Attendee video, audio, and chat are not recorded. If any of that is captured, remove it before the session is republished.
