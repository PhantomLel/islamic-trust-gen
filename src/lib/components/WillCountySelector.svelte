<script lang="ts">
	let {
		value = $bindable(''),
		counties = [],
		stateName = '',
		onchange,
		placeholder = 'Search counties…',
		inputClass = ''
	}: {
		value?: string;
		counties: string[];
		stateName?: string;
		onchange?: (v: string) => void;
		placeholder?: string;
		inputClass?: string;
	} = $props();

	let query = $state(value ?? '');
	let open = $state(false);
	let activeIndex = $state(-1);
	let listEl = $state<HTMLUListElement | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		query = value ?? '';
	});

	let filtered = $derived(
		query.trim() === ''
			? counties
			: counties.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()))
	);

	function select(county: string) {
		query = county;
		value = county;
		onchange?.(county);
		open = false;
		activeIndex = -1;
	}

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		query = e.currentTarget.value;
		open = true;
		activeIndex = -1;

		const exact = counties.find((c) => c.toLowerCase() === query.trim().toLowerCase());
		if (exact) {
			value = exact;
			onchange?.(exact);
		} else {
			value = '';
			onchange?.('');
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
			open = true;
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
			scrollActive();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
			scrollActive();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (activeIndex >= 0 && filtered[activeIndex]) {
				select(filtered[activeIndex]);
			} else if (filtered.length === 1) {
				select(filtered[0]);
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
			const exact = counties.find((c) => c.toLowerCase() === query.trim().toLowerCase());
			if (!exact) {
				query = '';
				value = '';
				onchange?.('');
			} else {
				query = exact;
			}
		}, 150);
	}

	const defaultInputClass = `w-full px-5 py-4 rounded-xl bg-white/70 border border-navy/12 text-navy text-[15px]
		placeholder:text-navy/30 outline-none transition-all
		focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15`;
</script>

<div class="relative">
	<div class="relative">
		<input
			bind:this={inputEl}
			type="text"
			autocomplete="off"
			spellcheck="false"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={open}
			aria-haspopup="listbox"
			aria-activedescendant={activeIndex >= 0 ? `county-opt-${activeIndex}` : undefined}
			value={query}
			{placeholder}
			class="{inputClass !== '' ? inputClass : defaultInputClass} pr-10"
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

	{#if open && filtered.length > 0}
		<ul
			bind:this={listEl}
			role="listbox"
			aria-label="{stateName} counties"
			class="absolute z-50 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-navy/10 bg-white shadow-lg shadow-navy/8 py-1"
		>
			{#each filtered as county, i}
				<li
					id="county-opt-{i}"
					role="option"
					aria-selected={i === activeIndex}
					class="flex items-center px-4 py-2.5 text-sm cursor-pointer transition-colors select-none
						   {i === activeIndex ? 'bg-emerald-accent/8 text-navy' : 'text-navy/70 hover:bg-emerald-accent/8 hover:text-navy'}"
					onmousedown={() => select(county)}
					onmouseover={() => (activeIndex = i)}
					onfocus={() => (activeIndex = i)}
				>
					{county}
				</li>
			{/each}
		</ul>
	{:else if open && query.trim() !== '' && filtered.length === 0}
		<div class="absolute z-50 mt-1.5 w-full rounded-xl border border-navy/10 bg-white shadow-lg shadow-navy/8 px-4 py-3 text-sm text-navy/40">
			No county found for "{query}"
		</div>
	{/if}
</div>
