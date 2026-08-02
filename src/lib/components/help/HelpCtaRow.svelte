<script lang="ts">
	let { cta, queryId } = $props<{
		cta: { key: string; label: string; target: string };
		queryId: number;
	}>();

	async function trackClick() {
		await fetch('/api/help/cta', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ queryId, ctaKey: cta.key }),
		});
	}
</script>

<a
	class="inline-flex items-center gap-1.5 rounded-full bg-emerald-accent px-3.5 py-1.5 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-emerald-accent/90"
	href={cta.target}
	target={cta.target.startsWith('mailto:') ? undefined : '_blank'}
	rel="noreferrer"
	onclick={() => trackClick()}
>
	{cta.label}
	<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
	</svg>
</a>
