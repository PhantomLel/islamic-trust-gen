<script lang="ts">
	import SiteShell from '$lib/components/content/SiteShell.svelte';

	let { data } = $props();
</script>

<SiteShell>
	<main class="max-w-3xl mx-auto px-5 pt-10 md:pt-14">
		<p class="text-sm"><a href="/videos" class="text-navy/65 underline underline-offset-2">Videos</a></p>
		<h1 class="mt-2 text-3xl md:text-4xl tracking-tight text-navy">{data.name}</h1>
		<ol class="mt-8 space-y-5 list-decimal pl-5">
			{#each data.videos as v}
				<li>
					<a href="/videos/{v.slug}" class="text-emerald-accent underline underline-offset-2">{v.title}</a>
					{#if v.duration}<span class="text-xs text-navy/65 ml-2">{v.duration}</span>{/if}
				</li>
			{/each}
		</ol>
	</main>
</SiteShell>
