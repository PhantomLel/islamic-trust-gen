<script lang="ts">
	import type { PersonalPropertyEntry, QuestionResponseValue } from '$lib/config';
	import InfoPopout from './InfoPopout.svelte';

	let {
		value,
		onresponse,
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
	} = $props();

	function getItems(): PersonalPropertyEntry[] {
		if (
			Array.isArray(value) &&
			value.length > 0 &&
			typeof (value[0] as PersonalPropertyEntry)?.itemDescription === 'string'
		) {
			return value as PersonalPropertyEntry[];
		}
		return [{ itemDescription: '', spouse: 'husband' }];
	}

	function updateItem(index: number, patch: Partial<PersonalPropertyEntry>) {
		onresponse(getItems().map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
	}

	function addRow() {
		onresponse([...getItems(), { itemDescription: '', spouse: 'husband' }]);
	}

	function removeRow(index: number) {
		const updated = getItems().filter((_, i) => i !== index);
		onresponse(updated.length > 0 ? updated : [{ itemDescription: '', spouse: 'husband' }]);
	}

	let items = $derived(getItems());
	let valuePopout = $state(false);
	let ownershipPopout = $state(false);

	const ownerOptions: { value: PersonalPropertyEntry['spouse']; label: string }[] = [
		{ value: 'husband', label: 'Husband' },
		{ value: 'wife', label: 'Wife' },
		{ value: '50-50', label: '50 / 50' },
	];
</script>

<div class="space-y-6">
	<div class="text-[13.5px] text-navy/60 leading-relaxed space-y-2">
		<p>
			Some personal items are valuable enough that your trustee will need clear ownership
			designation to administer your estate properly.
		</p>
		<p>Please list the following if you own them:</p>
		<ul class="list-none space-y-1 pl-1">
			<li class="flex items-baseline gap-2"><span class="text-navy/30">—</span> All vehicles</li>
			<li class="flex items-baseline gap-2">
				<span class="text-navy/30">—</span>
				<span>
					Any jewelry or watch
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<span
						onclick={() => (valuePopout = true)}
						class="font-medium text-navy/80 underline decoration-navy/25 hover:decoration-navy/60 cursor-pointer transition-colors"
					>worth more than $1,000</span>
				</span>
			</li>
			<li class="flex items-baseline gap-2"><span class="text-navy/30">—</span> Artwork</li>
			<li class="flex items-baseline gap-2"><span class="text-navy/30">—</span> Collectibles</li>
		</ul>
		<p>
			For each item, indicate
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				onclick={() => (ownershipPopout = true)}
				class="font-medium text-navy/80 underline decoration-navy/25 hover:decoration-navy/60 cursor-pointer transition-colors"
			>which spouse it belongs to</span>.
		</p>
		<p class="text-navy/45">If you have none of these, skip this section and continue.</p>
	</div>

	<div class="space-y-2.5">
		{#each items as entry, i}
			<div class="rounded-2xl border border-navy/8 bg-white p-4 space-y-3">
				<div class="flex items-end gap-2">
					<div class="flex-1 min-w-0">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Item description</label>
						<input
							type="text"
							placeholder="e.g. 2022 Toyota Camry, Gold necklace, Oil painting"
							value={entry.itemDescription}
							oninput={(e) => updateItem(i, { itemDescription: (e.target as HTMLInputElement).value })}
							class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
						/>
					</div>
					{#if items.length > 1}
						<button
							type="button"
							onclick={() => removeRow(i)}
							aria-label="Remove item"
							class="shrink-0 p-2 rounded-lg text-navy/25 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer mb-0.5"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					{/if}
				</div>

				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Owned by</label>
					<div class="flex gap-2">
						{#each ownerOptions as opt}
							<button
								type="button"
								onclick={() => updateItem(i, { spouse: opt.value })}
								class="flex-1 py-2 rounded-xl text-[12px] font-medium transition-all duration-150 cursor-pointer border
									{entry.spouse === opt.value
										? 'border-emerald-accent bg-emerald-accent text-white shadow-sm'
										: 'border-navy/8 bg-white text-navy/55 hover:border-navy/20 hover:text-navy/80'}"
							>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/each}

		<button
			type="button"
			onclick={addRow}
			class="w-full py-3 rounded-2xl border-2 border-dashed border-navy/8 text-[13px] font-medium text-navy/40
				hover:border-navy/20 hover:text-navy/60 hover:bg-navy/2 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			Add another item
		</button>
	</div>
</div>

<InfoPopout open={valuePopout} onclose={() => (valuePopout = false)} title="Not sure if it's worth $1,000?">
	<p>If you are unsure of the value, include the item anyway. It is better to over-designate than to leave your trustee guessing.</p>
</InfoPopout>

<InfoPopout open={ownershipPopout} onclose={() => (ownershipPopout = false)} title="How do I determine ownership?">
	<p>For personal items, ownership generally follows who the item was purchased for or given to.</p>
	<p class="mt-3">A wife's engagement ring belongs to the wife. A husband's watch given to him as a gift belongs to the husband. Items purchased together for shared use can be designated 50/50.</p>
</InfoPopout>
