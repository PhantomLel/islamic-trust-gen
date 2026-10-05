<script lang="ts">
	import TestimonialDisclaimer from '$lib/components/TestimonialDisclaimer.svelte';
	import type { AnswerView } from '$lib/server/content/view';

	let { view, preview = false }: { view: AnswerView; preview?: boolean } = $props();

	const reviewed = $derived(
		view.lastReviewedOn
			? new Date(view.lastReviewedOn + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
			: null
	);
</script>

<!--
	Spec v3 §7.4 order, with nothing between the first two:
	1 H1  2 answer summary  3 byline + reviewed date  4 body  5 jurisdiction caveat  6 FAQ  7 related  8 one CTA
-->
<article class="max-w-3xl mx-auto px-5 pt-10 md:pt-14" data-testid="content-page">
	<h1 class="text-3xl md:text-4xl tracking-tight text-navy leading-tight text-balance">{view.title}</h1>

	<div
		data-testid="answer-summary"
		class="mt-6 rounded-r-xl border-l-4 border-emerald-accent bg-emerald-accent/6 pl-5 pr-5 py-4 ml-1 text-lg md:text-xl leading-relaxed text-navy"
	>
		{view.answerSummary}
	</div>

	<p class="mt-5 text-sm text-navy/60 leading-relaxed" data-testid="byline">
		<a href={view.byline.href} class="font-medium text-navy underline underline-offset-2 hover:text-emerald-accent">{view.byline.name}</a>{view.byline.rest}
		{#if reviewed}<span class="block mt-1">Last reviewed {reviewed}.</span>{/if}
	</p>

	<div class="content-body mt-10 text-[17px] leading-relaxed text-navy/80">
		{@html view.bodyHtml}
	</div>

	{#if view.caveat}
		<aside data-testid="jurisdiction-caveat" class="mt-10 rounded-xl border border-navy/12 bg-white/70 px-5 py-4 text-sm leading-relaxed text-navy/70">
			{view.caveat}
		</aside>
	{/if}

	{#if view.faqs.length}
		<section class="mt-12" aria-labelledby="faq-heading" data-testid="faq">
			<h2 id="faq-heading" class="text-2xl tracking-tight text-navy mb-4">Frequently asked questions</h2>
			<dl class="space-y-5">
				{#each view.faqs as f}
					<div>
						<dt class="font-medium text-navy">{f.question}</dt>
						<dd class="mt-1 text-navy/70 leading-relaxed">{f.answer}</dd>
					</div>
				{/each}
			</dl>
		</section>
	{/if}

	{#if view.related.length}
		<section class="mt-12" aria-labelledby="related-heading" data-testid="related">
			<h2 id="related-heading" class="text-2xl tracking-tight text-navy mb-3">Related questions</h2>
			<ul class="space-y-2">
				{#each view.related as r}
					<li><a href="/answers/{r.slug}" class="text-emerald-accent underline underline-offset-2 hover:text-emerald-light">{r.title}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if view.cta}
		<div class="mt-12" data-testid="cta">
			<a
				href={view.cta.href}
				target={view.cta.external ? '_blank' : undefined}
				rel={view.cta.external ? 'noopener' : undefined}
				class="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-navy text-cream text-sm font-medium hover:bg-navy-light"
			>
				{view.cta.label}
			</a>
			{#if view.cta.note}<p class="mt-2 text-sm text-navy/55">{view.cta.note}</p>{/if}
		</div>
	{/if}
</article>

<style>
	.content-body :global(h2) {
		font-size: 1.5rem;
		line-height: 1.25;
		letter-spacing: -0.01em;
		margin: 2.25rem 0 0.75rem;
		color: var(--color-navy, #1f2d3d);
	}
	.content-body :global(h3) {
		font-size: 1.2rem;
		margin: 1.75rem 0 0.5rem;
		color: var(--color-navy, #1f2d3d);
	}
	.content-body :global(p) {
		margin: 0 0 1.1rem;
	}
	.content-body :global(ul),
	.content-body :global(ol) {
		margin: 0 0 1.1rem 1.4rem;
	}
	.content-body :global(ul) {
		list-style: disc;
	}
	.content-body :global(ol) {
		list-style: decimal;
	}
	.content-body :global(li) {
		margin: 0.25rem 0;
	}
	.content-body :global(blockquote) {
		border-left: 3px solid rgba(74, 124, 111, 0.5);
		padding-left: 1rem;
		margin: 1.25rem 0;
		color: rgba(31, 45, 61, 0.7);
	}
	.content-body :global(a) {
		color: var(--color-emerald-accent, #4a7c6f);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
