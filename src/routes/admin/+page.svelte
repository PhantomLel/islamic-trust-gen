<script lang="ts">
	import { siteName, allIntakeQuestions } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { defaultPrepFee } from '$lib/config';

	let { data } = $props();

	let editingTrustId = $state<number | null>(null);
	let editPrice = $state('');


	function getProgress(responses: { id: string; response: unknown }[]): number {
		if (allIntakeQuestions.length === 0) return 0;
		const answered = responses.filter((r) => r.response != null && r.response !== '').length;
		return Math.round((answered / allIntakeQuestions.length) * 100);
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}

	function statusLabel(status: string): string {
		const map: Record<string, string> = {
			'started': 'Started',
			'awaiting-payment': 'Awaiting Payment',
			'awaiting-answers': 'Awaiting Answers',
			'review': 'Requires Review',
			'notarization-pending': 'Notarization Pending',
			'completed': 'Completed',
		};
		return map[status] ?? status;
	}

	function statusColor(status: string): string {
		const map: Record<string, string> = {
			'started': 'bg-navy/10 text-navy/60',
			'awaiting-payment': 'bg-amber-50 text-amber-700',
			'awaiting-answers': 'bg-blue-50 text-blue-700',
			'review': 'bg-purple-50 text-purple-700',
			'notarization-pending': 'bg-orange-50 text-orange-700',
			'completed': 'bg-emerald-50 text-emerald-700',
		};
		return map[status] ?? 'bg-navy/10 text-navy/60';
	}

	function planLabel(plan: string | null): string {
		if (!plan) return '-';
		return plan === 'full' ? 'Full' : 'Discounted';
	}

	function startEdit(trustId: number, currentPrice: number | null) {
		editingTrustId = trustId;
		editPrice = String(currentPrice ?? defaultPrepFee);
	}

	function cancelEdit() {
		editingTrustId = null;
		editPrice = '';
	}
</script>

<div class="min-h-screen w-screen bg-cream font-sans">
	<!-- top bar -->
	<nav class="flex items-center justify-between px-6 md:px-8 py-5 border-b border-navy/[0.06] max-w-7xl mx-auto">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<div class="flex items-center gap-5">
			<span class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium">Admin</span>
			<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
		</div>
	</nav>

	<div class="max-w-7xl mx-auto px-6 md:px-8 py-10">
		<div class="mb-8">
			<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Trusts</h1>
			<p class="text-navy/45 text-sm">{data.trusts.length} total</p>
		</div>

		{#if data.trusts.length === 0}
			<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
				<p class="text-navy/40 text-sm">No trusts yet.</p>
			</div>
		{:else}
			<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
				<div class="overflow-x-auto">
					<table class="w-full text-sm text-left">
						<thead>
							<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
								<th class="px-4 py-3 font-medium">User</th>
								<th class="px-4 py-3 font-medium">Status</th>
								<th class="px-4 py-3 font-medium">Type</th>
								<th class="px-4 py-3 font-medium">Plan</th>
								<th class="px-4 py-3 font-medium">Eligible</th>
								<th class="px-4 py-3 font-medium">Progress</th>
								<th class="px-4 py-3 font-medium">Price</th>
								<th class="px-4 py-3 font-medium">Created</th>
								<th class="px-4 py-3 font-medium"></th>
							</tr>
						</thead>
						<tbody>
							{#each data.trusts as t}
								{@const progress = getProgress(t.responses)}
								{@const effectivePrice = t.customPrice ?? defaultPrepFee}
								{@const isCustom = t.customPrice !== null && t.customPrice !== defaultPrepFee}
								{@const hasPaid = t.selectedPlan !== null}
								<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
									<!-- User -->
									<td class="px-4 py-3">
										<div class="font-medium text-navy">{t.user.name}</div>
										<div class="text-[11px] text-navy/40">{t.user.email}</div>
									</td>

									<!-- Status -->
									<td class="px-4 py-3">
										<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium {statusColor(t.status)}">
											{statusLabel(t.status)}
										</span>
									</td>

									<!-- Type -->
									<td class="px-4 py-3 text-navy/60">
										{t.joint === null ? '-' : t.joint ? 'Joint' : 'Individual'}
									</td>

									<!-- Plan -->
									<td class="px-4 py-3 text-navy/60">
										{planLabel(t.selectedPlan)}
									</td>

									<!-- Eligible -->
									<td class="px-4 py-3">
										{#if t.isEligible === true}
											<span class="inline-block w-2 h-2 rounded-full bg-emerald-accent" title="Eligible"></span>
										{:else if t.isEligible === false}
											<span class="inline-block w-2 h-2 rounded-full bg-rose-400" title="Ineligible"></span>
										{:else}
											<span class="inline-block w-2 h-2 rounded-full bg-navy/20" title="Not screened"></span>
										{/if}
									</td>

									<!-- Progress -->
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div class="w-16 h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
												<div
													class="h-full rounded-full {progress === 100 ? 'bg-emerald-accent' : progress > 0 ? 'bg-amber-400' : 'bg-navy/10'}"
													style="width: {progress}%"
												></div>
											</div>
											<span class="text-[11px] text-navy/40 tabular-nums">{progress}%</span>
										</div>
									</td>

									<!-- Price -->
									<td class="px-4 py-3">
										{#if editingTrustId === t.id}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<span onclick={(e: MouseEvent) => e.stopPropagation()} class="contents">
												<form
													method="POST"
													action="?/updatePrice"
													use:enhance={() => {
														return async ({ result }) => {
															if (result.type === 'success') {
																cancelEdit();
																await invalidateAll();
															}
														};
													}}
												>
													<input type="hidden" name="trustId" value={t.id} />
													<div class="flex items-center gap-1">
														<span class="text-navy/50">$</span>
														<input
															type="number"
															name="price"
															bind:value={editPrice}
															min="0"
															class="w-16 px-1.5 py-0.5 rounded border border-navy/20 text-[12px] text-navy bg-white focus:outline-none focus:border-emerald-accent"
														/>
														<button type="submit" class="px-1.5 py-0.5 rounded bg-emerald-accent text-white text-[10px] font-medium cursor-pointer">Save</button>
														<button type="button" onclick={() => cancelEdit()} class="px-1.5 py-0.5 rounded bg-navy/10 text-navy/50 text-[10px] cursor-pointer">Cancel</button>
													</div>
												</form>
											</span>
										{:else}
											<span class="text-navy tabular-nums" class:text-emerald-700={isCustom} class:font-medium={isCustom}>
												${effectivePrice}
											</span>
											{#if !hasPaid}
												<button
													type="button"
													onclick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); startEdit(t.id, t.customPrice); }}
													class="ml-1 text-[10px] text-emerald-accent hover:text-emerald-accent/80 cursor-pointer underline"
												>edit</button>
											{/if}
										{/if}
									</td>

									<!-- Created -->
									<td class="px-4 py-3 text-navy/50 text-[12px] whitespace-nowrap">
										{formatDate(t.createdAt)}
									</td>

									<!-- Link -->
									<td class="px-4 py-3">
										<a href="/admin/user/{t.user.id}" class="text-emerald-accent hover:text-emerald-accent/80 text-[12px] font-medium">
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
	</div>
</div>
