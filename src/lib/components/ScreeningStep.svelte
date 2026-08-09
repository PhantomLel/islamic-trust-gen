<script lang="ts">
	import { siteName, screeningQuestions, consultationBookingUrl } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { slide, fade } from 'svelte/transition';
	import CountySelector from './CountySelector.svelte';
	import type { LoeAgreementData } from '$lib/loe';
	import { LOE_AGREEMENT_VERSION } from '$lib/loe';

	let { firstName, userEmail, trustId, onsubmit: onsubmitProp, onIneligible }: {
		firstName: string;
		userEmail: string;
		trustId: number;
		onsubmit: (payload: { county: string; answers: Record<string, boolean>; loe: LoeAgreementData }) => void;
		/** Called silently when a hard-stop gating question is answered Yes — records ineligibility in the DB without navigating away. */
		onIneligible?: (payload: { county: string; answers: Record<string, boolean> }) => void;
	} = $props();

	let screeningAnswers = $state<Record<string, boolean | null>>(
		Object.fromEntries(screeningQuestions.map((q) => [q.id, null]))
	);
	let screeningIndex = $state(0);
	let submitting = $state(false);
	let county = $state('');
	/** Tracks the answer to the S corp sub-question (null = unanswered). */
	let scorp = $state<boolean | null>(null);
	const totalSteps = screeningQuestions.length + 1;

	// ── LOE Modal state ──────────────────────────────────────────────
	let showLoeModal = $state(false);
	let loeUserDate = $state('');
	let loeCheckboxes = $state({
		limitedScope: false,
		situationFits: false,
		islamicPrinciples: false,
		noTaxPlanning: false,
		noHeirRepresentation: false,
		keepOriginalsSafe: false,
		homesteadGuidanceOnly: false,
	});

	let hasCounty = $derived(county.trim().length > 0);

	let allAnswered = $derived(hasCounty && screeningQuestions.every((q) => screeningAnswers[q.id] !== null));
	let businessOwnerContinuing = $derived(screeningAnswers['business_ownership'] === true && scorp === false);
	let isCountyStep = $derived(screeningIndex === 0);
	let currentQ = $derived(isCountyStep ? null : screeningQuestions[screeningIndex - 1]);
	let isFinalQuestionStep = $derived(screeningIndex === totalSteps - 1 && !isCountyStep);
	let finalQuestionAnswered = $derived(
		isFinalQuestionStep && currentQ ? screeningAnswers[currentQ.id] !== null : false
	);

	/** True when the S corp follow-up question needs to be answered. */
	let showScorpQuestion = $derived(
		currentQ?.id === 'business_ownership' && screeningAnswers['business_ownership'] === true && scorp === null
	);
	/** True when the user confirmed they have an S Corp — hard stop, must consult. */
	let scorpHardStop = $derived(
		currentQ?.id === 'business_ownership' && screeningAnswers['business_ownership'] === true && scorp === true
	);
	/** True when a standard gating question has been answered Yes — hard stop, must consult. */
	let gatingHardStop = $derived(
		currentQ !== null &&
		currentQ.id !== 'business_ownership' &&
		currentQ.consultationIfYes !== false &&
		screeningAnswers[currentQ.id] === true
	);

	let allLoeChecked = $derived(
		loeCheckboxes.limitedScope &&
		loeCheckboxes.situationFits &&
		loeCheckboxes.islamicPrinciples &&
		loeCheckboxes.noTaxPlanning &&
		loeCheckboxes.noHeirRepresentation &&
		loeCheckboxes.keepOriginalsSafe &&
		loeCheckboxes.homesteadGuidanceOnly
	);
	let loeReady = $derived(allLoeChecked && loeUserDate.trim().length > 0);

	function answer(id: string, value: boolean) {
		if (id === 'business_ownership' && screeningAnswers[id] !== value) {
			scorp = null;
		}
		screeningAnswers = { ...screeningAnswers, [id]: value };
		const q = screeningQuestions.find((x) => x.id === id);
		const pauseOnStep = Boolean(
			(q?.advisoryAfterYes && value === true) ||
			(q?.consultationIfYes !== false && value === true)
		);
		if (!pauseOnStep && screeningIndex < totalSteps - 1) {
			screeningIndex++;
		}
		if (q?.consultationIfYes !== false && value === true && onIneligible && county.trim()) {
			const answers: Record<string, boolean> = {};
			for (const sq of screeningQuestions) {
				answers[sq.id] = screeningAnswers[sq.id] === true;
			}
			onIneligible({ county: county.trim(), answers });
		}
	}

	function openLoeModal() {
		if (!allAnswered) return;
		showLoeModal = true;
	}

	async function agreeAndSubmit() {
		if (!loeReady || !allAnswered) return;
		const loe: LoeAgreementData = {
			version: LOE_AGREEMENT_VERSION,
			clientTimestamp: new Date().toISOString(),
			userEnteredDate: loeUserDate.trim(),
			checkboxes: { ...loeCheckboxes },
		};
		submitting = true;
		showLoeModal = false;
		const answers: Record<string, boolean> = {};
		for (const q of screeningQuestions) {
			const v = screeningAnswers[q.id];
			if (v === null) { submitting = false; return; }
			answers[q.id] = v;
		}
		onsubmitProp({ county: county.trim(), answers, loe });
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}
</script>

<!-- ── LOE Modal ────────────────────────────────────────────────────── -->
{#if showLoeModal}
	<div
		class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
		transition:fade={{ duration: 150 }}
		onclick={(e) => { if (e.target === e.currentTarget) showLoeModal = false; }}
		onkeydown={(e) => { if (e.key === 'Escape') showLoeModal = false; }}
		role="dialog"
		aria-modal="true"
		aria-labelledby="loe-title"
		tabindex="-1"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-navy/40 backdrop-blur-sm"></div>

		<!-- Panel -->
		<div
			class="relative z-10 w-full sm:max-w-2xl bg-cream rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh]"
		>
			<!-- Header -->
			<div class="shrink-0 px-6 pt-6 pb-4 border-b border-navy/[0.08]">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-[10px] tracking-[0.25em] uppercase text-emerald-accent font-medium mb-1">Legal Agreement</p>
						<h2 id="loe-title" class="text-lg font-semibold text-navy leading-snug">
							Limited-Scope App Engagement
						</h2>
						<p class="text-[12px] text-navy/45 mt-0.5">McDaniel Estate Planning, PLLC · Good Tree Trust App</p>
					</div>
					<button
						onclick={() => showLoeModal = false}
						class="shrink-0 mt-0.5 p-1.5 rounded-lg text-navy/40 hover:text-navy hover:bg-navy/[0.06] transition-colors cursor-pointer"
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

				<!-- Intro -->
				<p class="text-navy/80">
					By continuing, you are hiring <strong class="text-navy font-semibold">McDaniel Estate Planning, PLLC</strong> for a limited-scope app-based estate planning service. The Good Tree Trust App is designed to help eligible users create a basic Islamic revocable trust plan using the information they provide through the app.
				</p>

				<!-- What the app includes -->
				<div>
					<h3 class="text-[11px] tracking-[0.2em] uppercase font-semibold text-navy/50 mb-2">What the app includes</h3>
					<p>
						Your app plan includes a basic Islamic revocable living trust, a basic pour-over will, one deed for your primary personal residence if you own a home, recording of that deed with your county of residence, general signing/notarization/funding instructions, and limited attorney review for eligibility, consistency, and obvious input issues.
					</p>
				</div>

				<!-- What the app does not include -->
				<div>
					<h3 class="text-[11px] tracking-[0.2em] uppercase font-semibold text-navy/50 mb-2">What the app does not include</h3>
					<p>
						This is not full-service estate planning. Unless we separately agree in writing, the app does not include tax planning, financial advice, beneficiary-designation review, full trust funding, community-property or separate-property analysis, business succession planning, probate, post-death trust administration, or representation of heirs/family members.
					</p>
				</div>

				<!-- Trust funding -->
				<div>
					<h3 class="text-[11px] tracking-[0.2em] uppercase font-semibold text-navy/50 mb-2">Trust funding</h3>
					<p>
						A trust only works for assets that are properly connected to it. We will assist with the deed for your primary personal residence only. For other assets, we may provide instructions, but you are responsible for completing the funding steps unless you hire us separately.
					</p>
				</div>

				<!-- Self-administered trust -->
				<div>
					<h3 class="text-[11px] tracking-[0.2em] uppercase font-semibold text-navy/50 mb-2">Self-administered trust</h3>
					<p>
						The Good Tree Trust App is designed to create a self-administered trust plan. Your chosen successor trustee should be able to use the documents and instructions to begin administering the trust after death. McDaniel Estate Planning will not administer the trust after death unless separately hired.
					</p>
				</div>

				<!-- Your documents -->
				<div>
					<h3 class="text-[11px] tracking-[0.2em] uppercase font-semibold text-navy/50 mb-2">Your documents</h3>
					<p>
						You must keep your signed originals safe. Do not rely on the app or our firm as your permanent document vault. You are responsible for downloading, printing, signing, and safely storing your final documents.
					</p>
				</div>

				<!-- Married couples -->
				<div>
					<h3 class="text-[11px] tracking-[0.2em] uppercase font-semibold text-navy/50 mb-2">Married couples</h3>
					<p>
						If you are using the app as a married couple, you are asking us to represent both spouses jointly for this limited app service. We cannot take sides. Information one spouse gives us may be shared with the other spouse. If a conflict develops, we may stop work and require separate counsel.
					</p>
				</div>

				<!-- When engagement ends -->
				<div>
					<h3 class="text-[11px] tracking-[0.2em] uppercase font-semibold text-navy/50 mb-2">When the engagement ends</h3>
					<p>
						Our limited app representation ends when the app service is complete, final documents are delivered via your portal on your account, any included deed service is completed, the file is closed for nonresponse, or we determine the app is not appropriate. After that, we have no ongoing duty to monitor changes in your family, assets, tax law, estate planning law, probate law, homestead law, or Islamic inheritance analysis.
					</p>
				</div>

				<!-- Divider -->
				<div class="border-t border-navy/[0.08] pt-4">
					<p class="text-[11px] tracking-[0.2em] uppercase font-semibold text-navy mb-4">Please confirm each of the following</p>

					<div class="space-y-3.5">
						<!-- Checkbox 1 -->
						<label class="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								bind:checked={loeCheckboxes.limitedScope}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer"
							/>
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand this is a <strong class="font-semibold text-navy">limited-scope app engagement</strong>, not full-service estate planning.
							</span>
						</label>

						<!-- Checkbox 2: situationFits (varies by business owner) -->
						<label class="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								bind:checked={loeCheckboxes.situationFits}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer"
							/>
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								{#if businessOwnerContinuing}
									I own a business and confirm I may still use this online trust. I understand I should amend my bylaws and operating agreements so they work with my trust, and that Good Tree / Muslim Legacy Planning will email me about a free consultation regarding my corporate documents. I otherwise confirm this plan fits my situation (Texas resident, one primary residence, no blended-family or special needs planning beyond this trust). If my situation is more complex, I understand I should <a href={consultationBookingUrl} target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 text-emerald-accent hover:text-emerald-accent/80">schedule a consultation</a> instead.
								{:else}
									I confirm my situation fits this online plan (Texas resident, one primary residence, no business ownership, no blended-family or special needs planning). If my situation is more complex, I understand I should <a href={consultationBookingUrl} target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 text-emerald-accent hover:text-emerald-accent/80">schedule a consultation</a> instead.
								{/if}
							</span>
						</label>

						<!-- Checkbox 3 -->
						<label class="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								bind:checked={loeCheckboxes.islamicPrinciples}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer"
							/>
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand this trust is structured in accordance with established <strong class="font-semibold text-navy">Islamic inheritance principles</strong>. The prescribed shares are not customizable.
							</span>
						</label>

						<!-- Checkbox 4 -->
						<label class="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								bind:checked={loeCheckboxes.noTaxPlanning}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer"
							/>
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand the app does not include tax planning, financial advice, beneficiary-designation review, full trust funding, or post-death trust administration. For those, or for any other legal strategy or services beyond the app scope, I understand that I can <a href={consultationBookingUrl} target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 text-emerald-accent hover:text-emerald-accent/80">book a consultation</a>.
							</span>
						</label>

						<!-- Checkbox 5 -->
						<label class="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								bind:checked={loeCheckboxes.noHeirRepresentation}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer"
							/>
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand McDaniel Estate Planning will not represent my heirs, beneficiaries, trustee, executor, spouse, children, or family members unless separately hired.
							</span>
						</label>

						<!-- Checkbox 6 -->
						<label class="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								bind:checked={loeCheckboxes.keepOriginalsSafe}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer"
							/>
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand I must keep my <strong class="font-semibold text-navy">signed originals safe</strong> and should not rely on the app or firm as my document vault.
							</span>
						</label>

						<!-- Checkbox 7 -->
						<label class="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								bind:checked={loeCheckboxes.homesteadGuidanceOnly}
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/25 text-emerald-accent focus:ring-emerald-accent/30 cursor-pointer"
							/>
							<span class="text-[13px] text-navy/75 leading-relaxed group-hover:text-navy/90 transition-colors">
								I understand GoodTree Trust provides detailed, attorney-prepared guidance for securing my Texas homestead exemption, but does not file the exemption application on my behalf.
							</span>
						</label>
					</div>
				</div>

				<!-- Date field -->
				<div class="border-t border-navy/[0.08] pt-4">
					<label for="loe-date" class="block text-[12px] font-medium text-navy/60 mb-2 tracking-wide">
						Today's date <span class="text-red-400">*</span>
					</label>
					<input
						id="loe-date"
						type="date"
						bind:value={loeUserDate}
						class="w-48 px-3.5 py-2.5 rounded-xl border border-navy/10 bg-white text-navy text-sm outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/15 cursor-pointer"
					/>
					<p class="text-[11px] text-navy/40 mt-1.5">Select today's date to confirm your agreement.</p>
				</div>

				<!-- Spacer so the sticky footer doesn't overlap content -->
				<div class="h-2"></div>
			</div>

			<!-- Sticky footer -->
			<div class="shrink-0 px-6 py-4 border-t border-navy/[0.08] bg-cream/90 backdrop-blur-sm rounded-b-2xl">
				{#if !allLoeChecked}
					<p class="text-[11px] text-navy/45 mb-3">
						Please check all {Object.values(loeCheckboxes).filter(v => !v).length} remaining box{Object.values(loeCheckboxes).filter(v => !v).length === 1 ? '' : 'es'} above to continue.
					</p>
				{:else if !loeUserDate.trim()}
					<p class="text-[11px] text-navy/45 mb-3">Please enter today's date above to continue.</p>
				{/if}
				<div class="flex items-center gap-3">
					<button
						onclick={() => showLoeModal = false}
						class="px-4 py-2.5 rounded-lg text-sm text-navy/55 hover:text-navy hover:bg-navy/[0.05] transition-colors cursor-pointer"
					>
						Cancel
					</button>
					<button
						onclick={agreeAndSubmit}
						disabled={!loeReady || submitting}
						class="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-cream bg-navy
							   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/15
							   disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
					>
						{#if submitting}
							<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Submitting…
						{:else}
							I Agree &amp; Continue
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ── Main screening UI ────────────────────────────────────────────── -->
<div class="h-dvh max-h-dvh w-screen overflow-hidden bg-cream font-sans flex flex-col relative">
	<div class="absolute inset-0 pointer-events-none"
		style="background:
			radial-gradient(ellipse 80% 60% at 50% 40%, rgba(74,124,111,0.07) 0%, transparent 70%),
			radial-gradient(ellipse 40% 40% at 20% 80%, rgba(74,124,111,0.03) 0%, transparent 60%);">
	</div>

	<nav
		class="relative z-10 shrink-0 flex items-center justify-between px-8 pt-[max(1.5rem,env(safe-area-inset-top,0px))] pb-6 max-w-5xl w-full mx-auto"
	>
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<div class="flex items-center gap-3">
			<span class="hidden sm:inline text-sm text-navy/45">{userEmail}</span>
			<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
		</div>
	</nav>

	<div class="relative z-10 flex min-h-0 flex-1 flex-col">
		<div
			class="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] px-6 py-10 md:py-16"
		>
			<div class="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-start md:justify-center">
				<div class="text-center mb-10 w-full">
					<div class="flex items-center justify-center gap-4 mb-5">
						<span class="w-8 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Before We Begin</span>
						<span class="w-8 h-px bg-emerald-accent/60"></span>
					</div>
					<h1 class="text-3xl md:text-4xl font-semibold text-navy tracking-tight mb-3">Welcome, {firstName}</h1>
					<p class="text-navy/50 text-base font-light max-w-md mx-auto leading-relaxed">
						Please answer a few quick questions so we can determine the best path for your estate plan.
					</p>
				</div>

				<div class="w-full max-w-lg">
					<!-- progress -->
					<div class="flex items-center justify-between mb-2">
						<span class="text-[11px] text-navy/40 tracking-wider uppercase font-medium">Eligibility Check</span>
						<span class="text-[11px] text-navy/35">{screeningIndex + 1} of {totalSteps}</span>
					</div>
					<div class="w-full h-1 rounded-full bg-navy/[0.06] overflow-hidden mb-10">
						<div class="h-full rounded-full bg-emerald-accent transition-all duration-500 ease-out"
							style="width: {((screeningIndex + 1) / totalSteps) * 100}%"></div>
					</div>

					<!-- question -->
					{#if isCountyStep}
						<h2 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight leading-snug mb-8">
							Which county in Texas do you live in?
						</h2>
						<div class="mb-8">
							<CountySelector
								bind:value={county}
								placeholder="Search Texas counties…"
								inputClass="w-full px-4 py-3 rounded-xl border border-navy/10 bg-white text-navy text-sm outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/15"
							/>
						</div>
					{:else}
						<h2 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight leading-snug mb-8">
							{currentQ?.text}
						</h2>
						{#if currentQ?.subtext}
							<p class="text-sm text-navy/55 leading-relaxed -mt-4 mb-6">
								{currentQ.subtext}
							</p>
						{/if}

						<div class="flex gap-3 mb-6">
							{#each [{ label: 'Yes', value: true }, { label: 'No', value: false }] as opt}
								{@const sel = currentQ ? screeningAnswers[currentQ.id] === opt.value : false}
								<button onclick={() => currentQ && answer(currentQ.id, opt.value)}
									class="flex-1 px-5 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer
										   {sel ? 'bg-emerald-accent/8 border-emerald-accent/30 text-navy font-medium' : 'bg-white border-navy/10 text-navy/70 hover:border-navy/20'}">
									{opt.label}
								</button>
							{/each}
						</div>

						<!-- S Corp sub-question (shown when business_ownership = Yes) -->
						{#if currentQ?.id === 'business_ownership' && screeningAnswers['business_ownership'] === true}
							{#if scorp === null}
								<div class="mb-6" transition:slide={{ duration: 200 }}>
									<p class="text-lg font-semibold text-navy tracking-tight leading-snug mb-4">
										Are any of your businesses S Corporations?
									</p>
									<div class="flex gap-3">
										{#each [{ label: 'Yes', value: true }, { label: 'No', value: false }] as opt}
											<button
												onclick={() => scorp = opt.value}
												class="flex-1 px-5 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer bg-white border-navy/10 text-navy/70 hover:border-navy/20"
											>
												{opt.label}
											</button>
										{/each}
									</div>
								</div>
							{:else if scorp === true}
								<!-- Hard stop: S Corp requires consultation -->
								<div
									class="mb-8 rounded-xl border border-amber-300/50 bg-amber-50/70 p-4 md:p-5"
									role="alert"
									transition:slide={{ duration: 200 }}
								>
									<p class="text-[13px] md:text-sm text-navy/80 leading-relaxed mb-4">
										S Corporations are particularly complex to plan for in a trust context and cannot be properly handled through this online tool. You will need a direct consultation with our attorney to structure your estate plan correctly.
									</p>
									<a
										href={consultationBookingUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy transition-all duration-200 hover:bg-navy-light"
									>
										Schedule a Consultation
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
										</svg>
									</a>
									<button
										onclick={() => scorp = null}
										class="mt-3 block text-[12px] text-navy/40 underline underline-offset-2 cursor-pointer hover:text-navy/60 transition-colors"
									>
										Go back
									</button>
								</div>
							{/if}
						{/if}

						<!-- Hard stop for all other gating questions -->
						{#if gatingHardStop && currentQ}
							<div
								class="mb-8 rounded-xl border border-amber-300/50 bg-amber-50/70 p-4 md:p-5"
								role="alert"
								transition:slide={{ duration: 200 }}
							>
								<p class="text-[13px] md:text-sm text-navy/80 leading-relaxed mb-4">
									Based on your answer, your situation requires personalized planning that goes beyond the scope of this online tool. Please schedule a consultation with our attorney to ensure your estate plan is structured correctly.
								</p>
								<a
									href={consultationBookingUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy transition-all duration-200 hover:bg-navy-light"
								>
									Schedule a Consultation
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
									</svg>
								</a>
								<button
									onclick={() => { if (currentQ) screeningAnswers = { ...screeningAnswers, [currentQ.id]: null }; }}
									class="mt-3 block text-[12px] text-navy/40 underline underline-offset-2 cursor-pointer hover:text-navy/60 transition-colors"
								>
									Go back
								</button>
							</div>
						{/if}

						<!-- Existing advisory (only for non-S-corp business owners) -->
						{#if currentQ?.advisoryAfterYes && screeningAnswers[currentQ.id] === true && (currentQ.id !== 'business_ownership' || scorp === false)}
							<div
								class="mb-8 rounded-xl border border-emerald-accent/30 bg-emerald-accent/[0.07] p-4 md:p-5"
								role="status"
								transition:slide={{ duration: 200 }}
							>
								<p class="text-[13px] md:text-sm text-navy/80 leading-relaxed">
									{currentQ.advisoryAfterYes}
								</p>
							</div>
						{/if}

						<!-- On the final question, after answering, prompt the user to review the agreement -->
						{#if finalQuestionAnswered && !gatingHardStop && !scorpHardStop}
							<div class="mb-8 rounded-xl border border-emerald-accent/25 bg-emerald-accent/[0.05] p-4 md:p-5" transition:slide={{ duration: 200 }}>
								<p class="text-[13px] text-navy/70 leading-relaxed mb-3">
									You're eligible to proceed. Before continuing, please review and accept the engagement agreement.
								</p>
								<button
									onclick={openLoeModal}
									class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cream bg-emerald-accent hover:bg-emerald-accent/90 transition-all duration-200 cursor-pointer"
								>
									Review &amp; Sign Agreement
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- nav bar -->
		<div
			class="shrink-0 border-t border-navy/[0.06] bg-cream px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:py-5"
		>
			<div class="mx-auto flex max-w-lg items-center justify-between">
				<button onclick={() => { if (screeningIndex > 0) screeningIndex--; }}
					disabled={screeningIndex === 0}
					class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm text-navy/60
						   transition-all hover:text-navy hover:bg-navy/[0.04]
						   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
					Back
				</button>

				{#if screeningIndex < totalSteps - 1}
					<button
						onclick={() => {
							if (isCountyStep) {
								if (hasCounty) screeningIndex++;
								return;
							}
							if (currentQ && screeningAnswers[currentQ.id] !== null) screeningIndex++;
						}}
						disabled={isCountyStep
							? !hasCounty
							: (currentQ ? screeningAnswers[currentQ.id] === null : true) || showScorpQuestion || scorpHardStop || gatingHardStop}
						class="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy
							   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
							   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
						Next
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{:else}
					<!-- On the final step, the "Continue" button opens the LOE modal -->
					<button
						onclick={openLoeModal}
						disabled={!allAnswered || submitting || gatingHardStop || scorpHardStop}
						class="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy
							   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
							   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
						{submitting ? 'Submitting…' : 'Continue'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
