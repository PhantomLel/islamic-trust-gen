<script lang="ts">
	let { data } = $props();
</script>

<div class="mb-6 flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Conversations</h1>
		<p class="text-navy/45 text-sm">
			{data.conversations.length} conversation{data.conversations.length === 1 ? '' : 's'}
			{#if data.filterUserId}<span class="text-navy/35">(filtered by user)</span>{/if}
		</p>
	</div>
	{#if data.filterUserId}
		<a href="/admin/help/conversations" class="text-[12px] text-navy/50 hover:text-navy">Clear filter</a>
	{/if}
</div>

{#if data.conversations.length === 0}
	<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
		<p class="text-navy/40 text-sm">No conversations yet.</p>
	</div>
{:else}
	<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
		<div class="overflow-x-auto">
			<table class="w-full text-sm text-left">
				<thead>
					<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
						<th class="px-4 py-3 font-medium">ID</th>
						<th class="px-4 py-3 font-medium">User</th>
						<th class="px-4 py-3 font-medium">Surface</th>
						<th class="px-4 py-3 font-medium">Turns</th>
						<th class="px-4 py-3 font-medium">Redaction</th>
						<th class="px-4 py-3 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.conversations as c (c.id)}
						<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
							<td class="px-4 py-3 text-navy/60 tabular-nums">{c.id}</td>
							<td class="px-4 py-3 text-navy break-all">{c.userEmail ?? c.userId}</td>
							<td class="px-4 py-3 text-navy/60">{c.surface}{c.stepKey ? ` / ${c.stepKey}` : ''}</td>
							<td class="px-4 py-3 text-navy/60 tabular-nums">{c.turnCount}</td>
							<td class="px-4 py-3">
								{#if c.hasRedaction}
									<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">Yes</span>
								{:else}
									<span class="text-navy/30 text-[12px]">—</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<a class="text-emerald-accent hover:text-emerald-accent/80 text-[12px] font-medium" href={`/admin/help/conversations/${c.id}`}>
									View
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
