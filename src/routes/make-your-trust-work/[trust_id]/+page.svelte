<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { siteName, notarizationBookingUrl } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import HelpLauncher from '$lib/components/help/HelpLauncher.svelte';

	let { data } = $props();

	let disclaimerCollapsed = $state(false);
	let findYourStuffOpen = $state(!data.findYourStuff.completed);
	let expandedModules = $state<Record<string, boolean>>({});
	let showAllAssets = $state<Record<string, boolean>>({});
	let modulesInitialized = $state(false);
	let prevModuleStatus = $state<Record<string, string>>({});
	let prevPrepareComplete = $state<boolean | null>(null);
	let prevCompletePhaseDone = $state<boolean | null>(null);
	let recentlyCompletedModule = $state<string | null>(null);
	let moduleCompleteTimer: ReturnType<typeof setTimeout> | null = null;
	/**
	 * Local checklist overlay — once the user toggles an item, that value lives here
	 * and wins over server props until the next full navigation.
	 */
	let checklistLocal = $state<Record<string, Record<string, boolean>>>({});
	let pendingItem = $state<string | null>(null);

	const nextKey = $derived(data.nextUp?.milestoneKey ?? null);
	const completeLocked = $derived(data.progress.completePhaseLocked);
	const preparePhaseComplete = $derived(data.progress.prepareComplete);
	const completePhaseDone = $derived(
		!completeLocked && data.progress.complete.total > 0 && data.progress.complete.pct === 100,
	);
	const showStickyContinue = $derived(!!data.nextUp && !data.progress.implementationComplete);

	$effect(() => {
		if (modulesInitialized) return;
		const next = data.nextUp;
		const init: Record<string, boolean> = {};
		for (const m of data.modules) {
			init[m.id] = next?.moduleId === m.id;
		}
		expandedModules = init;
		for (const m of data.modules) {
			prevModuleStatus[m.id] = m.progress.status;
		}
		prevPrepareComplete = preparePhaseComplete;
		prevCompletePhaseDone = completePhaseDone;
		modulesInitialized = true;
	});

	$effect(() => {
		if (!modulesInitialized) return;

		const next = data.nextUp;
		let updates: Record<string, boolean> | null = null;
		let justCompleted = false;

		for (const mod of data.modules) {
			const prev = prevModuleStatus[mod.id];
			const curr = mod.progress.status;
			if (prev && prev !== 'complete' && curr === 'complete') {
				updates = updates ?? { ...expandedModules };
				updates[mod.id] = false;
				justCompleted = true;
				recentlyCompletedModule = mod.id;
				if (moduleCompleteTimer) clearTimeout(moduleCompleteTimer);
				moduleCompleteTimer = setTimeout(() => {
					recentlyCompletedModule = null;
				}, 5000);
			}
			prevModuleStatus[mod.id] = curr;
		}

		if (justCompleted && next) {
			updates = updates ?? { ...expandedModules };
			updates[next.moduleId] = true;
		}

		if (updates) expandedModules = updates;
	});

	$effect(() => {
		if (!modulesInitialized || prevPrepareComplete === null) return;
		if (!prevPrepareComplete && preparePhaseComplete) {
			requestAnimationFrame(() => {
				document.getElementById('phase-complete-prepare')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			});
		}
		prevPrepareComplete = preparePhaseComplete;
	});

	$effect(() => {
		if (!modulesInitialized || prevCompletePhaseDone === null) return;
		if (!prevCompletePhaseDone && completePhaseDone) {
			requestAnimationFrame(() => {
				document.getElementById('phase-complete-funding')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			});
		}
		prevCompletePhaseDone = completePhaseDone;
	});

	function isChecked(milestoneKey: string, itemId: string): boolean {
		const local = checklistLocal[milestoneKey];
		if (local && Object.prototype.hasOwnProperty.call(local, itemId)) {
			return local[itemId] === true;
		}
		const m = data.milestones.find((x) => x.key === milestoneKey);
		return m?.checklistState?.[itemId] === true;
	}

	function setCheckedLocal(milestoneKey: string, itemId: string, checked: boolean) {
		const server =
			data.milestones.find((x) => x.key === milestoneKey)?.checklistState ?? {};
		checklistLocal = {
			...checklistLocal,
			[milestoneKey]: {
				...server,
				...(checklistLocal[milestoneKey] ?? {}),
				[itemId]: checked,
			},
		};
	}

	function statusLabel(status: string): string {
		switch (status) {
			case 'locked':
				return 'Locked';
			case 'not_started':
				return 'Not started';
			case 'in_progress':
				return 'In progress';
			case 'action_needed':
				return 'Action needed';
			case 'complete':
				return 'Complete';
			case 'not_applicable':
				return 'N/A';
			default:
				return status;
		}
	}

	function statusClass(status: string): string {
		switch (status) {
			case 'complete':
				return 'bg-emerald-accent/12 text-emerald-accent border-emerald-accent/25';
			case 'in_progress':
				return 'bg-navy/5 text-navy/70 border-navy/10';
			case 'action_needed':
				return 'bg-red-50 text-red-700 border-red-200';
			case 'locked':
				return 'bg-navy/[0.04] text-navy/35 border-navy/8';
			case 'not_applicable':
				return 'bg-navy/[0.03] text-navy/30 border-navy/8';
			default:
				return 'bg-white text-navy/45 border-navy/10';
		}
	}

	function milestonesForModule(moduleId: string) {
		return data.milestones.filter(
			(m) => m.moduleId === moduleId && m.applicable && m.key !== 'find_your_stuff',
		);
	}

	/** Expand the owning section first — a collapsed module has no element to scroll to yet. */
	function scrollToMilestone(key: string) {
		if (key === 'find_your_stuff') findYourStuffOpen = true;
		const mod = data.milestones.find((m) => m.key === key);
		if (mod) expandedModules = { ...expandedModules, [mod.moduleId]: true };
		requestAnimationFrame(() => {
			document.getElementById(`milestone-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	}

	function scrollToModule(id: string) {
		expandedModules = { ...expandedModules, [id]: true };
		const el = document.getElementById(`module-${id}`);
		el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}

	const fysAnswers = $state({ ...data.findYourStuff.answers });
	let fysRetirementBeneficiary = $state(data.findYourStuff.retirementBeneficiary);
	let fysFormEl = $state<HTMLFormElement | null>(null);
	let fysSubmitting = $state(false);

	$effect(() => {
		Object.assign(fysAnswers, data.findYourStuff.answers);
		fysRetirementBeneficiary = data.findYourStuff.retirementBeneficiary;
	});

	/**
	 * Mirrors the server rule: only married users who have an employer plan or IRA are asked who is
	 * named as beneficiary. Tracks the in-form answers so the question appears as they answer.
	 */
	const showRetirementBeneficiary = $derived(
		data.findYourStuff.retirementQuestionApplies ||
			(data.isMarried && (fysAnswers.hasEmployerPlan === 'yes' ||
				fysAnswers.hasEmployerPlan === 'not_sure' ||
				fysAnswers.hasIra === 'yes' ||
				fysAnswers.hasIra === 'not_sure')),
	);

	function isFysComplete(): boolean {
		for (const q of data.findYourStuffQuestions) {
			if (!fysAnswers[q.field]) return false;
		}
		if (showRetirementBeneficiary && !fysRetirementBeneficiary) return false;
		return true;
	}

	async function tryAutoSubmitFys(
		trigger: 'retirement_over_threshold' | 'retirement_beneficiary',
	) {
		await tick();
		if (fysSubmitting) return;
		if (trigger === 'retirement_over_threshold') {
			if (!showRetirementBeneficiary && isFysComplete()) fysFormEl?.requestSubmit();
		} else if (isFysComplete()) {
			fysFormEl?.requestSubmit();
		}
	}

	function setFysAnswer(field: keyof typeof fysAnswers, val: (typeof fysAnswers)[typeof field]) {
		fysAnswers[field] = val;
		if (field === 'retirementOverThreshold') {
			void tryAutoSubmitFys('retirement_over_threshold');
		}
	}
</script>

<div
	class="min-h-[100dvh] w-full bg-cream font-sans relative pb-12 {showStickyContinue
		? 'max-lg:pb-28'
		: ''}"
>
	<div
		class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 80% 60% at 50% 20%, rgba(74,124,111,0.06) 0%, transparent 70%);"
	></div>

	<nav class="sticky top-0 z-30 flex items-center justify-between px-5 md:px-8 py-4 border-b border-navy/[0.06] max-w-6xl mx-auto bg-cream/95 backdrop-blur-sm">
		<a href="/dashboard" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<div class="flex items-center gap-4">
			<a
				href="/dashboard"
				class="text-sm font-medium text-navy/70 hover:text-navy transition-colors underline-offset-4 hover:underline"
				>Trust dashboard</a
			>
			<button onclick={handleLogout} class="text-sm text-navy/45 hover:text-navy transition-colors cursor-pointer"
				>Log out</button
			>
		</div>
	</nav>

	<div class="relative z-10 max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10">
		<a
			href="/dashboard"
			class="hidden md:inline-flex items-center gap-1.5 text-[13px] text-navy/45 hover:text-navy transition-colors mb-6"
		>
			<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Back to trust dashboard
		</a>
		<header class="mb-6 md:mb-8">
			<p class="text-[11px] tracking-[0.2em] uppercase text-emerald-accent font-semibold mb-2">Guided journey</p>
			<h1 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight mb-2">Make Your Trust Work</h1>
			<p class="text-navy/50 text-sm md:text-[15px] leading-relaxed max-w-2xl">{data.copy.subtitle}</p>
		</header>

		<!-- Disclaimer -->
		<div class="mb-6 rounded-xl border border-navy/10 bg-white/60 backdrop-blur-sm overflow-hidden">
			<button
				type="button"
				class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
				onclick={() => (disclaimerCollapsed = !disclaimerCollapsed)}
			>
				<span class="text-[12px] text-navy/55 leading-snug">
					{disclaimerCollapsed ? 'Important disclaimer (tap to expand)' : 'Important disclaimer'}
				</span>
				<svg
					class="w-4 h-4 text-navy/30 shrink-0 transition-transform {disclaimerCollapsed ? '' : 'rotate-180'}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			{#if !disclaimerCollapsed}
				<p class="px-4 pb-4 text-[12px] text-navy/45 leading-relaxed border-t border-navy/[0.05] pt-3">
					{data.copy.disclaimer}
				</p>
			{/if}
		</div>

		{#snippet infoCallout(
			body: string,
			eyebrow: string | null = null,
			size: 'sm' | 'md' = 'sm',
		)}
			<div
				class="{size === 'md' ? 'mb-6 rounded-2xl' : 'mb-3 rounded-xl'} bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden"
			>
				<div class="flex">
					<div class="w-0.5 shrink-0 bg-emerald-accent/50" aria-hidden="true"></div>
					<div class="flex-1 {size === 'md' ? 'px-5 py-5 md:px-6 md:py-5' : 'px-3.5 py-2.5'}">
						{#if eyebrow}
							<p class="text-[11px] tracking-[0.2em] uppercase text-emerald-accent font-semibold mb-1">{eyebrow}</p>
						{/if}
						<p class="{size === 'md' ? 'text-sm' : 'text-[12px]'} text-navy/55 leading-relaxed">{body}</p>
					</div>
				</div>
			</div>
		{/snippet}

		{#if data.actionNeededNote}
			{@render infoCallout(data.actionNeededNote, 'Action needed', 'md')}
		{/if}

		{#if data.fundingUnlockedAt && !data.implementationCompletedAt}
			<div class="mb-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden">
				<div class="flex">
					<div class="w-0.5 shrink-0 bg-emerald-accent/50" aria-hidden="true"></div>
					<div class="flex-1 px-5 py-5 md:px-6 md:py-5">
						<p class="text-[11px] tracking-[0.2em] uppercase text-emerald-accent font-semibold mb-2">Trust signed</p>
						<p class="text-sm text-navy/55 leading-relaxed max-w-2xl">{data.copy.fundingUnlockedBanner}</p>
					</div>
				</div>
			</div>
		{/if}

		{#snippet phaseCompleteBanner(
			id: string,
			eyebrow: string,
			title: string,
			body: string,
			footnote: string | null = null,
		)}
			<div
				{id}
				class="mb-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden"
			>
				<div class="flex">
					<div class="w-0.5 shrink-0 bg-emerald-accent/50" aria-hidden="true"></div>
					<div class="flex-1 px-5 py-5 md:px-6 md:py-5">
						<p class="text-[11px] tracking-[0.2em] uppercase text-emerald-accent font-semibold mb-2">{eyebrow}</p>
						<h2 class="text-base font-semibold text-navy tracking-tight mb-2">{title}</h2>
						<p class="text-sm text-navy/50 leading-relaxed max-w-2xl">{body}</p>
						{#if footnote}
							<p class="text-[13px] text-navy/40 leading-relaxed mt-3 pt-3 border-t border-navy/[0.05]">{footnote}</p>
						{/if}
					</div>
				</div>
			</div>
		{/snippet}

		{#if data.progress.implementationComplete}
			{@render phaseCompleteBanner(
				'phase-complete-funding',
				'Journey complete',
				data.copy.completionTitle,
				data.copy.completionBody,
			)}
		{:else if completePhaseDone}
			{@render phaseCompleteBanner(
				'phase-complete-funding',
				'Done for now',
				data.copy.completePhaseCompleteTitle,
				data.copy.completePhaseCompleteBody,
			)}
		{:else if preparePhaseComplete && completeLocked}
			{@render phaseCompleteBanner(
				'phase-complete-prepare',
				'Done for now',
				data.copy.preparePhaseCompleteTitle,
				data.copy.preparePhaseCompleteBody,
				data.copy.prepareCompleteWhileLocked,
			)}
		{/if}

		<!-- Journey progress -->
		<div class="mb-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-5 md:p-6">
			<div class="flex items-start justify-between gap-4 mb-4">
				<div>
					<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-1">Overall progress</p>
					<p class="text-lg font-semibold text-navy tabular-nums">
						{data.progress.journey.done}
						<span class="text-navy/30 font-normal">/</span>
						{data.progress.journey.total}
						<span class="text-sm font-normal text-navy/40 ml-1">steps</span>
					</p>
				</div>
				<span class="text-sm tabular-nums text-navy/45">{data.progress.journey.pct}%</span>
			</div>
			<div class="h-2 rounded-full bg-navy/[0.06] overflow-hidden mb-5">
				<div
					class="h-full rounded-full bg-emerald-accent transition-all duration-700 ease-out"
					style="width: {data.progress.journey.pct}%"
				></div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<div class="flex justify-between text-[12px] mb-1.5">
						<span class="text-navy/60 font-medium">Prepare Your Funding</span>
						<span class="tabular-nums text-navy/40"
							>{preparePhaseComplete ? 'Complete' : `${data.progress.prepare.done}/${data.progress.prepare.total}`}</span
						>
					</div>
					<div class="h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
						<div
							class="h-full rounded-full bg-emerald-accent transition-all duration-500"
							style="width: {data.progress.prepare.pct}%"
						></div>
					</div>
				</div>
				<div class:opacity-60={completeLocked && !completePhaseDone}>
					<div class="flex justify-between text-[12px] mb-1.5">
						<span class="text-navy/60 font-medium flex items-center gap-1.5">
							{#if completeLocked && !completePhaseDone}
								<svg class="w-3 h-3 text-navy/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/></svg
								>
							{/if}
							Complete Your Funding
						</span>
						<span class="tabular-nums text-navy/40"
							>{completeLocked && !completePhaseDone
								? '—'
								: completePhaseDone
									? 'Complete'
									: `${data.progress.complete.done}/${data.progress.complete.total}`}</span
						>
					</div>
					<div class="h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
						<div
							class="h-full rounded-full bg-emerald-accent transition-all duration-500"
							style="width: {completeLocked ? 0 : data.progress.complete.pct}%"
						></div>
					</div>
					{#if completeLocked}
						<p class="text-[11px] text-navy/40 mt-1.5 leading-snug">Unlocks after notarization</p>
					{/if}
				</div>
			</div>

			{#if data.nextUp}
				<div class="mt-5 pt-4 border-t border-navy/[0.06] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
					<div>
						<p class="text-[11px] tracking-wider uppercase text-emerald-accent font-semibold mb-0.5">Next up</p>
						<p class="text-sm text-navy font-medium">{data.nextUp.milestoneTitle}</p>
						<p class="text-[12px] text-navy/40">{data.nextUp.moduleTitle}</p>
					</div>
					<button
						type="button"
						onclick={() => scrollToMilestone(data.nextUp!.milestoneKey)}
						class="shrink-0 px-5 py-2.5 rounded-xl bg-navy text-cream text-sm font-medium hover:bg-navy-light transition-colors cursor-pointer active:scale-[0.98]"
					>
						Continue
					</button>
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main column -->
			<div class="lg:col-span-2 space-y-4">
				<!-- Find Your Stuff -->
				<div class="rounded-2xl bg-white/80 border border-navy/[0.06] overflow-hidden" id="milestone-find_your_stuff">
					<button
						type="button"
						class="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
						onclick={() => (findYourStuffOpen = !findYourStuffOpen)}
					>
						<div>
							<p class="text-[11px] tracking-wider uppercase text-navy/35 font-medium mb-0.5">Get Oriented</p>
							<h2 class="text-base font-semibold text-navy">Find Your Stuff</h2>
						</div>
						<span
							class="text-[10px] px-2 py-0.5 rounded-full border {data.findYourStuff.completed
								? statusClass('complete')
								: statusClass('not_started')}">{data.findYourStuff.completed ? 'Complete' : 'Required'}</span
						>
					</button>
					{#if findYourStuffOpen}
						<div class="px-5 pb-5 border-t border-navy/[0.05] pt-4">
							<p class="text-sm text-navy/55 leading-relaxed mb-4">
								Answer a few questions so we can show the right funding cards. “Not sure” shows the card — you can
								mark it not applicable later.
							</p>
							<form
								bind:this={fysFormEl}
								method="POST"
								action="?/saveFindYourStuff"
								use:enhance={() => {
									fysSubmitting = true;
									return async ({ result, update }) => {
										if (result.type === 'success') {
											findYourStuffOpen = false;
										}
										await update({ reset: false });
										fysSubmitting = false;
									};
								}}
								class="space-y-4"
							>
								{#each data.findYourStuffQuestions as q}
									<fieldset class="space-y-2">
										<legend class="text-sm text-navy/80 mb-2">{q.question}</legend>
										<div class="flex flex-wrap gap-2">
											{#each [['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure']] as [val, label]}
												<label
													class="px-3.5 py-2 rounded-xl border text-sm cursor-pointer transition-all
													{fysAnswers[q.field] === val
														? 'border-emerald-accent/40 bg-emerald-accent/10 text-emerald-accent'
														: 'border-navy/10 text-navy/50 hover:border-navy/20'}"
												>
													<input
														type="radio"
														name={q.field}
														value={val}
														class="sr-only"
														checked={fysAnswers[q.field] === val}
														disabled={fysSubmitting}
														onchange={() => setFysAnswer(q.field, val as typeof fysAnswers[typeof q.field])}
														required
													/>
													{label}
												</label>
											{/each}
										</div>
									</fieldset>
								{/each}

								{#if showRetirementBeneficiary}
									{@const rq = data.retirementBeneficiaryQuestion}
									<fieldset class="space-y-2 pt-1">
										<legend class="text-sm text-navy/80 mb-1">{rq.question}</legend>
										<p class="text-[12px] text-navy/45 leading-relaxed mb-2">{rq.help}</p>
										<div class="flex flex-col gap-2">
											{#each rq.options as opt}
												<label
													class="px-3.5 py-2.5 rounded-xl border text-sm cursor-pointer transition-all
													{fysRetirementBeneficiary === opt.value
														? 'border-emerald-accent/40 bg-emerald-accent/10 text-emerald-accent'
														: 'border-navy/10 text-navy/50 hover:border-navy/20'}"
												>
													<input
														type="radio"
														name={rq.field}
														value={opt.value}
														class="sr-only"
														checked={fysRetirementBeneficiary === opt.value}
														disabled={fysSubmitting}
														onchange={() => {
															fysRetirementBeneficiary = opt.value;
															void tryAutoSubmitFys('retirement_beneficiary');
														}}
														required
													/>
													{opt.label}
												</label>
											{/each}
										</div>
									</fieldset>
								{/if}

							</form>

							{#if data.findYourStuff.completed}
								<div class="mt-6 pt-5 border-t border-navy/[0.06]">
									<p class="text-[11px] tracking-wider uppercase text-navy/35 font-medium mb-3">
										How categories map
									</p>
									<div class="space-y-3 md:hidden">
										{#each data.categoryTranslation as row}
											<div class="rounded-xl border border-navy/8 p-3.5">
												<p class="text-[12px] text-navy/40 mb-1">{row.recognizes}</p>
												<p class="text-sm font-medium text-navy mb-1">{row.category}</p>
												<p class="text-[12px] text-navy/55 leading-relaxed mb-1">{row.whatToDo}</p>
												<p class="text-[11px] text-navy/40 italic leading-relaxed">{row.warning}</p>
											</div>
										{/each}
									</div>
									<div class="hidden md:block overflow-x-auto">
										<table class="w-full text-left text-[12px]">
											<thead>
												<tr class="text-navy/35 border-b border-navy/8">
													<th class="py-2 pr-3 font-medium">You recognize</th>
													<th class="py-2 pr-3 font-medium">Category</th>
													<th class="py-2 pr-3 font-medium">What to do</th>
													<th class="py-2 font-medium">Key warning</th>
												</tr>
											</thead>
											<tbody>
												{#each data.categoryTranslation as row}
													<tr class="border-b border-navy/[0.04] align-top">
														<td class="py-2.5 pr-3 text-navy/50">{row.recognizes}</td>
														<td class="py-2.5 pr-3 text-navy font-medium">{row.category}</td>
														<td class="py-2.5 pr-3 text-navy/55">{row.whatToDo}</td>
														<td class="py-2.5 text-navy/40">{row.warning}</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Modules -->
				{#each data.modules as mod}
					{@const ms = milestonesForModule(mod.id)}
					{@const locked = mod.progress.status === 'locked'}
					{#if ms.length > 0 || locked}
						<section
							id="module-{mod.id}"
							class="rounded-2xl border overflow-hidden transition-all duration-500
							{locked
								? 'border-navy/8 bg-navy/[0.02] opacity-90'
								: mod.progress.status === 'complete'
									? 'border-navy/[0.06] bg-white/80'
									: 'border-navy/[0.06] bg-white/80'}
							{recentlyCompletedModule === mod.id ? 'border-emerald-accent/25' : ''}"
						>
							<button
								type="button"
								class="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer"
								onclick={() => (expandedModules[mod.id] = !expandedModules[mod.id])}
							>
								<div
									class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
									{mod.progress.status === 'complete'
										? 'bg-emerald-accent/15 text-emerald-accent'
										: locked
											? 'bg-navy/5 text-navy/30'
											: 'bg-navy/5 text-navy/50'}"
								>
									{#if mod.progress.status === 'complete'}
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
											><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg
										>
									{:else if locked}
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											/></svg
										>
									{:else}
										<span class="text-[11px] font-semibold">{mod.shortLabel.slice(0, 1)}</span>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 flex-wrap">
										<p class="text-[11px] tracking-wider uppercase text-navy/35 font-medium">
											{mod.phase === 'prepare' ? 'Prepare' : 'Complete'}
										</p>
										{#if locked}
											<span class="text-[10px] text-navy/35">Locked</span>
										{/if}
									</div>
									<h2 class="text-base font-semibold text-navy truncate">{mod.title}</h2>
									{#if mod.progress.status === 'complete'}
										<p class="text-[11px] text-navy/40 mt-0.5">Complete</p>
									{/if}
									{#if !locked && mod.progress.total > 0}
										<div class="mt-2 flex items-center gap-2">
											<div class="flex-1 h-1 rounded-full bg-navy/[0.06] overflow-hidden max-w-[140px]">
												<div
													class="h-full rounded-full bg-emerald-accent transition-all duration-500"
													style="width: {mod.progress.pct}%"
												></div>
											</div>
											<span class="text-[11px] tabular-nums text-navy/40"
												>{mod.progress.done}/{mod.progress.total}</span
											>
										</div>
									{/if}
								</div>
								<svg
									class="w-4 h-4 text-navy/25 shrink-0 transition-transform {expandedModules[mod.id]
										? 'rotate-180'
										: ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{#if locked && expandedModules[mod.id]}
								<div class="px-5 pb-5 border-t border-navy/[0.05] pt-4">
									<p class="text-sm text-navy/55 leading-relaxed">{data.copy.completeLockedExplainer}</p>
									<ul class="mt-3 space-y-1.5">
										{#each ms as m}
											<li class="text-[13px] text-navy/40 flex items-center gap-2">
												<span class="w-1 h-1 rounded-full bg-navy/20"></span>
												{m.title}
											</li>
										{/each}
									</ul>
								</div>
							{:else if expandedModules[mod.id]}
								<div class="border-t border-navy/[0.05] divide-y divide-navy/[0.05]">
									{#each ms as m}
										<article
											id="milestone-{m.key}"
											class="px-5 py-5 {nextKey === m.key ? 'bg-emerald-accent/[0.03]' : ''} {m.status === 'locked' ? 'opacity-60' : ''}"
										>
											<div class="flex items-start justify-between gap-3 mb-2">
												<h3 class="text-[15px] font-semibold text-navy leading-snug">{m.title}</h3>
												<span
													class="shrink-0 text-[10px] px-2 py-0.5 rounded-full border {statusClass(m.status)}"
													>{statusLabel(m.status)}</span
												>
											</div>
											<p class="text-[13px] text-navy/55 leading-relaxed mb-3">{m.body}</p>
											{#if m.willSigning}
												<div class="mb-3 rounded-lg border border-navy/10 bg-white/70 px-3.5 py-3" data-testid="will-signing-instructions">
													<p class="text-[12.5px] text-navy/70 leading-relaxed">{m.willSigning.wrapper}</p>
													{#if m.willSigning.heading}
														<p class="text-[13px] font-semibold text-navy mt-3 mb-2">{m.willSigning.heading}</p>
														<ol class="space-y-1.5">
															{#each m.willSigning.steps as step, i}
																<li class="flex gap-2.5 text-[12.5px] text-navy/65 leading-relaxed"><span class="shrink-0 tabular-nums text-navy/40">{i + 1}.</span><span>{step}</span></li>
															{/each}
														</ol>
													{/if}
												</div>
											{/if}
											{#if m.warning}
												{@render infoCallout(m.warning)}
											{/if}
											{#if m.riskNote}
												<div class="mb-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
													<p class="text-[11px] uppercase tracking-wider font-semibold text-amber-800/80 mb-1">
														Based on your answers
													</p>
													<p class="text-[12px] text-amber-900/75 leading-relaxed">{m.riskNote}</p>
												</div>
											{/if}
											{#if m.scheduleAWarning}
												<div class="mb-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
													<p class="text-[12px] text-amber-900/75 leading-relaxed">
														{data.copy.scheduleAWarning}
													</p>
												</div>
											{/if}
											{#if m.videoUrl}
												<div class="mb-4">
													<VideoPlayer src={m.videoUrl} title={m.title} />
												</div>
											{/if}

											{#if m.key === 'prepare_sign_trust' && data.trustStatus !== 'completed'}
												<a
													href={data.notarizationLinkUrl ?? notarizationBookingUrl}
													target="_blank"
													rel="noopener noreferrer"
													class="inline-flex mb-4 px-4 py-2.5 rounded-xl bg-navy text-cream text-sm font-medium hover:bg-navy-light transition-colors"
												>
													Schedule notarization
												</a>
											{/if}

											{#if m.key === 'webinar' && (data.copy.webinarRegistrationUrl || data.copy.webinarReplayUrl)}
												<div class="flex flex-wrap gap-2 mb-4">
													{#if data.copy.webinarRegistrationUrl}
														<a
															href={data.copy.webinarRegistrationUrl}
															target="_blank"
															rel="noopener noreferrer"
															class="px-4 py-2 rounded-xl border border-navy/10 text-sm text-navy hover:border-emerald-accent/30"
															>Register</a
														>
													{/if}
													{#if data.copy.webinarReplayUrl}
														<a
															href={data.copy.webinarReplayUrl}
															target="_blank"
															rel="noopener noreferrer"
															class="px-4 py-2 rounded-xl border border-navy/10 text-sm text-navy hover:border-emerald-accent/30"
															>Watch replay</a
														>
													{/if}
												</div>
											{/if}

											{#if m.showAssetReference}
												{@const expanded = showAllAssets[m.key] === true}
												{@const shown = expanded ? data.listedAssets : m.matchedAssets}
												<div class="mb-4 rounded-xl border border-navy/8 bg-navy/[0.015] px-3.5 py-3">
													<p
														class="text-[11px] uppercase tracking-wider font-semibold text-navy/45 mb-1.5"
													>
														{data.copy.assetReferenceTitle}
													</p>
													<p class="text-[12px] text-navy/50 leading-relaxed">
														{m.matchedAssets.length
															? data.copy.assetReferenceMatchHint
															: data.copy.assetReferenceNoMatchHint}
													</p>
													{#if shown.length}
														<ul class="mt-2.5 space-y-1.5">
															{#each shown as asset (asset.name + (asset.accountId ?? ''))}
																<li class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px]">
																	<span class="font-medium text-navy/80">{asset.name}</span>
																	{#if asset.accountId}
																		<span class="text-[11px] text-navy/40">acct {asset.accountId}</span>
																	{/if}
																	{#if data.showAssetOwners && asset.owner}
																		<span
																			class="text-[10px] px-1.5 py-0.5 rounded-full bg-navy/[0.06] text-navy/45"
																			>{asset.owner}</span
																		>
																	{/if}
																</li>
															{/each}
														</ul>
													{/if}
													{#if data.listedAssets.length > m.matchedAssets.length}
														<button
															type="button"
															onclick={() => (showAllAssets[m.key] = !expanded)}
															class="mt-2.5 text-[11px] font-medium text-emerald-accent hover:underline"
														>
															{expanded
																? data.copy.assetReferenceHideAll
																: data.copy.assetReferenceShowAll}
														</button>
													{/if}
												</div>
											{/if}

											<ul class="space-y-1">
												{#each m.checklist as item (item.id)}
													{@const checked = isChecked(m.key, item.id)}
													{@const itemPending = pendingItem === `${m.key}:${item.id}`}
													<li>
														<form
															method="POST"
															action="?/toggleChecklist"
															use:enhance={() => {
																const previous = checked;
																const nextChecked = !previous;
																setCheckedLocal(m.key, item.id, nextChecked);
																pendingItem = `${m.key}:${item.id}`;
																return async ({ result, update }) => {
																	if (result.type === 'success') {
																		// Keep local overlay; only refresh progress/status from the server.
																		await update({ reset: false });
																	} else {
																		setCheckedLocal(m.key, item.id, previous);
																		await update({ reset: false });
																	}
																	pendingItem = null;
																};
															}}
														>
															<input type="hidden" name="milestoneKey" value={m.key} />
															<input type="hidden" name="itemId" value={item.id} />
															<input type="hidden" name="checked" value={checked ? 'false' : 'true'} />
															<button
																type="submit"
																disabled={m.status === 'locked' || m.status === 'not_applicable' || itemPending}
																class="w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer
																{checked ? 'bg-emerald-accent/5' : 'hover:bg-navy/[0.03]'}
																disabled:opacity-50 disabled:cursor-not-allowed"
															>
																<span
																	class="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors
																	{checked
																		? 'bg-emerald-accent border-emerald-accent text-white'
																		: 'border-navy/20 bg-white'}"
																>
																	{#if checked}
																		<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
																			><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg
																		>
																	{/if}
																</span>
																<span class="text-[13px] text-navy/75 leading-snug">{item.label}</span>
															</button>
														</form>
													</li>
												{/each}
											</ul>

											<div class="mt-3 flex flex-wrap gap-2">
												{#if m.allowNa && m.status !== 'not_applicable' && m.status !== 'locked'}
													<form
														method="POST"
														action="?/setMilestoneNa"
														use:enhance={() => {
															return async ({ update }) => {
																await update({ reset: false });
															};
														}}
													>
														<input type="hidden" name="milestoneKey" value={m.key} />
														<button
															type="submit"
															class="text-[12px] text-navy/40 hover:text-navy/70 underline underline-offset-2 cursor-pointer"
															>Mark not applicable</button
														>
													</form>
												{/if}
												{#if m.showConsult}
													<form
														method="POST"
														action="?/ackConsult"
														use:enhance={() => {
															return async ({ result }) => {
																if (result.type === 'success') {
																	window.open(data.copy.bookingUrl, '_blank', 'noopener,noreferrer');
																}
															};
														}}
													>
														<button
															type="submit"
															class="text-[12px] text-emerald-accent hover:text-emerald-accent/80 font-medium cursor-pointer"
															>Book a consultation</button
														>
													</form>
												{/if}
											</div>
										</article>
									{/each}
								</div>
							{/if}
						</section>
					{/if}
				{/each}
			</div>

			<!-- Right rail -->
			<aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
				<a
					href="/dashboard"
					class="flex items-center gap-2 rounded-2xl border border-navy/[0.06] bg-white/80 px-4 py-3 text-[13px] font-medium text-navy/70 hover:text-navy hover:border-navy/12 transition-colors"
				>
					<svg class="w-4 h-4 shrink-0 text-navy/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
					Trust dashboard
				</a>
				<div class="rounded-2xl bg-white/80 border border-navy/[0.06] p-4">
					<p class="text-[11px] tracking-wider uppercase text-navy/35 font-medium mb-3">Journey modules</p>
					<nav class="space-y-1">
						{#each data.modules as mod}
							<button
								type="button"
								onclick={() => scrollToModule(mod.id)}
								class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-navy/[0.03] transition-colors cursor-pointer"
							>
								<span
									class="w-2 h-2 rounded-full shrink-0
									{mod.progress.status === 'complete'
										? 'bg-emerald-accent'
										: mod.progress.status === 'locked'
											? 'bg-navy/15'
											: mod.progress.status === 'in_progress'
												? 'bg-emerald-accent/50'
												: 'bg-navy/25'}"
								></span>
								<span class="flex-1 text-[13px] text-navy/70 truncate">{mod.title}</span>
								{#if mod.progress.status === 'locked'}
									<svg class="w-3 h-3 text-navy/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
										/></svg
									>
								{:else if mod.progress.total > 0}
									<span class="text-[10px] tabular-nums text-navy/35">{mod.progress.pct}%</span>
								{/if}
							</button>
						{/each}
					</nav>
				</div>

				{#if data.findYourStuff.completed}
					<div class="rounded-2xl bg-white/80 border border-navy/[0.06] p-4">
						<p class="text-[11px] tracking-wider uppercase text-navy/35 font-medium mb-2">Your stuff</p>
						<ul class="space-y-1.5 text-[13px] text-navy/60">
							{#each data.findYourStuffQuestions as q}
								{#if data.findYourStuff.answers[q.field] === 'yes' || data.findYourStuff.answers[q.field] === 'not_sure'}
									<li class="flex items-start gap-2">
										<span class="w-1 h-1 mt-1.5 rounded-full bg-emerald-accent shrink-0"></span>
										<span class="leading-snug">{q.question.replace(/\?$/, '')}</span>
									</li>
								{/if}
							{/each}
						</ul>
						<button
							type="button"
							onclick={() => {
								findYourStuffOpen = true;
								document.getElementById('milestone-find_your_stuff')?.scrollIntoView({ behavior: 'smooth' });
							}}
							class="mt-3 text-[12px] text-emerald-accent font-medium cursor-pointer hover:underline"
							>Edit answers</button
						>
					</div>
				{/if}

				<div class="rounded-2xl bg-white/80 border border-navy/[0.06] p-4">
					<p class="text-[11px] tracking-wider uppercase text-navy/35 font-medium mb-2">Notarization</p>
					<p class="text-[13px] text-navy/55 leading-relaxed mb-3">
						{#if data.trustStatus === 'completed'}
							Complete — your trust is signed.
						{:else if data.trustStatus === 'notarization-scheduled'}
							Appointment scheduled. Keep preparing your funding checklist.
						{:else}
							Schedule signing so Complete Your Funding can unlock.
						{/if}
					</p>
					{#if data.trustStatus !== 'completed'}
						<a
							href={data.notarizationLinkUrl ?? notarizationBookingUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex text-sm text-emerald-accent font-medium hover:underline"
							>Open scheduling</a
						>
					{/if}
				</div>
			</aside>
		</div>
	</div>

	<!-- Sticky next-step bar (mobile / tablet) -->
	{#if showStickyContinue && data.nextUp}
		<div
			class="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-navy/[0.08] bg-cream/95 backdrop-blur-sm"
			style="padding-bottom: env(safe-area-inset-bottom);"
		>
			<div class="flex items-center gap-3 px-5 py-3">
				<div class="min-w-0 flex-1">
					<p class="text-[10px] tracking-wider uppercase text-emerald-accent font-semibold">Next up</p>
					<p class="text-[13px] text-navy font-medium truncate">{data.nextUp.milestoneTitle}</p>
				</div>
				<button
					type="button"
					onclick={() => scrollToMilestone(data.nextUp!.milestoneKey)}
					class="shrink-0 px-5 py-3 rounded-xl bg-navy text-cream text-sm font-medium hover:bg-navy-light transition-colors cursor-pointer active:scale-[0.98]"
				>
					Continue
				</button>
			</div>
		</div>
	{/if}

	<HelpLauncher
		surface="funding"
		stepKey={data.nextUp?.milestoneKey ?? null}
		trustId={data.trustId}
		blockedStepKeys={data.helpBlockedSteps}
	/>
</div>
