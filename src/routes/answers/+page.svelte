<script lang="ts">
	import SiteShell from '$lib/components/content/SiteShell.svelte';
	import { JURISDICTION_LABELS, type ContentJurisdiction } from '$lib/content/types';

	let { data } = $props();

	function href(params: Record<string, string | number | null>): string {
		const sp = new URLSearchParams();
		for (const [k, v] of Object.entries(params)) if (v !== null && v !== '') sp.set(k, String(v));
		const s = sp.toString();
		return s ? `/answers?${s}` : '/answers';
	}
</script>

<SiteShell searchQuery={data.q}>
	<main class="max-w-3xl mx-auto px-5 pt-10 md:pt-14">
		<h1 class="text-3xl md:text-4xl tracking-tight text-navy">Answers</h1>

		<form method="get" action="/answers" class="mt-6 flex gap-2" role="search">
			<label class="sr-only" for="answers-q">Search answers and videos</label>
			<input id="answers-q" name="q" value={data.q} placeholder="Search answers and videos" class="flex-1 px-4 py-2.5 rounded-lg border border-navy/15 bg-white text-sm" />
			{#if data.categoryId}<input type="hidden" name="category" value={data.categoryId} />{/if}
			{#if data.jurisdiction}<input type="hidden" name="jurisdiction" value={data.jurisdiction} />{/if}
			<button class="px-5 py-2.5 rounded-lg bg-navy text-cream text-sm">Search</button>
		</form>

		{#if data.categories.length}
			<nav aria-label="Categories" class="mt-6 flex flex-wrap gap-2 text-sm">
				<a href={href({ q: data.q, jurisdiction: data.jurisdiction })} class="px-3 py-1 rounded-full border {data.categoryId ? 'border-navy/15 text-navy/65' : 'border-navy bg-navy text-cream'}">All</a>
				{#each data.categories as c}
					<a href={href({ q: data.q, category: c.id, jurisdiction: data.jurisdiction })} class="px-3 py-1 rounded-full border {data.categoryId === c.id ? 'border-navy bg-navy text-cream' : 'border-navy/15 text-navy/65'}">{c.name}</a>
				{/each}
			</nav>
		{/if}

		<nav aria-label="Jurisdiction" class="mt-3 flex flex-wrap gap-2 text-sm">
			<a href={href({ q: data.q, category: data.categoryId })} class="px-3 py-1 rounded-full border {data.jurisdiction ? 'border-navy/15 text-navy/65' : 'border-navy bg-navy text-cream'}">Any state</a>
			{#each ['TX', 'CA'] as j}
				<a href={href({ q: data.q, category: data.categoryId, jurisdiction: j })} class="px-3 py-1 rounded-full border {data.jurisdiction === j ? 'border-navy bg-navy text-cream' : 'border-navy/15 text-navy/65'}">{JURISDICTION_LABELS[j as ContentJurisdiction]}</a>
			{/each}
		</nav>

		{#if data.q && data.hits.length}
			<section class="mt-10" aria-labelledby="hits-heading">
				<h2 id="hits-heading" class="text-lg text-navy mb-3">Search results for “{data.q}”</h2>
				<ul class="space-y-4">
					{#each data.hits as h}
						<li>
							<a href={h.href} class="text-emerald-accent underline underline-offset-2 hover:text-emerald-light">{h.title}</a>
							<span class="ml-2 text-[11px] uppercase tracking-wider text-navy/40">{h.type === 'video' ? 'Video' : 'Answer'}</span>
							<p class="text-sm text-navy/60 mt-0.5">{h.snippet}</p>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="mt-10" aria-label="All answers">
			{#if data.pages.length === 0}
				<p class="text-navy/55">{data.q || data.categoryId || data.jurisdiction ? 'No answers match those filters.' : 'No answers have been published yet.'}</p>
			{:else}
				<ul class="divide-y divide-navy/10">
					{#each data.pages as p}
						<li class="py-5">
							<h2 class="text-lg text-navy"><a href="/answers/{p.slug}" class="hover:text-emerald-accent">{p.title}</a></h2>
							<p class="mt-1 text-sm text-navy/60 leading-relaxed">{p.answerSummary}</p>
							<p class="mt-1 text-xs text-navy/40">{[p.categoryName, p.jurisdiction ? JURISDICTION_LABELS[p.jurisdiction as ContentJurisdiction] : null].filter(Boolean).join(' · ')}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</main>
</SiteShell>
