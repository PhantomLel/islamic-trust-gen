<script lang="ts">
	import { onMount } from 'svelte';
	import { deserialize } from '$app/forms';
	import { authClient } from '$lib/auth-client';
	import { siteName, consultationBookingUrl } from '$lib/config';
	import {
		usStates,
		stateName,
		assetRanges,
		stageMeta,
		willStages,
		type WillResponses,
		type WillResponseValue,
		type WillStep,
		type WillStage,
		type ChildrenCounts
	} from '$lib/free-will/config';
	import {
		getActiveSteps,
		isStepAnswered,
		isWillComplete,
		isCommunityPropertySituation,
		appliesCommunityPropertyClauses,
		communityPropertyWarning,
		communityPropertyClauses,
		legalMode,
		legalModeDisclaimers,
		computeLeadTags,
		recommendPlan,
		buildEstateInput,
		type PlanKey
	} from '$lib/free-will/logic';
	import { IslamicInheritanceCalculator } from '$lib/inheritance';

	let { data } = $props();

	type Phase = 'welcome' | 'questions' | 'community' | 'preview' | 'account' | 'complete';

	const STORAGE_KEY = 'free-will:v1';

	let phase = $state<Phase>('welcome');
	let responses = $state<WillResponses>({});
	let currentIndex = $state(0);
	let hydrated = $state(false);
	let savedToAccount = $state(false);

	// Account step state
	let accountName = $state('');
	let accountEmail = $state('');
	let reviewReminders = $state(true);
	let attorneyAvailability = $state(false);
	let accountError = $state('');
	let accountLoading = $state(false);
	let magicLinkSent = $state(false);

	// ── derived ──
	let activeSteps = $derived(getActiveSteps(responses));
	let currentStep = $derived<WillStep | undefined>(activeSteps[currentIndex]);
	let progress = $derived(
		activeSteps.length ? Math.min(1, (currentIndex + 1) / activeSteps.length) : 0
	);
	let canNext = $derived(currentStep ? isStepAnswered(currentStep, responses) : false);
	let isLastQuestion = $derived(currentIndex === activeSteps.length - 1);
	let complete = $derived(isWillComplete(responses));

	let mode = $derived(legalMode(responses));
	let tags = $derived(computeLeadTags(responses));
	let recommendation = $derived(recommendPlan(responses));
	let communityProperty = $derived(isCommunityPropertySituation(responses));
	let includeClauses = $derived(appliesCommunityPropertyClauses(responses));

	let calcResult = $derived.by(() => {
		try {
			return new IslamicInheritanceCalculator(buildEstateInput(responses)).calculate();
		} catch {
			return null;
		}
	});

	type PlanCard = { title: string; tagline: string; price: string; href: string };
	const planCards: Record<Exclude<PlanKey, null>, PlanCard> = {
		'goodtree-trust': {
			title: 'GoodTree Trust',
			tagline: 'Avoid probate with an attorney-supervised Islamic revocable living trust.',
			price: 'Flat fee',
			href: '/trust'
		},
		'legacy-plan': {
			title: 'Legacy Plan',
			tagline: 'Full-service estate planning designed personally by your attorney.',
			price: 'From $3,200',
			href: consultationBookingUrl
		},
		'family-waqf': {
			title: 'Family Waqf Plan',
			tagline: 'Protect your estate and build a lasting family endowment.',
			price: 'Inquire',
			href: consultationBookingUrl
		}
	};
	let recommendedCard = $derived(
		recommendation.plan ? planCards[recommendation.plan] : null
	);

	// ── persistence (localStorage) ──
	function persist() {
		if (!hydrated || typeof localStorage === 'undefined') return;
		const payload = {
			phase,
			responses,
			currentIndex,
			savedToAccount,
			accountName,
			accountEmail,
			reviewReminders,
			attorneyAvailability
		};
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		} catch {
			// ignore quota / privacy-mode errors
		}
	}

	$effect(() => {
		// touch reactive deps so this runs on any change
		void phase;
		void currentIndex;
		void savedToAccount;
		void JSON.stringify(responses);
		void accountName;
		void accountEmail;
		void reviewReminders;
		void attorneyAvailability;
		persist();
	});

	// clamp index when active list shrinks
	$effect(() => {
		if (currentIndex >= activeSteps.length && activeSteps.length > 0) {
			currentIndex = activeSteps.length - 1;
		}
	});

	onMount(() => {
		if (typeof localStorage !== 'undefined') {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				try {
					const p = JSON.parse(raw);
					if (p.responses) responses = p.responses;
					if (typeof p.currentIndex === 'number') currentIndex = p.currentIndex;
					if (typeof p.phase === 'string') phase = p.phase;
					if (typeof p.savedToAccount === 'boolean') savedToAccount = p.savedToAccount;
					if (typeof p.accountName === 'string') accountName = p.accountName;
					if (typeof p.accountEmail === 'string') accountEmail = p.accountEmail;
					if (typeof p.reviewReminders === 'boolean') reviewReminders = p.reviewReminders;
					if (typeof p.attorneyAvailability === 'boolean')
						attorneyAvailability = p.attorneyAvailability;
				} catch {
					// ignore corrupt state
				}
			}
		}

		// Prefill from authenticated account if present.
		if (data.user) {
			if (!accountName) accountName = data.user.name ?? '';
			if (!accountEmail) accountEmail = data.user.email ?? '';
		}

		hydrated = true;

		// If the user returned authenticated with a finished will that hasn't been
		// attached to the account yet, save it now and show the completion screen.
		if (data.user && !savedToAccount && isWillComplete(responses)) {
			void persistToAccount();
		} else if (data.user && data.savedWill?.complete && !isWillComplete(responses)) {
			phase = 'complete';
		}
	});

	// ── responses helpers ──
	function setResponse(value: WillResponseValue) {
		if (!currentStep) return;
		responses[currentStep.id] = value;
	}

	function setCounts(part: keyof ChildrenCounts, value: number) {
		const current = (responses['children_counts'] as ChildrenCounts) ?? { sons: 0, daughters: 0 };
		responses['children_counts'] = { ...current, [part]: Math.max(0, value) };
	}

	let countsValue = $derived(
		(responses['children_counts'] as ChildrenCounts) ?? { sons: 0, daughters: 0 }
	);

	// ── navigation ──
	function start() {
		phase = 'questions';
		currentIndex = 0;
	}

	function goNext() {
		if (!canNext) return;
		if (!isLastQuestion) {
			currentIndex += 1;
			return;
		}
		// finished questions
		phase = communityProperty ? 'community' : 'preview';
	}

	function goBack() {
		if (phase === 'questions') {
			if (currentIndex > 0) currentIndex -= 1;
			else phase = 'welcome';
		} else if (phase === 'community') {
			phase = 'questions';
		} else if (phase === 'preview') {
			phase = communityProperty ? 'community' : 'questions';
		} else if (phase === 'account') {
			phase = 'preview';
		}
	}

	function buildResponseArray() {
		return getActiveSteps(responses).map((s) => ({ id: s.id, response: responses[s.id] ?? null }));
	}

	function saveFormData(action: 'saveAuthed' | 'savePending'): FormData {
		const form = new FormData();
		form.set('responses', JSON.stringify(buildResponseArray()));
		form.set('tags', JSON.stringify(tags));
		form.set('state', typeof responses['state'] === 'string' ? responses['state'] : '');
		form.set('legalMode', mode);
		form.set('recommendedPlan', recommendation.plan ?? '');
		form.set('reviewReminders', String(reviewReminders));
		form.set('attorneyAvailability', String(attorneyAvailability));
		if (action === 'savePending') {
			form.set('name', accountName.trim());
			form.set('email', accountEmail.trim());
		}
		return form;
	}

	async function persistToAccount() {
		const res = await fetch('?/saveAuthed', { method: 'POST', body: saveFormData('saveAuthed') });
		const result = deserialize(await res.text());
		if (result.type === 'success') {
			savedToAccount = true;
			phase = 'complete';
		}
	}

	async function handleCreateAccount() {
		accountError = '';
		if (!accountName.trim()) {
			accountError = 'Please enter your name.';
			return;
		}
		if (!accountEmail.trim() || !accountEmail.includes('@')) {
			accountError = 'Please enter a valid email address.';
			return;
		}
		accountLoading = true;
		try {
			if (data.user) {
				await persistToAccount();
				return;
			}
			// Anonymous: stash a pending submission, then start passwordless sign-in.
			await fetch('?/savePending', { method: 'POST', body: saveFormData('savePending') });
			const { error: err } = await authClient.signIn.magicLink({
				email: accountEmail.trim(),
				name: accountName.trim(),
				callbackURL: '/free-islamic-will'
			});
			if (err) {
				accountError = err.message ?? 'Something went wrong. Please try again.';
				return;
			}
			magicLinkSent = true;
		} finally {
			accountLoading = false;
		}
	}

	async function handleGoogle() {
		if (!data.user) {
			// Persist pending first so a Google account with a different email still
			// gets the data via the authenticated auto-save on return.
			await fetch('?/savePending', { method: 'POST', body: saveFormData('savePending') });
		}
		await authClient.signIn.social({ provider: 'google', callbackURL: '/free-islamic-will' });
	}

	// option helpers for select-style answers
	function yesNoUnsureLabel(v: WillResponseValue): string {
		if (v === 'yes') return 'Yes';
		if (v === 'no') return 'No';
		if (v === 'unsure') return 'Not sure';
		return '';
	}

	function sharePercent(numerator: number, denominator: number): string {
		if (!denominator) return '';
		return `${Math.round((numerator / denominator) * 1000) / 10}%`;
	}
</script>

<svelte:head>
	<title>Free Islamic Will — {siteName}</title>
	<meta
		name="description"
		content="Create your free Islamic will in about 10 minutes. Attorney-informed, shariah-grounded, and the right first step for every Muslim family."
	/>
</svelte:head>

{#snippet optionButton(label: string, selected: boolean, onClick: () => void)}
	<button
		type="button"
		onclick={onClick}
		class="w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer
			{selected
			? 'border-emerald-accent bg-emerald-accent/8 text-navy shadow-sm shadow-emerald-accent/10'
			: 'border-navy/12 bg-white/70 text-navy/75 hover:border-emerald-accent/40 hover:bg-white'}"
	>
		<span class="flex items-center justify-between gap-3">
			<span class="text-[15px] font-medium">{label}</span>
			<span
				class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all
					{selected ? 'border-emerald-accent bg-emerald-accent' : 'border-navy/20'}"
			>
				{#if selected}
					<svg class="w-3 h-3 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				{/if}
			</span>
		</span>
	</button>
{/snippet}

<div class="min-h-dvh w-full bg-cream font-sans flex flex-col relative">
	<div
		class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 80% 55% at 50% 30%, rgba(74,124,111,0.06) 0%, transparent 70%);"
	></div>

	<!-- NAV -->
	<nav class="relative z-10 shrink-0 flex items-center justify-between px-5 md:px-8 py-4 border-b border-navy/[0.06]">
		<a href="/" class="flex items-center gap-3 transition-opacity hover:opacity-75">
			<img src="/mcdaniel.png" alt="" class="h-7 w-auto" />
			<span class="text-navy font-semibold text-sm tracking-tight" style="font-family: 'Playfair Display', Georgia, serif;">
				{siteName}
			</span>
		</a>
		{#if phase === 'questions' || phase === 'community' || phase === 'preview'}
			<span class="text-[11px] text-navy/40 tracking-[0.18em] uppercase">Free Islamic Will</span>
		{:else}
			<a href="/plans" class="text-sm text-navy/50 hover:text-navy transition-colors">All plans</a>
		{/if}
	</nav>

	<!-- PROGRESS BAR (no numbers, per brief) -->
	{#if phase === 'questions' || phase === 'community' || phase === 'preview'}
		<div class="relative z-10 shrink-0 h-1 w-full bg-navy/[0.06]">
			<div
				class="h-full bg-emerald-accent transition-all duration-500 ease-out"
				style="width: {phase === 'questions' ? progress * 100 : 100}%"
			></div>
		</div>
	{/if}

	<main class="relative z-10 flex-1 flex flex-col">
		{#if phase === 'welcome'}
			<!-- ═══ WELCOME ═══ -->
			<div class="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
				<div class="max-w-xl w-full">
					<div class="flex items-center justify-center gap-3 mb-7">
						<span class="w-8 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Free · About 10 minutes</span>
						<span class="w-8 h-px bg-emerald-accent/60"></span>
					</div>
					<h1 class="text-3xl md:text-5xl text-navy tracking-tight leading-tight text-balance mb-5">
						Start your free Islamic will
					</h1>
					<p class="text-navy/55 text-base leading-relaxed max-w-md mx-auto mb-10">
						A warm, guided first step toward an estate plan that follows what Allah prescribed — no account needed to begin.
					</p>

					<ul class="text-left flex flex-col gap-3.5 max-w-md mx-auto mb-9">
						{#each ['A will reflecting the Qur\u2019anic distribution for your family', 'Plain-language signing and witnessing instructions', 'A clear note of anything in your situation worth attorney review'] as item}
							<li class="flex items-start gap-3 text-[15px] text-navy/70">
								<svg class="w-4 h-4 shrink-0 mt-0.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								{item}
							</li>
						{/each}
					</ul>

					<button
						onclick={start}
						class="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-medium text-cream bg-emerald-accent
							transition-all duration-200 hover:bg-emerald-light hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-accent/20 cursor-pointer"
					>
						Get Started
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>

					<p class="text-navy/45 text-xs leading-relaxed max-w-sm mx-auto mt-8">
						This free will is a starting point. Some assets and family situations require attorney review. Your information is private and never shared.
					</p>
				</div>
			</div>

		{:else if phase === 'questions' && currentStep}
			<!-- ═══ QUESTION ═══ -->
			<div class="flex-1 flex flex-col">
				<div class="flex-1 overflow-y-auto px-6 py-8 md:py-12">
					<div class="w-full max-w-lg mx-auto">
						<span class="text-[11px] text-emerald-accent tracking-[0.2em] uppercase font-medium">
							{stageMeta[currentStep.stage].label}
						</span>
						<h2 class="text-2xl md:text-3xl text-navy tracking-tight leading-snug mt-3 mb-3">
							{currentStep.question}
						</h2>
						{#if currentStep.help}
							<p class="text-navy/50 text-[15px] font-light leading-relaxed mb-8">{currentStep.help}</p>
						{:else}
							<div class="mb-8"></div>
						{/if}

						<!-- INPUT BY TYPE -->
						{#if currentStep.type === 'state'}
							<div class="relative">
								<select
									value={(responses[currentStep.id] as string) ?? ''}
									onchange={(e) => setResponse((e.currentTarget as HTMLSelectElement).value)}
									class="w-full appearance-none px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px]
										outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 cursor-pointer"
								>
									<option value="" disabled>Select your state…</option>
									{#each usStates as s}
										<option value={s.code}>{s.name}</option>
									{/each}
								</select>
								<svg class="w-4 h-4 text-navy/40 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</div>

						{:else if currentStep.type === 'single-select'}
							<div class="flex flex-col gap-3">
								{#each currentStep.options ?? [] as opt}
									{@render optionButton(opt, responses[currentStep.id] === opt, () => setResponse(opt))}
								{/each}
							</div>

						{:else if currentStep.type === 'yes-no'}
							<div class="flex flex-col gap-3">
								{@render optionButton('Yes', responses[currentStep.id] === true, () => setResponse(true))}
								{@render optionButton('No', responses[currentStep.id] === false, () => setResponse(false))}
							</div>

						{:else if currentStep.type === 'yes-no-unsure'}
							<div class="flex flex-col gap-3">
								{@render optionButton('Yes', responses[currentStep.id] === 'yes', () => setResponse('yes'))}
								{@render optionButton('No', responses[currentStep.id] === 'no', () => setResponse('no'))}
								{@render optionButton('Not sure', responses[currentStep.id] === 'unsure', () => setResponse('unsure'))}
							</div>

						{:else if currentStep.type === 'counts'}
							<div class="grid grid-cols-2 gap-4">
								{#each [{ key: 'sons', label: 'Sons' }, { key: 'daughters', label: 'Daughters' }] as field}
									<div class="rounded-xl border border-navy/12 bg-white/70 p-5">
										<div class="text-navy/55 text-xs tracking-wide uppercase mb-3">{field.label}</div>
										<div class="flex items-center justify-between gap-2">
											<button
												type="button"
												onclick={() => setCounts(field.key as keyof ChildrenCounts, countsValue[field.key as keyof ChildrenCounts] - 1)}
												class="w-9 h-9 rounded-lg border border-navy/12 text-navy/60 text-lg flex items-center justify-center hover:bg-navy/4 transition-colors cursor-pointer"
												aria-label={`Decrease ${field.label}`}
											>−</button>
											<span class="text-2xl text-navy tabular-nums">{countsValue[field.key as keyof ChildrenCounts]}</span>
											<button
												type="button"
												onclick={() => setCounts(field.key as keyof ChildrenCounts, countsValue[field.key as keyof ChildrenCounts] + 1)}
												class="w-9 h-9 rounded-lg border border-navy/12 text-navy/60 text-lg flex items-center justify-center hover:bg-navy/4 transition-colors cursor-pointer"
												aria-label={`Increase ${field.label}`}
											>+</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- FOOTER -->
				<div class="shrink-0 border-t border-navy/[0.06] bg-cream px-6 py-5">
					<div class="max-w-lg mx-auto flex items-center justify-between">
						<button
							onclick={goBack}
							class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-navy/55 transition-all hover:text-navy hover:bg-navy/[0.04] cursor-pointer"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
							</svg>
							Back
						</button>
						<button
							onclick={goNext}
							disabled={!canNext}
							class="flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy
								transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
								disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
						>
							{isLastQuestion ? 'Review' : 'Next'}
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>
				</div>
			</div>

		{:else if phase === 'community'}
			<!-- ═══ COMMUNITY PROPERTY WARNING ═══ -->
			<div class="flex-1 flex flex-col items-center justify-center px-6 py-12">
				<div class="max-w-xl w-full">
					<div class="rounded-2xl border border-amber-300/70 bg-amber-50 p-7 md:p-8">
						<div class="flex items-center gap-3 mb-4">
							<span class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
								<svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
								</svg>
							</span>
							<h2 class="text-xl md:text-2xl text-navy tracking-tight">A special note for {stateName(responses['state'] as string)}</h2>
						</div>
						<p class="text-navy/65 text-[15px] leading-relaxed">{communityPropertyWarning}</p>
					</div>
					<div class="flex items-center justify-between mt-8">
						<button onclick={goBack} class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-navy/55 hover:text-navy hover:bg-navy/[0.04] transition-all cursor-pointer">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
							Back
						</button>
						<button
							onclick={() => (phase = 'preview')}
							class="flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10 cursor-pointer"
						>
							I understand — continue
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</button>
					</div>
				</div>
			</div>

		{:else if phase === 'preview'}
			<!-- ═══ WILL PREVIEW ═══ -->
			<div class="flex-1 overflow-y-auto px-6 py-10 md:py-12">
				<div class="max-w-2xl mx-auto">
					<div class="text-center mb-10">
						<div class="flex items-center justify-center gap-3 mb-5">
							<span class="w-8 h-px bg-emerald-accent/60"></span>
							<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Your will is ready</span>
							<span class="w-8 h-px bg-emerald-accent/60"></span>
						</div>
						<h2 class="text-2xl md:text-4xl text-navy tracking-tight leading-tight text-balance">
							Here is what your Islamic will includes
						</h2>
					</div>

					<!-- Distribution schedule -->
					<div class="rounded-2xl border border-navy/10 bg-white/70 overflow-hidden mb-5">
						<div class="px-6 py-4 border-b border-navy/8 flex items-center justify-between">
							<h3 class="text-navy font-medium text-[15px]">Islamic Distribution Schedule</h3>
							<span class="text-navy/40 text-xs">Estimated shares</span>
						</div>
						<div class="divide-y divide-navy/6">
							{#if calcResult && calcResult.heirs.length}
								{#each calcResult.heirs as heir}
									<div class="px-6 py-3.5 flex items-center justify-between gap-4">
										<div class="min-w-0">
											<div class="text-navy text-sm">
												{heir.label}{heir.count > 1 ? ` (×${heir.count})` : ''}
											</div>
											<div class="text-navy/40 text-xs capitalize">{heir.shareType.replace(/_/g, ' ')}</div>
										</div>
										<div class="text-right shrink-0">
											<div class="text-navy text-sm tabular-nums">{heir.totalShare.toString()}</div>
											<div class="text-emerald-accent/80 text-xs tabular-nums">{sharePercent(heir.totalShare.n, heir.totalShare.d)}</div>
										</div>
									</div>
								{/each}
							{:else}
								<div class="px-6 py-5 text-navy/50 text-sm">
									We’ll finalize your distribution once your family details are complete.
								</div>
							{/if}
						</div>
						{#if calcResult && calcResult.notes.length}
							<div class="px-6 py-4 bg-navy/3 border-t border-navy/8">
								<ul class="flex flex-col gap-1.5">
									{#each calcResult.notes as note}
										<li class="text-navy/45 text-xs leading-relaxed">• {note}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>

					<!-- Document contents -->
					<div class="rounded-2xl border border-navy/10 bg-white/70 p-6 mb-5">
						<h3 class="text-navy font-medium text-[15px] mb-4">Your document will contain</h3>
						<ul class="flex flex-col gap-3">
							{#each ['Your declaration as testator, with your name, state, and the date', 'The Islamic distribution schedule above', 'Appointment of a personal representative to carry out your wishes', 'Plain-language signing and witnessing instructions for your state'] as item}
								<li class="flex items-start gap-3 text-sm text-navy/70">
									<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
									{item}
								</li>
							{/each}
							{#if includeClauses}
								<li class="flex items-start gap-3 text-sm text-navy/70">
									<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
									Community property language designed to reduce conflicts with your spouse’s rights
								</li>
							{/if}
						</ul>
					</div>

					<!-- Legal mode note -->
					<div class="rounded-xl border border-navy/8 bg-navy/3 px-5 py-4 mb-8">
						<div class="text-navy/40 text-[10px] tracking-[0.22em] uppercase mb-1.5">Legal note</div>
						<p class="text-navy/55 text-xs leading-relaxed">{legalModeDisclaimers[mode]}</p>
					</div>

					<div class="flex items-center justify-between">
						<button onclick={goBack} class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-navy/55 hover:text-navy hover:bg-navy/[0.04] transition-all cursor-pointer">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
							Back
						</button>
						<button
							onclick={() => (phase = 'account')}
							class="flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-medium text-cream bg-emerald-accent transition-all duration-200 hover:bg-emerald-light hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-accent/20 cursor-pointer"
						>
							Save my will
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</button>
					</div>
				</div>
			</div>

		{:else if phase === 'account'}
			<!-- ═══ ACCOUNT / EMAIL CAPTURE ═══ -->
			<div class="flex-1 flex flex-col items-center justify-center px-6 py-12">
				<div class="max-w-md w-full">
					{#if magicLinkSent}
						<div class="rounded-2xl bg-emerald-accent/8 border border-emerald-accent/15 p-7 text-center">
							<div class="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-accent/15 flex items-center justify-center">
								<svg class="w-6 h-6 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
							</div>
							<h2 class="text-xl text-navy tracking-tight mb-2">Check your email</h2>
							<p class="text-navy/55 text-sm leading-relaxed">
								We sent a secure link to <strong class="text-navy/75">{accountEmail}</strong>. Open it to finish creating your account — your answers are saved and waiting.
							</p>
						</div>
					{:else}
						<div class="text-center mb-8">
							<h2 class="text-2xl md:text-3xl text-navy tracking-tight mb-2">Save your will</h2>
							<p class="text-navy/55 text-sm leading-relaxed">
								Create a free account so we can store your answers, deliver your document, and pick up right where you left off.
							</p>
						</div>

						<div class="flex flex-col gap-3">
							<label class="block">
								<span class="text-navy/60 text-xs font-medium tracking-wide uppercase">Full name</span>
								<input
									type="text"
									bind:value={accountName}
									placeholder="Your full name"
									class="mt-1.5 w-full px-4 py-3 rounded-lg bg-white border border-navy/10 text-navy text-sm placeholder:text-navy/30 outline-none transition-all focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
								/>
							</label>
							<label class="block">
								<span class="text-navy/60 text-xs font-medium tracking-wide uppercase">Email</span>
								<input
									type="email"
									bind:value={accountEmail}
									placeholder="you@example.com"
									class="mt-1.5 w-full px-4 py-3 rounded-lg bg-white border border-navy/10 text-navy text-sm placeholder:text-navy/30 outline-none transition-all focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
								/>
							</label>

							<div class="flex flex-col gap-2.5 mt-2 mb-1">
								<label class="flex items-start gap-3 cursor-pointer">
									<input type="checkbox" bind:checked={reviewReminders} class="mt-0.5 w-4 h-4 accent-emerald-accent cursor-pointer" />
									<span class="text-navy/60 text-[13px] leading-snug">Send me reminders every 6 months to review my plan</span>
								</label>
								<label class="flex items-start gap-3 cursor-pointer">
									<input type="checkbox" bind:checked={attorneyAvailability} class="mt-0.5 w-4 h-4 accent-emerald-accent cursor-pointer" />
									<span class="text-navy/60 text-[13px] leading-snug">Notify me when attorney-reviewed plans become available in my state</span>
								</label>
							</div>

							{#if accountError}
								<p class="text-red-600 text-xs">{accountError}</p>
							{/if}

							<button
								onclick={handleCreateAccount}
								disabled={accountLoading}
								class="w-full py-3.5 rounded-lg bg-emerald-accent text-cream text-sm font-medium transition-all duration-200 hover:bg-emerald-light hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
							>
								{accountLoading ? 'Saving…' : data.user ? 'Save my will' : 'Create account & save'}
							</button>

							{#if !data.user}
								<div class="flex items-center gap-4 my-3">
									<div class="flex-1 h-px bg-navy/8"></div>
									<span class="text-navy/30 text-xs">or</span>
									<div class="flex-1 h-px bg-navy/8"></div>
								</div>
								<button
									type="button"
									onclick={handleGoogle}
									class="relative isolate flex min-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-navy/10 bg-white py-3 text-sm font-medium text-navy transition-all duration-200 hover:border-navy/20 hover:shadow-md hover:shadow-navy/5"
								>
									<svg class="pointer-events-none h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
										<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
									</svg>
									<span class="pointer-events-none">Continue with Google</span>
								</button>
							{/if}

							<button onclick={goBack} class="mx-auto mt-3 text-navy/45 text-xs hover:text-navy/70 transition-colors cursor-pointer">← Back to review</button>
						</div>
					{/if}
				</div>
			</div>

		{:else if phase === 'complete'}
			<!-- ═══ COMPLETION + UPSELL ═══ -->
			<div class="flex-1 overflow-y-auto px-6 py-10 md:py-14">
				<div class="max-w-2xl mx-auto">
					<div class="text-center mb-10">
						<div class="w-14 h-14 rounded-full bg-emerald-accent/10 flex items-center justify-center mx-auto mb-5">
							<svg class="w-7 h-7 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						</div>
						<h2 class="text-2xl md:text-4xl text-navy tracking-tight leading-tight text-balance mb-3">
							Your free Islamic will is complete
						</h2>
						<p class="text-navy/55 text-base leading-relaxed max-w-md mx-auto">
							Masha’Allah — you’ve taken a real first step for your family. We’ve saved your answers to your account and will email your document shortly.
						</p>
					</div>

					<!-- Signing instructions -->
					<div class="rounded-2xl border border-navy/10 bg-white/70 p-6 mb-5">
						<h3 class="text-navy font-medium text-[15px] mb-4">Next: sign your will</h3>
						<ol class="flex flex-col gap-3.5">
							{#each ['Print your will once it arrives in your email.', 'Sign and date it in front of two adult witnesses who are not heirs.', 'Have your witnesses sign in your presence and each other\u2019s.', 'Store the signed original somewhere safe and tell your representative where it is.'] as step, i}
								<li class="flex gap-3.5 items-start">
									<span class="text-emerald-accent/60 text-[11px] tabular-nums tracking-widest mt-0.5 shrink-0">0{i + 1}</span>
									<span class="text-navy/65 text-sm leading-relaxed">{step}</span>
								</li>
							{/each}
						</ol>
						<p class="text-navy/40 text-xs leading-relaxed mt-4 pt-4 border-t border-navy/8">
							Witnessing and notarization requirements vary by state. Your emailed document includes the specific steps for {stateName(responses['state'] as string) || 'your state'}.
						</p>
					</div>

					<!-- Community property upsell block -->
					{#if tags.includes('community_property_state')}
						<div class="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-6 mb-5">
							<h3 class="text-navy font-medium text-[15px] mb-2">Recommended next steps</h3>
							<p class="text-navy/60 text-sm leading-relaxed mb-5">
								Because you’re married and live in a community property state, your will may not fully resolve how your spouse’s community property share interacts with Islamic inheritance.
							</p>
							<div class="flex flex-col gap-2.5">
								<a href="/free-islamic-will" class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-navy/10 text-sm text-navy/75 hover:border-emerald-accent/40 transition-colors">
									Invite my spouse to complete a will
									<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
								</a>
								<a href="/plans" class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-navy/10 text-sm text-navy/75 hover:border-emerald-accent/40 transition-colors">
									Review my beneficiary designations
									<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
								</a>
								<a href={consultationBookingUrl} class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-navy/10 text-sm text-navy/75 hover:border-emerald-accent/40 transition-colors">
									Book an attorney review
									<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
								</a>
							</div>
						</div>
					{/if}

					<!-- Recommended plan upsell -->
					{#if recommendedCard}
						<div class="rounded-2xl bg-navy overflow-hidden mb-5">
							<div class="p-7">
								<span class="text-emerald-light/70 text-[10px] tracking-[0.28em] uppercase font-medium">Recommended for your situation</span>
								<h3 class="text-cream text-xl md:text-2xl tracking-tight mt-2 mb-2">{recommendedCard.title}</h3>
								<p class="text-cream/60 text-sm leading-relaxed mb-3">{recommendedCard.tagline}</p>
								{#if recommendation.attorneyReviewNote}
									<p class="text-cream/45 text-xs leading-relaxed mb-5">Given the size of your estate, we recommend attorney review to make sure nothing is missed.</p>
								{/if}
								<div class="flex items-center justify-between gap-4 mt-5">
									<span class="text-cream/50 text-sm">{recommendedCard.price}</span>
									<a href={recommendedCard.href} class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cream text-navy text-sm font-medium transition-all duration-200 hover:bg-white">
										Learn more
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
									</a>
								</div>
							</div>
						</div>
					{/if}

					<div class="text-center">
						<a href="/plans" class="text-navy/45 text-sm hover:text-navy/70 transition-colors">Explore all plans →</a>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
