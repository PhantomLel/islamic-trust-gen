<script lang="ts">
	import type { HeirsCalculatorResponse, QuestionResponseValue } from '$lib/config';
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

	function getHeirsData(questionId: string): HeirsCalculatorResponse | null {
		const response = allResponses[questionId];
		if (
			response != null &&
			typeof response === 'object' &&
			!Array.isArray(response) &&
			'namedHeirs' in response &&
			'verified' in response &&
			response.verified === true
		) {
			return response as HeirsCalculatorResponse;
		}
		return null;
	}

	let husbandHeirs = $derived(getHeirsData('husband-heirs'));
	let wifeHeirs = $derived(getHeirsData('wife-heirs'));
	let popout = $state(false);

	// Auto-mark as viewed when component mounts
	$effect(() => {
		if (value !== true) {
			onresponse(true);
		}
	});
</script>

<div class="space-y-8">
	<div class="rounded-2xl bg-white border border-navy/10 p-6 space-y-3">
		<p class="text-[14px] text-navy/70 leading-relaxed">
			These shares are calculated based on your family as it exists today. They will be
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				onclick={() => (popout = true)}
				class="font-medium text-navy/85 underline decoration-navy/25 hover:decoration-navy/60 cursor-pointer transition-colors"
			>recalculated at the time of each spouse's death</span>
			based on who is alive and eligible to inherit at that time.
		</p>
	</div>

	<div class="space-y-6">
		{#if husbandHeirs && husbandHeirs.namedHeirs.length > 0}
			<div>
				<h3 class="text-sm font-semibold text-navy mb-3">Husband's Heirs</h3>
				<div class="rounded-xl border border-navy/10 overflow-hidden">
					<table class="w-full text-sm">
						<thead class="bg-navy/5 border-b border-navy/10">
							<tr>
								<th class="text-left px-4 py-3 text-[11px] font-semibold text-navy/50 tracking-wider uppercase">Heir Name</th>
								<th class="text-left px-4 py-3 text-[11px] font-semibold text-navy/50 tracking-wider uppercase">Relationship</th>
								<th class="text-right px-4 py-3 text-[11px] font-semibold text-navy/50 tracking-wider uppercase">Estimated Share</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-navy/5">
							{#each husbandHeirs.namedHeirs as heir}
								{#each heir.names as name, idx}
									<tr class="hover:bg-navy/2 transition-colors">
										<td class="px-4 py-3 text-navy/70">{name}</td>
										<td class="px-4 py-3 text-navy/60">{heir.label}</td>
										<td class="px-4 py-3 text-right text-navy/70 font-medium tabular-nums">
											{heir.perPersonShare.numerator}/{heir.perPersonShare.denominator}
										</td>
									</tr>
								{/each}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		{#if wifeHeirs && wifeHeirs.namedHeirs.length > 0}
			<div>
				<h3 class="text-sm font-semibold text-navy mb-3">Wife's Heirs</h3>
				<div class="rounded-xl border border-navy/10 overflow-hidden">
					<table class="w-full text-sm">
						<thead class="bg-navy/5 border-b border-navy/10">
							<tr>
								<th class="text-left px-4 py-3 text-[11px] font-semibold text-navy/50 tracking-wider uppercase">Heir Name</th>
								<th class="text-left px-4 py-3 text-[11px] font-semibold text-navy/50 tracking-wider uppercase">Relationship</th>
								<th class="text-right px-4 py-3 text-[11px] font-semibold text-navy/50 tracking-wider uppercase">Estimated Share</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-navy/5">
							{#each wifeHeirs.namedHeirs as heir}
								{#each heir.names as name, idx}
									<tr class="hover:bg-navy/2 transition-colors">
										<td class="px-4 py-3 text-navy/70">{name}</td>
										<td class="px-4 py-3 text-navy/60">{heir.label}</td>
										<td class="px-4 py-3 text-right text-navy/70 font-medium tabular-nums">
											{heir.perPersonShare.numerator}/{heir.perPersonShare.denominator}
										</td>
									</tr>
								{/each}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>

	<div class="rounded-2xl bg-white border border-navy/10 p-5">
		<p class="text-[13.5px] text-navy/55 leading-relaxed">
			If anything looks incorrect, go back and update your family information before continuing.
		</p>
	</div>

</div>

<InfoPopout open={popout} onclose={() => (popout = false)} title="What does recalculation at death mean?">
	<p>Islamic inheritance shares change based on who survives the deceased. For example, if a parent who is currently listed as an heir passes away before you, their share is redistributed among the remaining heirs according to Islamic law.</p>
	<p class="mt-3">Your trustee will make this recalculation using the calculation tool built into this system.</p>
</InfoPopout>
