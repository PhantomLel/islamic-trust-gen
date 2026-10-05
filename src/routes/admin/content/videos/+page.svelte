<script lang="ts">
	let { data } = $props();
</script>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl tracking-tight">Videos</h1>
	<form method="POST" action="?/create"><button class="px-4 py-2 rounded-lg bg-navy text-cream text-sm">New video</button></form>
</div>
<div class="overflow-x-auto rounded-xl border border-navy/10 bg-white">
	<table class="w-full text-sm">
		<thead class="text-left text-navy/50"><tr><th class="p-3">Title</th><th class="p-3">Series</th><th class="p-3">Status</th><th class="p-3">Updated</th></tr></thead>
		<tbody>
			{#each data.videos as v}
				<tr class="border-t border-navy/10">
					<td class="p-3"><a class="underline underline-offset-2" href="/admin/content/videos/{v.id}">{v.title || 'Untitled video'}</a>{#if v.isTestimonial}<span class="ml-2 text-xs text-navy/45">testimonial</span>{/if}</td>
					<td class="p-3">{v.series ?? ''}</td>
					<td class="p-3">{v.status.replace('_', ' ')}{#if v.scheduledPublishAt} · {new Date(v.scheduledPublishAt).toLocaleString()}{/if}</td>
					<td class="p-3">{new Date(v.updatedAt).toLocaleDateString()}</td>
				</tr>
			{:else}
				<tr><td class="p-4 text-navy/50" colspan="4">No videos yet.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
