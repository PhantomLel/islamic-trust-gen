<script lang="ts">
	import SiteShell from '$lib/components/content/SiteShell.svelte';

	let { data } = $props();
</script>

<SiteShell>
	<main class="max-w-4xl mx-auto px-5 pt-10 md:pt-14">
		<h1 class="text-3xl md:text-4xl tracking-tight text-navy">Videos</h1>

		{#if data.series.length}
			<nav aria-label="Series" class="mt-5 flex flex-wrap gap-2 text-sm">
				{#each data.series as s}
					<a href="/videos/series/{s.slug}" class="px-3 py-1 rounded-full border border-navy/15 text-navy/70 hover:border-navy/40">{s.name} ({s.count})</a>
				{/each}
			</nav>
		{/if}

		{#if data.videos.length === 0}
			<p class="mt-8 text-navy/65">No videos have been published yet.</p>
		{:else}
			<ul class="mt-8 grid sm:grid-cols-2 gap-6">
				{#each data.videos as v}
					<li>
						<a href="/videos/{v.slug}" class="group block rounded-2xl overflow-hidden border border-navy/10 bg-white/60 hover:shadow-md">
							{#if v.hasThumbnail}
								<img src="/videos/{v.slug}/thumbnail" alt="" aria-hidden="true" class="aspect-video w-full object-cover" loading="lazy" width="1280" height="720" />
							{/if}
							<div class="p-4">
								<h2 class="text-base text-navy font-medium group-hover:text-emerald-accent">{v.title}</h2>
								{#if v.duration}<p class="text-xs text-navy/65 mt-1">{v.duration}</p>{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</main>
</SiteShell>
