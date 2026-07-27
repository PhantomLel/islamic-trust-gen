<script lang="ts">
	import type { SuccessorTrusteeEntry, QuestionResponseValue } from '$lib/config';
	import InfoPopout from './InfoPopout.svelte';

	let {
		value,
		onresponse,
		allResponses = {},
		copySourceId,
		copyButtonLabel = "Make my Trustees the Same as my Husband's (Most Common)",
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		allResponses?: Record<string, QuestionResponseValue>;
		/** When set, offer a one-click copy from the other spouse's successor-trustee list. */
		copySourceId?: 'husband-successor-trustees' | 'wife-successor-trustees';
		copyButtonLabel?: string;
	} = $props();

	function getTrustees(): SuccessorTrusteeEntry[] {
		if (Array.isArray(value) && value.length > 0 && typeof (value[0] as SuccessorTrusteeEntry)?.fullName === 'string') {
			return value as SuccessorTrusteeEntry[];
		}
		return [
			{ fullName: '', relationship: '', contact: '' },
			{ fullName: '', relationship: '', contact: '' },
		];
	}

	function update(index: number, patch: Partial<SuccessorTrusteeEntry>) {
		onresponse(getTrustees().map((t, i) => (i === index ? { ...t, ...patch } : t)));
	}

	function addRow() {
		const current = getTrustees();
		if (current.length >= 4) return;
		onresponse([...current, { fullName: '', relationship: '', contact: '' }]);
	}

	function removeRow(index: number) {
		const updated = getTrustees().filter((_, i) => i !== index);
		onresponse(updated.length > 0 ? updated : [{ fullName: '', relationship: '', contact: '' }]);
	}

	function getSourceTrustees(): SuccessorTrusteeEntry[] {
		if (!copySourceId) return [];
		const v = allResponses[copySourceId];
		if (
			Array.isArray(v) &&
			v.length > 0 &&
			typeof (v[0] as SuccessorTrusteeEntry)?.fullName === 'string'
		) {
			return v as SuccessorTrusteeEntry[];
		}
		return [];
	}

	function copyFromSpouse() {
		if (!canCopyFromSpouse) return;
		const copied: SuccessorTrusteeEntry[] = namedSourceTrustees.map((t) => ({
			fullName: t.fullName,
			relationship: t.relationship,
			contact: t.contact ?? '',
		}));
		onresponse(copied);
	}

	let trustees = $derived(getTrustees());
	let sourceTrustees = $derived(getSourceTrustees());
	let namedSourceTrustees = $derived(sourceTrustees.filter((t) => t.fullName.trim() !== ''));
	let canCopyFromSpouse = $derived(copySourceId != null && namedSourceTrustees.length > 0);
	let orderPopout = $state(false);

	const ordinals = ['1st', '2nd', '3rd', '4th'];
</script>

<div class="space-y-6">
	<div class="rounded-2xl bg-white border border-navy/10 p-6 space-y-3">
		<p class="text-[14px] text-navy/70 leading-relaxed">
			If no spouse is serving as trustee, these individuals will step in — one at a time,
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				onclick={() => (orderPopout = true)}
				class="font-medium text-navy/85 underline decoration-navy/25 hover:decoration-navy/60 cursor-pointer transition-colors"
			>in the order you list them</span>.
		</p>
		<p class="text-[14px] text-navy/50 leading-relaxed">
			Choose people who are trustworthy, organized, and willing to take on this responsibility. It is a good idea to ask them before naming them here.
		</p>
	</div>

	{#if copySourceId}
		<button
			type="button"
			onclick={copyFromSpouse}
			disabled={!canCopyFromSpouse}
			class="w-full px-4 py-3 rounded-xl border text-[13px] font-medium transition-all cursor-pointer
				{canCopyFromSpouse
					? 'border-emerald-accent/30 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10'
					: 'border-navy/10 text-navy/30 bg-navy/2 cursor-not-allowed'}
				flex items-center justify-center gap-2"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
			</svg>
			{copyButtonLabel}
			{#if !canCopyFromSpouse}
				<span class="text-navy/35 font-normal">(no successor trustees named yet)</span>
			{/if}
		</button>
	{/if}

	<div class="space-y-3">
		{#each trustees as trustee, i}
			<div class="rounded-2xl border border-navy/8 bg-white p-4">
				<div class="flex items-center justify-between mb-3">
					<span class="text-[11px] font-semibold text-navy/35 tracking-wider uppercase">{ordinals[i]} Successor Trustee</span>
					{#if trustees.length > 1}
						<button
							type="button"
							onclick={() => removeRow(i)}
							aria-label="Remove trustee"
							class="p-1.5 rounded-lg text-navy/25 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
						>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					{/if}
				</div>
				<div class="flex items-end gap-2">
					<div class="flex-1 min-w-0">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Full name</label>
						<input
							type="text"
							placeholder="Full legal name"
							value={trustee.fullName}
							oninput={(e) => update(i, { fullName: (e.target as HTMLInputElement).value })}
							class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Relationship</label>
						<input
							type="text"
							placeholder="e.g. Brother, close friend"
							value={trustee.relationship}
							oninput={(e) => update(i, { relationship: (e.target as HTMLInputElement).value })}
							class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
						/>
					</div>
				</div>
				<div class="mt-2.5">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Phone or email <span class="normal-case text-navy/30 font-normal">(optional)</span></label>
					<input
						type="text"
						placeholder="For your records only"
						value={trustee.contact ?? ''}
						oninput={(e) => update(i, { contact: (e.target as HTMLInputElement).value })}
						class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
					/>
				</div>
			</div>
		{/each}

		{#if trustees.length < 4}
			<button
				type="button"
				onclick={addRow}
				class="w-full py-3 rounded-2xl border-2 border-dashed border-navy/8 text-[13px] font-medium text-navy/40
					hover:border-navy/20 hover:text-navy/60 hover:bg-navy/2 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Add another trustee ({trustees.length} of 4)
			</button>
		{/if}
	</div>
</div>

<InfoPopout open={orderPopout} onclose={() => (orderPopout = false)} title="What does order of preference mean?">
	<p>If the first person on your list is unable or unwilling to serve, the second person steps in, and so on. <span class="font-medium text-navy/85">Only one person serves at a time.</span></p>
</InfoPopout>
