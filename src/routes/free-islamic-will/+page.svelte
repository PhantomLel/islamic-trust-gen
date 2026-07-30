<script lang="ts">
	import { onMount } from 'svelte';
	import { deserialize } from '$app/forms';
	import { authClient } from '$lib/auth-client';
	import { siteName, consultationBookingUrl, defaultPrepFee, formatUsd, wasiyyahDiscount } from '$lib/config';
	import type { HeirsCalculatorResponse } from '$lib/config';
	import {
		usStates,
		willAvailableStates,
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
		isCommunityPropertySituation,
		appliesCommunityPropertyClauses,
		communityPropertyWarning,
		legalMode,
		legalModeDisclaimers,
		computeLeadTags,
		recommendPlan,
		freeWillOfferLadder,
		getNamedHeirs,
		heirsQuestionId,
		heirsCalculatorAllResponses,
		getWillLimitationReasons,
		needsWillLimitationWarning,
		willLimitationWarningIntro,
		willLimitationWarningOutro,
		willLimitationReasonLabels,
		toWillResponses,
		type PlanKey
	} from '$lib/free-will/logic';
	import HeirsCalculatorInput from '$lib/components/HeirsCalculatorInput.svelte';
	import ExecutorsInput from '$lib/components/ExecutorsInput.svelte';
	import GuardiansInput from '$lib/components/GuardiansInput.svelte';
	import WillCountySelector from '$lib/components/WillCountySelector.svelte';
	import WillWasiyyahInput from '$lib/components/WillWasiyyahInput.svelte';
	import WillWaitlistCapture from '$lib/components/WillWaitlistCapture.svelte';
	import type { WillWasiyyahResponse } from '$lib/free-will/config';
	import {
		ACKNOWLEDGMENT_VERSION,
		SHOW_HEBA_MENTION,
		communityPropertyBodyParagraphs,
		communityPropertyCheckboxCopy,
		communityPropertyHeading,
		communityPropertyHebaMention,
		requiresCommunityPropertyAcknowledgment,
		selfHelpDisclaimerCopy,
		type AcknowledgmentData
	} from '$lib/free-will/acknowledgment';
	import { getFirstTouchUtm } from '$lib/utm';

	let { data } = $props();

	type Phase = 'welcome' | 'returning' | 'questions' | 'acknowledge' | 'limitations' | 'preview' | 'account' | 'complete';

	const STORAGE_KEY = 'free-will:v1';

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

	// A6/B6 — acknowledgment gate checkboxes
	let acknowledgeSelfHelp = $state(false);
	let acknowledgeCommunityProperty = $state(false);
	let acknowledgmentData = $state<AcknowledgmentData | null>(null);

	// ── dev-only question navigator (localhost only) ──
	let isDev = $state(false);
	let devNavOpen = $state(true);

	// Account step state
	let accountName = $state('');
	let accountEmail = $state('');
	let accountError = $state('');
	let accountLoading = $state(false);
	let savingWill = $state(false);
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
	let requiresCommunityAck = $derived(requiresCommunityPropertyAcknowledgment(responses));
	let canContinueAcknowledge = $derived(
		acknowledgeSelfHelp && (!requiresCommunityAck || acknowledgeCommunityProperty)
	);
	let willLimitationReasons = $derived(getWillLimitationReasons(responses));
	let showWillLimitationWarning = $derived(needsWillLimitationWarning(responses));

	let namedHeirs = $derived(getNamedHeirs(responses));
	let heirsCalcQuestionId = $derived(heirsQuestionId(responses));
	let heirsCalcAllResponses = $derived(heirsCalculatorAllResponses(responses));

	type PlanCard = { title: string; tagline: string; price: string; href: string };
	const planCards: Record<Exclude<PlanKey, null>, PlanCard> = {
		'goodtree-trust': {
			title: 'GoodTree Trust',
			tagline: 'Avoid probate with an attorney-supervised Islamic revocable living trust.',
			price: formatUsd(defaultPrepFee),
			href: '/trust'
		},
		'legacy-plan': {
			title: 'Legacy Plan',
			tagline: 'Full-service estate planning designed personally by your attorney.',
			price: 'From $3,500',
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
	// Ordered upsell ladder (ticket A2): GoodTree Trust App first when app-recommended,
	// Legacy Plan always present — one source of truth shared with the delivery email.
	let offerLadder = $derived(freeWillOfferLadder(responses));
	let offerCards = $derived(offerLadder.map((key) => ({ key, ...planCards[key] })));

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
			acknowledgeSelfHelp,
			acknowledgeCommunityProperty,
			acknowledgmentData,
			activeWillId
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
		void acknowledgeSelfHelp;
		void acknowledgeCommunityProperty;
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
					if (p.responses) responses = p.responses;
					if (typeof p.currentIndex === 'number') currentIndex = p.currentIndex;
					// legacy sessions may still have the old 'community' phase name stored
					if (typeof p.phase === 'string') phase = p.phase === 'community' ? 'acknowledge' : p.phase;
					if (typeof p.savedToAccount === 'boolean') savedToAccount = p.savedToAccount;
					if (typeof p.accountName === 'string') accountName = p.accountName;
					if (typeof p.accountEmail === 'string') accountEmail = p.accountEmail;
					if (typeof p.acknowledgeSelfHelp === 'boolean') acknowledgeSelfHelp = p.acknowledgeSelfHelp;
					if (typeof p.acknowledgeCommunityProperty === 'boolean')
						acknowledgeCommunityProperty = p.acknowledgeCommunityProperty;
					if (p.acknowledgmentData) acknowledgmentData = p.acknowledgmentData;
					if (typeof p.activeWillId === 'number') activeWillId = p.activeWillId;
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

		hydrated = true;

		if (data.user && data.savedWill?.complete) {
			if (activeWillId === data.savedWill.id) {
				// We already know about this exact will from earlier in this browser
				// session — either we just saved it directly, or we're returning from
				// a magic-link/Google redirect right after submitting it. Show it
				// immediately instead of a choice screen.
				savedToAccount = true;
				if (data.willDownload) willDownload = data.willDownload;
				phase = 'complete';
			} else {
				// A4 — the flow is no longer locked to a single will: a genuinely
				// returning user who already has a finished will on file gets a
				// choice instead of being force-jumped to the completion screen.
				phase = 'returning';
			}
		} else if (data.user && !savedToAccount && isWillComplete(responses)) {
			// Signed-in user whose local answers are complete but not yet
			// persisted (e.g. the page reloaded mid-save) — save now.
			void persistToAccount();
		}
	});

	/** A4 — "View my finished will" from the returning-user choice screen. */
	function viewFinishedWill() {
		if (data.savedWill) activeWillId = data.savedWill.id;
		savedToAccount = true;
		phase = 'complete';
	}

	/**
	 * A4 — "Edit my answers", available both from the returning-user choice
	 * screen and from the completion page right after finishing. Prefers
	 * whatever's already in memory (the "I just finished this session" case,
	 * where the server's `load()` snapshot may be stale or nonexistent since
	 * `persistToAccount()` saves via a raw `fetch` rather than `enhance`) and
	 * only falls back to the server-stored answers when the local ones aren't
	 * complete (a genuinely returning user on a fresh device/session).
	 */
	function editFinishedWill() {
		if (!isWillComplete(responses) && data.savedWill?.responses?.length) {
			responses = toWillResponses(data.savedWill.responses);
			acknowledgmentData = data.savedWill.acknowledgmentData;
			acknowledgeSelfHelp = data.savedWill.acknowledgmentData?.checkboxes.selfHelp ?? false;
			acknowledgeCommunityProperty = data.savedWill.acknowledgmentData?.checkboxes.communityProperty ?? false;
		}
		if (activeWillId == null && data.savedWill) activeWillId = data.savedWill.id;
		savedToAccount = true;
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
		acknowledgeSelfHelp = false;
		acknowledgeCommunityProperty = false;
		acknowledgmentData = null;
		activeWillId = null;
		savedToAccount = false;
		willDownload = null;
		phase = 'welcome';
	}

	// ── responses helpers ──
	function setResponse(value: WillResponseValue) {
		if (!currentStep) return;
		responses[currentStep.id] = value;
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
		phase = 'questions';
		currentIndex = 0;
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
		if (!canNext) return;
		if (!isLastQuestion) {
			currentIndex += 1;
			return;
		}
		// finished questions — the acknowledgment gate always runs next (B6's
		// self-help checkbox applies to every user).
		phase = 'acknowledge';
	}

	function continueFromAcknowledge() {
		if (!canContinueAcknowledge) return;
		acknowledgmentData = {
			version: ACKNOWLEDGMENT_VERSION,
			clientTimestamp: new Date().toISOString(),
			checkboxes: {
				selfHelp: acknowledgeSelfHelp,
				communityProperty: acknowledgeCommunityProperty
			}
		};
		phase = showWillLimitationWarning ? 'limitations' : 'preview';
	}

	function goBack() {
		if (phase === 'questions') {
			if (currentIndex > 0) currentIndex -= 1;
			else phase = 'welcome';
		} else if (phase === 'acknowledge') {
			phase = 'questions';
		} else if (phase === 'limitations') {
			phase = 'acknowledge';
		} else if (phase === 'preview') {
			phase = showWillLimitationWarning ? 'limitations' : 'acknowledge';
		} else if (phase === 'account') {
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
		form.set('legalMode', mode);
		form.set('recommendedPlan', recommendation.plan ?? '');
		form.set('acknowledgmentData', acknowledgmentData ? JSON.stringify(acknowledgmentData) : '');
		// A4 — set means "update this specific will", unset means "insert a new one".
		form.set('willId', activeWillId != null ? String(activeWillId) : '');
		const utm = getFirstTouchUtm();
		form.set('utmSource', utm.utmSource ?? '');
		form.set('utmMedium', utm.utmMedium ?? '');
		form.set('utmCampaign', utm.utmCampaign ?? '');
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
			phase = 'account';
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
			// Captures the row id (A4) so the magic-link return recognizes this as
			// "the will I just submitted" rather than treating it as an old one.
			// Bail out (rather than sending the magic link anyway) if this fails —
			// otherwise the user lands back on the app after verifying their email
			// with nothing actually saved and no indication why.
			const pendingRes = await fetch('?/savePending', { method: 'POST', body: saveFormData('savePending') });
			const pendingResult = deserialize(await pendingRes.text());
			if (pendingResult.type !== 'success') {
				accountError = extractActionErrorMessage(pendingResult);
				return;
			}
			const pendingId = (pendingResult.data as { willId?: number })?.willId;
			if (typeof pendingId === 'number') {
				activeWillId = pendingId;
				persist();
			}
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
			// gets the data via the authenticated auto-save on return. Bail out on
			// failure rather than redirecting to Google with nothing saved.
			const pendingRes = await fetch('?/savePending', { method: 'POST', body: saveFormData('savePending') });
			const pendingResult = deserialize(await pendingRes.text());
			if (pendingResult.type !== 'success') {
				accountError = extractActionErrorMessage(pendingResult);
				return;
			}
			const pendingId = (pendingResult.data as { willId?: number })?.willId;
			if (typeof pendingId === 'number') {
				activeWillId = pendingId;
				persist();
			}
		}
		await authClient.signIn.social({ provider: 'google', callbackURL: '/free-islamic-will' });
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
		{#if phase === 'questions' || phase === 'acknowledge' || phase === 'limitations' || phase === 'preview'}
			<span class="text-[11px] text-navy/40 tracking-[0.18em] uppercase">Free Islamic Will</span>
		{:else}
			<a href="/plans" class="text-sm text-navy/50 hover:text-navy transition-colors">All plans</a>
		{/if}
	</nav>

	<!-- PROGRESS BAR (no numbers, per brief) -->
	{#if phase === 'questions' || phase === 'acknowledge' || phase === 'limitations' || phase === 'preview'}
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

					<div class="rounded-xl border border-emerald-accent/35 bg-emerald-accent/8 px-5 py-4 max-w-md mx-auto mb-8 text-left">
						<p class="text-navy text-base md:text-lg font-medium leading-snug">
							Available now in California and Texas
						</p>
						<p class="text-navy/55 text-sm mt-1">Other states coming soon.</p>
					</div>

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
						This free will is a starting point; some situations require attorney review. Your information is private and never shared.
					</p>
				</div>
			</div>

		{:else if phase === 'returning'}
			<!-- ═══ RETURNING USER — A4: no longer locked to a single will ═══ -->
			<div class="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
				<div class="max-w-lg w-full">
					<div class="w-14 h-14 rounded-full bg-emerald-accent/10 flex items-center justify-center mx-auto mb-6">
						<svg class="w-7 h-7 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
					</div>
					<h1 class="text-2xl md:text-4xl text-navy tracking-tight leading-tight text-balance mb-3">
						Welcome back{accountName ? `, ${accountName.split(' ')[0]}` : ''}
					</h1>
					<p class="text-navy/55 text-base leading-relaxed max-w-md mx-auto mb-10">
						You already have a finished Islamic will on file. What would you like to do?
					</p>

					<div class="flex flex-col gap-3 text-left">
						<button
							onclick={viewFinishedWill}
							class="flex items-center justify-between gap-4 px-6 py-4 rounded-xl bg-emerald-accent text-cream transition-all duration-200 hover:bg-emerald-light hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-accent/20 cursor-pointer"
						>
							<span>
								<span class="block font-medium text-[15px]">View my finished will</span>
								<span class="block text-cream/70 text-xs mt-0.5">Download your document and see next steps</span>
							</span>
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</button>
						<button
							onclick={editFinishedWill}
							class="flex items-center justify-between gap-4 px-6 py-4 rounded-xl border border-navy/10 bg-white/70 text-navy transition-all duration-200 hover:border-emerald-accent/40 hover:-translate-y-px cursor-pointer"
						>
							<span>
								<span class="block font-medium text-[15px]">Edit my answers</span>
								<span class="block text-navy/50 text-xs mt-0.5">Update your will with new information</span>
							</span>
							<svg class="w-4 h-4 shrink-0 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</button>
						<button
							onclick={startNewWill}
							class="flex items-center justify-between gap-4 px-6 py-4 rounded-xl border border-navy/10 bg-white/70 text-navy transition-all duration-200 hover:border-emerald-accent/40 hover:-translate-y-px cursor-pointer"
						>
							<span>
								<span class="block font-medium text-[15px]">Start a new will</span>
								<span class="block text-navy/50 text-xs mt-0.5">e.g. for a spouse, on the same account</span>
							</span>
							<svg class="w-4 h-4 shrink-0 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</button>
					</div>
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
							<p class="text-navy/50 text-[15px] font-light leading-relaxed mb-8">{currentStep.help}</p>
						{:else}
							<div class="mb-8"></div>
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
									{#each usStates.filter((s) => willAvailableStates.has(s.code)) as s}
										<option value={s.code}>{s.name}</option>
									{/each}
									<optgroup label="Coming soon">
										{#each usStates.filter((s) => !willAvailableStates.has(s.code)) as s}
											<option value={s.code}>{s.name}</option>
										{/each}
									</optgroup>
								</select>
								<svg class="w-4 h-4 text-navy/40 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
							{#if selectedState && !isWillAvailableState(selectedState)}
								<!-- A1: out-of-state email capture, works on both state screens -->
								<WillWaitlistCapture
									stateCode={selectedState}
									stateLabel={stateName(selectedState)}
									stepId={currentStep.id}
									name={accountName}
								/>
							{:else}
								<p class="text-navy/45 text-xs leading-relaxed mt-3 px-1">
									Only California and Texas are available right now. Other states are listed below as coming soon.
								</p>
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
							<div class="flex flex-col gap-3">
								{#each currentStep.options ?? [] as opt}
									{@render optionButton(opt, responses[currentStep.id] === opt, () => setResponse(opt))}
								{/each}
							</div>

						{:else if currentStep.type === 'text'}
							<input
								type="text"
								autocomplete="name"
								value={(responses[currentStep.id] as string) ?? ''}
								oninput={(e) => setResponse((e.currentTarget as HTMLInputElement).value)}
								placeholder="Full legal name"
								class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
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
									class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
								/>
								<input
									type="text"
									autocomplete="address-line2"
									value={addressValue.unit ?? ''}
									oninput={(e) => patchAddress({ unit: (e.currentTarget as HTMLInputElement).value })}
									placeholder="Apt, suite, unit (optional)"
									class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
								/>
								<div class="grid grid-cols-[1fr_120px] gap-3">
									<input
										type="text"
										autocomplete="address-level2"
										value={addressValue.city}
										oninput={(e) => patchAddress({ city: (e.currentTarget as HTMLInputElement).value })}
										placeholder="City"
										class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
									/>
									<input
										type="text"
										inputmode="numeric"
										autocomplete="postal-code"
										value={addressValue.zip}
										oninput={(e) => patchAddress({ zip: (e.currentTarget as HTMLInputElement).value })}
										placeholder="ZIP"
										class="w-full px-5 py-4 rounded-xl border border-navy/12 bg-white/70 text-navy text-[15px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
									/>
								</div>
								{#if responses['state']}
									<p class="text-navy/40 text-xs px-1">State: {stateName(responses['state'] as string)}</p>
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
							onresponse={(v) => setResponse(v as WillResponseValue)}
						/>
					{/if}
					</div>
				</div>

				<!-- FOOTER -->
				<div class="shrink-0 border-t border-navy/[0.06] bg-cream px-6 py-5">
					<div class="{currentStep.type === 'heirs-calculator' || currentStep.type === 'executors' || currentStep.type === 'guardians' || currentStep.type === 'wasiyyah' ? 'max-w-xl' : 'max-w-lg'} mx-auto flex items-center justify-between">
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

		{:else if phase === 'acknowledge'}
			<!-- ═══ ACKNOWLEDGMENT GATE (A6 + B6) ═══ -->
			<div class="flex-1 overflow-y-auto px-6 py-12">
				<div class="max-w-xl w-full mx-auto">
					{#if requiresCommunityAck}
						<div class="rounded-2xl border border-amber-300/70 bg-amber-50 p-7 md:p-8 mb-5">
							<div class="flex items-center gap-3 mb-4">
								<span class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
									<svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
									</svg>
								</span>
								<h2 class="text-xl md:text-2xl text-navy tracking-tight">{communityPropertyHeading}</h2>
							</div>
							{#each communityPropertyBodyParagraphs as paragraph}
								<p class="text-navy/65 text-[15px] leading-relaxed mb-3">{paragraph}</p>
							{/each}
							<div class="flex flex-col gap-2 my-4">
								<a href="/trust" target="_blank" rel="noopener" class="text-emerald-accent text-sm font-medium hover:underline">
									Learn about a living trust →
								</a>
								<a href={consultationBookingUrl} target="_blank" rel="noopener" class="text-emerald-accent text-sm font-medium hover:underline">
									Book a consultation →
								</a>
							</div>
							{#if SHOW_HEBA_MENTION}
								<p class="text-navy/50 text-xs leading-relaxed mb-4">{communityPropertyHebaMention}</p>
							{/if}
							<label class="flex items-start gap-3 mt-2 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={acknowledgeCommunityProperty}
									class="mt-1 w-4 h-4 accent-emerald-accent cursor-pointer shrink-0"
								/>
								<span class="text-navy/75 text-sm leading-relaxed">{communityPropertyCheckboxCopy}</span>
							</label>
						</div>
					{:else if communityProperty}
						<div class="rounded-2xl border border-amber-300/70 bg-amber-50 p-7 md:p-8 mb-5">
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
					{/if}

					<div class="rounded-2xl border border-navy/10 bg-white/70 p-6 md:p-7">
						<h3 class="text-navy font-medium text-[15px] mb-3">Before you continue</h3>
						<label class="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={acknowledgeSelfHelp}
								class="mt-1 w-4 h-4 accent-emerald-accent cursor-pointer shrink-0"
							/>
							<span class="text-navy/70 text-sm leading-relaxed">{selfHelpDisclaimerCopy}</span>
						</label>
					</div>

					<div class="flex items-center justify-between mt-8">
						<button onclick={goBack} class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-navy/55 hover:text-navy hover:bg-navy/[0.04] transition-all cursor-pointer">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
							Back
						</button>
						<button
							onclick={continueFromAcknowledge}
							disabled={!canContinueAcknowledge}
							class="flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
						>
							I understand, continue
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</button>
					</div>
				</div>
			</div>

		{:else if phase === 'limitations'}
			<!-- ═══ WILL LIMITATION WARNING ═══ -->
			<div class="flex-1 flex flex-col items-center justify-center px-6 py-12">
				<div class="max-w-xl w-full">
					<div class="rounded-2xl border border-amber-300/70 bg-amber-50 p-7 md:p-8">
						<div class="flex items-center gap-3 mb-4">
							<span class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
								<svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
								</svg>
							</span>
							<h2 class="text-xl md:text-2xl text-navy tracking-tight">Important to know</h2>
						</div>
						<p class="text-navy/65 text-[15px] leading-relaxed mb-4">{willLimitationWarningIntro}</p>
						<ul class="flex flex-col gap-2.5 mb-4">
							{#each willLimitationReasons as reason}
								<li class="flex items-start gap-2.5 text-navy/65 text-[14px] leading-relaxed">
									<span class="text-amber-600 mt-1 shrink-0">•</span>
									<span>{willLimitationReasonLabels[reason]}</span>
								</li>
							{/each}
						</ul>
						<p class="text-navy/65 text-[15px] leading-relaxed">{willLimitationWarningOutro}</p>
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
							I understand, continue
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
							<span class="text-navy/40 text-xs">Your named heirs</span>
						</div>
						<div class="divide-y divide-navy/6">
							{#if namedHeirs.length}
								{#each namedHeirs as heir}
									<div class="px-6 py-3.5">
										<div class="flex items-center justify-between gap-4 mb-1.5">
											<div class="text-navy/55 text-[11px] uppercase tracking-wider">
												{heir.label}{heir.count > 1 ? ` ×${heir.count}` : ''}
											</div>
											<div class="text-emerald-accent text-xs tabular-nums">
												{heir.perPersonShare.display}{heir.count > 1 ? ' each' : ''}
											</div>
										</div>
										{#each heir.names as name}
											<div class="flex items-center justify-between gap-4 py-0.5">
												<span class="text-navy text-sm">{name || `[${heir.label}]`}</span>
												<span class="text-navy/40 text-xs tabular-nums">{(heir.perPersonShare.decimal * 100).toFixed(1)}%</span>
											</div>
										{/each}
									</div>
								{/each}
							{:else}
								<div class="px-6 py-5 text-navy/50 text-sm">
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

					<!-- Legal mode note -->
					<div class="rounded-xl border border-navy/8 bg-navy/3 px-5 py-4 mb-8">
						<div class="text-navy/40 text-[10px] tracking-[0.22em] uppercase mb-1.5">Legal note</div>
						<p class="text-navy/55 text-xs leading-relaxed">{legalModeDisclaimers[mode]}</p>
					</div>

				{#if accountError}
					<p class="text-red-600 text-xs mb-3 text-right">{accountError}</p>
				{/if}
				<div class="flex items-center justify-between">
					<button onclick={goBack} class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-navy/55 hover:text-navy hover:bg-navy/[0.04] transition-all cursor-pointer">
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
									<p class="text-navy font-medium text-[15px] leading-snug">Your Islamic will (.docx)</p>
									<p class="text-navy/50 text-xs mt-0.5">Ready to print, sign, and witness</p>
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

						<div class="flex items-center justify-center gap-2 text-navy/50 text-[13px] mb-8 -mt-1">
							<svg class="w-4 h-4 shrink-0 text-emerald-accent/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
							<span>We’ve also emailed a copy{accountEmail ? ` to ${accountEmail}` : ''}, with the document attached.</span>
						</div>
					{/if}

					<!-- Signing instructions -->
					<div class="rounded-2xl border border-navy/10 bg-white/70 p-6 mb-5">
						<h3 class="text-navy font-medium text-[15px] mb-4">Next: sign your will</h3>
						<ol class="flex flex-col gap-3.5">
							{#each ['Print your will.', 'Sign and date it in front of two adult witnesses who are not heirs.', 'Have your witnesses sign in your presence and each other\u2019s.', 'Store the signed original somewhere safe and tell your representative where it is.'] as step, i}
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

					<!-- Will limitation upsell block -->
					{#if showWillLimitationWarning}
						<div class="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-6 mb-5">
							<h3 class="text-navy font-medium text-[15px] mb-2">Recommended next steps</h3>
							<p class="text-navy/60 text-sm leading-relaxed mb-3">{willLimitationWarningIntro}</p>
							<ul class="flex flex-col gap-2 mb-5">
								{#each willLimitationReasons as reason}
									<li class="flex items-start gap-2 text-navy/60 text-sm leading-relaxed">
										<span class="text-amber-600 shrink-0">•</span>
										<span>{willLimitationReasonLabels[reason]}</span>
									</li>
								{/each}
							</ul>
							<p class="text-navy/60 text-sm leading-relaxed mb-5">{willLimitationWarningOutro}</p>
							<div class="flex flex-col gap-2.5">
								{#if tags.includes('community_property_state')}
								 {/if}
								{#if tags.includes('beneficiary_designation_review')}
									<a href="/plans" class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-navy/10 text-sm text-navy/75 hover:border-emerald-accent/40 transition-colors">
										Review my beneficiary designations
										<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
									</a>
								{/if}
								{#if recommendedCard}
									<a href={recommendedCard.href} class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-navy/10 text-sm text-navy/75 hover:border-emerald-accent/40 transition-colors">
										Explore {recommendedCard.title}
										<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
									</a>
								{/if}
								<a href={consultationBookingUrl} class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-navy/10 text-sm text-navy/75 hover:border-emerald-accent/40 transition-colors">
									Book an attorney review
									<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
								</a>
							</div>
						</div>
					{/if}

					<!-- Upsell ladder (ticket A2): GoodTree card above Legacy Plan when app-recommended -->
					{#each offerCards as card, i}
						{#if i === 0}
							<div class="rounded-2xl bg-navy overflow-hidden mb-5">
								<div class="p-7">
									<span class="text-emerald-light/70 text-[10px] tracking-[0.28em] uppercase font-medium">Recommended for your situation</span>
									<h3 class="text-cream text-xl md:text-2xl tracking-tight mt-2 mb-2">{card.title}</h3>
									<p class="text-cream/60 text-sm leading-relaxed mb-3">{card.tagline}</p>
									{#if recommendation.attorneyReviewNote}
										<p class="text-cream/45 text-xs leading-relaxed mb-5">Given the size of your estate, we recommend attorney review to make sure nothing is missed.</p>
									{/if}
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
									<span class="text-navy/40 text-[10px] tracking-[0.28em] uppercase font-medium">Premium option</span>
									<h3 class="text-navy text-xl md:text-2xl tracking-tight mt-2 mb-2">{card.title}</h3>
									<p class="text-navy/60 text-sm leading-relaxed mb-5">{card.tagline}</p>
									<div class="flex items-center justify-between gap-4">
										<span class="text-navy/45 text-sm">{card.price}</span>
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
						<a href="/plans" class="text-navy/45 text-sm hover:text-navy/70 transition-colors">Explore all plans →</a>
					</div>

					<!-- A4 — the flow isn't locked to a single will: let a signed-in user
					     tweak their answers or start a second will (e.g. for a spouse)
					     right from the completion page, not only on a later visit. -->
					{#if data.user}
						<div class="flex items-center justify-center gap-5 mt-6 pt-6 border-t border-navy/8">
							<button onclick={editFinishedWill} class="text-navy/45 text-sm hover:text-navy/70 transition-colors cursor-pointer">
								Edit my answers
							</button>
							<span class="text-navy/15">·</span>
							<button onclick={startNewWill} class="text-navy/45 text-sm hover:text-navy/70 transition-colors cursor-pointer">
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
						class="text-navy/40 hover:text-navy cursor-pointer leading-none text-base"
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
						{#each ['welcome', 'returning', 'questions', 'acknowledge', 'limitations', 'preview', 'account', 'complete'] as p}
							<button
								type="button"
								onclick={() => devGoToPhase(p as Phase)}
								class="px-2 py-1 rounded border text-[10px] cursor-pointer transition-colors
									{phase === p
									? 'border-fuchsia-500 bg-fuchsia-500 text-white'
									: 'border-navy/15 text-navy/60 hover:border-fuchsia-400'}"
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
		<p class="text-navy/35 text-xs leading-relaxed">
			© 2026 McDaniel Estate Planning, PLLC. Licensed in Texas and California.
		</p>
	</footer>
</div>
