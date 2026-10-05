# 11: Plans, routing quiz and calculator (AA W3.3)

Read `00-overview.md`, AA W3.3 and AA W7.

Files: `src/routes/plans/+page.svelte`, `src/routes/which-plan/**`, `src/routes/inheritance-calculator/**`, and the quiz logic (find where `recommend*` or `which-plan` outcomes are computed).

## 1. `/plans`
- List exactly four services: Free Islamic Will, Guided Trust, Legacy Plan and Family Waqf Plan.
  - Remove any other plan cards.
  - Guided Trust title and supporting sentence come from config (V3 2.1, 2.9).
- Add one line or block linking to MEP `/probate-estate-administration` and `/business-succession-planning`. Use the card titles from AA W4.2 as link text; no new copy.
- Family Waqf Plan card:
  - Remove the "Afterfund partnership" box and every W6.2 phrase.
  - Use the AA W4.2 Family Waqf card text and link to `${mcdanielOrigin}/family-waqf-plan`.
- No plan counts in headings or links ("five plans", "4 plans").
- Prices use `formatUsdWhole`.
- Apply W7 to every line.

## 2. `/which-plan` quiz
- Outcomes route only to the four services above, or to MEP probate or business-succession pages, or to booking.
- Out-of-state answer: the outcome states plainly that we serve Texas and California only. Reuse `outOfStateExitParagraphs[0]` from config. No "coming soon".
- **A single person must never reach the Guided Trust**; it supports married couples only. Route them to the free will or the Legacy Plan instead.
- Add `which-plan` logic tests covering every outcome branch:
  - single never gets the Guided Trust
  - out-of-state never gets a product
- Apply W7 to every line.

## 3. Calculator
- Label every result view, on screen and in any printout, with `Estimate based on the information entered.` Add TODO(Leonard) to confirm the exact wording; W3.3 requires the label but doesn't provide it.
- Apply W7 to every line, for example "exact share".
- No school selector change: the calculator stays as it is.

## 4. Report
List every string you changed in `docs/w3-3-changes.md`, as before → after, for Leonard (W3.3: "report what you change").

## Done when
- The quiz tests pass.
- `/plans` lists the four services.
- The banned-words test is clean for these routes.
