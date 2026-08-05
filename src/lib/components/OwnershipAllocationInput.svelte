<script lang="ts">
	import type { QuestionResponseValue } from '$lib/config';
	import InfoPopout from './InfoPopout.svelte';

	let {
		value,
		onresponse,
		onnext,
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		onnext: () => void;
	} = $props();

	let selected = $derived(typeof value === 'string' ? value : null);

	let hebaPopout = $state(false);
	let islamicPopout = $state(false);
</script>

<div class="flex w-full min-w-0 flex-col gap-3 sm:gap-4">
<!-- Option 1 — Recommended -->
<button
	type="button"
	onclick={() => { onresponse('heba'); onnext(); }}
	class="w-full min-w-0 text-left rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 cursor-pointer relative overflow-hidden
		{selected === 'heba'
			? 'border-emerald-accent bg-white shadow-md shadow-emerald-accent/10'
			: 'border-emerald-accent/30 bg-emerald-accent/2 hover:border-emerald-accent/60 hover:bg-white'}"
>
	<!-- Mobile: badge in document flow so body text can use full width -->
	<div class="mb-3 md:hidden">
		<span class="inline-block text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-accent/10 text-emerald-accent">
			Recommended for most families
		</span>
	</div>
	<div class="absolute top-3.5 right-4 hidden md:block">
		<span class="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-accent/10 text-emerald-accent">
			Recommended for most families
		</span>
	</div>

	<div class="flex items-start gap-3 sm:gap-4 min-w-0 md:pr-44">
		<div class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
			{selected === 'heba' ? 'border-emerald-accent' : 'border-navy/25'}">
			{#if selected === 'heba'}
				<div class="w-2.5 h-2.5 rounded-full bg-emerald-accent"></div>
			{/if}
		</div>
		<div class="flex-1 min-w-0">
			<div class="text-sm font-semibold text-navy mb-1.5">Heba - 50/50 Mutual Gift</div>
			<p class="text-[13px] text-navy/55 leading-relaxed text-pretty wrap-break-word">
				Each spouse gives the other half of everything earned during the marriage. You each end up owning exactly 50% of all marital property. The Islamic shares are then applied to each spouse's 50%.
			</p>
			<p class="text-[13px] text-navy/55 leading-relaxed mt-1.5 text-pretty wrap-break-word">
				This is the simpler option and works well for the majority of families.
			</p>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				onclick={(e) => { e.stopPropagation(); hebaPopout = true; }}
				class="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-emerald-accent/80 hover:text-emerald-accent cursor-pointer underline decoration-emerald-accent/30 hover:decoration-emerald-accent/60 transition-colors"
			>
				What is a mutual gift?
				<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</span>
		</div>
	</div>
</button>

<!-- Option 2 — Secondary -->
<button
	type="button"
	onclick={() => { onresponse('assets'); onnext(); }}
	class="w-full min-w-0 text-left rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 cursor-pointer
		{selected === 'assets'
			? 'border-navy bg-white shadow-sm'
			: 'border-navy/8 bg-white/60 hover:border-navy/20 hover:bg-white/80'}"
>
	<div class="flex items-start gap-3 sm:gap-4 min-w-0">
		<div class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
			{selected === 'assets' ? 'border-navy' : 'border-navy/25'}">
			{#if selected === 'assets'}
				<div class="w-2.5 h-2.5 rounded-full bg-navy"></div>
			{/if}
		</div>
		<div class="flex-1 min-w-0">
			<div class="text-sm font-semibold text-navy mb-1.5">
				<span class="block sm:inline">Asset by Asset Allocation</span>
				<span class="mt-1 block text-[11px] font-normal text-navy/40 tracking-wide sm:mt-0 sm:ml-2 sm:inline">
					(For families with specific ownership concerns)
				</span>
			</div>
			<p class="text-[13px] text-navy/55 leading-relaxed text-pretty wrap-break-word">
				You list each significant asset and designate which spouse
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<span
					onclick={(e) => { e.stopPropagation(); islamicPopout = true; }}
					class="inline font-medium text-navy/70 underline decoration-navy/30 hover:text-navy hover:decoration-navy/60 cursor-pointer transition-colors"
				>
					Islamically owns it
				</span>
				, based on whose income or savings acquired it.
			</p>
			<p class="text-[13px] text-navy/55 leading-relaxed mt-1.5 text-pretty wrap-break-word">
				This option is more detailed but may be more accurate for your situation.
			</p>
		</div>
	</div>
</button>
</div>

<InfoPopout open={hebaPopout} onclose={() => (hebaPopout = false)} title="What is a Mutual Gift (Heba)?" dismissLabel="Understood">
	<p>In Islamic law, this type of gift is called a <span class="font-medium text-navy/80">heba</span>. It is a lifetime gift — not a provision in a will. It takes effect the moment you sign your trust.</p>
	<p class="mt-3">It is <span class="font-medium text-navy/80">irrevocable</span>, meaning it cannot be taken back for any reason, including divorce. This is a serious commitment.</p>
	<p class="mt-3">If you have questions, please speak with an imam or attorney.</p>
</InfoPopout>

<InfoPopout open={islamicPopout} onclose={() => (islamicPopout = false)} title='What does "Islamically owns it" mean?'>
	<p>Islamic ownership is based on <span class="font-medium text-navy/80">who earned or acquired the asset</span> — not whose name is on the account.</p>
	<p class="mt-3">If the husband's income paid for the house, it is his Islamically. If both spouses contributed, you can designate it 50/50.</p>
	<p class="mt-3">If you are unsure, the 50/50 mutual gift option is simpler and appropriate for most families.</p>
</InfoPopout>
