<script lang="ts">
	import { siteName, consultationBookingUrl, jabalFoundationUrl, formatJabalDonation } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import type { WarningAgreementData } from '$lib/loe';
	import { WARNING_AGREEMENT_VERSION } from '$lib/loe';

	let { data } = $props();
	const DEED_RETRIEVAL_FEE = 35;

	let addDeedRetrieval = $state(false);
	let submitting = $state(false);

	let fullPrice = $derived(data.amountUsd);
	let amountDue = $derived(fullPrice + (addDeedRetrieval ? DEED_RETRIEVAL_FEE : 0));

	let cancelled = $derived($page.url.searchParams.get('cancelled') === 'true');

	// ── Warning Modal state ──────────────────────────────────────────
	/** null = not yet shown, 'warning' = showing the warning screen, 'checkboxes' = showing the confirmation checkboxes */
	let warningStep = $state<'warning' | 'checkboxes' | null>(null);
	let warningDate = $state('');
	let warningBoxes = $state({
		basicPlanningOnly: false,
		largeComplexEstateRisk: false,
		noAdvancedOptimization: false,
		heirDisagreementRisk: false,
		choseAppOverConsultation: false,
	});
	/** The agreed-upon data — set when the user clicks "I Agree & Continue to Pay" */
	let warningAgreement = $state<WarningAgreementData | null>(null);

	let allWarningBoxesChecked = $derived(
		warningBoxes.basicPlanningOnly &&
		warningBoxes.largeComplexEstateRisk &&
		warningBoxes.noAdvancedOptimization &&
		warningBoxes.heirDisagreementRisk &&
		warningBoxes.choseAppOverConsultation
	);
	let warningReady = $derived(allWarningBoxesChecked && warningDate.trim().length > 0);

	function openWarningModal() {
		warningStep = 'warning';
	}

	function acceptWarningAndProceed() {
		if (!warningReady) return;
		warningAgreement = {
			version: WARNING_AGREEMENT_VERSION,
			clientTimestamp: new Date().toISOString(),
			userEnteredDate: warningDate.trim(),
			checkboxes: { ...warningBoxes },
		};
		warningStep = null;
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}
</script>

<!-- ── Warning Modal ──────────────────────────────────────────────── -->
{#if warningStep !== null}
	<div
		class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
		transition:fade={{ duration: 150 }}
		role="dialog"
		aria-modal="true"
		aria-labelledby="warning-title"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-navy/40 backdrop-blur-sm"></div>

		<!-- Panel -->
		<div class="relative z-10 w-full sm:max-w-2xl bg-cream rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh]">

			<!-- Header -->
			<div class="shrink-0 px-6 pt-6 pb-4 border-b border-navy/8">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-[10px] tracking-[0.25em] uppercase text-amber-600 font-medium mb-1">Important Notice</p>
						<h2 id="warning-title" class="text-lg font-semibold text-navy leading-snug">
							The Good Tree Trust App is for simpler estates
						</h2>
					</div>
					<button
						onclick={() => warningStep = null}
						class="shrink-0 mt-0.5 p-1.5 rounded-lg text-navy/40 hover:text-navy hover:bg-navy/6 transition-colors cursor-pointer"
						aria-label="Close"
					>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Scrollable body -->
			<div class="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5 text-[13px] text-navy/70 leading-relaxed">

				{#if warningStep === 'warning'}
					<!-- Step 1: Warning copy -->
					<p class="text-navy/80">
						The Good Tree Trust App was designed to help Muslim families create a basic Islamic trust plan at an accessible cost. For many families, the app is a major improvement over doing nothing or relying only on a simple will. But if your estate is larger, tax-sensitive, business-related, or likely to create family conflict, the app may not be the best planning option.
					</p>

					<div>
						<h3 class="text-[11px] tracking-[0.2em] uppercase font-semibold text-navy/50 mb-3">Full-service planning is strongly recommended if:</h3>
						<ul class="space-y-2.5">
							{#each [
								'Your total estate is over $1.5 million',
								'You have substantial retirement accounts, such as a 401(k), IRA, pension, or similar account',
								'You own a business interest',
								'You want to leave significant assets to a masjid, Islamic school, waqf, donor-advised fund, charity, or nonprofit',
								'You are allocating ownership of the assets between spouses as anything other than 100/0 or 50/50',
								'You expect disagreement from heirs or family members',
								'Either spouse is not a U.S. citizen',
								'You have international assets or heirs outside the United States',
							] as item}
								<li class="flex items-start gap-2.5">
									<svg class="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
									</svg>
									<span>{item}</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="h-1"></div>

				{:else if warningStep === 'checkboxes'}
					<!-- Step 2: Acknowledgment checkboxes + date -->
					<p class="text-navy/80 font-medium">
						Before continuing, please confirm you have read and understood the following:
					</p>

					<div class="space-y-4">
						<label class="flex items-start gap-3 cursor-pointer group">
							<input type="checkbox" bind:checked={warningBoxes.basicPlanningOnly}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer" />
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand that the Good Tree Trust App is designed for <strong class="font-semibold text-navy">basic, lower-to-moderate complexity</strong> Islamic trust planning.
							</span>
						</label>

						<label class="flex items-start gap-3 cursor-pointer group">
							<input type="checkbox" bind:checked={warningBoxes.largeComplexEstateRisk}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer" />
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand that if my estate is <strong class="font-semibold text-navy">large or complex</strong>, full-service planning may be the better and safer option.
							</span>
						</label>

						<label class="flex items-start gap-3 cursor-pointer group">
							<input type="checkbox" bind:checked={warningBoxes.noAdvancedOptimization}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer" />
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand the app does not provide tax optimization, asset-by-asset planning, community-property analysis, retirement-account planning, business succession planning, or family-conflict strategy.
							</span>
						</label>

						<label class="flex items-start gap-3 cursor-pointer group">
							<input type="checkbox" bind:checked={warningBoxes.heirDisagreementRisk}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer" />
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand my heirs or beneficiaries may later disagree with the plan, and McDaniel Estate Planning does not represent them through the app.
							</span>
						</label>

						<label class="flex items-start gap-3 cursor-pointer group">
							<input type="checkbox" bind:checked={warningBoxes.choseAppOverConsultation}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer" />
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand that I have been given the opportunity to book a full-service consultation, and I am choosing to <strong class="font-semibold text-navy">continue with the app</strong> despite these limitations.
							</span>
						</label>
					</div>

					<!-- Date -->
					<div class="border-t border-navy/8 pt-4">
						<label for="warning-date" class="block text-[12px] font-medium text-navy/60 mb-2 tracking-wide">
							Today's date <span class="text-red-400">*</span>
						</label>
						<input
							id="warning-date"
							type="date"
							bind:value={warningDate}
							class="w-48 px-3.5 py-2.5 rounded-xl border border-navy/10 bg-white text-navy text-sm outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/15 cursor-pointer"
						/>
						<p class="text-[11px] text-navy/40 mt-1.5">Select today's date to confirm your acknowledgment.</p>
					</div>

					<div class="h-1"></div>
				{/if}
			</div>

			<!-- Sticky footer -->
			<div class="shrink-0 px-6 py-4 border-t border-navy/8 bg-cream/90 backdrop-blur-sm rounded-b-2xl">
				{#if warningStep === 'warning'}
					<div class="flex flex-col sm:flex-row gap-3">
						<a
							href={consultationBookingUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-cream bg-navy hover:bg-navy-light transition-all duration-200 cursor-pointer"
						>
							Book a Full-Service Consultation
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</a>
						<button
							onclick={() => warningStep = 'checkboxes'}
							class="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-medium text-navy/65 border border-navy/15 hover:border-navy/30 hover:text-navy bg-white transition-all duration-200 cursor-pointer"
						>
							I Understand, Continue With the App
						</button>
					</div>
				{:else if warningStep === 'checkboxes'}
					{#if !allWarningBoxesChecked}
						<p class="text-[11px] text-navy/45 mb-3">
							Please check all {Object.values(warningBoxes).filter(v => !v).length} remaining box{Object.values(warningBoxes).filter(v => !v).length === 1 ? '' : 'es'} above to continue.
						</p>
					{:else if !warningDate.trim()}
						<p class="text-[11px] text-navy/45 mb-3">Please select today's date above to continue.</p>
					{/if}
					<div class="flex items-center gap-3">
						<button
							onclick={() => warningStep = 'warning'}
							class="px-4 py-2.5 rounded-lg text-sm text-navy/55 hover:text-navy hover:bg-navy/5 transition-colors cursor-pointer"
						>
							← Back
						</button>
						<button
							onclick={acceptWarningAndProceed}
							disabled={!warningReady}
							class="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-cream bg-navy
								   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/15
								   disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
						>
							I Agree &amp; Continue to Pay
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- ── Main payment page ───────────────────────────────────────────── -->
<div class="min-h-screen w-screen bg-cream font-sans relative">
	<div
		class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 80% 60% at 50% 35%, rgba(74,124,111,0.06) 0%, transparent 70%);"
	></div>

	<nav class="relative z-10 flex items-center justify-between px-6 md:px-8 py-5 border-b border-navy/6 max-w-2xl mx-auto w-full">
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
				Review your order below and complete payment to continue your trust preparation.
			</p>
		</div>

		<!-- Trust preparation fee -->
		<div class="rounded-2xl border-2 border-navy/8 bg-white p-5">
			<div class="flex items-baseline justify-between gap-3">
				<span class="text-sm font-semibold text-navy">Trust preparation fee</span>
				<span class="text-2xl font-bold text-navy tabular-nums">${fullPrice.toFixed(2)}</span>
			</div>
			<p class="text-[13px] text-navy/50 leading-relaxed mt-2">
				One-time fee for attorney-supervised trust preparation and document drafting.
			</p>
			<p class="text-[12.5px] text-emerald-accent/90 leading-relaxed mt-3 pt-3 border-t border-navy/6">
				{formatJabalDonation(fullPrice)} — 5% of this fee — will be donated to Jabal Foundation's Legacy Waqf the same day you pay. Leonard serves as Secretary of Jabal's board.
				<a href={jabalFoundationUrl} target="_blank" rel="noopener noreferrer" class="underline hover:text-emerald-light">Learn more</a>
			</p>
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
						: 'border-navy/8 bg-white/60 hover:border-navy/20 hover:bg-white/80'}"
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
		<div class="rounded-2xl bg-white/80 border border-navy/7 p-5 space-y-3">
			<div class="space-y-1.5 text-[13px]">
				<div class="flex items-baseline justify-between text-navy/55">
					<span>Trust preparation fee</span>
					<span class="tabular-nums">${fullPrice.toFixed(2)}</span>
				</div>
				{#if addDeedRetrieval}
					<div class="flex items-baseline justify-between text-navy/55">
						<span>House deed retrieval</span>
						<span class="tabular-nums">+${DEED_RETRIEVAL_FEE}.00</span>
					</div>
				{/if}
			</div>
			<div class="h-px bg-navy/7"></div>
			<div class="flex items-baseline justify-between gap-4">
				<span class="text-sm font-medium text-navy">Amount due today</span>
				<span class="text-2xl font-semibold text-navy tabular-nums">${amountDue.toFixed(2)}</span>
			</div>
			<p class="text-[12px] text-navy/35">
				Invoice{addDeedRetrieval ? 's' : ''} will be sent to {data.userEmail}
			</p>
		</div>

		<!-- Pay button -->
		<div class="space-y-3">
			{#if warningAgreement}
				<!-- Agreement accepted — show the real checkout form -->
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
					<input type="hidden" name="addDeedRetrieval" value={String(addDeedRetrieval)} />
					<input type="hidden" name="warningAgreement" value={JSON.stringify(warningAgreement)} />
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
				<!-- Small "change my mind" link -->
				<button
					onclick={() => { warningAgreement = null; warningStep = 'warning'; }}
					class="block w-full text-center text-[12px] text-navy/35 hover:text-navy/60 transition-colors cursor-pointer"
				>
					Re-read the planning notice
				</button>
			{:else}
				<!-- Not yet agreed — clicking Pay opens the warning modal -->
				<button
					type="button"
					onclick={openWarningModal}
					disabled={submitting}
					class="w-full py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
						text-cream bg-navy hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
						disabled:opacity-40 disabled:cursor-not-allowed"
				>
					Pay ${amountDue.toFixed(2)} now
				</button>
			{/if}

			<a
				href={`/create-trust/${data.trustId}`}
				class="block text-center text-sm text-navy/50 hover:text-navy transition-colors"
			>
				&larr; Back to questionnaire
			</a>
		</div>

	</main>
</div>
