<script lang="ts">
	import type { AssetAllocationEntry, QuestionResponseValue } from '$lib/config';
	import InfoPopout from './InfoPopout.svelte';

	let {
		value,
		onresponse,
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
	} = $props();

	function getAssets(): AssetAllocationEntry[] {
		if (Array.isArray(value) && value.length > 0 && typeof (value[0] as AssetAllocationEntry)?.assetName === 'string') {
			return value as AssetAllocationEntry[];
		}
		return [{ assetName: '', accountId: '', spouse: 'husband' }];
	}

	function updateAsset(index: number, patch: Partial<AssetAllocationEntry>) {
		onresponse(getAssets().map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
	}

	function addRow() {
		onresponse([...getAssets(), { assetName: '', accountId: '', spouse: 'husband' }]);
	}

	function removeRow(index: number) {
		const updated = getAssets().filter((_, i) => i !== index);
		onresponse(updated.length > 0 ? updated : [{ assetName: '', accountId: '', spouse: 'husband' }]);
	}

	let assets = $derived(getAssets());
	let islamicPopout = $state(false);
	let defaultPopout = $state(false);

	const ownerOptions: { value: AssetAllocationEntry['spouse']; label: string }[] = [
		{ value: 'husband', label: 'Husband' },
		{ value: 'wife', label: 'Wife' },
		{ value: '50-50', label: '50 / 50' },
	];
</script>

<div class="space-y-6">
	<div class="text-[13.5px] text-navy/60 leading-relaxed space-y-1.5">
		<p>
			For each significant asset, indicate which spouse
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				onclick={() => (islamicPopout = true)}
				class="font-medium text-navy/80 underline decoration-navy/25 hover:decoration-navy/60 cursor-pointer transition-colors"
			>Islamically owns it</span>.
			Generally, this is the spouse whose income or savings acquired it.
		</p>
		<p>Focus on major assets — home, bank accounts, retirement accounts, vehicles, and other significant property. You do not need to list everything you own.</p>
		<p>
			Any asset you do not list will automatically
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				onclick={() => (defaultPopout = true)}
				class="font-medium text-navy/80 underline decoration-navy/25 hover:decoration-navy/60 cursor-pointer transition-colors"
			>default to a 50/50 split</span>.
		</p>
	</div>

	<div class="space-y-2.5">
		{#each assets as entry, i}
			<div class="rounded-2xl border border-navy/8 bg-white p-4 space-y-3">
				<div class="flex items-end gap-2">
					<div class="flex-2 min-w-0">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Asset description</label>
						<input
							type="text"
							placeholder="e.g. Primary home, Chase checking, Toyota Camry"
							value={entry.assetName}
							oninput={(e) => updateAsset(i, { assetName: (e.target as HTMLInputElement).value })}
							class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Account / ID <span class="normal-case text-navy/30 font-normal">(optional)</span></label>
						<input
							type="text"
							placeholder="Last 4 digits"
							value={entry.accountId ?? ''}
							oninput={(e) => updateAsset(i, { accountId: (e.target as HTMLInputElement).value })}
							class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
						/>
					</div>
					{#if assets.length > 1}
						<button
							type="button"
							onclick={() => removeRow(i)}
							aria-label="Remove asset"
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
								onclick={() => updateAsset(i, { spouse: opt.value })}
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
			Add another asset
		</button>
	</div>

</div>

<InfoPopout open={islamicPopout} onclose={() => (islamicPopout = false)} title='What does "Islamically owns it" mean?'>
	<p>Islamic ownership follows <span class="font-medium text-navy/85">who earned or acquired the asset</span> — not whose name is on the title or account. If the husband's salary paid the mortgage, the home is his Islamically. If both spouses contributed to an account, choose 50/50.</p>
</InfoPopout>

<InfoPopout open={defaultPopout} onclose={() => (defaultPopout = false)} title="What happens if I don't list an asset?">
	<p>If you leave an asset off this list, your trustee will treat it as <span class="font-medium text-navy/85">equally owned by both spouses</span> for the purpose of calculating Islamic inheritance shares. This is a practical default, not a religious ruling.</p>
</InfoPopout>
