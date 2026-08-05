<script lang="ts">
	import {
		siteName,
		prePaymentQuestions,
		postPaymentQuestions,
		allIntakeQuestions,
		postPaymentEntryQuestionId,
		buckets,
		isEligibleForOnlineTrustFromScreening,
		type QuestionResponseValue
	} from '$lib/config';
	import {
		getActiveQuestions,
		isIntakePhaseComplete,
		isQuestionResponseAnswered,
		isQuestionResponseComplete
	} from '$lib/question-response-helpers';
	import { authClient } from '$lib/auth-client';
	import { page } from '$app/stores';
	import { invalidateAll, goto } from '$app/navigation';
	import QuestionInput from '$lib/components/QuestionInput.svelte';
	import QuestionnaireSidebar from '$lib/components/QuestionnaireSidebar.svelte';
	import ScreeningStep from '$lib/components/ScreeningStep.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import WhatsAppHelpLink from '$lib/components/WhatsAppHelpLink.svelte';
	import HelpLauncher from '$lib/components/help/HelpLauncher.svelte';

	/** Set to `true` to show the individual vs joint trust picker again. */
	const showTrustTypeSelection = false;

	let completing = $state(false);
	let mobileSidebarOpen = $state(false);

	let { data } = $props();

	let firstName = $derived(data.userName?.split(' ')[0] ?? 'there');
	let userEmail = $derived(data.userEmail ?? '');
	let selectedPlan = $derived(data.trust.selectedPlan);
	let hasPaidInvoice = $derived(selectedPlan !== null);
	/** After Stripe checkout, jump to property questions once (see payment-return $effects). */
	let paymentReturnHandled = $state(false);
	let returningFromPayment = $derived($page.url.searchParams.get('payment') === 'success');
	// After payment, include pre-payment questions in the active flow so the user
	// can navigate back to them freely from the sidebar.
	let intakeQuestions = $derived(
		selectedPlan !== null || returningFromPayment || paymentReturnHandled
			? allIntakeQuestions
			: prePaymentQuestions
	);
	let step = $derived<'screening' | 'type' | 'questionnaire'>(
		data.trust.isEligible === null
			? 'screening'
			: showTrustTypeSelection && data.trust.joint === null
				? 'type'
				: 'questionnaire'
	);

	async function handleScreeningSubmit(payload: {
		county: string;
		answers: Record<string, boolean>;
		loe?: import('$lib/loe').LoeAgreementData;
	}) {
		const form = new FormData();
		form.set('county', payload.county);
		form.set('answers', JSON.stringify(payload.answers));
		if (payload.loe) form.set('loe', JSON.stringify(payload.loe));
		await fetch('?/screen', { method: 'POST', body: form });
		await invalidateAll();
		if (!isEligibleForOnlineTrustFromScreening(payload.answers)) goto(`/consultation/${data.trust.id}`);
	}

	/** Silently records ineligibility in the DB when a hard-stop question is answered Yes.
	 *  Does not navigate away — the user stays on the screening page and sees the inline popup. */
	async function handleIneligibleScreening(payload: {
		county: string;
		answers: Record<string, boolean>;
	}) {
		const form = new FormData();
		form.set('county', payload.county);
		form.set('answers', JSON.stringify(payload.answers));
		await fetch('?/screen', { method: 'POST', body: form });
	}

	let currentIndex = $state(0);
	let responses = $state<Record<string, QuestionResponseValue>>(
		Object.fromEntries(
			(data.trust.responses ?? []).map((r: { id: string; response: unknown }) => [r.id, r.response as QuestionResponseValue])
		)
	);
	let saving = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let completeBlockedMessage = $state<string | null>(null);

	// ── active questions (dependency-aware) ──
	let activeResult = $derived(getActiveQuestions(responses, intakeQuestions));
	let activeQuestions = $derived(activeResult.active);

	$effect(() => {
		const { autoValues } = activeResult;
		let changed = false;
		for (const [id, val] of Object.entries(autoValues)) {
			if (responses[id] !== val) {
				responses[id] = val;
				changed = true;
			}
		}
		if (changed) scheduleAutosave();
	});

	// clamp index when the active list shrinks
	$effect(() => {
		if (currentIndex >= activeQuestions.length) {
			currentIndex = Math.max(0, activeQuestions.length - 1);
		}
	});

	let currentQuestion = $derived(activeQuestions[currentIndex]);
	let helpStepKey = $derived(
		step === 'questionnaire' ? (currentQuestion?.id ?? null) : step
	);
	let currentValue = $derived(currentQuestion ? (responses[currentQuestion.id] ?? null) : null);

	let isFirst = $derived(currentIndex === 0);
	let isLast = $derived(currentIndex === activeQuestions.length - 1);

	// ── video interstitial ──
	// When a question has a videoUrl, show the video screen first.
	// showingVideo tracks whether we're on the video screen for the current question.
	let showingVideo = $state(false);

	// Reset to video screen whenever the question changes (if it has a video).
	$effect(() => {
		// reactive on currentIndex
		void currentIndex;
		showingVideo = !!(currentQuestion?.videoUrl);
	});

	function isCurrentQuestionComplete(): boolean {
		if (!currentQuestion) return false;
		return isQuestionResponseComplete(currentQuestion.type, currentValue, responses);
	}

	let canGoNext = $derived(isCurrentQuestionComplete());

	// ── autosave ──
	function scheduleAutosave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => doSave(), 800);
	}

	async function doSave() {
		saving = true;
		const arr = Object.entries(responses)
			.filter(([, v]) => isQuestionResponseAnswered(v))
			.map(([id, response]) => ({ id, response }));
		const form = new FormData();
		form.set('responses', JSON.stringify(arr));
		await fetch('?/save', { method: 'POST', body: form });
		saving = false;
	}

	function setResponse(value: QuestionResponseValue) {
		if (!currentQuestion) return;
		responses[currentQuestion.id] = value;
		scheduleAutosave();
		updateHash();
	}

	function goToQuestion(index: number) {
		currentIndex = index;
		updateHash();
	}

	function goToQuestionById(questionId: string) {
		const idx = activeQuestions.findIndex((q) => q.id === questionId);
		if (idx >= 0) goToQuestion(idx);
	}

	function goNext() {
		if (!canGoNext) return;
		if (currentQuestion && data.helpBlockedSteps.includes(currentQuestion.id)) {
			completeBlockedMessage =
				'A consultation is required before continuing this step. Open Help Assistant to book a consult.';
			return;
		}
		if (!isLast) goToQuestion(currentIndex + 1);
	}

	async function completeIntake() {
		completeBlockedMessage = null;
		if (!isIntakePhaseComplete(responses, intakeQuestions)) {
			completeBlockedMessage =
				'Please complete all questions before finalizing. Use the sidebar to jump to any section that still needs answers.';
			return;
		}
		completing = true;
		try {
			if (saveTimer) clearTimeout(saveTimer);
			await doSave();
			const form = new FormData();
			if (hasPaidInvoice) {
				const res = await fetch('?/completePostPayment', { method: 'POST', body: form });
				if (!res.ok) {
					completeBlockedMessage =
						'We could not finalize your intake. Please check that all required questions are complete.';
					return;
				}
				await goto('/dashboard');
			} else if (returningFromPayment || paymentReturnHandled) {
				// Payment went through but confirmation is still pending (webhook lag or a
				// no-cost order still reconciling). Never bounce back to payment or lose the
				// answers already saved — refresh to pick up the confirmed state and let the
				// user try again in a moment.
				await invalidateAll();
				if (!hasPaidInvoice) {
					completeBlockedMessage =
						'We are still confirming your payment. Your answers are saved — please wait a few seconds and click Complete again.';
				} else {
					const res = await fetch('?/completePostPayment', { method: 'POST', body: form });
					if (res.ok) await goto('/dashboard');
				}
			} else {
				await fetch('?/completePrePayment', { method: 'POST', body: form });
				await goto(`/create-trust/${data.trust.id}/payment`);
			}
		} finally {
			completing = false;
		}
	}

	function goBack() {
		// If on the question screen and this question has a video, step back to the video first.
		if (!showingVideo && currentQuestion?.videoUrl) {
			showingVideo = true;
			return;
		}
		if (!isFirst) goToQuestion(currentIndex - 1);
	}

	function updateHash() {
		if (activeQuestions[currentIndex]) {
			history.replaceState(null, '', `#${activeQuestions[currentIndex].id}`);
		}
	}

	async function selectType(joint: boolean) {
		const form = new FormData();
		form.set('joint', String(joint));
		await fetch('?/select', { method: 'POST', body: form });
		await invalidateAll();
		updateHash();
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}

	// Webhook may lag behind the Stripe redirect — refresh until payment unlocks post-payment questions.
	$effect(() => {
		if ($page.url.searchParams.get('payment') !== 'success') return;
		if (step !== 'questionnaire') return;
		if (hasPaidInvoice) return;

		const id = setInterval(() => {
			void invalidateAll();
		}, 2000);
		const stop = setTimeout(() => clearInterval(id), 90_000);
		return () => {
			clearInterval(id);
			clearTimeout(stop);
		};
	});

	// Land on the first post-payment question after checkout — don't wait for the webhook
	// to unlock the question list (hash navigation fails while only pre-payment questions are active).
	$effect(() => {
		if (paymentReturnHandled) return;
		if (step !== 'questionnaire') return;
		if (!returningFromPayment && !hasPaidInvoice) return;

		const idx = activeQuestions.findIndex((q) => q.id === postPaymentEntryQuestionId);
		if (idx < 0) return;

		paymentReturnHandled = true;
		currentIndex = idx;
		const base = `/create-trust/${data.trust.id}`;
		const hash = `#${postPaymentEntryQuestionId}`;
		history.replaceState(
			null,
			'',
			hasPaidInvoice ? `${base}${hash}` : `${base}?payment=success${hash}`
		);
	});

	// Drop the payment=success query param once the webhook has confirmed payment.
	$effect(() => {
		if (!hasPaidInvoice) return;
		if ($page.url.searchParams.get('payment') !== 'success') return;
		history.replaceState(
			null,
			'',
			`/create-trust/${data.trust.id}#${postPaymentEntryQuestionId}`
		);
	});

	$effect(() => {
		if (paymentReturnHandled) return;
		const hash = window.location.hash.slice(1);
		if (hash) {
			const idx = activeQuestions.findIndex((q) => q.id === hash);
			if (idx >= 0) currentIndex = idx;
		}
	});

	// Force-flush to DB when user reaches the summary screen so it shows the latest data.
	let lastFlushedForSummary = $state(false);
	$effect(() => {
		if (currentQuestion?.type === 'summary-review' && !lastFlushedForSummary) {
			lastFlushedForSummary = true;
			if (saveTimer) clearTimeout(saveTimer);
			doSave();
		}
		if (currentQuestion?.type !== 'summary-review') {
			lastFlushedForSummary = false;
		}
	});
</script>

{#if step === 'screening'}
<ScreeningStep {firstName} {userEmail} trustId={data.trust.id} onsubmit={handleScreeningSubmit} onIneligible={handleIneligibleScreening} />

{:else if step === 'type'}
<!-- ─── TRUST TYPE SELECTION (only when showTrustTypeSelection is true; otherwise joint defaults to true on server) ─── -->
<div class="h-dvh max-h-dvh w-screen overflow-hidden bg-cream font-sans flex flex-col relative">
	<div class="absolute inset-0 pointer-events-none"
		style="background:
			radial-gradient(ellipse 80% 60% at 50% 40%, rgba(74,124,111,0.07) 0%, transparent 70%),
			radial-gradient(ellipse 40% 40% at 20% 80%, rgba(74,124,111,0.03) 0%, transparent 60%),
			radial-gradient(ellipse 40% 40% at 80% 80%, rgba(74,124,111,0.03) 0%, transparent 60%);">
	</div>

	<nav class="relative z-10 shrink-0 flex items-center justify-between px-8 py-6 max-w-5xl w-full mx-auto">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<div class="flex items-center gap-3">
			<span class="hidden sm:inline text-sm text-navy/45">{userEmail}</span>
			<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
		</div>
	</nav>

	<div class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16">
		<div class="text-center mb-12">
			<div class="flex items-center justify-center gap-4 mb-5">
				<span class="w-8 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Get Started</span>
				<span class="w-8 h-px bg-emerald-accent/60"></span>
			</div>
			<h1 class="text-3xl md:text-4xl font-semibold text-navy tracking-tight mb-3">Welcome, {firstName}</h1>
			<p class="text-navy/50 text-base font-light max-w-md mx-auto leading-relaxed">
				Choose the type of trust that best fits your estate planning needs.
			</p>
		</div>

		<div class="flex flex-col md:flex-row items-stretch justify-center gap-5 w-full max-w-3xl">
			{#each [
				{ joint: false, title: 'Individual Trust', desc: 'A single-grantor trust for your personal estate.', icon: 'user', bullets: ['Full control over assets and beneficiaries', 'Simplified management with a single trustee', 'Ideal for unmarried individuals or separate estates', 'Avoids probate and maintains privacy'] },
				{ joint: true, title: 'Joint Trust', desc: 'A shared trust for you and your spouse.', icon: 'users', bullets: ['Unified estate plan for both spouses', 'Seamless transfer of assets between partners', 'Shared management with co-trustee provisions', 'Built-in survivor provisions for continuity'] },
			] as card}
				<button
					onclick={() => selectType(card.joint)}
					class="flex-1 max-w-sm w-full mx-auto md:mx-0 text-left group rounded-2xl bg-white/80 backdrop-blur-sm
						   border border-navy/[0.07] p-7 md:p-8 flex flex-col
						   transition-all duration-300 cursor-pointer
						   hover:bg-white hover:border-emerald-accent/25
						   hover:shadow-[0_8px_40px_-8px_rgba(74,124,111,0.18)] hover:-translate-y-1"
				>
					<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-navy/[0.05] to-navy/[0.02] flex items-center justify-center mb-5
								group-hover:from-emerald-accent/12 group-hover:to-emerald-accent/5 transition-all duration-300">
						{#if card.icon === 'user'}
							<svg class="w-5.5 h-5.5 text-navy/35 group-hover:text-emerald-accent transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
							</svg>
						{:else}
							<svg class="w-5.5 h-5.5 text-navy/35 group-hover:text-emerald-accent transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
							</svg>
						{/if}
					</div>

					<h2 class="text-lg font-semibold text-navy tracking-tight mb-1">{card.title}</h2>
					<p class="text-navy/40 text-[13px] font-light mb-5 leading-relaxed">{card.desc}</p>

					<ul class="space-y-3 flex-1">
						{#each card.bullets as bullet}
							<li class="flex items-start gap-2.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60 mt-[7px] shrink-0"></span>
								<span class="text-navy/55 text-[13px] leading-snug">{bullet}</span>
							</li>
						{/each}
					</ul>

					<div class="mt-6 pt-4 border-t border-navy/[0.06] flex items-center justify-between">
						<span class="text-sm font-medium text-navy/60 group-hover:text-emerald-accent transition-colors duration-300">
							Select {card.joint ? 'Joint' : 'Individual'}
						</span>
						<div class="w-7 h-7 rounded-full bg-navy/[0.04] flex items-center justify-center
									group-hover:bg-emerald-accent group-hover:scale-105 transition-all duration-300">
							<svg class="w-3.5 h-3.5 text-navy/30 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>
</div>

{:else if step === 'questionnaire'}
<!-- ─── QUESTIONNAIRE ─── -->
<div class="h-dvh max-h-dvh w-screen overflow-hidden bg-cream font-sans flex flex-col relative">
	<div class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 80% 60% at 60% 40%, rgba(74,124,111,0.05) 0%, transparent 70%);">
	</div>

	<nav
		class="relative z-10 shrink-0 flex items-center justify-between px-6 md:px-8 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-5 border-b border-navy/[0.06]"
	>
		<div class="flex min-w-0 items-center gap-2">
			<button
				type="button"
				class="md:hidden shrink-0 cursor-pointer p-1.5 -ml-1 text-navy/50 transition-colors hover:text-navy"
				onclick={() => (mobileSidebarOpen = !mobileSidebarOpen)}
				aria-label={mobileSidebarOpen ? 'Close sections menu' : 'Open sections menu'}
				aria-expanded={mobileSidebarOpen}
				aria-controls="questionnaire-sidebar-drawer"
			>
				{#if mobileSidebarOpen}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
			<a href="/" class="flex min-w-0 items-center gap-2 truncate text-navy font-semibold text-base tracking-tight">
				<span class="w-2 h-2 shrink-0 rounded-full bg-emerald-accent"></span>
				{siteName}
			</a>
		</div>
		<div class="flex items-center gap-4">
			<span class="text-[11px] text-navy/35 transition-opacity duration-300 {saving ? 'opacity-100' : 'opacity-0'}">Saving...</span>
			<span class="hidden sm:inline text-sm text-navy/45">{userEmail}</span>
			<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
		</div>
	</nav>

	<div class="relative z-10 flex min-h-0 flex-1 overflow-hidden">

		<QuestionnaireSidebar
			bind:mobileOpen={mobileSidebarOpen}
			{currentIndex}
			{responses}
			{activeQuestions}
			preQuestions={prePaymentQuestions}
			postQuestions={postPaymentQuestions}
			selectedPlan={data.trust.selectedPlan}
			onnavigate={goToQuestionById}
		/>

		<main class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
			<!-- mobile progress -->
			<div class="shrink-0 md:hidden px-6 pt-5 pb-3">
				<div class="flex items-center justify-between mb-2">
					<span class="text-[11px] text-navy/40 tracking-wider uppercase font-medium">
						{buckets[currentQuestion.bucket]?.label ?? currentQuestion.bucket}
					</span>
					<span class="text-[11px] text-navy/35">{currentIndex + 1} of {activeQuestions.length}</span>
				</div>
				<div class="w-full h-1 rounded-full bg-navy/[0.06] overflow-hidden">
					<div class="h-full rounded-full bg-emerald-accent transition-all duration-500 ease-out"
						style="width: {((currentIndex + 1) / activeQuestions.length) * 100}%"></div>
				</div>
			</div>

			<!-- Scrollable region: flex-1 + min-h-0 bounds height between progress strip and footer (in-flow, not fixed) -->
			<div
				class="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
			>
				{#if showingVideo && currentQuestion.videoUrl}
					<!-- ── VIDEO INTERSTITIAL SCREEN (top-aligned so titles stay visible; scrolls if tall) ── -->
					<div
						class="flex w-full flex-col items-stretch px-6 py-6 pb-10 md:px-12 md:py-8 md:pb-12 lg:px-16"
					>
						<div class="w-full max-w-2xl md:max-w-5xl mx-auto shrink-0">
							<div class="hidden md:flex items-center gap-3 mb-8">
								<span class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium">
									{buckets[currentQuestion.bucket]?.label ?? currentQuestion.bucket}
								</span>
								<span class="w-4 h-px bg-navy/15"></span>
								<span class="text-[11px] text-navy/30">{currentIndex + 1} of {activeQuestions.length}</span>
							</div>

							{#if currentQuestion.videoTitle}
								<h2 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight leading-snug mb-6">
									{currentQuestion.videoTitle}
								</h2>
							{/if}

							<VideoPlayer src={currentQuestion.videoUrl} />

							<div class="mt-6 flex justify-center">
								<button
									onclick={() => (showingVideo = false)}
									class="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl text-sm font-medium text-cream bg-emerald-accent
										   transition-all duration-200 hover:bg-emerald-accent/90 hover:shadow-lg hover:shadow-emerald-accent/20 cursor-pointer"
								>
									Go To Question
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</div>

							<div class="mt-8 pt-6 border-t border-navy/10">
								<p class="text-[13px] text-navy/60 mb-3">
									Not sure how to fill out this question? 
								</p>
								<WhatsAppHelpLink />
							</div>
						</div>
					</div>
				{:else}
					<!-- ── QUESTION SCREEN ── -->
					<div
						class="flex min-h-0 min-w-0 w-full flex-col px-6 py-4 pb-8 md:px-16 md:py-8 md:pb-10 justify-start"
					>
						<div
							class="w-full min-w-0 {['heirs-calculator', 'minor-distribution', 'non-charitable-bequests', 'charities', 'summary-review', 'heba', 'ownership-allocation'].includes(currentQuestion.type) ? 'max-w-xl' : 'max-w-lg'} mx-auto"
						>
							<div class="hidden md:flex items-center gap-3 mb-8">
								<span class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium">
									{buckets[currentQuestion.bucket]?.label ?? currentQuestion.bucket}
								</span>
								<span class="w-4 h-px bg-navy/15"></span>
								<span class="text-[11px] text-navy/30">{currentIndex + 1} of {activeQuestions.length}</span>
							</div>

							<h2 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight leading-snug mb-8">
								{currentQuestion.text}
							</h2>
							{#if currentQuestion.subtext}
								<p class="text-navy/50 text-base font-light max-w-md auto mb-8">{currentQuestion.subtext}</p>
							{/if}

							<QuestionInput
								question={currentQuestion}
								value={currentValue}
								onresponse={setResponse}
								onnext={goNext}
								allResponses={responses}
								onnavigate={goToQuestionById}
								oncomplete={completeIntake}
								{completing}
								trustId={data.trust.id}
								userId={data.userId}
								userCounty={data.userCounty}
								houseDeedUrl={data.trust.houseDeedUrl}
								deedRetrievalRequested={data.trust.deedRetrievalRequested}
							/>

							<div class="mt-8 pt-6 border-t border-navy/10">
								<p class="text-[13px] text-navy/60 mb-3">
									Not sure how to fill out this question? 
								</p>
								<WhatsAppHelpLink />
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- back / next: in-flow so the scroll area height is exactly the space above this bar -->
			<div
				class="shrink-0 border-t border-navy/[0.06] bg-cream px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:px-16 md:pb-5 flex flex-col gap-3"
			>
				{#if completeBlockedMessage}
					<div
						class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
						role="alert"
					>
						{completeBlockedMessage}
					</div>
				{/if}
				<div class="flex items-center justify-between">
				<button onclick={goBack} disabled={isFirst && (showingVideo || !currentQuestion?.videoUrl)}
					class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm text-navy/60
						   transition-all hover:text-navy hover:bg-navy/[0.04]
						   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
					Back
				</button>
				{#if showingVideo}
					<!-- On video screen, the primary CTA is the "Go To Question" button in the body; show nothing on the right -->
					<div></div>
				{:else if isLast && currentQuestion.type !== 'summary-review'}
					<button onclick={completeIntake} disabled={completing}
						class="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-cream bg-emerald-accent
							   transition-all duration-200 hover:bg-emerald-accent/90 hover:shadow-lg hover:shadow-emerald-accent/15
							   disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
						{completing ? 'Completing...' : 'Complete'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					</button>
				{:else if currentQuestion.type === 'summary-review'}
					<div></div>
				{:else}
					<button onclick={goNext} disabled={!canGoNext}
						class="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy
							   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
							   disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer">
						Next
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{/if}
				</div>
			</div>
		</main>
	</div>
</div>
{/if}

<HelpLauncher
	surface="create_trust"
	stepKey={helpStepKey}
	trustId={data.trust.id}
	blockedStepKeys={data.helpBlockedSteps}
/>
