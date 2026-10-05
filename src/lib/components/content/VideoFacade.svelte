<script lang="ts">
	/**
	 * Spec v3 §9: a facade, not an embed. The page loads a local thumbnail and a play
	 * button and makes no request to youtube.com or i.ytimg.com. Only after the visitor
	 * clicks play does the iframe load, from youtube-nocookie.com.
	 */
	let {
		youtubeId,
		title,
		thumbnailSrc,
	}: { youtubeId: string; title: string; thumbnailSrc: string } = $props();

	let playing = $state(false);
</script>

<div class="relative aspect-video overflow-hidden rounded-2xl bg-navy-dark" data-testid="video-facade">
	{#if playing}
		<iframe
			class="absolute inset-0 h-full w-full"
			src="https://www.youtube-nocookie.com/embed/{youtubeId}?autoplay=1&rel=0"
			{title}
			allow="autoplay; encrypted-media; picture-in-picture"
			allowfullscreen
			referrerpolicy="strict-origin-when-cross-origin"
		></iframe>
	{:else}
		<img src={thumbnailSrc} alt="" class="absolute inset-0 h-full w-full object-cover" width="1280" height="720" />
		<button
			type="button"
			onclick={() => (playing = true)}
			class="absolute inset-0 flex items-center justify-center bg-navy/25 transition-colors hover:bg-navy/15 cursor-pointer"
			aria-label="Play video: {title}"
		>
			<span class="flex h-16 w-16 items-center justify-center rounded-full bg-cream/95 shadow-lg">
				<svg class="ml-1 h-7 w-7 text-navy" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
			</span>
		</button>
	{/if}
</div>
