# 08: Live Google reviews (AA W5, D8)

Read `00-overview.md` and AA W5.

**Before coding**, check the current docs for:
- Place Details (New): https://developers.google.com/maps/documentation/places/web-service/place-details
- Places policies and attribution: https://developers.google.com/maps/documentation/places/web-service/policies

## 1. Server module: `src/lib/server/reviews.ts`
- `getPlaceReviews()` → `PlaceReviews | null`.
- Request: `GET https://places.googleapis.com/v1/places/ChIJszQ9uNfRQIYRg3017kJNF8Y`
  - Headers: `X-Goog-Api-Key: env.GOOGLE_PLACES_API_KEY` and `X-Goog-FieldMask: rating,userRatingCount,reviews,googleMapsUri`. Confirm the field names against the docs.
  - 3-second timeout (`AbortSignal.timeout`).
  - Any error or missing key → `null`.
- **No caching of any kind (D8):** no module cache, no DB, no CDN. The page responses that include reviews set `Cache-Control: private, no-store`.
- Map each review to `{ authorName, authorUri, authorPhotoUri?, rating, text, relativeTime, publishTime }` in **Google's order**. Never filter by stars.
- Put the place ID in `config.ts` as `googlePlaceId`.
- Constants:
  - `googleWriteReviewUrl` = `https://search.google.com/local/writereview?placeid=…` (already `googleReviewsUrl`; rename it).
  - `googleReadReviewsUrl`: use `googleMapsUri` from the response when available, otherwise `https://search.google.com/local/reviews?placeid=…`.

## 2. Component: `src/lib/components/ReviewsBlock.svelte`
- Props: `data: PlaceReviews | null`, `variant: 'full' | 'compact'`, `theme: 'mlp' | 'mep'`. Style it to match the site it sits on (D10).
- `full` (MEP): star rating, `[N] Google reviews`, all returned reviews.
- `compact` (MLP): rating, count, and the **two most recent** reviews (sort by `publishTime`).
- Each review shows the reviewer name (linked to `authorUri`), the relative time as returned, the stars and the text.
- Show the label "Reviews from Google", plus any attribution the policy page requires.
- Links: "Read all reviews on Google" and "Leave a review".
- `TestimonialDisclaimer` sits beside the block (V3 §2.8).
- `data === null` → render **only** the "Read all reviews on Google" link. Never fall back to a stored number.
- Plain HTML only. No Google script, iframe or widget in the browser. Reviewer photos load from Google only if the policy requires them; otherwise omit them.

## 3. Wire it
- `src/routes/+page.server.ts` (MLP home) and `src/routes/mcdaniel/+page.server.ts` (MEP home): load `reviews: await getPlaceReviews()` and set the no-store header. Fill the slots that tasks 05 and 06 left.
- **No Review or AggregateRating JSON-LD** (AA W5.2). Add a test asserting the home pages' JSON-LD contains neither.
- Add `GOOGLE_PLACES_API_KEY` to `.env.example`.

## Tests
- Mock `fetch`: the mapping preserves order; the compact variant picks the 2 newest; an error returns null.
- Component test (or SSR string test): null → only the read link; the count is never hard-coded.

## Done when
Both homepages show live reviews, the count matches Google, and a failure shows only the link.
