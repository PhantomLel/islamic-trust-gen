# Required tests (write these FIRST)

**Workflow for every task:**
1. Before changing any app code, write the tests listed for that task below.
2. Run them and confirm they fail for the right reason, not because of an import error.
3. Implement until they pass.
4. Run `npm test`. The whole suite must be green.

This list is the required set and the **minimum**. Keep it lean. A task file's own "Tests" section is guidance; where it differs from this file, this file wins. Do not add snapshot tests or tests of styling.

Conventions:
- Vitest, with test files next to the code (`*.test.ts`).
- Mock the DB, `fetch` and UploadThing the way existing server tests do.
- Use pure functions wherever possible. If logic lives in a `.svelte` file, extract it so it can be tested.

## 01 Foundation
- `formatFirmNapLine()` returns the AA W9.5 string exactly.
- `formatUsdWhole(1499)` → `$1,499`.
- `getBooleanSetting` returns the default when the setting is unset, and `setSetting` then `getSetting` returns the stored value.

## 02 Free-will flow (`flow.test.ts`, server action tests)
- Phase order: `notice` → `state` → `warning` → the first question. The tool can't advance past `notice` without the acknowledgment.
- `Married, separated but not divorced` → `not_handled`. `Registered domestic partnership` (CA) → `not_handled`. Texas does not offer domestic partnership.
- `isEstateFullyDistributed`: false for a man survived only by his wife, true for wife + son.
- The save action rejects:
  - a missing B6.1 notice record (400)
  - not-handled answers (400)
  - `free_will_enabled = false` (503)
- Validation: executor 2 is required; guardian 2 is required only when there are minor children.

## 04 Free-will PDF
- For a TX and a CA fixture, the flattened text of `buildWillDefinition` + `buildSheetsDefinition`:
  - has no `{{`, `[IF`, `County County` or `DRAFT`
  - contains no date
  - numbers sections sequentially
- The no-gifts fixture renders `I make no wasiyyah gifts.` and no table.
- CA has no `Notary Public`. TX contains the self-proving affidavit.
- **Verbatim check:** for each state, every fixed sentence constant in `definition.ts` appears word for word in `docs/specs/will-templates-v2.md` (strip markdown first). This is a single test that loops over the constants.
- `render()` returns a buffer starting with `%PDF`, the page count = will pages + sheet pages, and the metadata has a creation date.

## 05 MLP copy
- `banned.test.ts`: no AA W7.1 or W6.2 string in the public `.svelte` routes or in `config.ts`, apart from the explicit allowlist.

## 06 MEP pages
- Each new MEP path (`/attorney`, `/legacy-plan`, `/family-waqf-plan`, `/probate-estate-administration`, `/business-succession-planning`) has a title and description and appears in the MEP sitemap.
- `/about` → 301 `/attorney`.

## 07 Hosts (`hostPolicy.test.ts`)
- A freemuslimwill host → 301 to `/free-islamic-will`, **keeping the query string**.
- Apex MLP and apex MEP → 301 to www, keeping the path and query.
- MEP `/admin/x`, `/plans` and `/free-islamic-will` → 301 to the MLP www URL.
- MEP `/` and `/legacy-plan` → reroute to `/mcdaniel…`, with no redirect.
- MLP `/mcdaniel/attorney` → 301 to MEP `/attorney`.
- A POST to `/api/*` on MEP → no redirect.

## 08 Reviews
- SSR render of `ReviewsBlock` contains the Elfsight app class, the "Read all reviews on Google" link and the "Leave a review" link, and no stored count.
- Home-page JSON-LD contains no `Review` or `AggregateRating`.

## 09 Accessibility and polish
- `src/app.html` contains no `maximum-scale` or `user-scalable`.
- No `fonts.googleapis.com` or `vjs.zencdn.net` reference remains in `src/app.html` or in `src/routes/**`.

## 10 SEO
- The MEP `LegalService` address equals `firmNap`. The NAP text matches `formatFirmNapLine()`.
- `/attorney` emits a `Person` with `@id = attorneyPersonId`. The MLP `WebSite.parentOrganization` points to `firmLegalServiceId`.
- `robotsTxt` for **both** hosts disallows `/login`, `/dashboard`, `/create-trust`, `/make-your-trust-work` and `/admin`.
- No MEP route resolves to an MLP title, and the reverse.

## 11 Plans, quiz, calculator
- The quiz never sends a single person to the Guided Trust.
- An out-of-state answer gets no product outcome.

## 12 Attribution
- `isValidSourceCode`: one valid example per AB B2 format passes. Free text, uppercase, `__proto__`, values over 60 characters, and `masjid_freewill_2026` all fail.
- The cookie is set only from a valid code, and the first touch is not overwritten.

## 13 Portal
- `can()`: `admin` can do every action, while `client` and `null` can do none.
- The caveat resolves correctly for TX, CA, GENERAL and BOTH, and the override wins.

## 14 Video
- `parseYouTubeId` handles `watch?v=`, `youtu.be`, `shorts`, `embed`, `nocookie`, a bare ID, and junk input (→ null).
- `parseIsoDuration`: `PT1H2M3S` → 3723, `PT45S` → 45, and invalid input → null.
- `fetchYouTubeMeta` (fetch mocked):
  - It maps the `videos.list` response correctly.
  - It falls back to oEmbed when there are no items or there's an error, giving title and thumbnail with null duration.
- `captionsToText`: an SRT sample and a VTT sample produce clean text with no timestamps, cue numbers or tags.
- The publish rule blocks `privacyStatus = 'private'`.

## 15 Tool pages
- The server-rendered `/free-islamic-will` HTML contains both AB B8 free-will questions **before** the tool markup.

## 16 Webinar
- Pure `dueEmails(registration, webinar, now)` returns the right email types at each time boundary and never repeats one whose `*_sent_at` is already set.
- The `.ics` output contains `DTSTART`, `DTEND` and `URL`.
- Registration: a duplicate email is rejected, consent is stored only when ticked, and the honeypot blocks the submission.
- The public page HTML never contains `join_url`.
- A Zoom join link (`https` on `zoom.us` or a subdomain, path `/j/`, `/w/`, `/s/`, `/my/`, or `/wc/`) is accepted. Any other URL is rejected.
