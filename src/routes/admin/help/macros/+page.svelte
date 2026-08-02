<script lang="ts">
	let { data } = $props();
</script>

<div class="mb-6">
	<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Staff macros</h1>
	<p class="text-navy/45 text-sm">Not bot-servable — reference text for Leonard/Sumayya email support.</p>
</div>

{#if data.macros.length === 0}
	<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
		<p class="text-navy/40 text-sm">No macros imported yet. Run <code class="font-mono">npm run import:kb</code>.</p>
	</div>
{:else}
	<div class="space-y-3">
		{#each data.macros as m (m.macroId)}
			<article class="rounded-xl border border-navy/[0.06] bg-white/70 p-5">
				<div class="flex items-center gap-2">
					<span class="font-mono text-[11px] text-navy/40">{m.macroId}</span>
					<h2 class="font-medium text-navy">{m.title}</h2>
				</div>
				<p class="mt-2 whitespace-pre-wrap text-sm text-navy/70 leading-relaxed">{m.body}</p>
			</article>
		{/each}
	</div>
{/if}
