<script lang="ts">
	import { onMount } from 'svelte';
	import { deserialize } from '$app/forms';
	import {
		siteName,
		consultationBookingUrl,
		defaultPrepFee,
		formatUsdWhole,
		productName,
		productAttorneyReviewSentence,
		emailPurposeNotice,
		marketingConsentLabel
	} from '$lib/config';
	import type { HeirsCalculatorResponse } from '$lib/config';
	import {
		usStates,
		isWillAvailableState,
		stateName,
		stageMeta,
		getCountiesByState,
		type AddressValue,
		type ExecutorEntry,
		type GuardianEntry,
		type WillResponses,
		type WillResponseValue,
		type WillStep
	} from '$lib/free-will/config';
	import {
		getActiveSteps,
		isStepAnswered,
		isWillComplete,
		appliesCommunityPropertyClauses,
		FREE_WILL_LEGAL_MODE,
		computeLeadTags,
		recommendPlan,
		freeWillOfferLadder,
		getNamedHeirs,
		heirsQuestionId,
		heirsCalculatorAllResponses,
		needsWillLimitationWarning,
		willFlagBoundaryCopy,
		getStepValidationMessage,
		normalizeWillPersonName,
		areAssetQuestionsSkipped,
		type PlanKey
	} from '$lib/free-will/logic';
	import HeirsCalculatorInput from '$lib/components/HeirsCalculatorInput.svelte';
	import ExecutorsInput from '$lib/components/ExecutorsInput.svelte';
	import GuardiansInput from '$lib/components/GuardiansInput.svelte';
	import WillCountySelector from '$lib/components/WillCountySelector.svelte';
	import WillWasiyyahInput from '$lib/components/WillWasiyyahInput.svelte';
	import OutOfStateExit from '$lib/components/OutOfStateExit.svelte';
	import { freeWillSigningWrapper } from '$lib/free-will/deliveryCopy';
	import type { WillWasiyyahResponse } from '$lib/free-will/config';
	import {
		B6_1_NOTICE_COPY,
		B6_6_WARNING_COPY,
		FLOW_NOTICE_VERSION,
		FREE_WILL_RETENTION_LINE,
		isNoticeComplete,
		maritalStatusOptions,
		resolvesToNotHandled,
		shouldShowWarningAfterState,
		type FlowPhase
	} from '$lib/free-will/flow';
	import type { AcknowledgmentData } from '$lib/free-will/acknowledgment';
	import { isFreeWillDraftExpired, nextDraftSavedAt } from '$lib/free-will/retention';
	import { trackWillCompletion } from '$lib/utm';

	let { data } = $props();

	type Phase = FlowPhase;

	const STORAGE_KEY = 'free-will:v2';

	let phase = $state<Phase>('welcome');
	let responses = $state<WillResponses>({});
	let currentIndex = $state(0);
	let hydrated = $state(false);
	let savedToAccount = $state(false);
	let willDownload = $state<{ url: string; filename: string } | null>(null);
	// A4 — the free_will row this browser is currently associated with. Null
	// means "start a new will" (the next save inserts a fresh row); set means
	// "editing/viewing that specific will" (the next save updates it in place).
	let activeWillId = $state<number | null>(null);
	/** Last time the browser draft changed. Opening the page does not move this. */
	let draftSavedAt = $state<string | null>(null);
	let draftBody = '';

	let acknowledgmentData = $state<AcknowledgmentData | null>(null);

	// ── dev-only question navigator (localhost only) ──
	let isDev = $state(false);
	let devNavOpen = $state(true);

	// Account step state
	let accountName = $state('');
	let accountEmail = $state('');
	let accountError = $state('');
	let deliveryLoading = $state(false);
	let savingWill = $state(false);
	// Spec v3 §4.3: unchecked by default, never pre-checked, never bundled.
	let marketingConsent = $state(false);

	// ── derived ──
	let activeSteps = $derived(getActiveSteps(responses));
	let currentStep = $derived<WillStep | undefined>(activeSteps[currentIndex]);
	let progress = $derived(
		activeSteps.length ? Math.min(1, (currentIndex + 1) / activeSteps.length) : 0
	);
	let canNext = $derived(currentStep ? isStepAnswered(currentStep, responses) : false);
	let validationMessage = $derived(
		currentStep && !canNext ? getStepValidationMessage(currentStep, responses) : null
	);
	let isLastQuestion = $derived(currentIndex === activeSteps.length - 1);
	let complete = $derived(isWillComplete(responses));

	let tags = $derived(computeLeadTags(responses));
	let recommendation = $derived(recommendPlan(responses));
	let includeClauses = $derived(appliesCommunityPropertyClauses(responses));
	let showWillLimitationWarning = $derived(needsWillLimitationWarning(responses));
	let toolEnabled = $derived(data.freeWillEnabled !== false);

	let namedHeirs = $derived(getNamedHeirs(responses));
	let heirsCalcQuestionId = $derived(heirsQuestionId(responses));
	let heirsCalcAllResponses = $derived(heirsCalculatorAllResponses(responses));

	type PlanCard = { title: string; tagline: string; price: string; href: string };
	const planCards: Record<Exclude<PlanKey, null>, PlanCard> = {
		'goodtree-trust': {
			title: productName,
			tagline: productAttorneyReviewSentence,
			price: formatUsdWhole(defaultPrepFee),
			href: '/trust'
		},
		'legacy-plan': {
			title: 'Legacy Plan',
			tagline: 'Full-service estate planning designed personally by your attorney.',
			price: `From ${formatUsdWhole(3500)}`,
			href: consultationBookingUrl
		},
		'family-waqf': {
			title: 'Family Waqf Plan',
			tagline: 'Protect your estate and build a lasting family endowment.',
			price: 'Inquire',
			href: consultationBookingUrl
		}
	};
	// No paid offer is shown when `recommendPlan` returns no plan (spec v3 §4.5).
	let offerLadder = $derived(recommendation.plan ? freeWillOfferLadder(responses) : []);
	let offerCards = $derived(offerLadder.map((key) => ({ key, ...planCards[key] })));


	// ── persistence (localStorage) ──
	function draftFields() {
		return {
			phase,
			responses,
			currentIndex,
			savedToAccount,
			accountName,
			accountEmail,
			acknowledgmentData,
			activeWillId
		};
	}

	function persist() {
		if (!hydrated || typeof localStorage === 'undefined') return;
		const fields = draftFields();
		const body = JSON.stringify(fields);
		draftSavedAt = nextDraftSavedAt(draftBody, body, draftSavedAt);
		draftBody = body;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...fields, savedAt: draftSavedAt }));
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
		void acknowledgmentData;
		void activeWillId;
		persist();
	});

	// clamp index when active list shrinks
	$effect(() => {
		if (currentIndex >= activeSteps.length && activeSteps.length > 0) {
			currentIndex = activeSteps.length - 1;
		}
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			const host = window.location.hostname;
			isDev = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
		}

		if (typeof localStorage !== 'undefined') {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				try {
					const p = JSON.parse(raw);
					const savedAt = typeof p.savedAt === 'string' ? p.savedAt : null;
					if (isFreeWillDraftExpired(savedAt)) {
						localStorage.removeItem(STORAGE_KEY);
					} else {
						if (p.responses) responses = p.responses;
						if (typeof p.currentIndex === 'number') currentIndex = p.currentIndex;
						// legacy sessions may still have the old 'community' phase name stored
						if (typeof p.phase === 'string') {
							const legacy = p.phase as string;
							if (legacy === 'account') phase = 'delivery';
							else if (legacy === 'acknowledge' || legacy === 'limitations' || legacy === 'returning')
								phase = isNoticeComplete(p.acknowledgmentData) ? 'questions' : 'notice';
							else if (legacy === 'community') phase = 'notice';
							else phase = legacy as Phase;
						}
						if (typeof p.savedToAccount === 'boolean') savedToAccount = p.savedToAccount;
						if (typeof p.accountName === 'string') accountName = p.accountName;
						if (typeof p.accountEmail === 'string') accountEmail = p.accountEmail;
						if (p.acknowledgmentData) acknowledgmentData = p.acknowledgmentData;
						if (typeof p.activeWillId === 'number') activeWillId = p.activeWillId;
						draftSavedAt = savedAt;
					}
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

		// Surface a previously generated will (returning, already-saved users).
		if (data.willDownload) willDownload = data.willDownload;

		draftBody = JSON.stringify(draftFields());
		hydrated = true;
	});

	function editFinishedWill() {
		willDownload = null;
		phase = 'preview';
	}

	/** A4 — "Start a new will": clears local state so the next save inserts a fresh row. */
	function startNewWill() {
		if (typeof localStorage !== 'undefined') {
			try {
				localStorage.removeItem(STORAGE_KEY);
			} catch {
				// ignore
			}
		}
		responses = {};
		currentIndex = 0;
		acknowledgmentData = null;
		activeWillId = null;
		savedToAccount = false;
		willDownload = null;
		draftSavedAt = null;
		draftBody = '';
		phase = 'welcome';
	}

	// ── responses helpers ──
	function setResponse(value: WillResponseValue) {
		if (!currentStep) return;
		responses[currentStep.id] = value;
	}

	function normalizeCurrentTextResponse() {
		if (!currentStep || currentStep.type !== 'text') return;
		const raw = responses[currentStep.id];
		if (typeof raw !== 'string') return;
		const normalized = normalizeWillPersonName(raw);
		if (normalized !== raw) responses[currentStep.id] = normalized;
	}

	function skipAssetQuestions() {
		responses = { ...responses, assets_skipped: true };
		const steps = getActiveSteps(responses);
		const goalsIndex = steps.findIndex((s) => s.stage === 'goals');
		if (goalsIndex >= 0) currentIndex = goalsIndex;
	}

	const emptyAddress: AddressValue = { street: '', unit: '', city: '', zip: '' };
	let addressValue = $derived(
		(responses['address'] as AddressValue | undefined) ?? emptyAddress
	);
	function patchAddress(part: Partial<AddressValue>) {
		responses['address'] = { ...addressValue, ...part };
	}

	// ── navigation ──
	function start() {
		if (!toolEnabled) return;
		phase = isNoticeComplete(acknowledgmentData) ? 'questions' : 'notice';
		currentIndex = 0;
	}

	function acceptNotice() {
		acknowledgmentData = {
			version: FLOW_NOTICE_VERSION,
			acceptedAt: new Date().toISOString()
		};
		phase = 'questions';
		currentIndex = 0;
	}

	function continueFromWarning() {
		const countyIndex = activeSteps.findIndex((s) => s.id === 'county');
		currentIndex = countyIndex >= 0 ? countyIndex : currentIndex + 1;
		phase = 'questions';
	}

	// ── dev navigator: jump straight to any step or phase ──
	function devGoToQuestionnaire(index = 0) {
		phase = 'questions';
		currentIndex = Math.min(Math.max(0, index), Math.max(0, activeSteps.length - 1));
	}

	function devGoToStep(index: number) {
		devGoToQuestionnaire(index);
	}

	function devGoToPhase(target: Phase) {
		if (target === 'questions') {
			devGoToQuestionnaire(currentIndex);
			return;
		}
		phase = target;
	}

	function goNext() {
		if (!canNext || !currentStep) return;
		if (currentStep.id === 'state' && shouldShowWarningAfterState(responses)) {
			phase = 'warning';
			return;
		}
		if (currentStep.id === 'marital_status' && resolvesToNotHandled(responses)) {
			phase = 'not_handled';
			return;
		}
		if (currentStep.id === 'heirs' && resolvesToNotHandled(responses)) {
			phase = 'not_handled';
			return;
		}
		if (!isLastQuestion) {
			currentIndex += 1;
			return;
		}
		phase = 'preview';
	}

	function goBack() {
		if (phase === 'questions') {
			if (currentIndex > 0) {
				if (currentStep?.id === 'county' && shouldShowWarningAfterState(responses)) {
					phase = 'warning';
					return;
				}
				currentIndex -= 1;
			} else if (isNoticeComplete(acknowledgmentData)) {
				phase = 'notice';
			} else {
				phase = 'welcome';
			}
		} else if (phase === 'notice') {
			phase = 'welcome';
		} else if (phase === 'warning') {
			const stateIndex = activeSteps.findIndex((s) => s.id === 'state');
			if (stateIndex >= 0) currentIndex = stateIndex;
			phase = 'questions';
		} else if (phase === 'not_handled') {
			const maritalIndex = activeSteps.findIndex((s) => s.id === 'marital_status');
			const heirsIndex = activeSteps.findIndex((s) => s.id === 'heirs');
			currentIndex = maritalIndex >= 0 ? maritalIndex : heirsIndex >= 0 ? heirsIndex : 0;
			phase = 'questions';
		} else if (phase === 'preview') {
			const lastIndex = activeSteps.length - 1;
			if (lastIndex >= 0) currentIndex = lastIndex;
			phase = 'questions';
		} else if (phase === 'delivery') {
			phase = 'preview';
		}
	}

	/** Pulls a human-readable message out of a `deserialize()`d failed form action result. */
	function extractActionErrorMessage(result: { type: string; error?: unknown; data?: unknown }): string {
		const fromError = (result.error as { message?: string } | undefined)?.message;
		if (fromError) return fromError;
		const fromData = (result.data as { message?: string } | undefined)?.message;
		if (fromData) return fromData;
		return 'Something went wrong saving your answers. Please try again.';
	}

	function buildResponseArray() {
		return getActiveSteps(responses).map((s) => ({ id: s.id, response: responses[s.id] ?? null }));
	}

	function saveFormData(action: 'saveAuthed' | 'savePending'): FormData {
		const form = new FormData();
		form.set('responses', JSON.stringify(buildResponseArray()));
		form.set('tags', JSON.stringify(tags));
		form.set('state', typeof responses['state'] === 'string' ? responses['state'] : '');
		form.set('legalMode', FREE_WILL_LEGAL_MODE);
		form.set('recommendedPlan', recommendation.plan ?? '');
		form.set('acknowledgmentData', acknowledgmentData ? JSON.stringify(acknowledgmentData) : '');
		// A4 — set means "update this specific will", unset means "insert a new one".
		form.set('willId', activeWillId != null ? String(activeWillId) : '');
		// Source attribution is read from the first-party cookie on the server (spec v3 §5.1).
		form.set('marketingConsent', marketingConsent ? 'true' : 'false');
		if (action === 'savePending') {
			form.set('name', accountName.trim());
			form.set('email', accountEmail.trim());
		}
		return form;
	}

	// From the preview screen: signed-in users skip the account step entirely and
	// go straight to their finished, downloadable will.
	async function handleSaveMyWill() {
		if (!data.user) {
			phase = 'delivery';
			return;
		}
		accountError = '';
		savingWill = true;
		try {
			await persistToAccount();
		} finally {
			savingWill = false;
		}
	}

	async function persistToAccount() {
		const res = await fetch('?/saveAuthed', { method: 'POST', body: saveFormData('saveAuthed') });
		const result = deserialize(await res.text());
		if (result.type !== 'success') {
			accountError = extractActionErrorMessage(result);
			return;
		}
		savedToAccount = true;
		const resultData = result.data as {
			willId?: number;
			willDownload?: { url: string; filename: string } | null;
		};
		if (typeof resultData?.willId === 'number') activeWillId = resultData.willId;
		if (resultData?.willDownload) willDownload = resultData.willDownload;
		phase = 'complete';
		
		// Track will completion with the first-touch source only (no email, spec v3 §5).
		trackWillCompletion(activeWillId);
	}

	async function handleDeliverySubmit() {
		accountError = '';
		if (!accountName.trim()) {
			accountError = 'Please enter your name.';
			return;
		}
		if (!accountEmail.trim() || !accountEmail.includes('@')) {
			accountError = 'Please enter a valid email address.';
			return;
		}
		deliveryLoading = true;
		try {
			if (data.user) {
				await persistToAccount();
				return;
			}
			const pendingRes = await fetch('?/savePending', { method: 'POST', body: saveFormData('savePending') });
			const pendingResult = deserialize(await pendingRes.text());
			if (pendingResult.type !== 'success') {
				accountError = extractActionErrorMessage(pendingResult);
				return;
			}
			const resultData = pendingResult.data as {
				willId?: number;
				willDownload?: { url: string; filename: string } | null;
			};
			if (typeof resultData?.willId === 'number') activeWillId = resultData.willId;
			if (resultData?.willDownload) willDownload = resultData.willDownload;
			savedToAccount = true;
			phase = 'complete';
			if (activeWillId) trackWillCompletion(activeWillId);
		} finally {
			deliveryLoading = false;
		}
	}

</script>

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
			<img src="/mcdaniel.png" alt="" aria-hidden="true" width="500" height="337" class="h-7 w-auto" />
			<span class="text-navy font-semibold text-sm tracking-tight" style="font-family: 'Playfair Display', Georgia, serif;">
				{siteName}
			</span>
		</a>
		{#if phase !== 'welcome' && phase !== 'complete'}
			<span class="text-[11px] text-navy/65 tracking-[0.18em] uppercase">Free Islamic Will</span>
		{:else}
			<a href="/plans" class="text-sm text-navy/65 hover:text-navy transition-colors">All plans</a>
		{/if}
	</nav>

	<!-- PROGRESS BAR (no numbers, per brief) -->
	{#if phase === 'questions' || phase === 'notice' || phase === 'warning' || phase === 'preview' || phase === 'delivery'}
		<div class="relative z-10 shrink-0 h-1 w-full bg-navy/[0.06]">
			<div
				class="h-full bg-emerald-accent transition-all duration-500 ease-out"
				style="width: {phase === 'questions' ? progress * 100 : phase === 'notice' ? 8 : 100}%"
			></div>
		</div>
	{/if}

	<main class="relative z-10 flex-1 flex flex-col">
		{#if !toolEnabled && phase !== 'welcome'}
			<div class="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
				<div class="max-w-md w-full">
					<p class="text-navy text-lg font-medium mb-4">The free Islamic will is temporarily unavailable.</p>
					<a
						href={consultationBookingUrl}
						class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-cream bg-emerald-accent transition-all hover:bg-emerald-light"
					>
						Book a consultation
					</a>
					<button
						type="button"
						onclick={() => (phase = 'welcome')}
						class="block mx-auto mt-6 text-sm text-navy/65 hover:text-navy cursor-pointer"
					>
						← Back
					</button>
				</div>
			</div>
		{:else if phase === 'welcome'}
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
					<p class="text-navy/65 text-base leading-relaxed max-w-md mx-auto mb-10">
						A guided first step toward an estate plan built around the Qur'anic shares — no account needed to begin.
					</p>

					<ul class="text-left flex flex-col gap-3.5 max-w-md mx-auto mb-9">
						{#each ['Calculates the inheritance shares used in this will based on the family information you provide and the Islamic inheritance methodology used by the tool.', 'Plain-language signing and witnessing instructions', 'A note of situations this tool does not handle'] as item}
							<li class="flex items-start gap-3 text-[15px] text-navy/70">
								<svg class="w-4 h-4 shrink-0 mt-0.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								{item}
							</li>
						{/each}
					</ul>

					<div class="rounded-xl border border-emerald-accent/35 bg-emerald-accent/8 px-5 py-4 max-w-md mx-auto mb-8 text-left">
						<p class="text-navy text-base md:text-lg font-medium leading-snug">
							Available for Texas and California.
						</p>
					</div>

					{#if toolEnabled}
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
					{:else}
						<p class="text-navy text-base font-medium mb-4">The free Islamic will is temporarily unavailable.</p>
						<a
							href={consultationBookingUrl}
							class="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium text-cream bg-emerald-accent transition-all hover:bg-emerald-light"
						>
							Book a consultation
						</a>
					{/if}

					<p class="text-navy/65 text-xs leading-relaxed max-w-sm mx-auto mt-8">
						We protect your information and use it as described in our <a href="/privacy" class="underline underline-offset-2 hover:text-navy">Privacy Policy</a>.
					</p>
					<p class="text-navy/65 text-xs leading-relaxed max-w-sm mx-auto mt-2" data-testid="free-will-retention">
						{FREE_WILL_RETENTION_LINE}
					</p>
				</div>
			</div>

		{:else if phase === 'notice'}
			<div class="flex-1 overflow-y-auto px-6 py-12">
				<div class="max-w-xl w-full mx-auto">
					<h2 class="text-2xl md:text-3xl text-navy tracking-tight mb-6">Before you begin</h2>
					<div class="rounded-2xl border border-navy/10 bg-white/70 p-6 md:p-7 mb-8">
						<p class="text-navy/70 text-[15px] leading-relaxed">{B6_1_NOTICE_COPY}</p>
					</div>
					<div class="flex items-center justify-between">
						<button onclick={goBack} class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-navy/65 hover:text-navy hover:bg-navy/[0.04] transition-all cursor-pointer">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
							Back
						</button>
						<button
							onclick={acceptNotice}
							class="flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy transition-all duration-200 hover:bg-navy-light cursor-pointer"
						>
							I understand
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</button>
					</div>
				</div>
			</div>

		{:else if phase === 'warning'}
			<div class="flex-1 flex flex-col items-center justify-center px-6 py-12">
				<div class="max-w-xl w-full">
					<div class="rounded-2xl border border-amber-300/70 bg-amber-50 p-7 md:p-8">
						<h2 class="text-xl md:text-2xl text-navy tracking-tight mb-4">Important to know</h2>
						<p class="text-navy/65 text-[15px] leading-relaxed">{B6_6_WARNING_COPY}</p>
					</div>
					<div class="flex items-center justify-between mt-8">
						<button onclick={goBack} class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-navy/65 hover:text-navy hover:bg-navy/[0.04] transition-all cursor-pointer">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
							Back
						</button>
						<button
							onclick={continueFromWarning}
							class="flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy transition-all duration-200 hover:bg-navy-light cursor-pointer"
						>
							Continue
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</button>
					</div>
				</div>
			</div>

		{:else if phase === 'not_handled'}
			<div class="flex-1 flex flex-col items-center justify-center px-6 py-12">
				<div class="max-w-xl w-full">
					<div class="rounded-2xl border border-amber-300/70 bg-amber-50 p-7 md:p-8 mb-8">
						<p class="text-navy/65 text-[15px] leading-relaxed">{willFlagBoundaryCopy}</p>
					</div>
					<a
						href={consultationBookingUrl}
						class="flex items-center justify-center gap-2 w-full px-7 py-3.5 rounded-xl text-sm font-medium text-cream bg-emerald-accent transition-all hover:bg-emerald-light"
					>
						Book a consultation
					</a>
					<button onclick={goBack} class="block mx-auto mt-6 text-sm text-navy/65 hover:text-navy cursor-pointer">← Back</button>
				</div>
			</div>

		{:else if phase === 'questions' && currentStep}
			<!-- ═══ QUESTION ═══ -->
			<div class="flex-1 flex flex-col">
				<div class="flex-1 overflow-y-auto px-6 py-8 md:py-12">
					<div class="w-full {currentStep.type === 'heirs-calculator' || currentStep.type === 'executors' || currentStep.type === 'guardians' || currentStep.type === 'wasiyyah' ? 'max-w-xl' : 'max-w-lg'} mx-auto">
						<span class="text-[11px] text-emerald-accent tracking-[0.2em] uppercase font-medium">
							{stageMeta[currentStep.stage].label}
						</span>
						<h2 class="text-2xl md:text-3xl text-navy tracking-tight leading-snug mt-3 mb-3">
							{currentStep.question}
						</h2>
						{#if currentStep.help}
							<p class="text-navy/65 text-[15px] font-light leading-relaxed mb-8">{currentStep.help}</p>
						{:else}
							<div class="mb-8"></div>
						{/if}

						{#if currentStep.id === 'full_legal_name'}
							<p class="text-navy/65 text-sm leading-relaxed mb-2">We protect your information and use it as described in our <a href="/privacy" class="underline underline-offset-2 hover:text-navy">Privacy Policy</a>.</p>
							<p class="text-navy/65 text-sm leading-relaxed mb-6" data-testid="free-will-retention">{FREE_WILL_RETENTION_LINE}</p>
						{/if}

						<!-- INPUT BY TYPE -->
						{#if currentStep.type === 'state'}
							{@const selectedState = (responses[currentStep.id] as string) ?? ''}
							<div class="relative">
								<select
									value={selectedState}
									onchange={(e) => setResponse((e.currentTarget as HTMLSelectElement).value)}
									class="w-full appearance-none px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px]
										outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 cursor-pointer"
								>
									<option value="" disabled>Select your state…</option>
									{#each usStates as s}
										<option value={s.code}>{s.name}</option>
									{/each}
								</select>
								<svg class="w-4 h-4 text-navy/65 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
							{#if selectedState && !isWillAvailableState(selectedState)}
								<!-- Spec v3 §3.1: stop here; no further interview questions are shown. -->
								<OutOfStateExit stateCode={selectedState} name={accountName} />
							{/if}

						{:else if currentStep.type === 'county'}
							{@const selectedState = responses['state'] as string}
							{@const counties = getCountiesByState(selectedState)}
							<WillCountySelector
								value={(responses[currentStep.id] as string) ?? ''}
								{counties}
								stateName={stateName(selectedState)}
								onchange={(v) => setResponse(v)}
							/>

						{:else if currentStep.type === 'single-select'}
							{@const selectOptions =
								currentStep.id === 'marital_status'
									? maritalStatusOptions(responses['state'] as string | undefined)
									: (currentStep.options ?? [])}
							<div class="flex flex-col gap-3">
								{#each selectOptions as opt}
									{@render optionButton(opt, responses[currentStep.id] === opt, () => setResponse(opt))}
								{/each}
							</div>

						{:else if currentStep.type === 'text'}
							<input
								type="text"
								autocomplete="name"
								value={(responses[currentStep.id] as string) ?? ''}
								oninput={(e) => setResponse((e.currentTarget as HTMLInputElement).value)}
								onblur={normalizeCurrentTextResponse}
								placeholder="Full legal name"
								class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/65"
							/>

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

						{:else if currentStep.type === 'address'}
							<div class="flex flex-col gap-3">
								<input
									type="text"
									autocomplete="address-line1"
									value={addressValue.street}
									oninput={(e) => patchAddress({ street: (e.currentTarget as HTMLInputElement).value })}
									placeholder="Street address"
									class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/65"
								/>
								<input
									type="text"
									autocomplete="address-line2"
									value={addressValue.unit ?? ''}
									oninput={(e) => patchAddress({ unit: (e.currentTarget as HTMLInputElement).value })}
									placeholder="Apt, suite, unit (optional)"
									class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/65"
								/>
								<div class="grid grid-cols-[1fr_120px] gap-3">
									<input
										type="text"
										autocomplete="address-level2"
										value={addressValue.city}
										oninput={(e) => patchAddress({ city: (e.currentTarget as HTMLInputElement).value })}
										placeholder="City"
										class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/65"
									/>
									<input
										type="text"
										inputmode="numeric"
										autocomplete="postal-code"
										value={addressValue.zip}
										oninput={(e) => patchAddress({ zip: (e.currentTarget as HTMLInputElement).value })}
										placeholder="ZIP"
										class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/65"
									/>
								</div>
								{#if responses['state']}
									<p class="text-navy/65 text-xs px-1">State: {stateName(responses['state'] as string)}</p>
								{/if}
							</div>

						{:else if currentStep.type === 'heirs-calculator'}
							<HeirsCalculatorInput
								value={(responses[currentStep.id] ?? null) as HeirsCalculatorResponse | null}
								onresponse={(v) => setResponse(v as WillResponseValue)}
								questionId={heirsCalcQuestionId}
								allResponses={heirsCalcAllResponses}
							/>

						{:else if currentStep.type === 'executors'}
							<ExecutorsInput
								value={(responses[currentStep.id] ?? null) as ExecutorEntry[] | null}
								onresponse={(v) => setResponse(v as WillResponseValue)}
							/>

					{:else if currentStep.type === 'guardians'}
						<GuardiansInput
							value={(responses[currentStep.id] ?? null) as GuardianEntry[] | null}
							onresponse={(v) => setResponse(v as WillResponseValue)}
						/>

					{:else if currentStep.type === 'wasiyyah'}
						<WillWasiyyahInput
							value={(responses[currentStep.id] ?? null) as WillWasiyyahResponse | null}
							stateCode={(responses['state'] as string) ?? ''}
							onresponse={(v) => setResponse(v as WillResponseValue)}
						/>
					{/if}

					{#if currentStep.id === 'own_home' && !areAssetQuestionsSkipped(responses)}
						<button
							type="button"
							onclick={skipAssetQuestions}
							class="mt-6 text-sm text-navy/65 hover:text-emerald-accent transition-colors cursor-pointer underline underline-offset-2"
						>
							Skip these questions — I&apos;ll review assets separately
						</button>
					{/if}
					</div>
				</div>

				<!-- FOOTER -->
				<div class="shrink-0 border-t border-navy/[0.06] bg-cream px-6 py-5">
					<div class="{currentStep.type === 'heirs-calculator' || currentStep.type === 'executors' || currentStep.type === 'guardians' || currentStep.type === 'wasiyyah' ? 'max-w-xl' : 'max-w-lg'} mx-auto">
					{#if validationMessage}
						<p class="text-amber-700 text-xs leading-relaxed mb-3 text-center" role="status">{validationMessage}</p>
					{/if}
					<div class="flex items-center justify-between">
						<button
							onclick={goBack}
							class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-navy/65 transition-all hover:text-navy hover:bg-navy/[0.04] cursor-pointer"
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
							<span class="text-navy/65 text-xs">Your named heirs</span>
						</div>
						<div class="divide-y divide-navy/6">
							{#if namedHeirs.length}
								{#each namedHeirs as heir}
									<div class="px-6 py-3.5">
										<div class="flex items-center justify-between gap-4 mb-1.5">
											<div class="text-navy/65 text-[11px] uppercase tracking-wider">
												{heir.label}{heir.count > 1 ? ` ×${heir.count}` : ''}
											</div>
											<div class="text-emerald-accent text-xs tabular-nums">
												{heir.perPersonShare.display}{heir.count > 1 ? ' each' : ''}
											</div>
										</div>
										{#each heir.names as name}
											<div class="flex items-center justify-between gap-4 py-0.5">
												<span class="text-navy text-sm">{name || `[${heir.label}]`}</span>
												<span class="text-navy/65 text-xs tabular-nums">{(heir.perPersonShare.decimal * 100).toFixed(1)}%</span>
											</div>
										{/each}
									</div>
								{/each}
							{:else}
								<div class="px-6 py-5 text-navy/65 text-sm">
									We’ll finalize your distribution once your heirs are confirmed.
								</div>
							{/if}
						</div>
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

				{#if accountError}
					<p class="text-red-600 text-xs mb-3 text-right">{accountError}</p>
				{/if}
				<div class="flex items-center justify-between">
					<button onclick={goBack} class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-navy/65 hover:text-navy hover:bg-navy/[0.04] transition-all cursor-pointer">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
						Back
					</button>
					<button
						onclick={handleSaveMyWill}
						disabled={savingWill}
						class="flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-medium text-cream bg-emerald-accent transition-all duration-200 hover:bg-emerald-light hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-accent/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
					>
						{savingWill ? 'Preparing your will…' : data.user ? 'Get my will' : 'Save my will'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</button>
				</div>
			</div>
		</div>

		{:else if phase === 'delivery'}
			<div class="flex-1 flex flex-col items-center justify-center px-6 py-12">
				<div class="max-w-md w-full">
					<div class="text-center mb-8">
						<h2 class="text-2xl md:text-3xl text-navy tracking-tight mb-2">Deliver your will</h2>
						<p class="text-navy/65 text-sm leading-relaxed">
							Enter your name and email so we can generate your document and send it to you.
						</p>
					</div>

					<div class="flex flex-col gap-3">
						<label class="block">
							<span class="text-navy/65 text-xs font-medium tracking-wide uppercase">Full name</span>
							<input
								type="text"
								bind:value={accountName}
								placeholder="Your full name"
								class="mt-1.5 w-full px-4 py-3 rounded-lg bg-white border border-navy/10 text-navy text-sm placeholder:text-navy/65 outline-none transition-all focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
							/>
						</label>
						<label class="block">
							<span class="text-navy/65 text-xs font-medium tracking-wide uppercase">Email</span>
							<input
								type="email"
								bind:value={accountEmail}
								placeholder="you@example.com"
								class="mt-1.5 w-full px-4 py-3 rounded-lg bg-white border border-navy/10 text-navy text-sm placeholder:text-navy/65 outline-none transition-all focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
							/>
							<span class="block text-navy/65 text-xs leading-relaxed mt-1.5" data-testid="email-purpose-notice">{emailPurposeNotice}</span>
							<span class="block text-navy/65 text-xs leading-relaxed mt-1.5" data-testid="free-will-retention">{FREE_WILL_RETENTION_LINE}</span>
						</label>

						<label class="flex items-start gap-3 cursor-pointer mt-1">
							<input
								type="checkbox"
								bind:checked={marketingConsent}
								class="mt-1 w-4 h-4 accent-emerald-accent cursor-pointer shrink-0"
								data-testid="marketing-consent"
							/>
							<span class="text-navy/65 text-xs leading-relaxed">{marketingConsentLabel}</span>
						</label>

						{#if accountError}
							<p class="text-red-600 text-xs">{accountError}</p>
						{/if}

						<button
							onclick={handleDeliverySubmit}
							disabled={deliveryLoading}
							class="w-full py-3.5 rounded-lg bg-emerald-accent text-cream text-sm font-medium transition-all duration-200 hover:bg-emerald-light hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							{deliveryLoading ? 'Preparing your will…' : 'Get my will'}
						</button>

						<button onclick={goBack} class="mx-auto mt-3 text-navy/65 text-xs hover:text-navy/70 transition-colors cursor-pointer">← Back to review</button>
					</div>
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
						<p class="text-navy/65 text-base leading-relaxed max-w-md mx-auto">
							Masha’Allah — you’ve taken a real first step for your family. We’ve saved your answers to your account{willDownload ? ' and your document is ready to download below' : ' and will email your document shortly'}.
						</p>
					</div>

					{#if willDownload}
						<div class="rounded-2xl border border-emerald-accent/30 bg-emerald-accent/8 p-6 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div class="flex items-center gap-3.5">
								<span class="w-11 h-11 rounded-xl bg-emerald-accent/15 flex items-center justify-center shrink-0">
									<svg class="w-5 h-5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
								</span>
								<div>
									<p class="text-navy font-medium text-[15px] leading-snug">Your Islamic will (PDF)</p>
								</div>
							</div>
							<a
								href={willDownload.url}
								download={willDownload.filename}
								class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-cream bg-emerald-accent transition-all duration-200 hover:bg-emerald-light hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-accent/20 cursor-pointer shrink-0"
							>
								Download
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M4 19h16" /></svg>
							</a>
						</div>

						<div class="flex items-center justify-center gap-2 text-navy/65 text-[13px] mb-8 -mt-1">
							<svg class="w-4 h-4 shrink-0 text-emerald-accent/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
							<span>We’ve also emailed a copy{accountEmail ? ` to ${accountEmail}` : ''}, with the document attached.</span>
						</div>
					{/if}

					<div class="rounded-2xl border border-navy/10 bg-white/70 p-6 mb-5" data-testid="signing-instructions">
						<p class="text-navy/70 text-sm leading-relaxed">{freeWillSigningWrapper}</p>
					</div>

					<!-- Will limitation upsell block -->
					{#if showWillLimitationWarning}
						<div class="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-6 mb-5">
							<p class="text-navy/65 text-sm leading-relaxed mb-5">{willFlagBoundaryCopy}</p>
							<div class="flex flex-col gap-2.5">
								{#if tags.includes('beneficiary_designation_review')}
									<a href="/beneficiary-checklist" class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-navy/10 text-sm text-navy/75 hover:border-emerald-accent/40 transition-colors">
										Review my beneficiary designations
										<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
									</a>
								{/if}
								<a href={consultationBookingUrl} class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-navy/10 text-sm text-navy/75 hover:border-emerald-accent/40 transition-colors">
									Book a consultation
									<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
								</a>
							</div>
						</div>
					{/if}

					<!-- Offers appear only when `recommendPlan` returns a plan (spec v3 §4.5); no assessment copy. -->
					{#each offerCards as card}
						{#if card.key === 'goodtree-trust'}
							<div class="rounded-2xl bg-navy overflow-hidden mb-5">
								<div class="p-7">
									<h3 class="text-cream text-xl md:text-2xl tracking-tight mb-2">{card.title}</h3>
									<p class="text-cream/60 text-sm leading-relaxed mb-3">{card.tagline}</p>
									<div class="flex items-center justify-between gap-4 mt-5">
										<span class="text-cream/50 text-sm">{card.price}</span>
										<a href={card.href} class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cream text-navy text-sm font-medium transition-all duration-200 hover:bg-white">
											Learn more
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
										</a>
									</div>
								</div>
							</div>
						{:else}
							<div class="rounded-2xl border border-navy/10 bg-white/70 overflow-hidden mb-5">
								<div class="p-7">
									<h3 class="text-navy text-xl md:text-2xl tracking-tight mb-2">{card.title}</h3>
									<p class="text-navy/65 text-sm leading-relaxed mb-5">{card.tagline}</p>
									<div class="flex items-center justify-between gap-4">
										<span class="text-navy/65 text-sm">{card.price}</span>
										<a href={card.href} class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy text-cream text-sm font-medium transition-all duration-200 hover:bg-navy-light">
											Learn more
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
										</a>
									</div>
								</div>
							</div>
						{/if}
					{/each}

					<div class="text-center">
						<a href="/plans" class="text-navy/65 text-sm hover:text-navy/70 transition-colors">Explore all plans →</a>
					</div>

					<!-- A4 — the flow isn't locked to a single will: let a signed-in user
					     tweak their answers or start a second will (e.g. for a spouse)
					     right from the completion page, not only on a later visit. -->
					{#if data.user}
						<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-6 pt-6 border-t border-navy/8">
							<button
								onclick={editFinishedWill}
								class="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl border border-navy/10 bg-white/80 text-sm font-medium text-navy/75 hover:border-emerald-accent/40 hover:text-navy hover:bg-white transition-all cursor-pointer"
							>
								<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
								</svg>
								Edit my answers
							</button>
							<button
								onclick={startNewWill}
								class="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl border border-navy/10 bg-white/80 text-sm font-medium text-navy/75 hover:border-emerald-accent/40 hover:text-navy hover:bg-white transition-all cursor-pointer"
							>
								<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
								</svg>
								Start a new will
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</main>

	<!-- ═══ DEV-ONLY QUESTION NAVIGATOR (localhost only) ═══ -->
	{#if isDev}
		{#if devNavOpen}
			<aside
				class="fixed top-20 right-3 z-50 w-64 max-h-[80vh] flex flex-col rounded-lg border border-fuchsia-400/50 bg-white shadow-xl shadow-navy/10 text-xs"
			>
				<div class="flex items-center justify-between px-3 py-2 border-b border-navy/10 bg-fuchsia-50 rounded-t-lg">
					<span class="font-semibold tracking-wide uppercase text-[10px] text-fuchsia-700">Dev nav</span>
					<button
						type="button"
						onclick={() => (devNavOpen = false)}
						class="text-navy/65 hover:text-navy cursor-pointer leading-none text-base"
						aria-label="Collapse dev navigator">×</button
					>
				</div>
				<div class="overflow-y-auto p-2 flex flex-col gap-2">
					{#if phase !== 'questions'}
						<button
							type="button"
							onclick={() => devGoToQuestionnaire(0)}
							class="w-full px-2.5 py-2 rounded border border-fuchsia-400/60 bg-fuchsia-50 text-[11px] font-medium text-fuchsia-800 cursor-pointer hover:bg-fuchsia-100 transition-colors text-left"
						>
							← Edit questionnaire
						</button>
					{/if}
					<div class="flex flex-wrap gap-1">
						{#each ['welcome', 'notice', 'questions', 'warning', 'not_handled', 'preview', 'delivery', 'complete'] as p}
							<button
								type="button"
								onclick={() => devGoToPhase(p as Phase)}
								class="px-2 py-1 rounded border text-[10px] cursor-pointer transition-colors
									{phase === p
									? 'border-fuchsia-500 bg-fuchsia-500 text-white'
									: 'border-navy/15 text-navy/65 hover:border-fuchsia-400'}"
							>
								{p}
							</button>
						{/each}
					</div>
					<div class="h-px bg-navy/10 my-1"></div>
					<ol class="flex flex-col gap-0.5">
						{#each activeSteps as step, i}
							<li>
								<button
									type="button"
									onclick={() => devGoToStep(i)}
									class="w-full text-left px-2 py-1.5 rounded flex items-start gap-2 cursor-pointer transition-colors
										{phase === 'questions' && currentIndex === i
										? 'bg-fuchsia-500 text-white'
										: 'text-navy/70 hover:bg-fuchsia-50'}"
								>
									<span class="tabular-nums opacity-60 shrink-0">{i + 1}.</span>
									<span class="flex-1 leading-tight">
										{step.question}
										{#if !isStepAnswered(step, responses)}
											<span class="opacity-50">·</span>
										{:else}
											<span class="text-emerald-accent">✓</span>
										{/if}
									</span>
								</button>
							</li>
						{/each}
					</ol>
				</div>
			</aside>
		{:else}
			<div class="fixed top-20 right-3 z-50 flex flex-col items-end gap-2">
				{#if phase !== 'welcome' && phase !== 'questions'}
					<button
						type="button"
						onclick={() => devGoToQuestionnaire(0)}
						class="px-3 py-1.5 rounded-lg border border-fuchsia-400/50 bg-white shadow-md text-[10px] font-semibold uppercase tracking-wide text-fuchsia-700 cursor-pointer hover:bg-fuchsia-50"
					>
						Edit answers
					</button>
				{/if}
				<button
					type="button"
					onclick={() => (devNavOpen = true)}
					class="px-3 py-1.5 rounded-lg border border-fuchsia-400/50 bg-white shadow-md text-[10px] font-semibold uppercase tracking-wide text-fuchsia-700 cursor-pointer hover:bg-fuchsia-50"
				>
					Dev nav
				</button>
			</div>
		{/if}
	{/if}

	<footer class="relative z-10 shrink-0 border-t border-navy/[0.06] px-6 py-4 text-center">
		<p class="text-navy/65 text-xs leading-relaxed">
			© 2026 McDaniel Estate Planning, PLLC. Licensed in Texas and California.
		</p>
		<p class="mt-1">
			<a href="/privacy" class="text-navy/65 text-xs underline underline-offset-2 hover:text-navy min-h-11 inline-flex items-center">Privacy Policy</a>
		</p>
	</footer>
</div>
