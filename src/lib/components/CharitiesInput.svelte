<script lang="ts">
	import type {
		CharitiesResponse,
		CharityResponse,
		QuestionResponseValue,
	} from '$lib/config';
	import { charities as presetCharities } from '$lib/config';
	import {
		isCharitiesResponseShape,
		isCustomCharityResponse,
		isPersonalDataShape,
		meetsDiscountedCharityPledge,
		getHusbandCharityPercentage,
		getWifeCharityPercentage,
		WASIYYAH_THIRD_PERCENT,
	} from '$lib/question-response-helpers';

	let {
		value,
		onresponse,
		allResponses = {},
		selectedPlan = null,
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		allResponses?: Record<string, QuestionResponseValue>;
		selectedPlan?: string | null;
	} = $props();

	const emptyState = (): CharitiesResponse => ({
		husbandInterested: false,
		wifeInterested: false,
		husbandCharities: [],
		wifeCharities: [],
	});

	function parse(v: QuestionResponseValue): CharitiesResponse {
		if (isCharitiesResponseShape(v)) return v;
		return emptyState();
	}

	let data = $derived(parse(value));

	function emit(next: CharitiesResponse) {
		onresponse(next);
	}

	$effect(() => {
		if (value == null || value === undefined) {
			onresponse(emptyState());
		}
	});

	function spouseLabel(key: 'husband-data' | 'wife-data'): string {
		const v = allResponses[key];
		if (isPersonalDataShape(v) && v.name.trim()) return v.name.trim();
		return key === 'husband-data' ? 'Husband' : 'Wife';
	}

	function newCustomId(): string {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
		return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
	}

	// ── Husband charity helpers ──────────────────────────────────────────────

	function setHusbandInterested(yes: boolean) {
		if (yes) {
			emit({ ...data, husbandInterested: true });
		} else {
			emit({ ...data, husbandInterested: false, husbandCharities: [] });
		}
	}

	function isHusbandCharitySelected(charityId: string): boolean {
		return data.husbandCharities.some((c) => c.charityId === charityId);
	}

	function toggleHusbandCharity(charityId: string) {
		const exists = data.husbandCharities.some((c) => c.charityId === charityId);
		if (exists) {
			const next = data.husbandCharities.filter((c) => c.charityId !== charityId);
			emit({ ...data, husbandCharities: next });
		} else {
			emit({ ...data, husbandCharities: [...data.husbandCharities, { charityId, percentage: 0 }] });
		}
	}

	function updateHusbandCharityPercentage(charityId: string, percentage: number) {
		const next = data.husbandCharities.map((c) =>
			c.charityId === charityId ? { ...c, percentage } : c
		);
		emit({ ...data, husbandCharities: next });
	}

	function addHusbandCustomCharity() {
		emit({
			...data,
			husbandCharities: [
				...data.husbandCharities,
				{ charityId: newCustomId(), percentage: 0, customName: '', customEin: '' },
			],
		});
	}

	function removeHusbandCustomCharity(charityId: string) {
		emit({ ...data, husbandCharities: data.husbandCharities.filter((c) => c.charityId !== charityId) });
	}

	function updateHusbandCustomField(charityId: string, field: 'customName' | 'customEin', fieldValue: string) {
		const next = data.husbandCharities.map((c) =>
			c.charityId === charityId && isCustomCharityResponse(c) ? { ...c, [field]: fieldValue } : c
		);
		emit({ ...data, husbandCharities: next });
	}

	// ── Wife charity helpers ─────────────────────────────────────────────────

	function copyHusbandBequests() {
		const copied = data.husbandCharities.map((c) =>
			isCustomCharityResponse(c)
				? { ...c, charityId: newCustomId() }
				: { ...c }
		);
		emit({ ...data, wifeInterested: true, wifeCharities: copied });
	}

	function setWifeInterested(yes: boolean) {
		if (yes) {
			emit({ ...data, wifeInterested: true });
		} else {
			emit({ ...data, wifeInterested: false, wifeCharities: [] });
		}
	}

	function isWifeCharitySelected(charityId: string): boolean {
		return data.wifeCharities.some((c) => c.charityId === charityId);
	}

	function toggleWifeCharity(charityId: string) {
		const exists = data.wifeCharities.some((c) => c.charityId === charityId);
		if (exists) {
			const next = data.wifeCharities.filter((c) => c.charityId !== charityId);
			emit({ ...data, wifeCharities: next });
		} else {
			emit({ ...data, wifeCharities: [...data.wifeCharities, { charityId, percentage: 0 }] });
		}
	}

	function updateWifeCharityPercentage(charityId: string, percentage: number) {
		const next = data.wifeCharities.map((c) =>
			c.charityId === charityId ? { ...c, percentage } : c
		);
		emit({ ...data, wifeCharities: next });
	}

	function addWifeCustomCharity() {
		emit({
			...data,
			wifeCharities: [
				...data.wifeCharities,
				{ charityId: newCustomId(), percentage: 0, customName: '', customEin: '' },
			],
		});
	}

	function removeWifeCustomCharity(charityId: string) {
		emit({ ...data, wifeCharities: data.wifeCharities.filter((c) => c.charityId !== charityId) });
	}

	function updateWifeCustomField(charityId: string, field: 'customName' | 'customEin', fieldValue: string) {
		const next = data.wifeCharities.map((c) =>
			c.charityId === charityId && isCustomCharityResponse(c) ? { ...c, [field]: fieldValue } : c
		);
		emit({ ...data, wifeCharities: next });
	}

	// ── Derived ──────────────────────────────────────────────────────────────

	let husbandPct = $derived(getHusbandCharityPercentage(data));
	let wifePct = $derived(getWifeCharityPercentage(data));
	let husbandOverCap = $derived(husbandPct > WASIYYAH_THIRD_PERCENT + 0.01);
	let wifeOverCap = $derived(wifePct > WASIYYAH_THIRD_PERCENT + 0.01);
	let discountedPledgeMet = $derived(
		selectedPlan !== 'discounted' || meetsDiscountedCharityPledge(data)
	);
</script>

<div class="space-y-6">
	<!-- Intro / discounted plan notice -->
	{#if selectedPlan === 'discounted'}
		<div
			class="rounded-xl border px-4 py-3 text-[13px] leading-relaxed {discountedPledgeMet
				? 'border-emerald-accent/25 bg-emerald-accent/5 text-navy/80'
				: 'border-amber-200 bg-amber-50 text-amber-950'}"
			role="status"
		>
			{#if discountedPledgeMet}
				Your wasiyyah pledge is satisfied — at least 1% is allocated to a charity you selected.
			{:else}
				You chose the discounted rate. To continue, allocate <strong>at least 1%</strong> of wasiyyah (from either spouse) to <strong>one</strong> of the charities below.
			{/if}
		</div>
	{/if}

	<!-- ── Husband section ── -->
	<div class="space-y-3">
		<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase">
			{spouseLabel('husband-data')}
		</div>
		<p class="text-[13px] text-navy/60">Would you like to include any charitable bequests in your wasiyyah?</p>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => setHusbandInterested(false)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{!data.husbandInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				No
			</button>
			<button
				type="button"
				onclick={() => setHusbandInterested(true)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{data.husbandInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				Yes
			</button>
		</div>

		{#if data.husbandInterested}
			<div class="space-y-3">
				<!-- Per-spouse limit indicator -->
				<div class="rounded-xl border border-navy/10 bg-navy/4 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
					<span class="text-[13px] font-medium text-navy/75">Wasiyyah used</span>
					<span class="text-sm font-semibold tabular-nums {husbandOverCap ? 'text-red-500' : 'text-emerald-accent'}">
						{husbandPct.toFixed(1)}% / {WASIYYAH_THIRD_PERCENT.toFixed(1)}% max
					</span>
				</div>
				{#if husbandOverCap}
					<p class="text-[13px] text-red-600 leading-relaxed">
						Charitable allocations exceed the one-third limit. Please reduce them.
					</p>
				{/if}

				<!-- Preset charities -->
				{#each presetCharities as charity}
					{@const selected = isHusbandCharitySelected(charity.id)}
					{@const charityData = data.husbandCharities.find((c) => c.charityId === charity.id)}
					{@const percentage = charityData?.percentage ?? 0}
					<div class="rounded-xl border transition-all duration-200
						{selected ? 'border-emerald-accent/30 bg-emerald-accent/5' : 'border-navy/10 bg-white'}">
						<div class="p-4">
							<div class="flex items-start gap-4">
								<button
									type="button"
									onclick={() => toggleHusbandCharity(charity.id)}
									class="flex items-center justify-center w-6 h-6 mt-1 rounded-md border-2 shrink-0 transition-colors cursor-pointer
										{selected ? 'border-emerald-accent bg-emerald-accent' : 'border-navy/20 bg-white hover:border-navy/30'}"
									aria-label={selected ? `Deselect ${charity.name}` : `Select ${charity.name}`}
								>
									{#if selected}
										<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</button>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3 mb-2">
										<div class="w-24 h-12 bg-white rounded-lg border border-navy/5 flex items-center justify-center p-2 shrink-0">
											<img src={charity.logo} alt="{charity.name} logo" class="max-w-full max-h-full object-contain" />
										</div>
										<div class="flex-1 min-w-0">
											<h3 class="text-base font-medium text-navy mb-0.5">{charity.name}</h3>
											<a href={charity.website} target="_blank" rel="noopener noreferrer"
												class="text-xs text-emerald-accent hover:text-emerald-accent/80 transition-colors">
												Visit Website →
											</a>
										</div>
									</div>
									{#if selected}
										<div class="mt-3 flex items-center gap-3">
											<label for="h-ch-{charity.id}" class="text-sm text-navy/70 whitespace-nowrap">
												Percentage:
											</label>
											<div class="flex items-center gap-2 flex-1 max-w-xs">
												<input
													id="h-ch-{charity.id}"
													type="number"
													min="0"
													max="100"
													step="0.1"
													value={percentage}
													oninput={(e) => {
														const val = parseFloat(e.currentTarget.value);
														if (!isNaN(val)) updateHusbandCharityPercentage(charity.id, val);
													}}
													class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
													placeholder="0"
												/>
												<span class="text-sm text-navy/50 shrink-0">%</span>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}

				<!-- Custom charities -->
				<div class="rounded-xl border border-navy/10 bg-navy/[0.02] p-4">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
						<div>
							<h3 class="text-sm font-medium text-navy">Other charities</h3>
							<p class="text-xs text-navy/55 mt-0.5">Add any U.S. charity by legal name and EIN.</p>
						</div>
						<button
							type="button"
							onclick={addHusbandCustomCharity}
							class="shrink-0 px-3 py-2 rounded-lg text-sm font-medium border border-emerald-accent/30 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-colors cursor-pointer"
						>
							Add charity
						</button>
					</div>
					{#each data.husbandCharities.filter((c) => isCustomCharityResponse(c)) as custom}
						<div class="rounded-lg border border-navy/10 bg-white p-3 mb-3 last:mb-0">
							<div class="grid gap-3 sm:grid-cols-2">
								<div>
									<label for="h-custom-name-{custom.charityId}" class="block text-xs text-navy/55 mb-1">Legal name</label>
									<input
										id="h-custom-name-{custom.charityId}"
										type="text"
										value={custom.customName}
										oninput={(e) => updateHusbandCustomField(custom.charityId, 'customName', e.currentTarget.value)}
										placeholder="Charity legal name"
										class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
									/>
								</div>
								<div>
									<label for="h-custom-ein-{custom.charityId}" class="block text-xs text-navy/55 mb-1">EIN</label>
									<input
										id="h-custom-ein-{custom.charityId}"
										type="text"
										value={custom.customEin}
										oninput={(e) => updateHusbandCustomField(custom.charityId, 'customEin', e.currentTarget.value)}
										placeholder="e.g. 12-3456789"
										class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
									/>
								</div>
							</div>
							<div class="mt-3 flex flex-wrap items-center gap-3">
								<label for="h-custom-pct-{custom.charityId}" class="text-sm text-navy/70 whitespace-nowrap">Wasiyyah %</label>
								<div class="flex items-center gap-2 flex-1 max-w-xs">
									<input
										id="h-custom-pct-{custom.charityId}"
										type="number"
										min="0"
										max="100"
										step="0.1"
										value={custom.percentage}
										oninput={(e) => {
											const val = parseFloat(e.currentTarget.value);
											if (!isNaN(val)) updateHusbandCharityPercentage(custom.charityId, val);
										}}
										class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
										placeholder="0"
									/>
									<span class="text-sm text-navy/50 shrink-0">%</span>
								</div>
								<button
									type="button"
									onclick={() => removeHusbandCustomCharity(custom.charityId)}
									class="ml-auto text-xs font-medium text-navy/45 hover:text-red-600 transition-colors cursor-pointer"
								>
									Remove
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- ── Wife section ── -->
	<div class="space-y-3 pt-2 border-t border-navy/8">
		<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase">
			{spouseLabel('wife-data')}
		</div>
		<p class="text-[13px] text-navy/60">Would you like to include any charitable bequests in your wasiyyah?</p>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => setWifeInterested(false)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{!data.wifeInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				No
			</button>
			<button
				type="button"
				onclick={() => setWifeInterested(true)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{data.wifeInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				Yes
			</button>
		</div>

		{#if data.husbandInterested && data.husbandCharities.length > 0}
			<button
				type="button"
				onclick={copyHusbandBequests}
				class="w-full py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2 border-dashed border-navy/20 text-navy/55 hover:border-navy/35 hover:text-navy/75 flex items-center justify-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
				</svg>
				Copy {spouseLabel('husband-data')}'s bequests
			</button>
		{/if}

		{#if data.wifeInterested}
			<div class="space-y-3">
				<!-- Per-spouse limit indicator -->
				<div class="rounded-xl border border-navy/10 bg-navy/4 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
					<span class="text-[13px] font-medium text-navy/75">Wasiyyah used</span>
					<span class="text-sm font-semibold tabular-nums {wifeOverCap ? 'text-red-500' : 'text-emerald-accent'}">
						{wifePct.toFixed(1)}% / {WASIYYAH_THIRD_PERCENT.toFixed(1)}% max
					</span>
				</div>
				{#if wifeOverCap}
					<p class="text-[13px] text-red-600 leading-relaxed">
						Charitable allocations exceed the one-third limit. Please reduce them.
					</p>
				{/if}

				<!-- Preset charities -->
				{#each presetCharities as charity}
					{@const selected = isWifeCharitySelected(charity.id)}
					{@const charityData = data.wifeCharities.find((c) => c.charityId === charity.id)}
					{@const percentage = charityData?.percentage ?? 0}
					<div class="rounded-xl border transition-all duration-200
						{selected ? 'border-emerald-accent/30 bg-emerald-accent/5' : 'border-navy/10 bg-white'}">
						<div class="p-4">
							<div class="flex items-start gap-4">
								<button
									type="button"
									onclick={() => toggleWifeCharity(charity.id)}
									class="flex items-center justify-center w-6 h-6 mt-1 rounded-md border-2 shrink-0 transition-colors cursor-pointer
										{selected ? 'border-emerald-accent bg-emerald-accent' : 'border-navy/20 bg-white hover:border-navy/30'}"
									aria-label={selected ? `Deselect ${charity.name}` : `Select ${charity.name}`}
								>
									{#if selected}
										<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</button>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3 mb-2">
										<div class="w-24 h-12 bg-white rounded-lg border border-navy/5 flex items-center justify-center p-2 shrink-0">
											<img src={charity.logo} alt="{charity.name} logo" class="max-w-full max-h-full object-contain" />
										</div>
										<div class="flex-1 min-w-0">
											<h3 class="text-base font-medium text-navy mb-0.5">{charity.name}</h3>
											<a href={charity.website} target="_blank" rel="noopener noreferrer"
												class="text-xs text-emerald-accent hover:text-emerald-accent/80 transition-colors">
												Visit Website →
											</a>
										</div>
									</div>
									{#if selected}
										<div class="mt-3 flex items-center gap-3">
											<label for="w-ch-{charity.id}" class="text-sm text-navy/70 whitespace-nowrap">
												Percentage:
											</label>
											<div class="flex items-center gap-2 flex-1 max-w-xs">
												<input
													id="w-ch-{charity.id}"
													type="number"
													min="0"
													max="100"
													step="0.1"
													value={percentage}
													oninput={(e) => {
														const val = parseFloat(e.currentTarget.value);
														if (!isNaN(val)) updateWifeCharityPercentage(charity.id, val);
													}}
													class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
													placeholder="0"
												/>
												<span class="text-sm text-navy/50 shrink-0">%</span>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}

				<!-- Custom charities -->
				<div class="rounded-xl border border-navy/10 bg-navy/[0.02] p-4">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
						<div>
							<h3 class="text-sm font-medium text-navy">Other charities</h3>
							<p class="text-xs text-navy/55 mt-0.5">Add any U.S. charity by legal name and EIN.</p>
						</div>
						<button
							type="button"
							onclick={addWifeCustomCharity}
							class="shrink-0 px-3 py-2 rounded-lg text-sm font-medium border border-emerald-accent/30 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-colors cursor-pointer"
						>
							Add charity
						</button>
					</div>
					{#each data.wifeCharities.filter((c) => isCustomCharityResponse(c)) as custom}
						<div class="rounded-lg border border-navy/10 bg-white p-3 mb-3 last:mb-0">
							<div class="grid gap-3 sm:grid-cols-2">
								<div>
									<label for="w-custom-name-{custom.charityId}" class="block text-xs text-navy/55 mb-1">Legal name</label>
									<input
										id="w-custom-name-{custom.charityId}"
										type="text"
										value={custom.customName}
										oninput={(e) => updateWifeCustomField(custom.charityId, 'customName', e.currentTarget.value)}
										placeholder="Charity legal name"
										class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
									/>
								</div>
								<div>
									<label for="w-custom-ein-{custom.charityId}" class="block text-xs text-navy/55 mb-1">EIN</label>
									<input
										id="w-custom-ein-{custom.charityId}"
										type="text"
										value={custom.customEin}
										oninput={(e) => updateWifeCustomField(custom.charityId, 'customEin', e.currentTarget.value)}
										placeholder="e.g. 12-3456789"
										class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
									/>
								</div>
							</div>
							<div class="mt-3 flex flex-wrap items-center gap-3">
								<label for="w-custom-pct-{custom.charityId}" class="text-sm text-navy/70 whitespace-nowrap">Wasiyyah %</label>
								<div class="flex items-center gap-2 flex-1 max-w-xs">
									<input
										id="w-custom-pct-{custom.charityId}"
										type="number"
										min="0"
										max="100"
										step="0.1"
										value={custom.percentage}
										oninput={(e) => {
											const val = parseFloat(e.currentTarget.value);
											if (!isNaN(val)) updateWifeCharityPercentage(custom.charityId, val);
										}}
										class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
										placeholder="0"
									/>
									<span class="text-sm text-navy/50 shrink-0">%</span>
								</div>
								<button
									type="button"
									onclick={() => removeWifeCustomCharity(custom.charityId)}
									class="ml-auto text-xs font-medium text-navy/45 hover:text-red-600 transition-colors cursor-pointer"
								>
									Remove
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
