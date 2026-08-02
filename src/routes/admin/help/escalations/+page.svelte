<script lang="ts">
	let { data } = $props();

	function tierColor(tier: number | string): string {
		const t = Number(tier);
		if (t === 1) return 'bg-rose-50 text-rose-700';
		if (t === 2) return 'bg-amber-50 text-amber-700';
		return 'bg-sky-50 text-sky-700';
	}

	function statusColor(status: string): string {
		const map: Record<string, string> = {
			open: 'bg-amber-50 text-amber-700',
			resolved: 'bg-emerald-50 text-emerald-700',
			dismissed: 'bg-navy/10 text-navy/50',
		};
		return map[status] ?? 'bg-navy/10 text-navy/50';
	}

	function formatDate(d: string | Date | null | undefined): string {
		if (!d) return '—';
		return new Date(d).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}
</script>

<div class="mb-6">
	<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Escalations</h1>
	<p class="text-navy/45 text-sm">{data.escalations.length} escalation{data.escalations.length === 1 ? '' : 's'}</p>
</div>

{#if data.escalations.length === 0}
	<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
		<p class="text-navy/40 text-sm">No escalations yet.</p>
	</div>
{:else}
	<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
		<div class="overflow-x-auto">
			<table class="w-full text-sm text-left">
				<thead>
					<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
						<th class="px-4 py-3 font-medium">Tier</th>
						<th class="px-4 py-3 font-medium">Trigger</th>
						<th class="px-4 py-3 font-medium">User</th>
						<th class="px-4 py-3 font-medium">Status</th>
						<th class="px-4 py-3 font-medium">When</th>
					</tr>
				</thead>
				<tbody>
					{#each data.escalations as e (e.id)}
						<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
							<td class="px-4 py-3">
								<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium {tierColor(e.tier)}">
									Tier {e.tier}
								</span>
							</td>
							<td class="px-4 py-3 font-mono text-[12px] text-navy/70">{e.triggerCode}</td>
							<td class="px-4 py-3 text-navy break-all">{e.userEmail}</td>
							<td class="px-4 py-3">
								<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium {statusColor(e.status)}">
									{e.status}
								</span>
							</td>
							<td class="px-4 py-3 text-navy/50 text-[12px] whitespace-nowrap">{formatDate(e.createdAt)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
