# Performance baseline (spec v3 §6)

Lighthouse mobile was **not run** in this implementation pass (no automated browser in CI; run locally before release).

Suggested commands after `npm run dev`:

```bash
npx lighthouse https://localhost:5173/ --only-categories=performance --preset=mobile --chrome-flags="--ignore-certificate-errors"
npx lighthouse https://localhost:5173/free-islamic-will --only-categories=performance --preset=mobile --chrome-flags="--ignore-certificate-errors"
npx lighthouse https://localhost:5173/mcdaniel --only-categories=performance --preset=mobile --chrome-flags="--ignore-certificate-errors"
```

Record scores here when run. Fix only failures that block load or make the primary CTA unusable.
