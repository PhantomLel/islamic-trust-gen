# 05: MLP copy and the banned-words sweep

Read `00-overview.md`, then AA W2, W3.1, W3.2, W6.2 and W7, and AB B6.5 and B8.

All copy below is approved. Apply it verbatim; change the layout, not the words.

## Homepage: `src/routes/+page.svelte` (AA W2, in page order)
- **W2.1 Title and meta**: set them in `src/lib/seo.ts` (`staticRouteSeo['/']`), not in the page.
- **W2.2 Nav**: show "Guided Trust" through `productNameShortBare()`.
- **W2.3 Hero**:
  - New hero sentence.
  - New firm identity line: update `firmIdentityLine` in config.
  - The hero image is handled in task 09.
- **W2.4 Problem section**: heading, item 02, item 03.
- **W2.5 Plans section**:
  - New lead sentence.
  - Guided Trust card: badge "Online"; title and button via the product-name config; the married-couples description; the "Distribution built around the Qur'anic shares" bullet; price line `$1,499 flat fee · attorney-supervised` using `formatUsdWhole`.
  - Below the cards: "Not ready yet? Start with the free Islamic will.", linking to `/free-islamic-will`.
  - Replace "Compare all plans →" (the old "View all five plans →" link).
- **W2.6 Giving section**:
  - Heading "Giving back".
  - The two paragraphs. The second already exists as `jabalLandingCopy()`; check it matches W2.6.
  - Links relabelled "See Jabal's public filings" (ProPublica) and "Learn more about Jabal".
- **W2.7 Endowment section**:
  - Keep the heading and the first paragraph.
  - Delete the second paragraph and all three cards.
  - Add the Family Waqf Plan sentence.
  - The button points to `${mcdanielOrigin}/family-waqf-plan`.
- **W2.8 Attorney section**:
  - The new "Since 2022…" sentence.
  - Timeline entry `2017 — UH Law Center, JD`.
  - The profile link goes to `attorneyProfileUrl`.
- **W2.9 Community section**:
  - Heading "What clients say."
  - Remove every testimonial, the hard-coded count and the `g.page` links.
  - Leave a `<ReviewsBlock variant="compact" />` slot for task 08.
- **W2.10 FAQ**:
  - The new probate heading.
  - Add or replace the four AB B8 Q&As verbatim.
  - Check every other answer against W7.
  - Question-form headings. Each answer's first sentence must stand alone.
- **W2.11**: "takes about ten minutes."
- **W2.12 Footer**:
  - The two new paragraphs.
  - `formatFirmNapLine()`.
  - The "Legacy Plan" link points to `${mcdanielOrigin}/legacy-plan`.

## Free-will landing: `/free-islamic-will` (AA W3.1 with AB B6.5)
- Meta (in seo.ts), the intro line and the availability line come from W3.1.
- The "will drafted to reflect…" bullet and the privacy line use the **AB B6.5** replacements, not W3.1's. The privacy line is plain text (D12).

## Trust page: `/trust` (AA W3.2)
- Apply every row of the W3.2 table.
- Add the eligibility bullet "You are married and planning together."
- Giving block → the W2.6 copy. Remove "treasurer", "personally oversees its finances" and "the same day you buy".
- "Four documents… Nothing extra to buy." becomes "One flat fee. One optional add-on if you need us to find your deed."

## W7 sweep (all MLP public pages)
- Apply the W7 table to every public route, including `/plans`, `/which-plan`, `/inheritance-calculator`, `/community-property`, `/islamic-heirs-explained`, `/beneficiary-checklist`, `/answers` and `/videos`.
- `/plans` and `/which-plan` belong to task 11, but remove W6.2 phrases there now. For example, `/plans` still says "Afterfund partnership", "shariah-compliant ETF" and "returns proceeds automatically".
- Create `src/lib/copy/banned.ts` exporting the AA W7.1 list plus the W6.2 phrases.
- Create `src/lib/copy/banned.test.ts`:
  - Scan `src/routes/**/*.svelte` (excluding `admin/**`, `create-trust/**`, `dashboard/**`, `make-your-trust-work/**`) and `src/lib/config.ts` for banned strings.
  - Matching is case-insensitive.
  - Keep an explicit allowlist of `{file, string, reason}` for internal keys.
- Create `scripts/w7-scan.mjs`:
  - Fetch the rendered HTML of every sitemap URL on both hosts (base URL as an argument, plus a `Host` header).
  - Write `docs/w7-scan.md` listing hits. This is for Leonard (AA W7.1).

## Done when
- The banned-words test passes.
- `docs/w7-scan.md` from a local preview shows no unexplained hits on MLP.
