# Handoff for next session

Read **`docs/plan/00-overview.md`**, then **`docs/plan/00-tests.md`**, then do **one** task file only.

Task 16 was built early. Do not redo it. The next task is still **`10-seo.md`**.

The webinar slice is in the working tree and is not committed.

## Done (this repo state)

| Task | Status |
|------|--------|
| `01-foundation.md` | Done — NAP, origins, `settings.ts`, `formatUsdWhole`, superseded banner |
| `02-free-will-flow.md` | Done — B6.1–B6.7 flow (except PDF); kill switch; `free-will:v2`; delivery without account step |
| `03-*` | Removed from plan |
| `04-free-will-pdf.md` | Done — pdfmake will + sheets, merged unlocked PDF, TX affidavit, CA has none |
| `05-mlp-copy.md` | Done — W2, W3.1–W3.2, W6.2 phrases off MLP, W7 scan, B8 FAQs |
| `06-mep-pages.md` | Done — shared MEP shell, W4 homepage, `/attorney`, four practice pages, `/about` 301 |
| `07-hosts-routing.md` | Done — `hostPolicy.ts`, 301s, MEP reroute, www canonicals, cross-links |
| `08-reviews.md` | Done — Elfsight widget on both home pages, read/leave links, disclaimer |
| `09-a11y-polish.md` | Done — pinch-zoom, self-hosted fonts, hero headshot, contrast, focus, error pages |
| `16-webinar.md` | Done early — schema, admin, public page, four emails, cron, CTA, demo seed. Copy gaps below. |

`10` through `15` are not started. Task 10's sitemap line already says the MLP sitemap may include the webinar page. That entry is already there. Keep it.

## Next task

**`docs/plan/10-seo.md`** — AA W9 and V3 §6 deltas.

What is already true, so do not rebuild it and do not delete it:

- `staticRouteSeo['/webinar']` and `sitemapRoutes` already include `/webinar` on MLP. MEP sitemap entries for `/`, `/attorney`, and the four practice pages are already present.
- `/privacy` is already in `staticRouteSeo` and both sitemaps. D12 still defers the policy. Task 10 does not add or remove it.
- `organizationJsonLd` still has **no** street address and **no** `sameAs`. `seo.test.ts` still asserts that. Task 10 flips that test: the address is required and must equal `firmNap`.
- `robotsTxt('mcdaniel')` still disallows nothing. Task 10 gives it the same disallow list as MLP.
- `firmLegalServiceId` already exists in `src/lib/config.ts`. The webinar Event JSON-LD organizer is `{ '@id': firmLegalServiceId }`. Task 10 must keep that id.
- Free-will and other static titles are **not** the W9.1 strings yet. `/free-islamic-will` is still `Free Islamic Will — ${siteName}`.
- `docs/performance-baseline.md` exists. Lighthouse mobile scores are not recorded. Task 10 §6 still owns that. The 375px notes in that file are from task 09.

## Workflow (unchanged)

1. Write that task’s tests from `00-tests.md` **before** app code.
2. Confirm failures are intentional, then implement until green.
3. Finish with: what changed, tests added, any `TODO(Leonard)`.
4. Update this file before you stop: move the task to Done, point Next task at the following file, and add any new `TODO(Leonard)`.

## Open TODO(Leonard)

- Webinar email bodies are a factual stub in `src/lib/server/webinar/emailBody.ts`: title, time, and the join link or the consultation link. Subjects are also unapproved (`You're registered: …`, and the reminder and follow-up subjects in that file).
- Webinar opt-in label, until replaced: `Send me occasional educational and service emails from McDaniel Estate Planning. I may unsubscribe at any time.` (`WEBINAR_OPT_IN_LABEL` in `src/lib/webinar/copy.ts`).
- Elfsight dashboard: turn **rich snippets / schema markup off**. The live widget injects Product JSON-LD with AggregateRating and Review (seen in the browser). W5.2 forbids that. Also confirm no star filter, reviewer name and time shown, Google attribution on, branding hidden.
- Elfsight loads a third-party script and sees visitor IPs. List it in the privacy policy when AB B9 is built (D12).
- Confirm kill-switch copy: *“The free Islamic will is temporarily unavailable.”*
- `/plans` Legacy card still says “shariah compliance gaps”. Not the W7.1 string `shariah-compliant`. No approved replacement in the spec.
- Inheritance calculator button still says “Make it enforceable”. D19 freezes that page. Allowlisted in `src/lib/copy/banned.ts`.
- Confirm no jurisdiction caveat belongs on the four MEP practice pages. None of the bodies is a community-property example; the Legacy Plan mentions marital property and heba.
- MEP homepage pillar title “Islamic inheritance is not automatic” matches the MLP homepage problem card title. Bodies differ. No approved replacement in W4.
- Vercel cron `*/15 * * * *` is set for `/api/cron/webinar` (same cadence as drip). Whether this Vercel plan accepts a 15-minute cron was not checked. The 1-hour reminder needs at least that cadence.

## Env (Vercel)

Set `ORIGIN=https://www.muslimlegacyplanning.com`. better-auth `baseURL` is `env.ORIGIN`. There is no `trustedOrigins` override, so it trusts that base URL. Magic-link URLs and Stripe success/cancel URLs are built from `env.ORIGIN`. Local `.env` stays `http://localhost:5173`. Apex → www is also still a Vercel domain setting (overview, human-only).

`/api/cron/webinar` uses `Authorization: Bearer <CRON_SECRET>`, same as the drip cron. It refuses to run when `CRON_SECRET` is unset.

`drizzle/0011_webinar.sql` was applied to the Neon database in local `.env` during the webinar session. The SQL is idempotent. The verification row used to check the page was deleted, so no webinar is open. Do not point the demo seed at production.

Demo seed (`scripts/seed-demo-account.mjs`) runs only when `DEMO_SEED_ALLOWED=true` and `DATABASE_URL` is not `PROD_DATABASE_HOST`. Steps are in `docs/webinar-demo.md`.

## Pointers

- Next hand-written SQL file is **`drizzle/0012_*.sql`**. `0009` is help-content, `0010` is the free-will purge, `0011` is webinar. Task 13’s plan file still says `drizzle/0009_single_admin_and_content.sql`. Use `0012`, not `0009`.
- Host policy: `src/lib/hostPolicy.ts` (`hostSite`, `redirectFor`, `rerouteFor`, `publicPathFor`). Wired in `src/hooks.ts` and the first handle in `src/hooks.server.ts`. `/webinar` is an MLP-only path (`MEP_APP_PATHS`): a GET on the MEP host 301s to the MLP URL.
- Banned phrases: `src/lib/copy/banned.ts`, test `src/lib/copy/banned.test.ts`, scan `node scripts/w7-scan.mjs http://127.0.0.1:5173` → `docs/w7-scan.md`
- Reviews: `ReviewsBlock.svelte` embeds Elfsight app `fdfb23d6-45c5-41bd-950a-d905edc79df1` on both home pages, plus the read and leave links. Dashboard still injects Product / AggregateRating / Review JSON-LD (rich snippets on). Turn that off.
- MEP pages: `src/routes/mcdaniel/+layout.svelte`, `PracticePage.svelte`, `/attorney`, `/legacy-plan`, `/family-waqf-plan`, `/probate-estate-administration`, `/business-succession-planning`. `/about` is a 301 to `/attorney`. Unknown MEP paths throw 404 inside the MEP layout (`mcdaniel/[...rest]`) and render `mcdaniel/+error.svelte`. MLP unknown paths render `src/routes/+error.svelte`.
- Hero: `mlpHeroImage` in `src/lib/config.ts`. Share images: MLP `/og-image.png`, MEP `/og-mep.png` (`scripts/build-mep-og.mjs`). Favicons: `/favicon-mlp.png`, `/favicon-mep.png`.
- Fonts: `src/lib/fonts.css` (Playfair Display and Figtree, self-hosted). Video.js CSS is imported from the package in `VideoPlayer.svelte`.
- Free will PDF: `src/lib/server/documents/willPdf/` (`context.ts`, `definition.ts`, `render.ts`)
- Free will flow: `src/routes/free-islamic-will/`, `src/lib/free-will/`
- Settings: `src/lib/server/settings.ts` (`free_will_enabled`, `featured_video_id`)
- Webinar: `drizzle/0011_webinar.sql`, `src/lib/server/db/webinar.schema.ts`, `src/lib/server/webinar/` (`db.ts`, `emailBody.ts`, `processDue.ts`, `send.ts`), `src/lib/webinar/` (`copy.ts`, `due.ts`, `eventJsonLd.ts`, `ics.ts`, `joinUrl.ts`, `public.ts`, `register.ts`, `time.ts`, `webinar.test.ts`). Admin: `src/routes/admin/webinar/`. Public: `src/routes/webinar/`. Cron: `src/routes/api/cron/webinar/+server.ts`. Join links are `https` on `zoom.us` or a subdomain, path `/j/`, `/w/`, `/s/`, `/my/`, or `/wc/`. The page and Event JSON-LD never include `join_url`. One `open` row at a time (partial unique index). CTA key `webinar` is allowed only while a webinar is open (`allowedCtaKeys` in `src/lib/content/rules.ts`).
- Attribution: registration already calls `attributionCodeFromCookies`. `ATTRIBUTION_CODES` is still `{}` and `validateAttributionCode` rejects anything not in that map, so `attribution_code` stays null until task 12. Task 12 switches the query param from `utm_campaign` to `src` and must keep this cookie read working.
- Spec precedence: owner table in `00-overview.md` > AB > AA > V3 > AppA
- Do **not** follow `docs/spec-v3-implementation-plan.md` “Do not build” table (superseded)

## Remaining order

`10-seo.md` → `11-plans-quiz-calculator.md` → `12-attribution-share.md` → `13-portal-simplify.md` → `14-video-by-url.md` → `15-tool-pages.md`. Then stop. `16-webinar.md` is already done.
