<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let width = $state('');
	let height = $state('');

	function readSize(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			width = String(img.naturalWidth);
			height = String(img.naturalHeight);
			URL.revokeObjectURL(url);
		};
		img.src = url;
	}
</script>

<h1 class="text-2xl tracking-tight mb-6">Images</h1>
{#if form?.message}<p class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800" role="alert">{form.message}</p>{/if}
<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance class="rounded-xl border border-navy/10 bg-white p-4 mb-8 space-y-3 max-w-xl">
	<div><label for="file" class="block text-sm mb-1">Image (JPG, PNG or WebP, under 5 MB)</label><input id="file" type="file" name="file" accept="image/jpeg,image/png,image/webp" required onchange={readSize} /></div>
	<div><label for="altText" class="block text-sm mb-1">Alt text (required)</label><input id="altText" name="altText" required class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm" /></div>
	<input type="hidden" name="width" value={width} /><input type="hidden" name="height" value={height} />
	<button class="px-4 py-2 rounded-lg bg-navy text-cream text-sm">Upload</button>
</form>
<ul class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
	{#each data.media as m}
		<li class="rounded-xl border border-navy/10 bg-white p-3">
			<img src={m.url} alt={m.altText} width={m.width ?? undefined} height={m.height ?? undefined} class="w-full h-36 object-cover rounded" loading="lazy" />
			<p class="text-xs text-navy/45 mt-1">#{m.id}{#if m.width && m.height} · {m.width}×{m.height}{/if}</p>
			<form method="POST" action="?/alt" use:enhance class="mt-2 flex gap-2">
				<input type="hidden" name="id" value={m.id} />
				<input name="altText" value={m.altText} aria-label="Alt text" class="flex-1 px-2 py-1 rounded border border-navy/20 text-xs" />
				<button class="text-xs underline">Save</button>
			</form>
		</li>
	{:else}<li class="text-sm text-navy/50">No images yet.</li>{/each}
</ul>
