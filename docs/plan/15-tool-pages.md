# 15: Tool landing pages (V3 §10)

Read `00-overview.md` and V3 §10. Use approved copy only. Where V3 §10 asks for prose that no spec supplies, keep the existing approved text and add TODO(Leonard).

## 1. `/free-islamic-will` (V3 10.1)
- The page content renders **server-side above the tool**, so the raw HTML contains all of it. Check with `curl` or an SSR test, because today the route is mostly a client app.
- Structure, top to bottom:
  1. H1. Keep the current H1 unless it is already question-shaped; TODO(Leonard) for a question-form H1 and a 40–60 word answer summary.
  2. The existing intro.
  3. The W3.1/B6.5 bullets.
  4. The availability line ("Available for Texas and California.").
  5. A FAQ block containing the two free-will questions from AB B8 ("Is the free Islamic will legally binding?", "Which Islamic inheritance method does the free will use?"), verbatim, marked up as `FAQPage`.
  6. The tool, launching in place.
- The page is readable nationally; the tool stays gated (task 02).
- Open Graph and share data come from task 12.

## 2. `/inheritance-calculator` (V3 10.2)
- Same treatment: server-rendered intro and the calculator below it.
- The estimate label comes from task 11.
- No FAQ unless approved Q&As exist. Do not write new ones.
- Specific `og:description`: reuse a sentence already on the page.

## 3. `/trust` (V3 10.3)
- Confirm, without adding copy:
  - The full product name appears with `productAttorneyReviewSentence` wherever it is a heading or offer (V3 2.1, 2.9).
  - The W3.2 edits from task 05 are live.
  - The FAQ is marked up as `FAQPage`.

## Tests
SSR tests (render the route's server output, or `+page.svelte` with `svelte/server` `render`) asserting that:
- `/free-islamic-will` HTML contains the B8 questions and the availability line before any tool markup.
- `/trust` contains `productAttorneyReviewSentence`.

## Done when
The content of all three pages is in the raw HTML with FAQ schema where applicable, and the remaining copy gaps are listed as TODO(Leonard).
