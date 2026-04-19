<script lang="ts">
	import type { QuestionResponseValue } from '$lib/config';
	import InfoPopout from './InfoPopout.svelte';

	let {
		value,
		onresponse,
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
	} = $props();

	let selected = $derived(typeof value === 'string' ? value : null);

	let successorPopout = $state(false);
	let skippedPopout = $state(false);
</script>

<div class="space-y-8">
	<div class="rounded-2xl bg-white border border-navy/10 p-6 space-y-4">
		<p class="text-[14px] text-navy/70 leading-relaxed">
			Your trustee is the person responsible for carrying out your wishes — distributing your estate to your heirs according to Islamic law, managing any funds held for minor children, and handling administrative tasks after your death.
		</p>
		<p class="text-[14px] text-navy/70 leading-relaxed">
			Right now, you and your spouse are the trustees. This question is about who takes over if you are both gone, or unable to serve.
		</p>
		<p class="text-[14px] text-navy/70 leading-relaxed">
			On the next screen we will ask you to name up to four
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				onclick={() => (successorPopout = true)}
				class="font-medium text-navy/85 underline decoration-navy/25 hover:decoration-navy/60 cursor-pointer transition-colors"
			>successor trustees</span>, in order of preference. Only one serves at a time.
		</p>
	</div>

	<div class="space-y-3">
		<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase">When the first spouse passes</div>

		<!-- Option 1 — Recommended -->
		<button
			type="button"
			onclick={() => onresponse('survivor-serves')}
			class="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer relative overflow-hidden
				{selected === 'survivor-serves'
					? 'border-emerald-accent bg-white shadow-md shadow-emerald-accent/10'
					: 'border-emerald-accent/30 bg-emerald-accent/2 hover:border-emerald-accent/60 hover:bg-white'}"
		>
			<div class="absolute top-3.5 right-4">
				<span class="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-accent/10 text-emerald-accent">
					Recommended for most families
				</span>
			</div>
			<div class="flex items-start gap-4 pr-44">
				<div class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
					{selected === 'survivor-serves' ? 'border-emerald-accent' : 'border-navy/25'}">
					{#if selected === 'survivor-serves'}
						<div class="w-2.5 h-2.5 rounded-full bg-emerald-accent"></div>
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-sm font-semibold text-navy mb-1.5">The surviving spouse serves as trustee.</div>
					<p class="text-[13px] text-navy/55 leading-relaxed">
						The surviving spouse takes over as sole trustee and manages the trust until they pass or are unable to serve. The successor trustees named below step in after that.
					</p>
				</div>
			</div>
		</button>

		<!-- Option 2 — Secondary -->
		<button
			type="button"
			onclick={() => onresponse('survivor-skipped')}
			class="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer
				{selected === 'survivor-skipped'
					? 'border-navy bg-white shadow-sm'
					: 'border-navy/8 bg-white/60 hover:border-navy/20 hover:bg-white/80'}"
		>
			<div class="flex items-start gap-4">
				<div class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
					{selected === 'survivor-skipped' ? 'border-navy' : 'border-navy/25'}">
					{#if selected === 'survivor-skipped'}
						<div class="w-2.5 h-2.5 rounded-full bg-navy"></div>
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-sm font-semibold text-navy mb-1.5">The surviving spouse does not serve as trustee.</div>
					<p class="text-[13px] text-navy/55 leading-relaxed">
						The first successor trustee named below serves immediately upon the first death.
					</p>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<span
						onclick={(e) => { e.stopPropagation(); skippedPopout = true; }}
						class="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-navy/50 hover:text-navy/70 cursor-pointer underline decoration-navy/20 hover:decoration-navy/40 transition-colors"
					>
						When would I choose this?
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</span>
				</div>
			</div>
		</button>
	</div>

</div>

<InfoPopout open={successorPopout} onclose={() => (successorPopout = false)} title="What is a successor trustee?">
	<p>A successor trustee steps in <span class="font-medium text-navy/85">only when both of you are either deceased or unable to serve</span>. They do not have any power over your trust while you are alive and capable.</p>
</InfoPopout>

<InfoPopout open={skippedPopout} onclose={() => (skippedPopout = false)} title="When would I choose this option?">
	<p>Some families choose this if they are concerned about the surviving spouse's ability or willingness to distribute the estate according to Islamic law.</p>
	<p class="mt-3">This is uncommon but available. If you choose this option, make sure your successor trustees are people you deeply trust and who understand Islamic inheritance.</p>
</InfoPopout>
