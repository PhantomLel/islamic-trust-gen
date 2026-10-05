# 12: Attribution codes and share links (V3 §5, V3 10.4, AB B2, D15)

Read `00-overview.md`, V3 §5 and AB B2 (source codes, share prompt, share preview).

## 1. Codes by pattern: `src/lib/attribution.ts`
- Remove the empty `ATTRIBUTION_CODES` map. Add `isValidSourceCode(code)` using these anchored regexes, lowercase only, with `slug = [a-z0-9]+(-[a-z0-9]+)*` and a 60-character maximum:
  - `fb-ad-{slug}`
  - `webinar-\d{4}-\d{2}`
  - `yt-{slug}`
  - `masjid-{slug}-{slug}`
  - `event-{slug}-\d{4}-\d{2}`
  - `share-freewill`, `share-calculator`
  - `email-{slug}`
  - `referral-(client|attorney|imam)`
  - `organic-search`, `organic-ai`, `direct`
- `ATTRIBUTION_QUERY_PARAM = 'src'`. In `hooks.server.ts`:
  - Read `src`. If it is absent, fall back to `utm_campaign`, used only if it passes `isValidSourceCode`.
  - Invalid values are ignored.
  - The first touch wins, and only the code is stored in the `mlp_src` cookie.
- `validateAttributionCode` uses `isValidSourceCode`.
- `withAttributionParam` sets `src`.
- Rewrite `attribution.test.ts`:
  - Every format passes.
  - Free text, uppercase, `__proto__`, and too-long values fail.
  - A historical value like `masjid_freewill_2026` is not accepted for new links but is never deleted from old rows.

## 2. Stop new UTM rows (D15)
- Remove the client UTM capture start in `src/routes/+layout.svelte` and `trackWillCompletion` calls (`src/lib/utm.ts`). Make `/api/utm-tracking` a 204 no-op.
- Keep the table and the admin UTM tab. Label the tab "UTM history (read-only)".
- Add a small admin panel: counts by `attribution_code` across `marketing_lead`, `free_will` and `trust`, for the last 30 and 90 days.

## 3. Link builder (admin)
- On the admin attribution panel, add a form: pick a channel pattern, fill the parts, and see the validated code.
- It outputs:
  - the URL (`${mlpOrigin}{path}?src={code}`)
  - a QR PNG generated with the existing `qrcode` dependency, as a data URL to download
- Nothing is stored.

## 4. Share prompt and preview (AB B2, V3 10.4)
- On the free-will completion screen, show the AB B2 share-prompt text verbatim, plus:
  - a **WhatsApp** button: `https://wa.me/?text=` + encoded `{prompt} {url}`
  - a **Copy link** button
  - the native `navigator.share` button where available
  
  The url is `${mlpOrigin}/free-islamic-will?src=share-freewill`.
- Calculator: any share link or button uses `src=share-calculator`. Add no new prompt copy; if no share UI exists, add only a Copy link button.
- `/free-islamic-will` Open Graph and Twitter `title` and `description` use the AB B2 share-preview strings. The page `<title>` stays as in task 10.
- Manual check, recorded in your report: paste the link into WhatsApp on iOS and Android and confirm the title, description and image show.

## Done when
- Valid codes flow from link → cookie → lead, free will or trust.
- New `utm_tracking_event` rows stop.
- The share prompt is live.
- Tests pass.
