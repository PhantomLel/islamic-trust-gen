<script lang="ts">
	import type { SeparatePropertyEntry } from '$lib/config';

	let {
		entries,
		onchange,
	}: {
		entries: SeparatePropertyEntry[];
		onchange: (updated: SeparatePropertyEntry[]) => void;
	} = $props();

	function update(index: number, patch: Partial<SeparatePropertyEntry>) {
		onchange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)));
	}

	function add() {
		onchange([...entries, { assetName: '', accountId: '', approximateValue: '' }]);
	}

	function remove(index: number) {
		const updated = entries.filter((_, i) => i !== index);
		onchange(updated);
	}
</script>

<div class="space-y-2">
	{#each entries as entry, i}
		<div class="rounded-xl border border-navy/[0.08] bg-white p-3.5 space-y-2.5">
			<div class="flex items-end gap-2">
				<div class="flex-[2] min-w-0">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-[10.5px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Asset description</label>
					<input
						type="text"
						placeholder="e.g. Inherited home, gift from parent"
						value={entry.assetName}
						oninput={(e) => update(i, { assetName: (e.target as HTMLInputElement).value })}
						class="w-full rounded-lg border border-navy/[0.08] bg-navy/[0.02] px-3 py-2 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
					/>
				</div>
				<div class="flex-1 min-w-0">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-[10.5px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Account / Institution</label>
					<input
						type="text"
						placeholder="Optional"
						value={entry.accountId ?? ''}
						oninput={(e) => update(i, { accountId: (e.target as HTMLInputElement).value })}
						class="w-full rounded-lg border border-navy/[0.08] bg-navy/[0.02] px-3 py-2 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
					/>
				</div>
				<div class="w-28 shrink-0">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-[10.5px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Approx. value</label>
					<input
						type="text"
						placeholder="$"
						value={entry.approximateValue ?? ''}
						oninput={(e) => update(i, { approximateValue: (e.target as HTMLInputElement).value })}
						class="w-full rounded-lg border border-navy/[0.08] bg-navy/[0.02] px-3 py-2 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
					/>
				</div>
				<button
					type="button"
					onclick={() => remove(i)}
					aria-label="Remove row"
					class="shrink-0 p-2 rounded-lg text-navy/25 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer mb-0.5"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
			</div>
		</div>
	{/each}

	<button
		type="button"
		onclick={add}
		class="w-full py-2.5 rounded-xl border border-dashed border-navy/[0.08] text-[12px] font-medium text-navy/35
			hover:border-navy/20 hover:text-navy/55 hover:bg-navy/[0.02] transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
	>
		<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
		</svg>
		Add row
	</button>
</div>
