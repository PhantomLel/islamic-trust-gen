# 08: Google reviews via Elfsight (AA W5, D8)

Read `00-overview.md` and AA W5. D8 replaces the Places API approach: reviews come from the owner's paid Elfsight Google Reviews widget. There is no server code, no API key and no cache header for this task.

## 1. Config: `src/lib/config.ts`
- Add `googlePlaceId = 'ChIJszQ9uNfRQIYRg3017kJNF8Y'`.
- Add `elfsightReviewsAppId = 'fdfb23d6-45c5-41bd-950a-d905edc79df1'`.
- Rename `googleReviewsUrl` to `googleWriteReviewUrl` and build it from `googlePlaceId`.
- Add `googleReadReviewsUrl = https://search.google.com/local/reviews?placeid=${googlePlaceId}`.

## 2. Component: `src/lib/components/ReviewsBlock.svelte`
Replace the slot with the owner's embed:

```svelte
<script lang="ts">
	import { elfsightReviewsAppId, googleReadReviewsUrl, googleWriteReviewUrl } from '$lib/config';
	let { appId = elfsightReviewsAppId }: { appId?: string } = $props();
</script>

<svelte:head>
	<script src="https://elfsightcdn.com/platform.js" async></script>
</svelte:head>

<div class="elfsight-app-{appId}" data-elfsight-app-lazy></div>

<p>
	<a href={googleReadReviewsUrl} rel="noopener" target="_blank">Read all reviews on Google</a>
	<a href={googleWriteReviewUrl} rel="noopener" target="_blank">Leave a review</a>
</p>
```

- The two plain links always render, outside the widget. If Elfsight fails to load or the view limit is hit, the visitor still sees the links (W5.1 fallback). Never render a stored rating or count.
- Remove the `variant` prop. One widget serves both sites. Style the links to match the page they sit on (D10); leave the widget's look to the Elfsight dashboard.
- Load the script only from this component. It must never appear on the free will, the trust app, login, payment or dashboard (overview rule).

## 3. Wire it
- MLP home (`src/routes/+page.svelte`) and MEP home (`src/routes/mcdaniel/+page.svelte`): replace `<ReviewsBlock variant="…" />` with `<ReviewsBlock />`.
- `TestimonialDisclaimer` sits beside the block on both pages (V3 §2.8). MEP already has it; add it to the MLP reviews section.
- **No Review or AggregateRating JSON-LD** of our own (AA W5.2).
- Client-side navigation: load `/` directly, then navigate to it from another page with a client-side link. If the widget doesn't render after the client-side navigation, add `data-sveltekit-reload` to links that point to the home page.

## 4. Elfsight dashboard settings (human, record the result in the final report)
- No star-rating or keyword filter. Show every review Google returns (W5.1).
- Rich snippets / schema markup **off** (W5.2).
- Show the reviewer name, time and a Google attribution (W5.1).
- Elfsight branding hidden (paid plan).

## Tests
- SSR render of `ReviewsBlock`: contains `elfsight-app-fdfb23d6-45c5-41bd-950a-d905edc79df1`, the read link and the leave link, and no hard-coded rating or "Google reviews" count text.
- Home-page JSON-LD contains no `Review` or `AggregateRating`.

## Done when
Both homepages show the Elfsight widget, the read and leave links always render, and the browser shows no `Review` or `AggregateRating` markup after the widget loads (check DevTools once by hand).

`TODO(Leonard)`: Elfsight loads a third-party script and sees visitor IPs. List it in the privacy policy when AB B9 is built (D12).
