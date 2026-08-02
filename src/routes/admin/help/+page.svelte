<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	function statusColor(status: string | null): string {
		const map: Record<string, string> = {
			approved: 'bg-emerald-50 text-emerald-700',
			needs_revision: 'bg-amber-50 text-amber-700',
			disabled: 'bg-navy/10 text-navy/50',
		};
		return map[status ?? ''] ?? 'bg-navy/10 text-navy/50';
	}

	function statusLabel(status: string | null): string {
		const map: Record<string, string> = {
			approved: 'Approved',
			needs_revision: 'Needs revision',
			disabled: 'Disabled',
		};
		return map[status ?? ''] ?? '—';
	}
</script>

<div class="mb-6">
	<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Help Assistant</h1>
	<p class="text-navy/45 text-sm">Knowledge base entries, governance, and health at a glance.</p>
</div>

<div class="mb-8 grid gap-4 sm:grid-cols-4">
	<div class="rounded-xl border border-navy/[0.06] bg-white/70 p-5">
		<p class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Open escalations</p>
		<p class="mt-2 text-2xl font-semibold text-navy tabular-nums">{data.stats.openEscalations}</p>
	</div>
	<div class="rounded-xl border border-navy/[0.06] bg-white/70 p-5">
		<p class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Unanswered</p>
		<p class="mt-2 text-2xl font-semibold text-navy tabular-nums">{data.stats.unanswered}</p>
	</div>
	<div class="rounded-xl border border-navy/[0.06] bg-white/70 p-5">
		<p class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Conversations</p>
		<p class="mt-2 text-2xl font-semibold text-navy tabular-nums">{data.stats.conversations}</p>
	</div>
	<div class="rounded-xl border border-navy/[0.06] bg-white/70 p-5">
		<p class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Blocked gates</p>
		<p class="mt-2 text-2xl font-semibold text-navy tabular-nums">{data.stats.unsatisfiedGates}</p>
	</div>
</div>

<div class="mb-6 flex items-center justify-between gap-4">
	<div>
		<h2 class="text-lg font-semibold text-navy tracking-tight">Knowledge base entries</h2>
		<p class="text-navy/45 text-sm">{data.entries.length} entries</p>
	</div>
	<a
		href="/admin/help/entries/new"
		class="rounded-lg bg-emerald-accent px-4 py-2 text-sm font-medium text-white hover:bg-emerald-accent/90 transition-colors shrink-0"
	>
		+ New entry
	</a>
</div>

<form method="GET" class="mb-4 flex flex-wrap items-end gap-3">
	<label class="flex flex-col gap-1">
		<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Search</span>
		<input
			class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent w-64"
			name="q"
			value={data.q}
			placeholder="Search entries…"
		/>
	</label>
	<label class="flex flex-col gap-1">
		<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Status</span>
		<select
			name="status"
			class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
		>
			{#each ['all', 'needs_revision', 'approved', 'disabled'] as s}
				<option value={s} selected={data.statusFilter === s}>{s === 'all' ? 'All statuses' : statusLabel(s)}</option>
			{/each}
		</select>
	</label>
	<button class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy hover:border-emerald-accent cursor-pointer" type="submit">
		Filter
	</button>
</form>

{#if form?.deleted}
	<p class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Entry deleted.</p>
{/if}

{#if form?.bulkApprove}
	<p class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
		Approved {form.bulkApprove.approved.length}; skipped {form.bulkApprove.skipped.length}
	</p>
{/if}

<form id="bulk-approve-form" method="POST" action="?/bulkApprove" use:enhance>
	<div class="mb-3 flex items-center justify-end">
		<button class="rounded-lg bg-emerald-accent px-4 py-2 text-sm font-medium text-white hover:bg-emerald-accent/90 transition-colors cursor-pointer" type="submit">
			Bulk approve selected
		</button>
	</div>
</form>

	{#if data.entries.length === 0}
		<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
			<p class="text-navy/40 text-sm">No entries match the selected filters.</p>
		</div>
	{:else}
		<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
			<div class="overflow-x-auto">
				<table class="w-full text-sm text-left">
					<thead>
						<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
							<th class="px-4 py-3 font-medium w-8"></th>
							<th class="px-4 py-3 font-medium">ID</th>
							<th class="px-4 py-3 font-medium">Question</th>
							<th class="px-4 py-3 font-medium">Category</th>
							<th class="px-4 py-3 font-medium">Status</th>
							<th class="px-4 py-3 font-medium">Serves</th>
							<th class="px-4 py-3 font-medium w-16"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.entries as row (row.id)}
							<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
								<td class="px-4 py-3">
									<input type="checkbox" form="bulk-approve-form" name="entryId" value={row.id} class="cursor-pointer" />
								</td>
								<td class="px-4 py-3 font-mono text-[12px]">
									<a
										class="text-emerald-accent hover:text-emerald-accent/80 font-medium"
										href="/admin/help/entries/{row.id}"
									>
										{row.id}
									</a>
								</td>
								<td class="px-4 py-3 text-navy/80 max-w-[420px] truncate" title={row.question ?? row.title ?? ''}>
									{row.question ?? row.title ?? '—'}
								</td>
								<td class="px-4 py-3 text-navy/60 max-w-[160px] truncate" title={row.category ?? ''}>
									{row.category ?? '—'}
								</td>
								<td class="px-4 py-3">
									<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium {statusColor(row.status)}">
										{statusLabel(row.status)}
									</span>
								</td>
								<td class="px-4 py-3 text-navy/60 tabular-nums">{row.serveCount ?? 0}</td>
								<td class="px-4 py-3">
									<form
										method="POST"
										action="?/delete"
										use:enhance={({ cancel }) => {
											if (!confirm('Delete this entry permanently?')) {
												cancel();
												return;
											}
											return async ({ update }) => update();
										}}
									>
										<input type="hidden" name="entryId" value={row.id} />
										<button
											type="submit"
											class="text-[12px] text-rose-500/70 hover:text-rose-600 font-medium cursor-pointer"
										>
											Delete
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
