<script lang="ts">
	import { elfsightReviewsAppId, googleReadReviewsUrl, googleWriteReviewUrl } from '$lib/config';

	/** AA-W5, D8. Elfsight widget plus the two Google links, which stay visible if the widget fails. */
	let {
		appId = elfsightReviewsAppId,
		linksClass = '',
	}: { appId?: string; linksClass?: string } = $props();
</script>

<svelte:head>
	<script src="https://elfsightcdn.com/platform.js" async></script>
</svelte:head>

<div class="elfsight-app-{appId}" data-elfsight-app-lazy></div>

<p class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm {linksClass}">
	<a
		href={googleReadReviewsUrl}
		rel="noopener"
		target="_blank"
		class="min-h-11 inline-flex items-center underline underline-offset-4 hover:opacity-80"
	>
		Read all reviews on Google
	</a>
	<a
		href={googleWriteReviewUrl}
		rel="noopener"
		target="_blank"
		class="min-h-11 inline-flex items-center underline underline-offset-4 hover:opacity-80"
	>
		Leave a review
	</a>
</p>
