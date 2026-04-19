<script lang="ts">
	import type { HebaResponse, PersonalDataResponse, QuestionResponseValue } from '$lib/config';
	import { isPersonalDataShape } from '$lib/question-response-helpers';
	let {
		value,
		onresponse,
		allResponses = {},
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		allResponses?: Record<string, QuestionResponseValue>;
	} = $props();

	function getHebaState(): HebaResponse {
		if (value && typeof value === 'object' && !Array.isArray(value) && 'husbandConfirmation' in value) {
			return value as HebaResponse;
		}
		return { husbandConfirmation: null, wifeConfirmation: null };
	}

	function getSpouseName(questionId: string): string {
		const raw = allResponses[questionId];
		if (isPersonalDataShape(raw)) return (raw as PersonalDataResponse).name.trim();
		return '';
	}

	function toggleConfirmation(spouse: 'husband' | 'wife') {
		const current = getHebaState();
		const key = spouse === 'husband' ? 'husbandConfirmation' : 'wifeConfirmation';
		onresponse({ ...current, [key]: current[key] ? null : new Date().toISOString() });
	}

	let heba = $derived(getHebaState());
	let husbandName = $derived(getSpouseName('husband-data') || 'Husband');
	let wifeName = $derived(getSpouseName('wife-data') || 'Wife');
</script>

<div class="space-y-8 w-full min-w-0">
	<div class="rounded-2xl bg-white border border-navy/10 p-4 sm:p-6 md:p-8 space-y-5 min-w-0">
		<p class="text-[15px] sm:text-[14px] text-navy/70 leading-relaxed text-pretty wrap-break-word">
			By choosing the 50/50 option, you are each making an Islamic gift, a <span class="font-semibold text-navy/90">heba</span>, of one-half of your marital property to the other spouse.
		</p>

		<div class="text-[15px] sm:text-[14px] text-navy/70 leading-relaxed space-y-2.5 min-w-0">
			<p class="font-medium text-navy/80">Under Islamic law, this gift:</p>
			<ul class="space-y-2 pl-1 min-w-0">
				<li class="flex items-start gap-2.5 min-w-0">
					<span class="w-4 h-px bg-navy/25 mt-[11px] shrink-0" aria-hidden="true"></span>
					<span class="min-w-0 flex-1 text-pretty wrap-break-word">Takes effect <span class="font-medium text-navy/85">immediately</span> when you sign your trust. Not at death. Right now.</span>
				</li>
				<li class="flex items-start gap-2.5 min-w-0">
					<span class="w-4 h-px bg-navy/25 mt-[11px] shrink-0" aria-hidden="true"></span>
					<span class="min-w-0 flex-1 text-pretty wrap-break-word">Is <span class="font-medium text-navy/85">irrevocable</span>. It cannot be taken back for any reason.</span>
				</li>
				<li class="flex items-start gap-2.5 min-w-0">
					<span class="w-4 h-px bg-navy/25 mt-[11px] shrink-0" aria-hidden="true"></span>
					<span class="min-w-0 flex-1 text-pretty wrap-break-word"><span class="font-medium text-navy/85">Survives divorce</span>. If you later separate, neither spouse can reclaim what was given.</span>
				</li>
			</ul>
		</div>

		<div class="rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-3.5 sm:px-5 sm:py-4 min-w-0">
			<p class="text-[13px] text-amber-900/80 leading-relaxed text-pretty wrap-break-word">
				<span class="font-semibold">This is not a formality.</span> This is a real and permanent commitment under Islamic law. If you are not comfortable with this, go back and choose the asset-by-asset option instead. There is no wrong answer, only the one that is right for your family.
			</p>
		</div>

	</div>

	<div class="space-y-3">
		{#each [{ spouse: 'husband' as const, name: husbandName, confirmed: heba.husbandConfirmation }, { spouse: 'wife' as const, name: wifeName, confirmed: heba.wifeConfirmation }] as item}
			<button
				type="button"
				onclick={() => toggleConfirmation(item.spouse)}
				class="w-full min-w-0 text-left rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 cursor-pointer
					{item.confirmed
						? 'border-emerald-accent bg-emerald-accent/3 shadow-sm'
						: 'border-navy/8 bg-white hover:border-navy/20'}"
			>
				<div class="flex items-start gap-3 sm:gap-4 min-w-0">
					<div class="mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors
						{item.confirmed ? 'border-emerald-accent bg-emerald-accent' : 'border-navy/25 bg-white'}">
						{#if item.confirmed}
							<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-semibold text-navy mb-1.5">{item.name}</div>
						<p class="text-[13px] text-navy/55 leading-relaxed text-pretty wrap-break-word">
							I have read and understood the above. I understand that by signing this trust I am making an irrevocable Islamic gift of one-half of my marital property to my spouse. I understand this gift takes effect immediately, cannot be revoked, and is not undone by divorce. I make this gift freely and without coercion.
						</p>
						{#if item.confirmed}
							<p class="text-[11px] text-emerald-accent/70 mt-2 tabular-nums">
								Confirmed {new Date(item.confirmed).toLocaleString()}
							</p>
						{/if}
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>
