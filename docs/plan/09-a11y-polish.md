# 09: Accessibility and polish (AA W8, AB B2 hero, D10, D16)

Read `00-overview.md` and AA W8. **Keep MLP and MEP visually distinct (D10).** This is defect fixing, not a redesign.

## 1. Zoom (W8.1)
- In `src/app.html`, the viewport becomes `width=device-width, initial-scale=1`. Remove `maximum-scale`, `minimum-scale` and `user-scalable`.
- Grep for any other viewport meta tag.

## 2. Self-host fonts and the Video.js CSS (D16)
- Find every Google Fonts reference:
  - `src/app.html` (Playfair Display)
  - `src/routes/mcdaniel/**` (Figtree, and whatever `.mep-serif` uses)
  - any CSS `@import`
- Replace them with `@fontsource-variable/*` packages (or woff2 files in `static/fonts`) plus `@font-face` in the global CSS. Keep the family names, so the visual result is unchanged. Remove the preconnect and stylesheet tags.
- Email templates' Google Fonts `@import` stays; it runs in the mail client.
- `VideoPlayer.svelte`: remove the `vjs.zencdn.net` link and `import 'video.js/dist/video-js.css'`.
- Update `docs/tracking-inventory.md` rows 1 and 4 to say "removed".

## 3. MLP hero (AB B2, V3 6.2)
- Add `mlpHeroImage = { src: '/pfp.jpg', alt: 'Leonard McDaniel, estate planning attorney.', width, height }` in config. A future swap is one change.
- Render it in the homepage hero in place of any `picsum.photos` URL, which must no longer appear anywhere.

## 4. Readability (W8.3)
- Contrast: MLP body and caption text uses low-opacity navy on cream (`text-navy/40`, `/50`, …), and MEP uses `#1F2D3D/xx` on `#FCFBF8`.
  - Compute the effective contrast of each opacity step against its background.
  - On public pages, replace body and caption text below 4.5:1 with the lowest step that passes.
  - Large headings need 3:1.
  - Record the chosen minimums as comments in the CSS.
- Visible keyboard focus: add a global `:focus-visible` outline for links, buttons and form controls on both themes. Remove any `outline-none` that has no replacement.
- Alt text: every `<img>` on public routes gets real alt text, or `alt=""` with `aria-hidden` when it is decorative. No placeholder descriptions.

## 5. Mobile (W8.4)
At 375px wide, both homepages and every new MEP page must have:
- no horizontal scroll
- tap targets of at least 44px
- nothing clipped

Fix what fails. Add a short checklist of the pages checked to `docs/performance-baseline.md`.

## 6. Images and share assets (W8.5, V3 6.1)
- Public images: WebP or AVIF where practical, with explicit `width` and `height` so nothing shifts.
- Each site has its own favicon and a 1200×630 share image:
  - MLP: the existing `/og-image.png`.
  - MEP: new `static/og-mep.png`, built from `static/mcdaniel.png` with a small `sharp` script in `scripts/`. If that isn't possible, note TODO(Leonard).
- `seo.ts` picks the image per site.
- Remove any remaining Good Tree logos or images.

## 7. Prices (W8.2)
- Every public price uses `formatUsdWhole`: `$1,499`, `from $3,500`.

## 8. Error pages (W8.6)
- `src/routes/+error.svelte` (MLP style) and `src/routes/mcdaniel/+error.svelte` (MEP style).
- Both handle 404 and 403 and link back to home and key pages. No bare text.

## Done when
- Pinch-zoom works.
- No Google Fonts or zencdn requests from site pages.
- Contrast and focus are fixed.
- Branded error pages render on both hosts.
