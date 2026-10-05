# 06: MEP pages and copy

Read `00-overview.md`, then AA W4, W6 and W9.1, and AB B7.

MEP routes live in `src/routes/mcdaniel/**`. Keep MEP's own look: its fonts, the `#FCFBF8` / `#1F2D3D` / `#9A7B45` palette and the `.mep` classes (D10).

## 1. Shared MEP shell
- Extract the header, footer and fonts from `src/routes/mcdaniel/+page.svelte` into `src/routes/mcdaniel/+layout.svelte`, or MEP components. Every MEP page then shares them.
- Footer (AA W4.7):
  - "Serving clients in Texas and California."
  - `formatFirmNapLine()`.
  - Keep the existing "Attorney Advertising…" disclaimer.
  - Links to the new pages.
- All MLP links use `mlpOrigin` (www, AA W4.8).

## 2. Homepage edits: `src/routes/mcdaniel/+page.svelte`
- **W4.2 Services**:
  - Replace the six cards with the five from the W4.2 table.
  - Each card links to its page; the consultation card links to booking.
  - Add the "Prefer to start online?…" line, linking to MLP `/trust` and `/free-islamic-will`.
- **W4.3 Attorney (short)**:
  - The two-sentence short bio.
  - Photo.
  - Timeline `2017 — UH Law Center, JD · 2021 — Licensed in Texas · 2023 — Licensed in California`.
  - Link to `/attorney`.
  - Remove the duplicated MLP text.
- **W4.4 Reviews**:
  - Keep the heading "Client Experiences".
  - Remove the testimonials array and the hard-coded count.
  - Leave a `<ReviewsBlock variant="full" />` slot for task 08.
- **W4.5**: new "One Practice, Two Platforms" paragraph.
- **W4.6**: new closing call-to-action line.
- **W1.2**: no paragraph may appear on both sites. Diff the MEP homepage text against the MLP homepage and remove MEP duplicates.

## 3. `/attorney` (AA W4.3)
- Move `src/routes/mcdaniel/about` to `src/routes/mcdaniel/attorney`.
- Use the full four-paragraph W4.3 bio verbatim, including the UCLA and Yaser Ali sentences. Render the product name from config.
- Do not list Arizona. Do not name an Islamic institution.
- Keep the facts list and the photo.
- Add `src/routes/mcdaniel/about/+server.ts` → 301 to `/attorney`.
- Update the seo.ts route keys and the sitemap entries.

## 4. Practice pages (AA W4.1, AB B7, AA W6.1)
- New component `src/routes/mcdaniel/PracticePage.svelte`, in MEP style. Order:
  1. H1
  2. Summary block, directly under the H1 and visually distinct, with nothing in between
  3. Body
  4. "Book a consultation" button (`consultationBookingUrl`)
- New routes:
  - `/legacy-plan`, `/probate-estate-administration` and `/business-succession-planning`: B7 copy, verbatim. Keep the question-form subheadings (for example, "How is the Legacy Plan different…") as H2s.
  - `/family-waqf-plan`: the W6.1 copy verbatim, **including** the optional halal-funds sentence (AB B0). Button "Book a consultation".
- No jurisdiction caveat on these pages; none of the bodies is a community-property example. Add `TODO(Leonard)` in your report to confirm.
- Never write any W6.2 phrase.

## 5. SEO hooks (data only; task 10 does the schema)
- Add titles and descriptions to `src/lib/seo.ts`, following the AA W9.1 pattern: `[Service] │ McDaniel Estate Planning, PLLC — Texas & California`. The description is the W4.2 card text.
- `/attorney` title: from W9.1.
- Add all five new paths to `sitemapRoutes` for `mcdaniel`.

## Tests
- A route smoke test or `seo.test.ts` additions: each new path has a title and description and is in the MEP sitemap.
- `/about` returns 301 to `/attorney`.
- The banned-words test (task 05) now also scans `src/routes/mcdaniel/**`.

## Done when
- MEP has the attorney page and four practice pages (Legacy Plan, Family Waqf Plan, Probate, Business Succession).
- The homepage cards link to them.
- No testimonials remain.
