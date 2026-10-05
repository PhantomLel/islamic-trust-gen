<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<h1 class="text-2xl tracking-tight mb-6">Redirects</h1>
{#if form?.message}<p class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800" role="alert">{form.message}</p>{/if}
<form method="POST" action="?/save" use:enhance class="flex flex-wrap gap-2 mb-8 items-end">
	<div><label for="from" class="block text-sm mb-1">From</label><input id="from" name="from" required placeholder="/answers/old-address" class="px-3 py-2 rounded-lg border border-navy/20 text-sm w-64" /></div>
	<div><label for="to" class="block text-sm mb-1">To</label><input id="to" name="to" required placeholder="/answers/new-address" class="px-3 py-2 rounded-lg border border-navy/20 text-sm w-64" /></div>
	<div><label for="status" class="block text-sm mb-1">Type</label><select id="status" name="status" class="px-3 py-2 rounded-lg border border-navy/20 text-sm"><option value="301">301 permanent</option><option value="302">302 temporary</option></select></div>
	<button class="px-4 py-2 rounded-lg bg-navy text-cream text-sm">Save</button>
</form>
<ul class="space-y-2">
	{#each data.redirects as r}
		<li class="flex items-center justify-between rounded-lg border border-navy/10 bg-white p-3 text-sm">
			<span><code>{r.fromPath}</code> → <code>{r.toPath}</code> <span class="text-navy/45">({r.statusCode})</span></span>
			<form method="POST" action="?/delete" use:enhance><input type="hidden" name="id" value={r.id} /><button class="text-red-700 underline">Delete</button></form>
		</li>
	{:else}<li class="text-sm text-navy/50">No redirects.</li>{/each}
</ul>
