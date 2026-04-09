<script lang="ts">
	import type { MinorDistributionResponse, QuestionResponseValue } from '$lib/config';
	import InfoPopout from './InfoPopout.svelte';

	const MAX_AGE = 30;
	const MIN_AGE = 18;

	let {
		value,
		onresponse,
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
	} = $props();

	function parse(v: QuestionResponseValue): MinorDistributionResponse | null {
		if (v == null || typeof v !== 'object' || Array.isArray(v)) return null;
		if (!('mode' in v)) return null;
		const m = (v as { mode: string }).mode;
		if (m === 'staggered') {
			const o = v as MinorDistributionResponse & { mode: 'staggered' };
			if (
				typeof o.firstPercent === 'number' &&
				typeof o.firstAge === 'number' &&
				typeof o.secondPercent === 'number' &&
				typeof o.secondAge === 'number' &&
				typeof o.remainderAge === 'number'
			) {
				return o;
			}
		}
		if (m === 'single-age' && typeof (v as { age: number }).age === 'number') {
			return v as MinorDistributionResponse;
		}
		if (m === 'age-of-majority') {
			return { mode: 'age-of-majority' };
		}
		return null;
	}

	let parsed = $derived(parse(value));

	let staggerPopout = $state(false);
	let singlePopout = $state(false);
	let majorityPopout = $state(false);

	function clampAge(n: number): number {
		return Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(n)));
	}

	function clampPercent(n: number): number {
		return Math.min(99, Math.max(0, Math.round(n)));
	}

	function emitStaggered(partial: Partial<Extract<MinorDistributionResponse, { mode: 'staggered' }>>) {
		const cur = parsed?.mode === 'staggered' ? parsed : null;
		onresponse({
			mode: 'staggered',
			firstPercent: partial.firstPercent ?? cur?.firstPercent ?? 0,
			firstAge: partial.firstAge ?? cur?.firstAge ?? MIN_AGE,
			secondPercent: partial.secondPercent ?? cur?.secondPercent ?? 0,
			secondAge: partial.secondAge ?? cur?.secondAge ?? MIN_AGE,
			remainderAge: partial.remainderAge ?? cur?.remainderAge ?? MAX_AGE,
		});
	}

	function emitSingleAge(age: number) {
		onresponse({ mode: 'single-age', age: clampAge(age) });
	}

	function emitMajority() {
		onresponse({ mode: 'age-of-majority' });
	}

	let remainderPercent = $derived.by(() => {
		if (parsed?.mode !== 'staggered') return 100;
		const r = 100 - parsed.firstPercent - parsed.secondPercent;
		return Math.max(0, r);
	});
</script>

<div class="space-y-6">
	<!-- Option 1 — Staggered -->
	<div
		class="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200
			{parsed?.mode === 'staggered'
				? 'border-navy bg-white shadow-sm'
				: 'border-navy/8 bg-white/60 hover:border-navy/20'}"
	>
		<button
			type="button"
			onclick={() => emitStaggered({})}
			class="w-full text-left cursor-pointer"
		>
			<div class="flex items-start gap-4">
				<div
					class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
						{parsed?.mode === 'staggered' ? 'border-navy' : 'border-navy/25'}"
				>
					{#if parsed?.mode === 'staggered'}
						<div class="w-2.5 h-2.5 rounded-full bg-navy"></div>
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-sm font-semibold text-navy mb-1">Staggered distribution</div>
					<p class="text-[13px] text-navy/55 leading-relaxed">
						My children will receive their inheritance in portions at different ages.
					</p>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<span
						role="button"
						tabindex="0"
						onclick={(e) => {
							e.stopPropagation();
							staggerPopout = true;
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								e.stopPropagation();
								staggerPopout = true;
							}
						}}
						class="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-navy/50 hover:text-navy/70 cursor-pointer underline decoration-navy/20"
					>
						What is staggered distribution?
					</span>
				</div>
			</div>
		</button>

		{#if parsed?.mode === 'staggered'}
			<div class="mt-5 pt-5 border-t border-navy/10 space-y-4 pl-9">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="md-p1" class="block text-[11px] font-medium text-navy/45 uppercase tracking-wider mb-1.5">First portion (%)</label>
						<input
							id="md-p1"
							type="number"
							min="1"
							max="98"
							value={parsed.firstPercent || ''}
							oninput={(e) => {
								const n = parseInt(e.currentTarget.value, 10);
								emitStaggered({ firstPercent: Number.isFinite(n) ? clampPercent(n) : 0 });
							}}
							class="w-full px-3 py-2 rounded-xl border border-navy/12 text-sm text-navy bg-white"
						/>
					</div>
					<div>
						<label for="md-a1" class="block text-[11px] font-medium text-navy/45 uppercase tracking-wider mb-1.5">At age (max {MAX_AGE})</label>
						<input
							id="md-a1"
							type="number"
							min={MIN_AGE}
							max={MAX_AGE}
							value={parsed.firstAge || ''}
							oninput={(e) => {
								const n = parseInt(e.currentTarget.value, 10);
								emitStaggered({ firstAge: Number.isFinite(n) ? clampAge(n) : MIN_AGE });
							}}
							class="w-full px-3 py-2 rounded-xl border border-navy/12 text-sm text-navy bg-white"
						/>
					</div>
					<div>
						<label for="md-p2" class="block text-[11px] font-medium text-navy/45 uppercase tracking-wider mb-1.5">Second portion (%)</label>
						<input
							id="md-p2"
							type="number"
							min="1"
							max="98"
							value={parsed.secondPercent || ''}
							oninput={(e) => {
								const n = parseInt(e.currentTarget.value, 10);
								emitStaggered({ secondPercent: Number.isFinite(n) ? clampPercent(n) : 0 });
							}}
							class="w-full px-3 py-2 rounded-xl border border-navy/12 text-sm text-navy bg-white"
						/>
					</div>
					<div>
						<label for="md-a2" class="block text-[11px] font-medium text-navy/45 uppercase tracking-wider mb-1.5">At age (max {MAX_AGE})</label>
						<input
							id="md-a2"
							type="number"
							min={MIN_AGE}
							max={MAX_AGE}
							value={parsed.secondAge || ''}
							oninput={(e) => {
								const n = parseInt(e.currentTarget.value, 10);
								emitStaggered({ secondAge: Number.isFinite(n) ? clampAge(n) : MIN_AGE });
							}}
							class="w-full px-3 py-2 rounded-xl border border-navy/12 text-sm text-navy bg-white"
						/>
					</div>
				</div>
				<div class="rounded-xl bg-navy/4 border border-navy/8 p-4 space-y-2">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<span class="text-[13px] font-medium text-navy/75">Remaining balance</span>
						<span class="text-sm font-semibold text-navy tabular-nums">{remainderPercent}%</span>
					</div>
					<p class="text-[12px] text-navy/50">Automatically calculated as 100% minus the two portions above.</p>
					<div>
						<label for="md-ra" class="block text-[11px] font-medium text-navy/45 uppercase tracking-wider mb-1.5">Paid in full at age (max {MAX_AGE})</label>
						<input
							id="md-ra"
							type="number"
							min={MIN_AGE}
							max={MAX_AGE}
							value={parsed.remainderAge || ''}
							oninput={(e) => {
								const n = parseInt(e.currentTarget.value, 10);
								emitStaggered({ remainderAge: Number.isFinite(n) ? clampAge(n) : MAX_AGE });
							}}
							class="w-full max-w-[140px] px-3 py-2 rounded-xl border border-navy/12 text-sm text-navy bg-white"
						/>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Option 2 — Single age (recommended / default visual) -->
	<button
		type="button"
		onclick={() => {
			const cur = parsed?.mode === 'single-age' ? parsed.age : 25;
			emitSingleAge(cur);
		}}
		class="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer relative overflow-hidden
			{parsed?.mode === 'single-age'
				? 'border-emerald-accent bg-white shadow-md shadow-emerald-accent/10'
				: 'border-emerald-accent/30 bg-emerald-accent/2 hover:border-emerald-accent/60'}"
	>
		<div class="absolute top-3.5 right-4">
			<span class="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-accent/10 text-emerald-accent">
				Most common
			</span>
		</div>
		<div class="flex items-start gap-4 pr-36">
			<div
				class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
					{parsed?.mode === 'single-age' ? 'border-emerald-accent' : 'border-navy/25'}"
			>
				{#if parsed?.mode === 'single-age'}
					<div class="w-2.5 h-2.5 rounded-full bg-emerald-accent"></div>
				{/if}
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-semibold text-navy mb-1">Single age</div>
				<p class="text-[13px] text-navy/55 leading-relaxed">
					My children will receive their full inheritance at one age (not exceeding {MAX_AGE}).
				</p>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<span
					role="button"
					tabindex="0"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						singlePopout = true;
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							e.stopPropagation();
							singlePopout = true;
						}
					}}
					class="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-navy/50 hover:text-navy/70 cursor-pointer underline decoration-navy/20"
				>
					Why choose a single age?
				</span>
			</div>
		</div>
		{#if parsed?.mode === 'single-age'}
			<div class="mt-5 pt-5 border-t border-emerald-accent/15 pl-9 space-y-2">
				<label for="md-single-age" class="block text-[11px] font-medium text-navy/45 uppercase tracking-wider">Age (max {MAX_AGE})</label>
				<input
					id="md-single-age"
					type="number"
					min={MIN_AGE}
					max={MAX_AGE}
					value={parsed.age}
					oninput={(e) => {
						const n = parseInt(e.currentTarget.value, 10);
						if (Number.isFinite(n)) emitSingleAge(n);
					}}
					class="w-full max-w-[160px] px-3 py-2 rounded-xl border border-navy/12 text-sm text-navy bg-white"
				/>
			</div>
		{/if}
	</button>

	<!-- Option 3 — Age of majority (template third option; distinct clause for drafting) -->
	<button
		type="button"
		onclick={emitMajority}
		class="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer
			{parsed?.mode === 'age-of-majority'
				? 'border-navy bg-white shadow-sm'
				: 'border-navy/8 bg-white/60 hover:border-navy/20'}"
	>
		<div class="flex items-start gap-4">
			<div
				class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
					{parsed?.mode === 'age-of-majority' ? 'border-navy' : 'border-navy/25'}"
			>
				{#if parsed?.mode === 'age-of-majority'}
					<div class="w-2.5 h-2.5 rounded-full bg-navy"></div>
				{/if}
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-semibold text-navy mb-1">Age of majority (18)</div>
				<p class="text-[13px] text-navy/55 leading-relaxed">
					My children will receive their full inheritance when they reach age 18, the age of majority in Texas.
				</p>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<span
					role="button"
					tabindex="0"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						majorityPopout = true;
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							e.stopPropagation();
							majorityPopout = true;
						}
					}}
					class="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-navy/50 hover:text-navy/70 cursor-pointer underline decoration-navy/20"
				>
					When is this appropriate?
				</span>
			</div>
		</div>
	</button>
</div>

<InfoPopout open={staggerPopout} onclose={() => (staggerPopout = false)} title="Staggered distribution">
	<p>
		A staggered plan pays out part of a child's share at one age, more at another, and the rest at a final age. It can help younger beneficiaries mature before receiving larger amounts. Your trust will include only the ages and percentages you elect.
	</p>
</InfoPopout>

<InfoPopout open={singlePopout} onclose={() => (singlePopout = false)} title="Single-age distribution">
	<p>
		Many families choose one age (often in the early or mid-twenties) for each child to receive their full share outright. It is simple to administer and easy for your trustee to follow.
	</p>
</InfoPopout>

<InfoPopout open={majorityPopout} onclose={() => (majorityPopout = false)} title="Age of majority">
	<p>
		Age 18 is when a person is legally an adult in Texas. Some families prefer distribution at this age so there is no long hold in trust. If you prefer a later age, use the single-age option above (up to {MAX_AGE}).
	</p>
</InfoPopout>
