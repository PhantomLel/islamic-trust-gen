<script lang="ts">
	import { buckets, type Question, type QuestionResponseValue } from '$lib/config';
	import { isQuestionResponseAnswered } from '$lib/question-response-helpers';

	let {
		currentIndex,
		responses,
		activeQuestions,
		preQuestions,
		postQuestions,
		hasPaidInvoice,
		onnavigate,
	}: {
		currentIndex: number;
		responses: Record<string, QuestionResponseValue>;
		activeQuestions: Question[];
		preQuestions: Question[];
		postQuestions: Question[];
		hasPaidInvoice: boolean;
		onnavigate: (questionId: string) => void;
	} = $props();

	let currentId = $derived(activeQuestions[currentIndex]?.id ?? null);

	let preBuckets = $derived([...new Set(preQuestions.map((q) => q.bucket))]);
	let postBuckets = $derived([...new Set(postQuestions.map((q) => q.bucket))]);

	let allSidebarQuestions = $derived([...preQuestions, ...postQuestions]);

	function firstNavigableIndexInBucket(bucketQs: Question[]): number {
		for (const q of bucketQs) {
			const idx = activeQuestions.findIndex((aq) => aq.id === q.id);
			if (idx >= 0) return idx;
		}
		return -1;
	}

	function tryNavigate(questionId: string, sectionLocked: boolean) {
		if (sectionLocked) return;
		const idx = activeQuestions.findIndex((aq) => aq.id === questionId);
		if (idx >= 0) onnavigate(questionId);
	}

	function tryNavigateBucket(bucketQs: Question[], sectionLocked: boolean) {
		if (sectionLocked) return;
		const idx = firstNavigableIndexInBucket(bucketQs);
		if (idx >= 0) onnavigate(activeQuestions[idx].id);
	}

	/** After payment the main flow is post-only; pre items stay visible but are not navigable. */
	let preSectionLocked = $derived(hasPaidInvoice);
	let postSectionLocked = $derived(!hasPaidInvoice);

	let overallProgress = $derived(
		allSidebarQuestions.length === 0
			? 0
			: Math.round(
					(allSidebarQuestions.filter((q) => isQuestionResponseAnswered(responses[q.id])).length /
						allSidebarQuestions.length) *
						100
				)
	);

	function bucketProgress(bucket: string, questions: Question[]) {
		const qs = questions.filter((q) => q.bucket === bucket);
		const done = qs.filter((q) => isQuestionResponseAnswered(responses[q.id])).length;
		return { total: qs.length, done };
	}

	function isBucketActive(bucketQs: Question[]): boolean {
		return bucketQs.some((q) => q.id === currentId);
	}
</script>

<aside class="hidden md:flex flex-col w-64 shrink-0 border-r border-navy/[0.06] bg-white/40 backdrop-blur-sm">
	<div class="px-6 pt-6 pb-4">
		<div class="text-[11px] text-navy/40 tracking-wider uppercase font-medium mb-3">Progress</div>
		<div class="w-full h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
			<div
				class="h-full rounded-full bg-emerald-accent transition-all duration-500 ease-out"
				style="width: {overallProgress}%"
			></div>
		</div>
		<div class="text-[11px] text-navy/35 mt-1.5">{overallProgress}% complete</div>
	</div>

	<div class="h-px bg-navy/[0.06] mx-4"></div>

	<nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1">
		{#each preBuckets as bucket}
			{@const meta = buckets[bucket] ?? { label: bucket, icon: 'circle' }}
			{@const progress = bucketProgress(bucket, preQuestions)}
			{@const bqs = preQuestions.filter((q) => q.bucket === bucket)}
			{@const active = isBucketActive(bqs)}
			{@const locked = preSectionLocked}

			<div class={locked ? 'opacity-55' : ''}>
				<button
					type="button"
					disabled={locked || firstNavigableIndexInBucket(bqs) < 0}
					onclick={() => tryNavigateBucket(bqs, locked)}
					class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
						   {locked || firstNavigableIndexInBucket(bqs) < 0
						? 'cursor-not-allowed text-navy/35'
						: 'cursor-pointer ' +
							(active ? 'bg-emerald-accent/8 text-navy' : 'text-navy/50 hover:bg-navy/[0.03] hover:text-navy/70')}"
				>
					<div
						class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 {active
							? 'bg-emerald-accent/15'
							: 'bg-navy/[0.05]'}"
					>
						{#if meta.icon === 'user'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
							</svg>
						{:else if meta.icon === 'users'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
							</svg>
						{:else if meta.icon === 'home'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
							</svg>
						{:else if meta.icon === 'scroll'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
							</svg>
						{:else}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<circle cx="12" cy="12" r="8" />
							</svg>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-[13px] font-medium truncate">{meta.label}</div>
						<div class="text-[11px] {active ? 'text-emerald-accent/70' : 'text-navy/30'}">{progress.done}/{progress.total}</div>
					</div>
					{#if progress.done === progress.total}
						<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					{/if}
				</button>

				<div class="ml-6 mt-1 mb-2 flex flex-col gap-0.5">
					{#each bqs as q}
						{@const inFlow = activeQuestions.some((aq) => aq.id === q.id)}
						{@const answered = isQuestionResponseAnswered(responses[q.id])}
						{@const isCurrent = q.id === currentId}
						<button
							type="button"
							disabled={locked || !inFlow}
							onclick={() => tryNavigate(q.id, locked)}
							class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all
								   {locked || !inFlow
								? 'cursor-not-allowed text-navy/30'
								: 'cursor-pointer ' +
									(isCurrent ? 'text-navy' : 'text-navy/40 hover:text-navy/60')}"
						>
							<span
								class="w-1.5 h-1.5 rounded-full shrink-0 {answered
									? 'bg-emerald-accent'
									: isCurrent
										? 'bg-navy/40'
										: 'bg-navy/15'}"
							></span>
							<span class="text-[12px] truncate">{q.text}</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}

		<div class="flex items-center gap-2 py-4 px-1" role="separator" aria-hidden="true">
			<div class="flex-1 h-px bg-navy/[0.1]"></div>
			<span class="text-[10px] tracking-[0.2em] uppercase font-medium text-navy/35 shrink-0">Payment</span>
			<div class="flex-1 h-px bg-navy/[0.1]"></div>
		</div>

		{#each postBuckets as bucket}
			{@const meta = buckets[bucket] ?? { label: bucket, icon: 'circle' }}
			{@const progress = bucketProgress(bucket, postQuestions)}
			{@const bqs = postQuestions.filter((q) => q.bucket === bucket)}
			{@const active = isBucketActive(bqs)}
			{@const locked = postSectionLocked}

			<div class={locked ? 'opacity-50' : ''}>
				<button
					type="button"
					disabled={locked || firstNavigableIndexInBucket(bqs) < 0}
					onclick={() => tryNavigateBucket(bqs, locked)}
					class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
						   {locked || firstNavigableIndexInBucket(bqs) < 0
						? 'cursor-not-allowed text-navy/35'
						: 'cursor-pointer ' +
							(active ? 'bg-emerald-accent/8 text-navy' : 'text-navy/50 hover:bg-navy/[0.03] hover:text-navy/70')}"
				>
					<div
						class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 {active
							? 'bg-emerald-accent/15'
							: 'bg-navy/[0.05]'}"
					>
						{#if meta.icon === 'user'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
							</svg>
						{:else if meta.icon === 'users'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
							</svg>
						{:else if meta.icon === 'home'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
							</svg>
						{:else if meta.icon === 'scroll'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
							</svg>
						{:else}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<circle cx="12" cy="12" r="8" />
							</svg>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-[13px] font-medium truncate">{meta.label}</div>
						<div class="text-[11px] {active ? 'text-emerald-accent/70' : 'text-navy/30'}">{progress.done}/{progress.total}</div>
					</div>
					{#if progress.done === progress.total}
						<svg class="w-4 h-4 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					{/if}
				</button>

				<div class="ml-6 mt-1 mb-2 flex flex-col gap-0.5">
					{#each bqs as q}
						{@const inFlow = activeQuestions.some((aq) => aq.id === q.id)}
						{@const answered = isQuestionResponseAnswered(responses[q.id])}
						{@const isCurrent = q.id === currentId}
						<button
							type="button"
							disabled={locked || !inFlow}
							onclick={() => tryNavigate(q.id, locked)}
							class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all
								   {locked || !inFlow
								? 'cursor-not-allowed text-navy/30'
								: 'cursor-pointer ' +
									(isCurrent ? 'text-navy' : 'text-navy/40 hover:text-navy/60')}"
						>
							<span
								class="w-1.5 h-1.5 rounded-full shrink-0 {answered
									? 'bg-emerald-accent'
									: isCurrent
										? 'bg-navy/40'
										: 'bg-navy/15'}"
							></span>
							<span class="text-[12px] truncate">{q.text}</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</nav>
</aside>
