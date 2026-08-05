<script lang="ts">
	import {
		formatMasjidLabel,
		formatMasjidSublabel,
		getMasjidById,
		isMasjidId,
		searchMasajid,
	} from '$lib/masajid';

	let {
		selectedIds,
		getPercentage,
		onselect,
		onremove,
		onPercentageChange,
		stateCode = 'TX',
		idPrefix = 'masjid',
	}: {
		selectedIds: string[];
		getPercentage: (id: string) => number;
		onselect: (id: string) => void;
		onremove: (id: string) => void;
		onPercentageChange: (id: string, percentage: number) => void;
		stateCode?: string;
		idPrefix?: string;
	} = $props();

	let query = $state('');
	let open = $state(false);
	let activeIndex = $state(-1);
	let listEl = $state<HTMLUListElement | null>(null);

	let selectedSet = $derived(new Set(selectedIds));

	let available = $derived(
		searchMasajid(query, stateCode).filter((m) => !selectedSet.has(m.id)).slice(0, 50),
	);

	function selectMasjid(id: string) {
		onselect(id);
		query = '';
		open = false;
		activeIndex = -1;
	}

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		query = e.currentTarget.value;
		open = true;
		activeIndex = -1;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
			open = true;
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, available.length - 1);
			scrollActive();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
			scrollActive();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (activeIndex >= 0 && available[activeIndex]) {
				selectMasjid(available[activeIndex].id);
			} else if (available.length === 1) {
				selectMasjid(available[0].id);
			}
		} else if (e.key === 'Escape') {
			open = false;
			activeIndex = -1;
		}
	}

	function scrollActive() {
		if (!listEl) return;
		const item = listEl.children[activeIndex] as HTMLElement | undefined;
		item?.scrollIntoView({ block: 'nearest' });
	}

	function handleBlur() {
		setTimeout(() => {
			open = false;
			activeIndex = -1;
		}, 150);
	}
</script>

<div class="rounded-xl border border-navy/10 bg-navy/[0.02] p-4 space-y-3">
	<div>
		<h3 class="text-sm font-medium text-navy">Texas masajid</h3>
		<p class="text-xs text-navy/55 mt-0.5 leading-relaxed">
			Search by name, city, or region to add a local masjid to your wasiyyah.
		</p>
	</div>

	<div class="relative">
		<div class="relative">
			<input
				type="text"
				autocomplete="off"
				spellcheck="false"
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={open}
				aria-controls="{idPrefix}-listbox"
				aria-haspopup="listbox"
				aria-activedescendant={activeIndex >= 0 ? `${idPrefix}-opt-${activeIndex}` : undefined}
				value={query}
				placeholder="Search Texas masajid…"
				class="w-full px-4 py-3 rounded-xl bg-white border border-navy/10 text-sm text-navy
					placeholder:text-navy/30 outline-none transition-all pr-10
					focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
				oninput={handleInput}
				onfocus={() => (open = true)}
				onblur={handleBlur}
				onkeydown={handleKeydown}
			/>
			<span class="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-navy/30">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
				</svg>
			</span>
		</div>

		{#if open && available.length > 0}
			<ul
				bind:this={listEl}
				id="{idPrefix}-listbox"
				role="listbox"
				aria-label="Texas masajid"
				class="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-navy/10 bg-white shadow-lg shadow-navy/8 py-1"
			>
				{#each available as masjid, i}
					<li
						id="{idPrefix}-opt-{i}"
						role="option"
						aria-selected={i === activeIndex}
						class="px-4 py-2.5 cursor-pointer transition-colors select-none
							{i === activeIndex ? 'bg-emerald-accent/8' : 'hover:bg-navy/[0.03]'}"
						onmousedown={() => selectMasjid(masjid.id)}
						onmouseover={() => (activeIndex = i)}
						onfocus={() => (activeIndex = i)}
					>
						<div class="text-sm font-medium text-navy leading-snug">{formatMasjidLabel(masjid)}</div>
						<div class="text-xs text-navy/45 mt-0.5 leading-snug">{formatMasjidSublabel(masjid)}</div>
					</li>
				{/each}
			</ul>
		{:else if open && query.trim() !== '' && available.length === 0}
			<div class="absolute z-50 mt-1.5 w-full rounded-xl border border-navy/10 bg-white shadow-lg shadow-navy/8 px-4 py-3 text-sm text-navy/40">
				No masjid found for "{query}"
			</div>
		{/if}
	</div>

	{#each selectedIds.filter(isMasjidId) as masjidId}
		{@const masjid = getMasjidById(masjidId)}
		{@const pct = getPercentage(masjidId)}
		{#if masjid}
			<div class="rounded-xl border border-emerald-accent/30 bg-emerald-accent/5 p-4">
				<div class="flex items-start gap-3">
					<div class="flex-1 min-w-0">
						<h4 class="text-sm font-medium text-navy leading-snug">{masjid.name}</h4>
						<p class="text-xs text-navy/50 mt-0.5 leading-relaxed">{formatMasjidSublabel(masjid)}</p>
					</div>
					<button
						type="button"
						onclick={() => onremove(masjidId)}
						class="shrink-0 text-xs font-medium text-navy/45 hover:text-red-600 transition-colors cursor-pointer"
					>
						Remove
					</button>
				</div>
				<div class="mt-3 flex items-center gap-3">
					<label for="{idPrefix}-pct-{masjidId}" class="text-sm text-navy/70 whitespace-nowrap">
						Percentage:
					</label>
					<div class="flex items-center gap-2 flex-1 max-w-xs">
						<input
							id="{idPrefix}-pct-{masjidId}"
							type="number"
							min="0"
							max="100"
							step="0.1"
							value={pct}
							oninput={(e) => {
								const val = parseFloat(e.currentTarget.value);
								if (!isNaN(val)) onPercentageChange(masjidId, val);
							}}
							class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy bg-white outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
							placeholder="0"
						/>
						<span class="text-sm text-navy/50 shrink-0">%</span>
					</div>
				</div>
			</div>
		{/if}
	{/each}
</div>
