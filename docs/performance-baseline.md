# Performance baseline (spec v3 §6)

Lighthouse mobile was **not run** in this implementation pass (no automated browser in CI; run locally before release).

Suggested commands after `npm run dev`:

```bash
npx lighthouse https://localhost:5173/ --only-categories=performance --preset=mobile --chrome-flags="--ignore-certificate-errors"
npx lighthouse https://localhost:5173/free-islamic-will --only-categories=performance --preset=mobile --chrome-flags="--ignore-certificate-errors"
npx lighthouse https://localhost:5173/mcdaniel --only-categories=performance --preset=mobile --chrome-flags="--ignore-certificate-errors"
```

Record scores here when run. Fix only failures that block load or make the primary CTA unusable.

## 375px check (task 09, 11 October 2026)

Checked in the browser at 375px wide. No horizontal scroll. Links and buttons are at least 44px. Nothing clipped.

- MLP `/`
- MEP `/` (`/mcdaniel`)
- `/mcdaniel/attorney`
- `/mcdaniel/legacy-plan`
- `/mcdaniel/family-waqf-plan`
- `/mcdaniel/probate-estate-administration`
- `/mcdaniel/business-succession-planning`
- MLP 404 and MEP 404

