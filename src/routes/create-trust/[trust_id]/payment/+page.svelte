<script lang="ts">
	import { siteName } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let { data } = $props();

	const CHARITY_DISCOUNT = 200;
	const DEED_RETRIEVAL_FEE = 35;

	type PlanId = 'full' | 'discounted';
	let selectedPlan = $state<PlanId>('full');
	let addDeedRetrieval = $state(false);
	let submitting = $state(false);

	let fullPrice = $derived(data.amountUsd);
	let discountedPrice = $derived(Math.max(0, data.amountUsd - CHARITY_DISCOUNT));
	let baseDue = $derived(selectedPlan === 'discounted' ? discountedPrice : fullPrice);
	let amountDue = $derived(baseDue + (addDeedRetrieval ? DEED_RETRIEVAL_FEE : 0));

	let cancelled = $derived($page.url.searchParams.get('cancelled') === 'true');

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}
</script>

<div class="min-h-screen w-screen bg-cream font-sans relative">
	<div
		class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 80% 60% at 50% 35%, rgba(74,124,111,0.06) 0%, transparent 70%);"
	></div>

	<nav class="relative z-10 flex items-center justify-between px-6 md:px-8 py-5 border-b border-navy/[0.06] max-w-2xl mx-auto w-full">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<button
			onclick={handleLogout}
			class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer"
		>
			Log out
		</button>
	</nav>

	<main class="relative z-10 max-w-2xl mx-auto px-6 py-12 space-y-10">

		{#if cancelled}
			<div class="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-sm text-amber-800">
				Payment was cancelled. You can try again when you're ready.
			</div>
		{/if}

		<!-- Header -->
		<div>
			<p class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium mb-3">Payment</p>
			<h1 class="text-2xl font-semibold text-navy tracking-tight mb-2">Complete your trust preparation</h1>
			<p class="text-sm text-navy/45 font-light leading-relaxed">
				Watch the short video below to learn about wasiyyah, then choose your payment option.
			</p>
		</div>

		<!-- Wasiyyah video placeholder -->
	
		<div class="rounded-2xl overflow-hidden border border-navy/[0.07] bg-navy/[0.02]">
			<div class="aspect-video flex flex-col items-center justify-center gap-4 bg-navy/[0.03]">
				<div class="w-16 h-16 rounded-full bg-white/70 border border-navy/[0.08] flex items-center justify-center shadow-sm">
					<svg class="w-6 h-6 text-navy/40 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z" />
					</svg>
				</div>
				<p class="text-[13px] text-navy/40 font-light">Video: Understanding Wasiyyah in Islamic Estate Planning</p>
			</div>
		</div>

		<!-- Plan selection -->
		<div class="space-y-3">
			<p class="text-[11px] text-navy/40 tracking-wider uppercase font-medium">Choose your payment plan</p>

			<!-- Option A — Full price -->
			<button
				type="button"
				onclick={() => (selectedPlan = 'full')}
				class="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer
					{selectedPlan === 'full'
						? 'border-navy bg-white shadow-sm'
						: 'border-navy/[0.08] bg-white/60 hover:border-navy/20 hover:bg-white/80'}"
			>
				<div class="flex items-start gap-4">
					<div class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
						{selectedPlan === 'full' ? 'border-navy' : 'border-navy/25'}">
						{#if selectedPlan === 'full'}
							<div class="w-2.5 h-2.5 rounded-full bg-navy"></div>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-baseline justify-between gap-3 mb-1.5">
							<span class="text-sm font-semibold text-navy">Option A — Pay in full</span>
							<span class="text-lg font-bold text-navy tabular-nums shrink-0">${fullPrice.toFixed(2)}</span>
						</div>
						<p class="text-[13px] text-navy/50 leading-relaxed">
							Pay the full fee now. If you make a charitable bequest election later in this process, we will refund you
							<span class="font-medium text-emerald-accent">${CHARITY_DISCOUNT}</span>.
						</p>
					</div>
				</div>
			</button>

			<!-- Option B — Discounted -->
			<button
				type="button"
				onclick={() => (selectedPlan = 'discounted')}
				class="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer relative overflow-hidden
					{selectedPlan === 'discounted'
						? 'border-emerald-accent bg-white shadow-sm'
						: 'border-navy/[0.08] bg-white/60 hover:border-emerald-accent/40 hover:bg-white/80'}"
			>
				<div class="absolute top-3 right-4">
					<span class="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-accent/10 text-emerald-accent">
						Save ${CHARITY_DISCOUNT}
					</span>
				</div>
				<div class="flex items-start gap-4">
					<div class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
						{selectedPlan === 'discounted' ? 'border-emerald-accent' : 'border-navy/25'}">
						{#if selectedPlan === 'discounted'}
							<div class="w-2.5 h-2.5 rounded-full bg-emerald-accent"></div>
						{/if}
					</div>
					<div class="flex-1 min-w-0 pr-16">
						<div class="flex items-baseline justify-between gap-3 mb-1.5">
							<span class="text-sm font-semibold text-navy">Option B — Pay with wasiyyah pledge</span>
							<span class="text-lg font-bold text-emerald-accent tabular-nums shrink-0">${discountedPrice.toFixed(2)}</span>
						</div>
						<p class="text-[13px] text-navy/50 leading-relaxed">
							Pay the discounted rate now. This price is confirmed when you complete your charitable bequest election later.
							If you do not make the election, the remaining
							<span class="font-medium text-navy/70">${CHARITY_DISCOUNT}</span> is charged before your document is generated.
						</p>
					</div>
				</div>
			</button>
		</div>

		<!-- Add-ons -->
		<div class="space-y-3">
			<p class="text-[11px] text-navy/40 tracking-wider uppercase font-medium">Optional add-ons</p>

			<button
				type="button"
				onclick={() => (addDeedRetrieval = !addDeedRetrieval)}
				class="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer
					{addDeedRetrieval
						? 'border-navy bg-white shadow-sm'
						: 'border-navy/[0.08] bg-white/60 hover:border-navy/20 hover:bg-white/80'}"
			>
				<div class="flex items-start gap-4">
					<div class="mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors
						{addDeedRetrieval ? 'border-navy bg-navy' : 'border-navy/25 bg-white'}">
						{#if addDeedRetrieval}
							<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-baseline justify-between gap-3 mb-1.5">
							<span class="text-sm font-semibold text-navy">House deed retrieval</span>
							<span class="text-lg font-bold text-navy tabular-nums shrink-0">+${DEED_RETRIEVAL_FEE}.00</span>
						</div>
						<p class="text-[13px] text-navy/50 leading-relaxed">
							If you don't know where your house deed is, we'll retrieve it for you from the county records office.
							This is a one-time fee charged alongside your trust preparation fee.
						</p>
					</div>
				</div>
			</button>
		</div>

		<!-- Amount due summary -->
		<div class="rounded-2xl bg-white/80 border border-navy/[0.07] p-5 space-y-3">
			<div class="space-y-1.5 text-[13px]">
				<div class="flex items-baseline justify-between text-navy/55">
					<span>Trust preparation fee</span>
					<span class="tabular-nums">${baseDue.toFixed(2)}</span>
				</div>
				{#if selectedPlan === 'discounted'}
					<div class="flex items-baseline justify-between text-emerald-accent">
						<span>Wasiyyah pledge discount</span>
						<span class="tabular-nums">-${CHARITY_DISCOUNT}.00</span>
					</div>
				{/if}
				{#if addDeedRetrieval}
					<div class="flex items-baseline justify-between text-navy/55">
						<span>House deed retrieval</span>
						<span class="tabular-nums">+${DEED_RETRIEVAL_FEE}.00</span>
					</div>
				{/if}
			</div>
			<div class="h-px bg-navy/[0.07]"></div>
			<div class="flex items-baseline justify-between gap-4">
				<span class="text-sm font-medium text-navy">Amount due today</span>
				<span class="text-2xl font-semibold text-navy tabular-nums">${amountDue.toFixed(2)}</span>
			</div>
			<p class="text-[12px] text-navy/35">
				Invoice{addDeedRetrieval ? 's' : ''} will be sent to {data.userEmail}
				{#if selectedPlan === 'discounted'}
					&middot; Wasiyyah pledge required to lock in discounted price
				{/if}
			</p>
		</div>

		<!-- Pay button -->
		<div class="space-y-3">
			<form
				method="POST"
				action="?/checkout"
				use:enhance={() => {
					submitting = true;
					return async ({ result }) => {
						if (result.type === 'success' && result.data?.checkoutUrl) {
							window.location.href = result.data.checkoutUrl as string;
						} else {
							submitting = false;
						}
					};
				}}
			>
				<input type="hidden" name="selectedPlan" value={selectedPlan} />
				<input type="hidden" name="addDeedRetrieval" value={String(addDeedRetrieval)} />
				<button
					type="submit"
					disabled={submitting}
					class="w-full py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
						{submitting
							? 'text-cream bg-navy/40 cursor-wait'
							: 'text-cream bg-navy hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10'}
						disabled:cursor-wait"
				>
					{submitting ? 'Redirecting to checkout...' : `Pay $${amountDue.toFixed(2)} now`}
				</button>
			</form>

			<a
				href={`/create-trust/${data.trustId}`}
				class="block text-center text-sm text-navy/50 hover:text-navy transition-colors"
			>
				&larr; Back to questionnaire
			</a>
		</div>

	</main>
</div>
