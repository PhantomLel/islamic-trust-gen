<script lang="ts">
	import type { ChildResponse, Question, QuestionResponseValue } from '$lib/config';

	let { question, value, onresponse, onnext }: {
		question: Question;
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
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

	function getChildren(): ChildResponse[] {
		if (!Array.isArray(value)) return [];
		return value.map((child) => ({
			firstName: child.firstName ?? '',
			lastName: child.lastName ?? '',
			dob: child.dob ?? ''
		}));
	}

	function updateChild(index: number, field: keyof ChildResponse, fieldValue: string) {
		const next = getChildren();
		next[index] = {
			...next[index],
			[field]: fieldValue
		};
		onresponse(next);
	}

	function addChild() {
		onresponse([
			...getChildren(),
			{ firstName: '', lastName: '', dob: '' }
		]);
	}

	function removeChild(index: number) {
		const next = getChildren().filter((_, i) => i !== index);
		onresponse(next.length > 0 ? next : null);
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

{:else if question.type === 'children'}
	{@const children = getChildren()}
	<div class="space-y-2.5">
		{#if children.length === 0}
			<div class="rounded-lg border border-dashed border-navy/15 bg-white/60 px-4 py-3 text-sm text-navy/45">
				No children added yet.
			</div>
		{/if}

		{#each children as child, index}
			<div class="rounded-lg border border-navy/10 bg-white p-2.5">
				<div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_170px_auto] gap-2 items-center">
					<input
						type="text"
						value={child.firstName}
						oninput={(e) => updateChild(index, 'firstName', e.currentTarget.value)}
						placeholder="First name"
						class="w-full px-3 py-2.5 rounded-md border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
					/>
					<input
						type="text"
						value={child.lastName}
						oninput={(e) => updateChild(index, 'lastName', e.currentTarget.value)}
						placeholder="Last name"
						class="w-full px-3 py-2.5 rounded-md border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
					/>
					<input
						type="date"
						value={child.dob}
						oninput={(e) => updateChild(index, 'dob', e.currentTarget.value)}
						class="w-full px-3 py-2.5 rounded-md border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
					/>
					<button
						type="button"
						onclick={() => removeChild(index)}
						class="h-[38px] px-3 rounded-md border border-navy/10 text-xs text-navy/50 hover:text-navy hover:border-navy/20 transition-colors cursor-pointer whitespace-nowrap"
						aria-label={`Remove child ${index + 1}`}
					>
						Remove
					</button>
				</div>
			</div>
		{/each}

		<button
			type="button"
			onclick={addChild}
			class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-emerald-accent/25 text-sm font-medium text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-all cursor-pointer"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add Child
		</button>
	</div>
{/if}
