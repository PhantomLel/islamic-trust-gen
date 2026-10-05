# 07: Hosts, redirects, canonical URLs (AA W1, D9)

Read `00-overview.md` and AA W1.

Today, host logic is duplicated across `src/hooks.ts`, `src/hooks.server.ts` and `src/lib/seo.ts`.

## 1. One pure module: `src/lib/hostPolicy.ts`
Export:
- `hostSite(hostname)` → `'mlp' | 'mep' | 'freewill' | 'dev'`. Includes the apex and www variants of all three domains. localhost and 127.0.0.1 → `'dev'`, which behaves as MLP.
- `MEP_APP_PATHS`: `/login`, `/signup`, `/trust`, `/create-trust`, `/dashboard`, `/admin`, `/make-your-trust-work`, `/free-islamic-will`, `/inheritance-calculator`, `/which-plan`, `/plans`, `/answers`, `/videos`, `/consultation`, `/unsubscribe`. Prefix match.
- `redirectFor(url, method)` → `{ status: 301, location } | null`. Only for GET and HEAD; never redirect `/api/*`. Rules, in order:
  1. Any freemuslimwill host → `https://www.muslimlegacyplanning.com/free-islamic-will` + the **original query string** (AA W1.5).
  2. Apex muslimlegacyplanning.com or mcdanielestateplanning.com → the same path and query on `www.` This backs up the Vercel domain redirect.
  3. MEP host and the path matches `MEP_APP_PATHS` → `${mlpOrigin}` + path + query (AA W1.3).
  4. MLP host and the path is `/mcdaniel` or `/mcdaniel/*` → `${mcdanielOrigin}` + the path without the prefix + query.
- `rerouteFor(url)` → the internal path for the MEP host (`/mcdaniel…`), or undefined. Keep the existing shared paths: `/robots.txt` and `/sitemap.xml`.

## 2. Wire it
- `src/hooks.ts` `reroute` uses `rerouteFor`.
- In `src/hooks.server.ts`, the first handle uses `redirectFor`. Replace `handleFreeWillRedirect`, which is currently a 308 that drops the query.
- `seo.ts` and `robots.ts` import `hostSite` and `publicPathFor`. Delete the local `MCDANIEL_HOSTS` copies.
- MEP 404s render MEP-styled error pages (task 09 makes them branded).

## 3. Canonical links everywhere (AA W1.4, W1.5, W4.8)
- Grep `src/` for `https://mcdanielestateplanning.com`, `https://muslimlegacyplanning.com`, `freemuslimwill.org` and `g.page/r/review`. Use `mcdanielOrigin` and `mlpOrigin` and link directly to `/free-islamic-will`.
- `vite.config.ts` `allowedHosts`: already lists the www hosts. Keep it.
- Auth: check that better-auth `baseURL` and `trustedOrigins` and env `ORIGIN` use `https://www.muslimlegacyplanning.com`, and that magic-link and Stripe return URLs land on www. Report anything that needs an env change in Vercel.

## 4. Cross-links (AA W1.6)
- MEP → MLP: the free will and the Guided Trust (homepage line from task 06, plus the footer).
- MLP → MEP: the attorney page, the Legacy Plan, the Family Waqf Plan, probate, business succession and booking. Use the MLP footer and nav. Most of this was done in task 05; fill any gaps.

## Tests: `src/lib/hostPolicy.test.ts`
- freemuslimwill with `?src=masjid-houston-hamza` → 301 that keeps the query.
- Apex → www, keeping the path and query.
- MEP `/admin/users`, `/plans` and `/free-islamic-will?x=1` → 301 to the MLP www URL with the same path and query.
- MEP `/`, `/attorney` and `/legacy-plan` → reroute to `/mcdaniel…` with no redirect.
- MLP `/mcdaniel/attorney` → 301 to MEP `/attorney`.
- A POST to MEP `/api/auth/...` → no redirect.
- Update `seo.test.ts` for www.

## Done when
No app route is served on MEP. Every internal link uses a canonical www URL.
