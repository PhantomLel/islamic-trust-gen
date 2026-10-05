<script lang="ts">
	import { isJabalCharityId, nationalCharities } from '$lib/nationalCharities';
	import { charityPickerHeading, jabalPickerConfirmPrompt, jabalPickerDisclosure } from '$lib/config';

	let {
		selectedIds,
		getPercentage,
		onselect,
		onremove,
		onPercentageChange,
		idPrefix = 'national-charity',
	}: {
		selectedIds: string[];
		getPercentage: (id: string) => number;
		/** `meta.confirmedAt` is set (ISO timestamp) only for the Jabal Foundation entry, after the explicit confirm. */
		onselect: (id: string, meta?: { confirmedAt?: string }) => void;
		onremove: (id: string) => void;
		onPercentageChange: (id: string, percentage: number) => void;
		idPrefix?: string;
	} = $props();

	let open = $state(false);
	/** Jabal selected but not yet confirmed: nothing is stored until the confirm button is pressed. */
	let pendingJabalId = $state<string | null>(null);

	let selectedSet = $derived(new Set(selectedIds));
	let selectedCharities = $derived(nationalCharities.filter((c) => selectedSet.has(c.id)));

	function toggle(id: string) {
		if (selectedSet.has(id)) {
			onremove(id);
		} else if (isJabalCharityId(id)) {
			// Appendix A §3.2: explicit confirm before the answer is stored.
			pendingJabalId = id;
			open = false;
		} else {
			onselect(id);
		}
	}

	function confirmJabal() {
		if (!pendingJabalId) return;
		onselect(pendingJabalId, { confirmedAt: new Date().toISOString() });
		pendingJabalId = null;
	}

	function handleTriggerBlur() {
		setTimeout(() => {
			open = false;
		}, 150);
	}

	function handleTriggerKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
			e.preventDefault();
			open = true;
		} else if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

<div class="rounded-xl border border-navy/10 bg-navy/[0.02] p-4 space-y-3">
	<div>
		<p class="text-xs text-navy/65 leading-relaxed" data-testid="charity-picker-heading">{charityPickerHeading}</p>
	</div>

	<div class="relative">
		<button
			type="button"
			role="combobox"
			aria-haspopup="listbox"
			aria-expanded={open}
			aria-controls="{idPrefix}-listbox"
			onclick={() => (open = !open)}
			onblur={handleTriggerBlur}
			onkeydown={handleTriggerKeydown}
			class="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white border border-navy/10 text-sm text-left outline-none transition-all
				focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
		>
			<span class={selectedCharities.length ? 'text-navy' : 'text-navy/40'}>
				{selectedCharities.length
					? `${selectedCharities.length} charit${selectedCharities.length === 1 ? 'y' : 'ies'} selected`
					: 'Select a charity…'}
			</span>
			<svg
				class="w-4 h-4 text-navy/40 shrink-0 transition-transform {open ? 'rotate-180' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if open}
			<ul
				id="{idPrefix}-listbox"
				role="listbox"
				aria-label="Muslim Charities in Texas"
				aria-multiselectable="true"
				class="absolute z-50 mt-1.5 w-full max-h-80 overflow-y-auto rounded-xl border border-navy/10 bg-white shadow-lg shadow-navy/8 py-1"
			>
				{#each nationalCharities as charity (charity.id)}
					{@const isSelected = selectedSet.has(charity.id)}
					<li
						role="option"
						aria-selected={isSelected}
						onmousedown={(e) => {
							e.preventDefault();
							toggle(charity.id);
						}}
						class="flex items-start gap-3 px-4 py-2.5 cursor-pointer select-none transition-colors
							{isSelected ? 'bg-emerald-accent/8' : 'hover:bg-navy/[0.03]'}"
					>
						<span
							class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors
								{isSelected ? 'border-emerald-accent bg-emerald-accent' : 'border-navy/20 bg-white'}"
						>
							{#if isSelected}
								<svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							{/if}
						</span>
						<span class="flex-1 min-w-0">
							<span class="block text-sm font-medium text-navy leading-snug">{charity.name}</span>
							{#if isJabalCharityId(charity.id)}
								<span class="block text-xs text-navy/55 leading-relaxed mt-0.5" data-testid="jabal-disclosure">{jabalPickerDisclosure}</span>
							{/if}
							<a
								href={charity.url}
								target="_blank"
								rel="noopener noreferrer"
								onmousedown={(e) => e.stopPropagation()}
								onclick={(e) => e.stopPropagation()}
								class="inline-flex items-center gap-1 text-xs text-emerald-accent hover:underline mt-0.5"
							>
								Visit website
								<svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
								</svg>
							</a>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if pendingJabalId}
		<div class="rounded-xl border border-amber-300/70 bg-amber-50 p-4" role="alertdialog" aria-label="Confirm Jabal Foundation gift" data-testid="jabal-confirm">
			<p class="text-sm text-navy leading-relaxed">{jabalPickerConfirmPrompt}</p>
			<div class="mt-3 flex gap-2">
				<button
					type="button"
					onclick={confirmJabal}
					class="px-4 py-2 rounded-lg bg-emerald-accent text-cream text-sm font-medium hover:bg-emerald-light transition-colors cursor-pointer"
				>
					Confirm
				</button>
				<button
					type="button"
					onclick={() => (pendingJabalId = null)}
					class="px-4 py-2 rounded-lg border border-navy/15 text-sm text-navy/70 hover:bg-navy/[0.04] transition-colors cursor-pointer"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	{#each selectedCharities as charity (charity.id)}
		{@const pct = getPercentage(charity.id)}
		<div class="rounded-xl border border-emerald-accent/30 bg-emerald-accent/5 p-4">
			<div class="flex items-start gap-3">
				<div class="flex-1 min-w-0">
					<h4 class="text-sm font-medium text-navy leading-snug">{charity.name}</h4>
					{#if isJabalCharityId(charity.id)}
						<p class="text-xs text-navy/55 leading-relaxed mt-0.5">{jabalPickerDisclosure}</p>
					{/if}
					<a
						href={charity.url}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1 text-xs text-emerald-accent hover:underline mt-0.5"
					>
						Visit website
						<svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
						</svg>
					</a>
				</div>
				<button
					type="button"
					onclick={() => onremove(charity.id)}
					class="shrink-0 text-xs font-medium text-navy/45 hover:text-red-600 transition-colors cursor-pointer"
				>
					Remove
				</button>
			</div>
			<div class="mt-3 flex items-center gap-3">
				<label for="{idPrefix}-pct-{charity.id}" class="text-sm text-navy/70 whitespace-nowrap">
					Percentage:
				</label>
				<div class="flex items-center gap-2 flex-1 max-w-xs">
					<input
						id="{idPrefix}-pct-{charity.id}"
						type="number"
						min="0"
						max="100"
						step="0.1"
						value={pct}
						oninput={(e) => {
							const val = parseFloat(e.currentTarget.value);
							if (!isNaN(val)) onPercentageChange(charity.id, val);
						}}
						class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy bg-white outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
						placeholder="0"
					/>
					<span class="text-sm text-navy/50 shrink-0">%</span>
				</div>
			</div>
		</div>
	{/each}
</div>
