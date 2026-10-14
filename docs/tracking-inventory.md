# Tracking inventory

Spec v3 section 1.1, written from the code on 2 October 2026. Nothing below was changed to produce this list. It records what the repository loads, where it loads it, and what it sends.

Scope: this repository serves both public sites (`hooks.ts` rewrites `mcdanielestateplanning.com` onto `/mcdaniel`), the free Islamic will, the trust app, login, booking links, payment, and the client pages. It cannot see what is configured in a third-party dashboard (Stripe, Resend, Clio Grow, Calendly, Vercel, Google Search Console). Those need a separate check by someone with the account. See "Not visible from code".

## Finding: no advertising or analytics tag exists in the code

Searched `src/`, `static/`, `vercel.json`, `package.json`, and `svelte.config.js` for: Meta Pixel (`fbq`, `connect.facebook.net`), Google Analytics (`gtag`, `google-analytics`), Google Tag Manager (`googletagmanager`), Google Ads, LinkedIn Insight, TikTok, Microsoft Clarity, Hotjar, FullStory, PostHog, Segment, Mixpanel, HubSpot, Intercom, Crisp, Drift, Vercel Analytics / Speed Insights, Plausible, Umami.

Result: none present. `src/app.html` contains the viewport meta tag and the `%sveltekit.head%` / `%sveltekit.body%` placeholders. Google Fonts and the Video.js CDN are removed (rows 1 and 4). `src/routes/+layout.svelte` contains the favicon, title, description, and first-party UTM capture. No `<script src=...>` tag exists anywhere under `src/`. No dependency in `package.json` is an analytics or advertising SDK.

This is a finding from the code, not an assumption. If a tag manager container or pixel was added through a hosting-level script injection, a Vercel integration, or a browser extension on a staff machine, it would not appear here.

## Mechanisms that do load or send

| # | Mechanism | Where it loads | What it sends | Interview | Trust app | Login | Booking | Payment | Client pages |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Google Fonts stylesheet — **removed** | Was `src/app.html` (Playfair Display) and `src/routes/mcdaniel/+layout.svelte` (Figtree). Faces are now self-hosted from `@fontsource-variable`. Email templates still `@import` Google Fonts; that request is the mail client, not the site (row 11). | No visitor request from site pages. | No | No | No | No | No | No |
| 2 | `picsum.photos` hero image | `src/routes/+page.svelte` (homepage hero). Removed in Phase 6. | IP address and user agent to a random-image service. | No | No | No | No | No | No |
| 3 | `i.ytimg.com` video thumbnail URL | `src/routes/+page.svelte`, inside an HTML comment block (not rendered). Removed in Phase 6. | Nothing today. It would send IP and user agent to Google if the comment block were enabled. | No | No | No | No | No | No |
| 4 | Video.js stylesheet from `vjs.zencdn.net` — **removed** | Was `src/lib/components/VideoPlayer.svelte`. The player now imports `video.js/dist/video-js.css` from the installed package. | No CDN request. | No | No | No | No | No | No |
| 5 | Uploaded training videos from UploadThing (`*.ufs.sh`) | `VideoPlayer` `src` values in `src/lib/config.ts` and `/community-property`. | IP address and user agent to UploadThing's CDN when the video is played or preloaded. | No | Yes | No | No | No | Yes |
| 6 | Clio Grow booking URL (`mcdaniel.cliogrow.com`) | `consultationBookingUrl` in `src/lib/config.ts`. Rendered as a plain link, opened in a new tab. No embed, no script. | Nothing until the visitor clicks. After the click the visitor is on Clio's page under Clio's own policy. | Link only | Link only | No | Link only | Link only | Link only |
| 7 | Calendly notarization URL (`calendly.com`) | `notarizationBookingUrl` in `src/lib/config.ts`, and a per-matter single-use link built in `src/lib/server/calendly.ts`. Plain link, no embed. The per-matter link carries `utm_source=goodtree&utm_content=<opaque token>`; the token is matched to the matter on our webhook (`/api/webhooks/calendly`). | On click, the visitor's browser goes to Calendly. Our server calls `api.calendly.com` with the matter's invitee details to create the scheduling link. | No | No | No | Yes | No | Yes |
| 8 | Stripe Checkout | `src/routes/create-trust/[trust_id]/payment/+page.server.ts` creates a session; the browser redirects to `checkout.stripe.com`. Webhook at `/api/stripe/webhook`. | Payment details go to Stripe directly. Our server sends the line items and the matter id in session metadata. | No | Yes | No | No | Yes | No |
| 9 | UploadThing (deed and document upload) | `HouseDeedUploadCard.svelte`, admin user page. Server router in `src/lib/server/uploadthing.ts`. | The uploaded file, from the browser to UploadThing. Stored file URL returned to our server. | No | Yes | No | No | No | Yes |
| 10 | Resend (transactional and marketing mail) | Server only (`src/lib/server/**`, `auth.ts`). | Recipient address and message body. Drip mail uses `List-Unsubscribe` headers. | Document delivery email | Service mail | Magic-link email | Reminders | Receipt | Closing letter |
| 11 | Email Google Fonts | `@import` in `src/lib/server/emails/layout.ts`. Runs in the recipient's mail client, not on our site. | The recipient's mail client requests Google Fonts when it renders the message. | n/a | n/a | n/a | n/a | n/a | n/a |
| 12 | Help assistant (`HelpLauncher`) | Mounted on `/create-trust/[id]`, `/dashboard`, `/make-your-trust-work/[id]`, and `/help`. Requires a signed-in user (`/api/help/query` returns 401 otherwise). | The user's typed question leaves our server for ranking and verification: the question text and the candidate approved entries go to Voyage AI (`api.voyageai.com`, rerank) and the verification step sends the question and one entry to OpenAI (`api.openai.com`, `gpt-4o-mini`). Messages are redacted first (`src/lib/help/redact.ts`). The models do not write the answer (`HELP_PRODUCT_DECISIONS.modelsNeverWriteProse`). Conversations are stored in our database. | No | Yes | No | No | No | Yes |
| 13 | First-party UTM capture | `src/lib/utm.ts`, started from `src/routes/+layout.svelte`. Stores `utm_source`, `utm_medium`, `utm_campaign` in `localStorage`, then posts to our own `/api/utm-tracking`. Rows go to `utm_tracking_event`. On will completion the row also stores the user's email. | Stays on our infrastructure. First party. Not shared with an advertising platform. | Landing and completion events | No | No | No | No | No |
| 14 | Better Auth session cookies | `src/hooks.server.ts`. | First-party session cookie. | n/a | Yes | Yes | n/a | Yes | Yes |
| 15 | Google sign-in | `socialProviders.google` in `src/lib/server/auth.ts`. | Redirect to Google's OAuth screen at the visitor's request. | No | No | Yes | No | No | No |

## What this means for the intake privacy notice (spec 4.2)

The notice says: "We do not send your interview answers, documents, or identifiable consultation or client activity to advertising platforms, and we do not use them to build advertising audiences."

Against the code:

- No advertising platform receives any request from the interview, the trust app, login, booking links, payment, or client pages. Google Fonts (row 1) and the Video.js CDN (row 4) are removed, so site pages no longer send those requests. The remaining third-party browser requests on those routes are uploaded-video CDN requests (5) and the clicked-through destinations (6, 7, 8). None of those is an advertising platform.
- Help questions (12) go to Voyage AI and OpenAI, which are service providers, not advertising platforms.
- UTM data (13) is stored first party.

The notice text is therefore accurate for the repository as it stands, and it has been added. It is conditional on the "Not visible from code" items below being clean. Do not leave it live if any of them turn up a pixel.

## Not visible from code (needs a person with the accounts)

- Vercel project settings: any Analytics, Speed Insights, Web Analytics, or integration that injects a script at the edge.
- Clio Grow: any pixel or tracking code configured inside the hosted booking page.
- Calendly: the "tracking and analytics" settings on the event type.
- Stripe: Checkout does not take our pixels. Stripe's own fraud tooling (Stripe.js on `checkout.stripe.com`) is theirs.
- Any Meta, Google Ads, or LinkedIn account that was configured to receive offline or server-side conversions. This repository contains no such upload.
- Whether a pixel was ever live on the production site in the past. The code cannot answer "which events actually fired" (spec 1.3). Git history was not searched for removed tags.

## Guard against a later sitewide tag

`src/lib/analytics.ts` holds the only allowlist for public-page analytics. It is empty and the default is off. A future public-page analytics tag must be loaded only when `isAnalyticsAllowedPath(pathname)` is true, and the helper refuses every sensitive prefix even if one is added to the allowlist by mistake. The analytics property itself is not implemented. Spec 5.3 requires sending the configuration to Leonard before it goes live.

## Preserved, not deleted

- `utm_tracking_event` rows: untouched.
- Drip email templates under `src/lib/server/emails/drip/**`: untouched. New enrollments and further drip sends are stopped in code (see `src/lib/server/drip`).
- Knowledge-base versions (`kb_entry_version`): untouched.
- Stripe, Calendly, UploadThing, Resend, Voyage, OpenAI: not removed.

## Performance baseline (spec 6.7)

See `docs/performance-baseline.md`.
