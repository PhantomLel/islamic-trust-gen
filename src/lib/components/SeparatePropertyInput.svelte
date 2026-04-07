<script lang="ts">
	import type { PersonalDataResponse, QuestionResponseValue, SeparatePropertyEntry, SeparatePropertyResponse } from '$lib/config';
	import { isPersonalDataShape } from '$lib/question-response-helpers';
	import SeparatePropertyTable from './SeparatePropertyTable.svelte';
	import InfoPopout from './InfoPopout.svelte';

	let {
		value,
		onresponse,
		allResponses = {},
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		allResponses?: Record<string, QuestionResponseValue>;
	} = $props();

	function getSeparateProperty(): SeparatePropertyResponse {
		if (value != null && typeof value === 'object' && !Array.isArray(value) && 'husband' in value && 'wife' in value) {
			return value as SeparatePropertyResponse;
		}
		return { husband: [], wife: [] };
	}

	function updateEntries(spouse: 'husband' | 'wife', entries: SeparatePropertyEntry[]) {
		onresponse({ ...getSeparateProperty(), [spouse]: entries });
	}

	function getSpouseName(questionId: string): string {
		const raw = allResponses[questionId];
		if (isPersonalDataShape(raw)) return (raw as PersonalDataResponse).name.trim();
		return '';
	}

	let sep = $derived(getSeparateProperty());
	let husbandName = $derived(getSpouseName('husband-data') || 'Husband');
	let wifeName = $derived(getSpouseName('wife-data') || 'Wife');

	let popout = $state<'husband' | 'wife' | null>(null);
</script>

<div class="space-y-6">
	<div class="rounded-2xl bg-white border border-navy/10 p-6 space-y-3">
		<p class="text-[14px] text-navy/70 leading-relaxed">
			Separate property is not affected by the ownership choice you just made. It belongs entirely to the spouse who owns it, and the Islamic shares will be applied to it individually.
		</p>
		<p class="text-[14px] text-navy/50 leading-relaxed">
			If neither of you has any separate property, leave both sections blank and continue.
		</p>
	</div>

	{#each [{ spouse: 'husband' as const, name: husbandName, entries: sep.husband }, { spouse: 'wife' as const, name: wifeName, entries: sep.wife }] as section}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm font-semibold text-navy">{section.name}'s Separate Property</div>
					<div class="text-[12px] text-navy/45 mt-0.5">Owned before marriage, or received as a personal gift or inheritance.</div>
				</div>
				<button
					type="button"
					onclick={() => (popout = section.spouse)}
					aria-label="What counts as separate property?"
					class="p-1.5 rounded-lg text-navy/30 hover:text-navy/60 hover:bg-navy/5 transition-colors cursor-pointer"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</button>
			</div>
			<SeparatePropertyTable
				entries={section.entries}
				onchange={(entries) => updateEntries(section.spouse, entries)}
			/>
		</div>
	{/each}
</div>

{#if popout !== null}
	{@const isHusband = popout === 'husband'}
	{@const spouseName = isHusband ? husbandName : wifeName}
	{@const pronoun = isHusband ? 'him' : 'her'}
	<InfoPopout open={true} onclose={() => (popout = null)} title="What counts as {spouseName}'s separate property?">
		<p>Examples: a home {pronoun === 'him' ? 'he' : 'she'} owned before you married, money left to {pronoun} by a parent, a car given to {pronoun} as a gift.</p>
		<p class="mt-3">Do <span class="font-medium text-navy/85">not</span> include anything purchased with income earned during the marriage — that is marital property.</p>
	</InfoPopout>
{/if}
