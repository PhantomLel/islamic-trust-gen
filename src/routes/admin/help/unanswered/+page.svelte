<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import type { SubmitFunction } from '@sveltejs/kit';
	let { data } = $props();

	function statusColor(status: string): string {
		const map: Record<string, string> = {
			open: 'bg-amber-50 text-amber-700',
			resolved: 'bg-emerald-50 text-emerald-700',
			disabled: 'bg-navy/10 text-navy/50',
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

	let toast = $state<string | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function showToast(text: string) {
		toast = text;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 3000);
	}

	const resolveWithToast: SubmitFunction = () => {
		return async ({ update }) => {
			await update();
			showToast('Marked as resolved');
		};
	};
</script>

{#if toast}
	<div
		class="fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg"
		role="status"
		transition:fly={{ y: 12, duration: 200 }}
	>
		<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
		</svg>
		{toast}
	</div>
{/if}

<div class="mb-6">
	<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Unanswered questions</h1>
	<p class="text-navy/45 text-sm">
		Fallback responses the assistant couldn't answer. Open a conversation to see the full exchange (access is
		logged) before deciding on a fix — add a KB entry, or reach out to the user directly.
	</p>
</div>

{#if data.rows.length === 0}
	<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
		<p class="text-navy/40 text-sm">Nothing in the queue.</p>
	</div>
{:else}
	<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
		<div class="overflow-x-auto">
			<table class="w-full text-sm text-left">
				<thead>
					<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
						<th class="px-4 py-3 font-medium">When</th>
						<th class="px-4 py-3 font-medium">User</th>
						<th class="px-4 py-3 font-medium">Context</th>
						<th class="px-4 py-3 font-medium">Response kind</th>
						<th class="px-4 py-3 font-medium">Status</th>
						<th class="px-4 py-3 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row (row.id)}
						<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
							<td class="px-4 py-3 text-navy/50 text-[12px] whitespace-nowrap">{formatDate(row.createdAt)}</td>
							<td class="px-4 py-3 text-navy break-all">{row.userEmail ?? row.userId}</td>
							<td class="px-4 py-3 text-navy/60 whitespace-nowrap">
								{row.surface ?? '—'}{row.stepKey ? ` / ${row.stepKey}` : ''}
							</td>
							<td class="px-4 py-3 text-navy/60">{row.renderedResponse?.kind ?? '—'}</td>
							<td class="px-4 py-3">
								<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium {statusColor(row.adminReviewStatus)}">
									{row.adminReviewStatus}
								</span>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-3 whitespace-nowrap">
									{#if row.conversationId}
										<a
											class="text-emerald-accent hover:text-emerald-accent/80 text-[12px] font-medium"
											href="/admin/help/conversations/{row.conversationId}"
										>
											View conversation
										</a>
									{/if}
									{#if row.userId}
										<a class="text-navy/50 hover:text-navy text-[12px] font-medium" href="/admin/user/{row.userId}">
											View user
										</a>
									{/if}
									{#if row.adminReviewStatus !== 'resolved'}
										<form method="POST" action="?/resolve" use:enhance={resolveWithToast}>
											<input type="hidden" name="id" value={row.id} />
											<button class="text-navy/50 hover:text-navy text-[12px] font-medium cursor-pointer" type="submit">
												Resolve
											</button>
										</form>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
