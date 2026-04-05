<script lang="ts">
	import { siteName, allIntakeQuestions } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let editingInvoiceId = $state<number | null>(null);
	let editAmount = $state('');

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

	function getStatus(trust: typeof data.trusts[number] & { awaitingPayment?: boolean }): { label: string; color: string } {
		if (trust.awaitingPayment) return { label: 'Awaiting Payment', color: 'bg-amber-400' };
		if (trust.complete) return { label: 'Approved', color: 'bg-emerald-accent' };
		if (trust.isEligible === false) return { label: 'Ineligible', color: 'bg-black/[0.04]' };
		if (trust.isEligible === true) return { label: 'Eligible', color: 'bg-emerald-accent/60' };
		return { label: 'Not Screened', color: 'bg-navy/10' };
	}

	function startEditInvoice(invoiceId: number, currentAmount: number) {
		editingInvoiceId = invoiceId;
		editAmount = String(currentAmount);
	}

	function cancelEditInvoice() {
		editingInvoiceId = null;
		editAmount = '';
	}
</script>

<div class="min-h-screen w-screen bg-cream font-sans relative">
	<div class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(74,124,111,0.05) 0%, transparent 70%);">
	</div>

	<!-- top bar -->
	<nav class="relative z-10 flex items-center justify-between px-6 md:px-8 py-5 border-b border-navy/[0.06] max-w-6xl mx-auto">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<div class="flex items-center gap-5">
			<span class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium">Admin</span>
			<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
		</div>
	</nav>

	<div class="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-10">
		<!-- header -->
		<div class="mb-10">
			<h1 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight mb-2">Trusts</h1>
			<p class="text-navy/45 text-sm font-light">{data.trusts.length} total trust{data.trusts.length !== 1 ? 's' : ''}</p>
		</div>

		{#if data.trusts.length === 0}
			<div class="rounded-2xl bg-white/60 border border-navy/[0.06] p-12 text-center">
				<p class="text-navy/40 text-sm">No trusts created yet.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.trusts as t}
					{@const progress = getProgress(t.responses)}
					{@const status = getStatus(t)}
					{@const awaitingPayment = 'awaitingPayment' in t && t.awaitingPayment}

					<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden transition-all duration-200 hover:bg-white hover:shadow-lg hover:shadow-navy/[0.04] hover:-translate-y-0.5">
					<a href="/admin/user/{t.user.id}" class="block">
						<div class="group w-full flex items-center gap-4 px-6 py-5">
							<!-- status dot -->
							<div class="w-2.5 h-2.5 rounded-full shrink-0 {status.color}"></div>

							<!-- user info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-navy truncate">{t.user.name}</span>
									<span class="text-[11px] text-navy/30">&middot;</span>
									<span class="text-[12px] text-navy/40 truncate">{t.user.email}</span>
								</div>
								<div class="flex items-center gap-3 mt-1 flex-wrap">
									<span class="text-[11px] text-navy/35">
										{t.joint === null ? 'Not selected' : t.joint ? 'Joint' : 'Individual'}
									</span>
									<span class="text-[11px] text-navy/20">&middot;</span>
									<span class="text-[11px] text-navy/35">Created {formatDate(t.createdAt)}</span>

									{#if t.isEligible === false}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/[0.04] text-navy/45 border border-navy/[0.08]">
											<span class="w-1.5 h-1.5 rounded-full bg-rose-300"></span>
											Ineligible
										</span>
									{:else if t.isEligible === true}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/[0.04] text-navy/45 border border-navy/[0.08]">
											<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60"></span>
											Eligible
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/[0.04] text-navy/35 border border-navy/[0.08]">
											<span class="w-1.5 h-1.5 rounded-full bg-navy/20"></span>
											Not Screened
										</span>
									{/if}

									{#if t.user.requestedConsultation}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/[0.04] text-navy/45 border border-navy/[0.08]">
											<span class="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
											Consultation Requested
										</span>
									{/if}

									{#if status.label === 'Awaiting Payment'}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/[0.04] text-navy/45 border border-navy/[0.08]">
											<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
											Awaiting Payment
										</span>
									{/if}
								</div>
							</div>

							<!-- progress -->
							<div class="hidden sm:flex items-center gap-3 shrink-0">
								<div class="w-24 h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
									<div class="h-full rounded-full transition-all duration-500
												{t.complete ? 'bg-emerald-accent' : progress > 0 ? 'bg-amber-400' : 'bg-navy/10'}"
										style="width: {progress}%"></div>
								</div>
								<span class="text-[11px] text-navy/40 w-8 text-right">{progress}%</span>
							</div>

							<!-- arrow -->
							<svg class="w-4 h-4 text-navy/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</a>

					{#if awaitingPayment && t.invoices?.length}
						<div class="border-t border-navy/[0.06] px-6 py-3 flex items-center gap-4 flex-wrap">
							{#each t.invoices.filter((i: any) => !i.paid) as inv (inv.id)}
								<div class="flex items-center gap-2 text-[12px]">
									<span class="text-navy/50">{inv.name}:</span>
									{#if editingInvoiceId === inv.id}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<span onclick={(e: MouseEvent) => e.preventDefault()} class="contents">
											<form
												method="POST"
												action="?/updateInvoiceAmount"
												use:enhance={() => {
													return async ({ result }) => {
														if (result.type === 'success') {
															cancelEditInvoice();
															await invalidateAll();
														}
													};
												}}
											>
												<input type="hidden" name="invoiceId" value={inv.id} />
												<div class="flex items-center gap-1.5">
													<span class="text-navy/50">$</span>
													<input
														type="number"
														name="amount"
														bind:value={editAmount}
														min="0"
														class="w-20 px-2 py-0.5 rounded border border-navy/20 text-[12px] text-navy bg-white focus:outline-none focus:border-emerald-accent"
													/>
													<button type="submit" class="px-2 py-0.5 rounded bg-emerald-accent text-white text-[11px] font-medium cursor-pointer hover:bg-emerald-accent/90">Save</button>
													<button type="button" onclick={() => cancelEditInvoice()} class="px-2 py-0.5 rounded bg-navy/10 text-navy/50 text-[11px] font-medium cursor-pointer hover:bg-navy/15">Cancel</button>
												</div>
											</form>
										</span>
									{:else}
										<span class="font-medium text-navy tabular-nums">${inv.amount}</span>
										<button
											type="button"
											onclick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); startEditInvoice(inv.id, inv.amount); }}
											class="text-[11px] text-emerald-accent hover:text-emerald-accent/80 cursor-pointer underline decoration-emerald-accent/30"
										>edit</button>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
