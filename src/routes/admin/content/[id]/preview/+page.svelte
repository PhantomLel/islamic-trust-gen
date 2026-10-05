<script lang="ts">
	import ContentPage from '$lib/components/content/ContentPage.svelte';

	let { data } = $props();
	let narrow = $state(false);
</script>

<div class="flex flex-wrap items-center gap-3 mb-4 text-sm">
	<a href="/admin/content/{data.id}" class="underline underline-offset-2">← Back to editor</a>
	<span class="rounded bg-amber-100 px-2 py-0.5 text-amber-900">Preview · {data.status.replace('_', ' ')}</span>
	<label class="ml-auto flex items-center gap-2"><input type="checkbox" bind:checked={narrow} /> Narrow (phone) width</label>
</div>

<!-- The same component the public page uses. -->
<div class="rounded-xl border border-navy/15 bg-cream pb-10 mx-auto transition-all" style="max-width: {narrow ? '390px' : '100%'}">
	<ContentPage view={data.view} preview />
</div>
