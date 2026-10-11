# 16: Webinar registration (V3 §11, D14)

Read `00-overview.md` and V3 §11. The call is Zoom only (D14). Store the Zoom join link. Do not call the Zoom API, and do not use Zoom registration or Zoom's reminder emails. Zoom only carries the call.

## 1. Schema: `drizzle/0010_webinar.sql` (idempotent), plus `webinar.schema.ts`
- `webinar`:
  - `id`, `title`, `starts_at` (timestamptz), `duration_minutes`
  - `join_url` (private), `replay_video_id` (nullable, FK `video_page`)
  - `status` (`draft | open | closed`)
  - `created_at`, `updated_at`
- `webinar_registration`:
  - `id`, `webinar_id`, `name`, `email`, `state`
  - `attribution_code`, `marketing_consent`, `marketing_consent_at`
  - `confirmation_sent_at`, `reminder_24h_sent_at`, `reminder_1h_sent_at`, `followup_sent_at`
  - `created_at`
  - unique (`webinar_id`, lower(`email`))

## 2. Admin: `/admin/webinar`
- Create or edit the **next** webinar: title, date and time (America/Chicago input, stored UTC), duration, Zoom join link, status.
- Accept `join_url` only when it is `https` and the host is `zoom.us` or a subdomain of `zoom.us` (for example `us02web.zoom.us`), with a join path of `/j/`, `/w/`, `/s/`, `/my/`, or `/wc/`. Reject every other host, including `zoom.com`, `zoomgov.com`, and shorteners.
- Only one webinar can be `open` at a time.
- List the registrants with a CSV export. Writes go to `content_audit`.

## 3. Public page: `/webinar` (MLP style, indexable)
- With an `open` webinar, show:
  - the title and date/time, with the timezone shown
  - the V3 11.1 required text **verbatim**, followed by `formatFirmNapLine()`
  - a form for name, email and state (all states)
  - the marketing opt-in: separate and unchecked. Its label is TODO(Leonard). Until then, use `Send me occasional educational and service emails from McDaniel Estate Planning. I may unsubscribe at any time.`
  - a hidden honeypot field
- The attribution code comes from the cookie (task 12).
- Without an open webinar: "No webinar is scheduled right now." plus the consultation link.
- **Never render `join_url` on the page.**
- JSON-LD `Event`:
  - `eventAttendanceMode: OnlineEventAttendanceMode`
  - `location: VirtualLocation` with `url` = the page URL
  - `organizer` = `{ '@id': firmLegalServiceId }`
- Add it to the MLP sitemap.

## 4. Emails (service stream, V3 4.4: no marketing unsubscribe gating)
- Each email:
  - **Confirmation**: on registration. Includes the join link and an `.ics` attachment (build a minimal VEVENT string yourself, with no new dependency).
  - **24-hour reminder**: includes the join link.
  - **1-hour reminder**: includes the join link.
  - **Follow-up**: after `starts_at + duration`, sent to every registrant, with `consultationBookingUrl` (V3 11.2).
- Body copy is TODO(Leonard). Use minimal factual text: the title, the time, and the join link or consultation link.
- Use the existing email layout with the NAP footer.
- Cron at `src/routes/api/cron/webinar/+server.ts`, protected like the drip cron:
  - Sends whatever is due.
  - Sets the `*_sent_at` fields, so nothing is sent twice.
  - Add it to `vercel.json`. The 1-hour reminder needs the cron to run at least every 15 minutes; if the Vercel plan can't do that, report it.

## 5. Content call to action
- Add CTA key `webinar` ("Register for the webinar" → `/webinar`). It is selectable only while an `open` webinar exists.
- Update `CTA_KEYS`, the labels, the rules and their tests.

## 6. Demo environment (V3 11.3)
- `scripts/seed-demo-account.mjs` creates or resets a demo client with a fabricated married-couple trust.
- It refuses to run unless `DEMO_SEED_ALLOWED=true` and `DATABASE_URL` is not the production URL (compare against `PROD_DATABASE_HOST`).
- Document it in `docs/webinar-demo.md`, including the V3 11.3 screen-share checklist.

## Tests
- Registration: duplicate emails, honeypot, consent stored only when ticked, and the code saved.
- `join_url`: a Zoom join link is accepted; any other URL is rejected.
- Cron selection logic, as a pure function: due vs not due for each email type, and idempotency.
- `.ics` output contains `DTSTART`, `DTEND` and `URL`.
- The page HTML never contains `join_url`.

## Done when
An admin can schedule a webinar, visitors can register, all four emails send on time, and the page is indexable with Event schema.
