<script lang="ts">
	import { siteName, screeningQuestions } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import CountySelector from './CountySelector.svelte';
	import WhatsAppHelpLink from './WhatsAppHelpLink.svelte';

	let { firstName, userEmail, trustId, onsubmit: onsubmitProp }: {
		firstName: string;
		userEmail: string;
		trustId: number;
		onsubmit: (payload: { county: string; answers: Record<string, boolean> }) => void;
	} = $props();

	let screeningAnswers = $state<Record<string, boolean | null>>(
		Object.fromEntries(screeningQuestions.map((q) => [q.id, null]))
	);
	let screeningIndex = $state(0);
	let submitting = $state(false);
	let county = $state('');
	let screeningConfirmed = $state(false);
	const totalSteps = screeningQuestions.length + 1;

	let hasCounty = $derived(county.trim().length > 0);

	let allAnswered = $derived(hasCounty && screeningQuestions.every((q) => screeningAnswers[q.id] !== null));
	let businessOwnerContinuing = $derived(screeningAnswers['business_ownership'] === true);
	let isCountyStep = $derived(screeningIndex === 0);
	let currentQ = $derived(isCountyStep ? null : screeningQuestions[screeningIndex - 1]);
	let isFinalQuestionStep = $derived(screeningIndex === totalSteps - 1 && !isCountyStep);
	let finalQuestionAnswered = $derived(
		isFinalQuestionStep && currentQ ? screeningAnswers[currentQ.id] !== null : false
	);

	function answer(id: string, value: boolean) {
		screeningAnswers = { ...screeningAnswers, [id]: value };
		const q = screeningQuestions.find((x) => x.id === id);
		const pauseForAdvisory = Boolean(q?.advisoryAfterYes && value === true);
		if (!pauseForAdvisory && screeningIndex < totalSteps - 1) {
			screeningIndex++;
		}
	}

	async function submit() {
		if (!hasCounty || !screeningConfirmed) return;
		const answers: Record<string, boolean> = {};
		for (const q of screeningQuestions) {
			const v = screeningAnswers[q.id];
			if (v === null) return;
			answers[q.id] = v;
		}
		submitting = true;
		onsubmitProp({
			county: county.trim(),
			answers
		});
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}
</script>

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

						<div class="mb-8 flex flex-col gap-3 sm:items-start">
							<p class="text-[13px] text-navy/60">
								Not sure how to fill out this question? 
							</p>
							<WhatsAppHelpLink />
						</div>

						{#if currentQ?.advisoryAfterYes && screeningAnswers[currentQ.id] === true}
							<div
								class="mb-8 rounded-xl border border-emerald-accent/30 bg-emerald-accent/[0.07] p-4 md:p-5"
								role="status"
							>
								<p class="text-[13px] md:text-sm text-navy/80 leading-relaxed">
									{currentQ.advisoryAfterYes}
								</p>
							</div>
						{/if}

						{#if finalQuestionAnswered}
							<div class="mb-8 rounded-xl border border-navy/10 bg-white/70 p-4 md:p-5">
								<ul class="list-disc pl-5 space-y-3 text-[13px] text-navy/65 leading-relaxed">
									{#if businessOwnerContinuing}
										<li>
											I own a business and confirm I may still use this online trust. I understand I should amend my bylaws and operating agreements so they work with my trust, and that Amana Legacy will email me about a free consultation regarding my corporate documents. I otherwise confirm this plan fits my situation (Texas resident, one primary residence, no blended-family or special needs planning beyond this trust). If my situation is more complex, I understand I should schedule a consultation instead.
										</li>
									{:else}
										<li>
											I confirm my situation fits this online plan (Texas resident, one primary residence, no business ownership, no blended-family or special needs planning). If my situation is more complex, I understand I should schedule a consultation instead.
										</li>
									{/if}
									<li>
										I understand this trust is structured in accordance with established Islamic inheritance principles. The prescribed shares are not customizable.
									</li>
									<li>
										I understand Amana Legacy provides detailed, attorney-prepared guidance for securing my Texas homestead exemption, but does not file the exemption application on my behalf.
									</li>
								</ul>

								<label class="mt-4 flex items-start gap-3 cursor-pointer">
									<input
										type="checkbox"
										bind:checked={screeningConfirmed}
										class="mt-1 h-4 w-4 rounded border-navy/20 text-emerald-accent focus:ring-emerald-accent/30"
									/>
									<span class="text-sm text-navy/70 leading-relaxed">
										I have read and agree to the statements above.
									</span>
								</label>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- nav: in-flow below scroll so content sits between header and this bar -->
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
						disabled={isCountyStep ? !hasCounty : (currentQ ? screeningAnswers[currentQ.id] === null : true)}
						class="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy
							   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
							   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
						Next
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{:else}
					<button onclick={submit}
						disabled={!allAnswered || submitting || !hasCounty || !screeningConfirmed}
						class="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy
							   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
							   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
						{submitting ? 'Submitting...' : 'Continue'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
