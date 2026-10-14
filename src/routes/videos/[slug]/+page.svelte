<script lang="ts">
	import SiteShell from '$lib/components/content/SiteShell.svelte';
	import VideoFacade from '$lib/components/content/VideoFacade.svelte';
	import TestimonialDisclaimer from '$lib/components/TestimonialDisclaimer.svelte';

	let { data } = $props();
	const v = $derived(data.view);
</script>

<SiteShell>
	<article class="max-w-3xl mx-auto px-5 pt-10 md:pt-14" data-testid="video-page">
		<h1 class="text-3xl md:text-4xl tracking-tight text-navy leading-tight text-balance">{v.title}</h1>

		<div class="mt-6">
			<VideoFacade youtubeId={v.youtubeId} title={v.title} thumbnailSrc="/videos/{v.slug}/thumbnail" />
		</div>

		{#if v.isTestimonial}
			<div class="mt-4 space-y-2" data-testid="testimonial-block">
				{#if v.speaker}
					<p class="text-sm text-navy" data-testid="speaker">{v.speaker.title} — {v.speaker.relationship}</p>
				{/if}
				<TestimonialDisclaimer class="text-sm leading-relaxed text-navy/70" />
			</div>
		{/if}

		<p class="mt-5 text-navy/70 leading-relaxed">{v.description}</p>
		{#if v.duration}<p class="mt-1 text-xs text-navy/65">Length {v.duration}</p>{/if}

		{#if v.relatedPage}
			<p class="mt-4 text-sm"><a href="/answers/{v.relatedPage.slug}" class="text-emerald-accent underline underline-offset-2">Read: {v.relatedPage.title}</a></p>
		{/if}

		<section class="mt-10" aria-labelledby="transcript-heading" data-testid="transcript">
			<h2 id="transcript-heading" class="text-2xl tracking-tight text-navy mb-3">Transcript</h2>
			<div class="whitespace-pre-line text-navy/75 leading-relaxed">{v.transcript}</div>
		</section>

		{#if v.series && (data.previous || data.next)}
			<nav aria-label="Series" class="mt-12 flex justify-between gap-4 text-sm border-t border-navy/10 pt-5">
				<span>{#if data.previous}<a href="/videos/{data.previous.slug}" class="text-emerald-accent underline underline-offset-2">← Previous: {data.previous.title}</a>{/if}</span>
				<span class="text-right">{#if data.next}<a href="/videos/{data.next.slug}" class="text-emerald-accent underline underline-offset-2">Next: {data.next.title} →</a>{/if}</span>
			</nav>
		{/if}
		{#if v.seriesSlug}
			<p class="mt-4 text-sm"><a href="/videos/series/{v.seriesSlug}" class="text-navy/65 underline underline-offset-2">More in {v.series}</a></p>
		{/if}
	</article>
</SiteShell>
