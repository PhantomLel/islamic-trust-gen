# W7 scan

Base: http://127.0.0.1:5173
Generated: 2026-10-05T20:44:54.857Z

13 pages. 0 hits. 0 unexplained.

## Pages

- MLP / — 200
- MLP /plans — 200
- MLP /trust — 200
- MLP /which-plan — 200
- MLP /free-islamic-will — 200
- MLP /inheritance-calculator — 200
- MLP /beneficiary-checklist — 200
- MLP /islamic-heirs-explained — 200
- MLP /community-property — 200
- MLP /answers — 200
- MLP /videos — 200
- MEP / — 200
- MEP /about — 200

## Hits

None.

## Source allowlist not always visible in the first HTML response

- `src/routes/inheritance-calculator/+page.svelte` still contains “Make it enforceable”. D19 says not to change the calculator. The button renders only after a calculation, so this fetch may not see it.
- `src/lib/config.ts` keeps `goodtree-trust`, `goodtree_fit`, `utm_source=goodtree`, and the nikah “same day” question.
- `src/routes/plans/+page.svelte` still says “shariah compliance gaps”. That is not the W7.1 string “shariah-compliant”. TODO(Leonard): replacement not in the spec.
