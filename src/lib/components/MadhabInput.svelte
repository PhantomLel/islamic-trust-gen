<script lang="ts">
	import type { QuestionResponseValue } from '$lib/config';
	import InfoPopout from './InfoPopout.svelte';
	import WhatsAppHelpLink from './WhatsAppHelpLink.svelte';

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
	let popout = $state(false);

	const options: { value: string; label: string }[] = [
		{ value: 'hanafi', label: 'Hanafi' },
		{ value: 'shafii', label: "Shafi'i" },
		{ value: 'maliki', label: 'Maliki' },
		{ value: 'hanbali', label: 'Hanbali' },
	];
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-2.5">
		{#each options as opt}
			<button
				type="button"
				onclick={() => { onresponse(opt.value); onnext(); }}
				class="w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer
					{selected === opt.value
						? 'bg-emerald-accent/8 border-emerald-accent/30 text-navy'
						: 'bg-white border-navy/10 text-navy/70 hover:border-navy/20'}"
			>
				<div class="flex items-center gap-3">
					<div class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
						{selected === opt.value ? 'border-emerald-accent' : 'border-navy/20'}">
						{#if selected === opt.value}
							<div class="w-2.5 h-2.5 rounded-full bg-emerald-accent"></div>
						{/if}
					</div>
					<span class="text-base">{opt.label}</span>
				</div>
			</button>
		{/each}
	</div>

	<div class="rounded-2xl bg-white border border-navy/10 p-5">
		<p class="text-[13.5px] text-navy/55 leading-relaxed">
			If you are unsure, select <span class="font-medium text-navy/75">Hanafi</span>. It is the most widely followed school among Muslims in the United States. You can always consult your imam if you are uncertain.
		</p>
		<div class="mt-3">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				onclick={() => (popout = true)}
				class="inline-flex items-center gap-1 text-[12px] font-medium text-navy/50 hover:text-navy/70 cursor-pointer underline decoration-navy/20 hover:decoration-navy/40 transition-colors"
			>
				What is a school of jurisprudence?
				<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</span>
		</div>
	</div>

	<WhatsAppHelpLink
		message="I have a question about which school applies to us."
		label="I have a question about which school applies to us"
	/>
</div>

<InfoPopout open={popout} onclose={() => (popout = false)} title="What is a school of jurisprudence?">
	<p>The four major Sunni schools of Islamic law agree on the fundamental rules of inheritance but differ on some relatively minor details.</p>
	<p class="mt-3">Your selection tells your trustee which rules to apply when calculating your heirs' shares.</p>
	<p class="mt-3">If different members of your family follow different schools, choose the one you most identify with or consult your imam.</p>
</InfoPopout>
