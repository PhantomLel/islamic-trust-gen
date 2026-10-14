# Handoff for next session

Read **`docs/plan/00-overview.md`**, then **`docs/plan/00-tests.md`**, then do **one** task file only.

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

## Next task

**`docs/plan/10-seo.md`** — AA W9 and V3 §6 deltas.

## Workflow (unchanged)

1. Write that task’s tests from `00-tests.md` **before** app code.
2. Confirm failures are intentional, then implement until green.
3. Finish with: what changed, tests added, any `TODO(Leonard)`.

## Open TODO(Leonard)

- Elfsight dashboard: turn **rich snippets / schema markup off**. The live widget injects Product JSON-LD with AggregateRating and Review (seen in the browser). W5.2 forbids that. Also confirm no star filter, reviewer name and time shown, Google attribution on, branding hidden.
- Elfsight loads a third-party script and sees visitor IPs. List it in the privacy policy when AB B9 is built (D12).

- Confirm kill-switch copy: *“The free Islamic will is temporarily unavailable.”*
- `/plans` Legacy card still says “shariah compliance gaps”. Not the W7.1 string `shariah-compliant`. No approved replacement in the spec.
- Inheritance calculator button still says “Make it enforceable”. D19 freezes that page. Allowlisted in `src/lib/copy/banned.ts`.
- Confirm no jurisdiction caveat belongs on the four MEP practice pages. None of the bodies is a community-property example; the Legacy Plan mentions marital property and heba.
- MEP homepage pillar title “Islamic inheritance is not automatic” matches the MLP homepage problem card title. Bodies differ. No approved replacement in W4.

## Env (Vercel)

Set `ORIGIN=https://www.muslimlegacyplanning.com`. better-auth `baseURL` is `env.ORIGIN`. There is no `trustedOrigins` override, so it trusts that base URL. Magic-link URLs and Stripe success/cancel URLs are built from `env.ORIGIN`. Local `.env` stays `http://localhost:5173`. Apex → www is also still a Vercel domain setting (overview, human-only).

## Pointers

- Host policy: `src/lib/hostPolicy.ts` (`hostSite`, `redirectFor`, `rerouteFor`, `publicPathFor`). Wired in `src/hooks.ts` and the first handle in `src/hooks.server.ts`.
- Banned phrases: `src/lib/copy/banned.ts`, test `src/lib/copy/banned.test.ts`, scan `node scripts/w7-scan.mjs http://127.0.0.1:5173` → `docs/w7-scan.md`
- Reviews: `ReviewsBlock.svelte` embeds Elfsight app `fdfb23d6-45c5-41bd-950a-d905edc79df1` on both home pages, plus the read and leave links. Dashboard still injects Product / AggregateRating / Review JSON-LD (rich snippets on). Turn that off.
- MEP pages: `src/routes/mcdaniel/+layout.svelte`, `PracticePage.svelte`, `/attorney`, `/legacy-plan`, `/family-waqf-plan`, `/probate-estate-administration`, `/business-succession-planning`. `/about` is a 301 to `/attorney`. Unknown MEP paths throw 404 inside the MEP layout (`mcdaniel/[...rest]`) and render `mcdaniel/+error.svelte`. MLP unknown paths render `src/routes/+error.svelte`.
- Hero: `mlpHeroImage` in `src/lib/config.ts`. Share images: MLP `/og-image.png`, MEP `/og-mep.png` (`scripts/build-mep-og.mjs`). Favicons: `/favicon-mlp.png`, `/favicon-mep.png`.
- Fonts: `src/lib/fonts.css` (Playfair Display and Figtree, self-hosted). Video.js CSS is imported from the package in `VideoPlayer.svelte`.
- Free will PDF: `src/lib/server/documents/willPdf/` (`context.ts`, `definition.ts`, `render.ts`)
- Free will flow: `src/routes/free-islamic-will/`, `src/lib/free-will/`
- Settings: `src/lib/server/settings.ts` (`free_will_enabled`, `featured_video_id`)
- Spec precedence: owner table in `00-overview.md` > AB > AA > V3 > AppA
- Do **not** follow `docs/spec-v3-implementation-plan.md` “Do not build” table (superseded)

## After 09 (order)

`10-seo.md` → `11-plans-quiz-calculator.md` → … see `00-overview.md` § Order.
