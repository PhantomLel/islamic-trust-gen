<script lang="ts">
	import { buckets, type Question, type QuestionResponseValue } from '$lib/config';
	import { isQuestionResponseAnswered } from '$lib/question-response-helpers';

	let { currentIndex, responses, activeQuestions, onnavigate }: {
		currentIndex: number;
		responses: Record<string, QuestionResponseValue>;
		activeQuestions: Question[];
		onnavigate: (index: number) => void;
	} = $props();

	let bucketOrder = $derived([...new Set(activeQuestions.map((q) => q.bucket))]);

	let bucketProgress = $derived(
		Object.fromEntries(
			bucketOrder.map((b) => {
				const total = activeQuestions.filter((q) => q.bucket === b).length;
				const done = activeQuestions.filter((q) => q.bucket === b && isQuestionResponseAnswered(responses[q.id])).length;
				return [b, { total, done }];
			})
		)
	);

	let overallProgress = $derived(
		Math.round((activeQuestions.filter((q) => isQuestionResponseAnswered(responses[q.id])).length / activeQuestions.length) * 100)
	);
</script>

<aside class="hidden md:flex flex-col w-64 shrink-0 border-r border-navy/[0.06] bg-white/40 backdrop-blur-sm">
	<!-- progress header -->
	<div class="px-6 pt-6 pb-4">
		<div class="text-[11px] text-navy/40 tracking-wider uppercase font-medium mb-3">Progress</div>
		<div class="w-full h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
			<div class="h-full rounded-full bg-emerald-accent transition-all duration-500 ease-out" style="width: {overallProgress}%"></div>
		</div>
		<div class="text-[11px] text-navy/35 mt-1.5">{overallProgress}% complete</div>
	</div>

	<div class="h-px bg-navy/[0.06] mx-4"></div>

	<!-- bucket navigation -->
	<nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1">
		{#each bucketOrder as bucket}
			{@const meta = buckets[bucket] ?? { label: bucket, icon: 'circle' }}
			{@const progress = bucketProgress[bucket]}
			{@const bqs = activeQuestions.filter((q) => q.bucket === bucket)}
			{@const firstIdx = activeQuestions.indexOf(bqs[0])}
			{@const lastIdx = activeQuestions.indexOf(bqs[bqs.length - 1])}
			{@const active = currentIndex >= firstIdx && currentIndex <= lastIdx}

			<div>
				<button
					onclick={() => onnavigate(firstIdx)}
					class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer
						   {active ? 'bg-emerald-accent/8 text-navy' : 'text-navy/50 hover:bg-navy/[0.03] hover:text-navy/70'}"
				>
					<div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 {active ? 'bg-emerald-accent/15' : 'bg-navy/[0.05]'}">
						{#if meta.icon === 'user'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
							</svg>
						{:else if meta.icon === 'users'}
							<svg class="w-3.5 h-3.5 {active ? 'text-emerald-accent' : 'text-navy/35'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
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

				{#if active}
					<div class="ml-6 mt-1 mb-2 flex flex-col gap-0.5">
						{#each bqs as q, qi}
							{@const gi = firstIdx + qi}
							{@const answered = isQuestionResponseAnswered(responses[q.id])}
							<button
								onclick={() => onnavigate(gi)}
								class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all cursor-pointer
									   {gi === currentIndex ? 'text-navy' : 'text-navy/40 hover:text-navy/60'}"
							>
								<span class="w-1.5 h-1.5 rounded-full shrink-0 {answered ? 'bg-emerald-accent' : gi === currentIndex ? 'bg-navy/40' : 'bg-navy/15'}"></span>
								<span class="text-[12px] truncate">{q.text}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</nav>
</aside>
