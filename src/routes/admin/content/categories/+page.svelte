<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<h1 class="text-2xl tracking-tight mb-6">Categories</h1>
{#if form?.message}<p class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800" role="alert">{form.message}</p>{/if}
{#if data.categories.length === 0}<p class="mb-4 text-sm text-navy/60">No categories yet. Answers cannot be published until at least one category exists and is chosen.</p>{/if}
<ul class="space-y-2 mb-8">
	{#each data.categories as c}
		<li class="flex flex-wrap items-center gap-2 rounded-lg border border-navy/10 bg-white p-3">
			{#if data.canManage}
				<form method="POST" action="?/rename" use:enhance class="flex gap-2 flex-1">
					<input type="hidden" name="id" value={c.id} />
					<input name="name" value={c.name} aria-label="Category name" class="flex-1 px-3 py-1.5 rounded border border-navy/20 text-sm" />
					<button class="text-sm underline">Rename</button>
				</form>
				<form method="POST" action="?/delete" use:enhance><input type="hidden" name="id" value={c.id} /><button class="text-sm text-red-700 underline">Delete</button></form>
			{:else}{c.name}{/if}
		</li>
	{/each}
</ul>
{#if data.canManage}
	<form method="POST" action="?/create" use:enhance class="flex gap-2 max-w-md">
		<input name="name" required placeholder="New category" aria-label="New category" class="flex-1 px-3 py-2 rounded-lg border border-navy/20 text-sm" />
		<button class="px-4 py-2 rounded-lg bg-navy text-cream text-sm">Add</button>
	</form>
{:else}
	<p class="text-sm text-navy/50">Only a publisher can add or change categories.</p>
{/if}
