<script lang="ts">
	import type { Question } from '$lib/config';

	let { question, value, onresponse, onnext }: {
		question: Question;
		value: string | boolean | null;
		onresponse: (val: string | boolean | null) => void;
		onnext: () => void;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			onnext();
		}
	}

	const inputClass = `w-full px-5 py-4 rounded-xl bg-white border border-navy/10 text-navy text-base
		placeholder:text-navy/25 outline-none transition-all
		focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10`;

	function formatPhone(raw: string): string {
		const digits = raw.replace(/\D/g, '').slice(0, 10);
		if (digits.length <= 3) return digits;
		if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	}

	function handlePhoneInput(e: Event & { currentTarget: HTMLInputElement }) {
		const formatted = formatPhone(e.currentTarget.value);
		e.currentTarget.value = formatted;
		const digits = formatted.replace(/\D/g, '');
		onresponse(digits.length > 0 ? formatted : null);
	}
</script>

{#if question.type === 'text'}
	<input type="text" value={value ?? ''} oninput={(e) => onresponse(e.currentTarget.value || null)}
		onkeydown={handleKeydown} placeholder="Type your answer..." class={inputClass} />

{:else if question.type === 'tel'}
	{@const digits = typeof value === 'string' ? value.replace(/\D/g, '') : ''}
	{@const isValid = digits.length === 0 || digits.length === 10}
	<div>
		<input type="tel" value={value ?? ''} oninput={handlePhoneInput}
			onkeydown={handleKeydown} placeholder="(555) 123-4567"
			class="{inputClass} {!isValid ? '!border-red-400 !focus:ring-red-100' : ''}" />
		{#if !isValid}
			<p class="text-red-500 text-xs mt-1.5 ml-1">Please enter a valid 10-digit phone number</p>
		{/if}
	</div>

{:else if question.type === 'date'}
	<input type="date" value={value ?? ''} oninput={(e) => onresponse(e.currentTarget.value || null)}
		onkeydown={handleKeydown} class={inputClass} />

{:else if question.type === 'select' && question.options}
	<div class="flex flex-col gap-2.5">
		{#each question.options as option}
			{@const sel = value === option}
			<button onclick={() => { onresponse(option); onnext(); }}
				class="w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer
					   {sel ? 'bg-emerald-accent/8 border-emerald-accent/30 text-navy' : 'bg-white border-navy/10 text-navy/70 hover:border-navy/20'}">
				<div class="flex items-center gap-3">
					<div class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
								{sel ? 'border-emerald-accent' : 'border-navy/20'}">
						{#if sel}<div class="w-2.5 h-2.5 rounded-full bg-emerald-accent"></div>{/if}
					</div>
					<span class="text-base">{option}</span>
				</div>
			</button>
		{/each}
	</div>

{:else if question.type === 'boolean'}
	<div class="flex gap-3">
		{#each [{ label: 'Yes', value: true }, { label: 'No', value: false }] as opt}
			{@const sel = value === opt.value}
			<button onclick={() => { onresponse(opt.value); onnext(); }}
				class="flex-1 px-5 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer
					   {sel ? 'bg-emerald-accent/8 border-emerald-accent/30 text-navy font-medium' : 'bg-white border-navy/10 text-navy/70 hover:border-navy/20'}">
				{opt.label}
			</button>
		{/each}
	</div>
{/if}
