# 01: Foundation

Read `00-overview.md` first. Small shared pieces that later tasks depend on.

## 1. Supersede the old plan
- Add a banner as the first lines of `docs/spec-v3-implementation-plan.md`: `> SUPERSEDED by docs/plan/ (Addendum B). Historical record only. Do not follow its "Do not build" table.`

## 2. Site settings helper
- Create `src/lib/server/settings.ts` with typed `getSetting(key)` and `setSetting(key, value, actorId)` over the existing `content_setting` table. Reuse whatever helper already reads the featured-video setting, and move it here if it lives elsewhere.
- Create `getBooleanSetting(key, default)`.
- Every `setSetting` call writes a `content_audit` row with action `setting:{key}`.
- Tests: default value, round trip, audit row written. Mock the db the way existing server tests do.

## 3. Firm identity (AA W9.5, D18)
In `src/lib/config.ts`:
- Add `firmNap = { name: 'McDaniel Estate Planning, PLLC', street: '13100 Wortham Center Drive, 3rd Floor', city: 'Houston', region: 'TX', postalCode: '77065', phone: '(713) 659-9668', phoneTel: '+17136599668', email: 'admin@mcdanielestateplanning.com' }`.
- Add `formatFirmNapLine()`. It returns exactly: `McDaniel Estate Planning, PLLC · 13100 Wortham Center Drive, 3rd Floor, Houston, TX 77065 · (713) 659-9668 · admin@mcdanielestateplanning.com`.
- Set `firmMailingAddress` to `McDaniel Estate Planning, PLLC · 13100 Wortham Center Drive, 3rd Floor, Houston, TX 77065` and remove the Austin address everywhere. Grep for `Lamar`, `Austin` and `78756`.
- Derive `firmPhone` and `firmPhoneTel` from `firmNap`.
- Test: the exact string above. Grep the repo: no `Lamar` remains outside git history.

## 4. Origins (D9)
- `mcdanielOrigin` = `https://www.mcdanielestateplanning.com`. `mlpOrigin` stays `https://www.muslimlegacyplanning.com`.
- `attorneyProfileUrl` = `${mcdanielOrigin}/attorney`. Task 06 builds the page.
- Add `attorneyPersonId = `${attorneyProfileUrl}#person`` and `firmLegalServiceId = `${mcdanielOrigin}/#legalservice``.
- Fix `seo.test.ts` expectations that hard-code apex MEP URLs or `/about`.

## 5. Price formatting (AA W8.2)
- Add `formatUsdWhole(n)`, which returns `$1,499` with no cents.
- Use it everywhere a list price is shown publicly. Search for `formatUsd(defaultPrepFee)` and `.00`.
- Leave payment and checkout amounts as they are.

## Done when
- `npm test` passes.
- No Austin address remains.
- Settings helper exists with tests.
