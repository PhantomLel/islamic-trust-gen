# 10: Search foundations (AA W9, V3 §6 deltas)

Read `00-overview.md`, AA W9 and V3 §6.

Existing pieces: `src/lib/seo.ts`, `src/lib/robots.ts`, the sitemap route and `seo.test.ts`. Much of V3 §6 is already built. This task applies the AA deltas.

## 1. Titles (W9.1)
Set from `staticRouteSeo` in `seo.ts`:
- MLP home: from W2.1.
- `/free-islamic-will`: title `Free Islamic Will for Texas & California │ Muslim Legacy Planning`, and the W3.1 meta.
- MEP home: unchanged.
- `/attorney` and the practice pages: from task 06.
- Every MEP route gets its MEP title. No MLP title may appear on an MEP page, or the reverse; add a test.

## 2. Keep app pages out of search (W9.2)
- Noindex plus a robots disallow, on **both** hosts:
  - `/login`
  - `/signup`
  - `/dashboard`
  - `/create-trust` (includes payment)
  - `/make-your-trust-work`
  - `/admin`
  - `/consultation`
  - `/unsubscribe`
  - `/api/`
- `robotsTxt('mcdaniel')` currently disallows nothing; give it the same list.
- `isNoindexRoute` covers every one of these.

## 3. Headings (W9.3)
- Exactly one `<h1>` per public page on both hosts. Fix pages with zero or more than one.
- FAQ questions render as headings, for example `<h3>`. The first sentence of each answer must stand alone; the copy already does this.

## 4. Structured data (W9.4, W9.6)
Rewrite `organizationJsonLd` and `attorneyJsonLd`:

**MEP** (home, plus a reference on other MEP pages)
- `LegalService` with:
  - `@id: firmLegalServiceId`
  - name, url (www), telephone
  - `address`: a `PostalAddress` built from `firmNap`
  - `areaServed`: Texas and California
  - `founder: { '@id': attorneyPersonId }`
  - `sameAs: ['https://www.google.com/maps/place/?q=place_id:ChIJszQ9uNfRQIYRg3017kJNF8Y']`. No Avvo yet.

**`/attorney`**
- `Person` with:
  - `@id: attorneyPersonId`
  - name, jobTitle
  - `alumniOf` University of Houston Law Center
  - `worksFor: { '@id': firmLegalServiceId }`
  - image
  - credentials for Texas 2021 and California 2023

**Practice pages**
- One `Service` each, with `provider: { '@id': firmLegalServiceId }`, `areaServed` Texas and California, name and description.

**MLP home**
- `Organization`, plus `WebSite` with `parentOrganization: { '@id': firmLegalServiceId }`.

**Both sites**
- `FAQPage` on every FAQ block: MLP home, `/trust`, `/free-islamic-will` and any other page with one.
- `BreadcrumbList` on every interior page.
- The `Article` author in `src/lib/server/content/view.ts` uses `@id: attorneyPersonId`.
- **No `Review` or `AggregateRating`** anywhere.

**Tests**
- Update `seo.test.ts`: the old "no address" test is flipped. The address is now required and must equal `firmNap`.
- The NAP inside JSON-LD matches `formatFirmNapLine()`, character for character.

## 5. Sitemaps
- The MEP sitemap includes `/`, `/attorney` and the four practice pages, all www.
- The MLP sitemap is unchanged, plus whatever later tasks add (webinar page).

## 6. Performance baseline (V3 6.7)
- Run Lighthouse (mobile) on both homepages and `/free-islamic-will` (`npx lighthouse … --output json`, if Chrome is available).
- Record the scores in `docs/performance-baseline.md`. If you can't run it, leave TODO(Leonard).

## Done when
- The schema tests pass.
- Both robots files disallow the app routes.
- One H1 per page.
- No review markup.
