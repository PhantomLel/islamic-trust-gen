<script lang="ts">
	import type {
		NonCharitableBequestEntry,
		NonCharitableBequestsResponse,
		QuestionResponseValue,
	} from '$lib/config';
	import {
		getTotalCharityPercentage,
		getCombinedWasiyyahPercentage,
		WASIYYAH_THIRD_PERCENT,
		isPersonalDataShape,
	} from '$lib/question-response-helpers';
	import InfoPopout from './InfoPopout.svelte';
	import WhatsAppHelpLink from './WhatsAppHelpLink.svelte';

	let {
		value,
		onresponse,
		allResponses = {},
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		allResponses?: Record<string, QuestionResponseValue>;
	} = $props();

	const emptyState = (): NonCharitableBequestsResponse => ({
		husbandInterested: false,
		wifeInterested: false,
		husbandBequests: [],
		wifeBequests: [],
	});

	const emptyRow = (): NonCharitableBequestEntry => ({
		recipientName: '',
		relationship: '',
		percentage: 1,
	});

	function normalizeRow(r: Partial<NonCharitableBequestEntry>): NonCharitableBequestEntry {
		const p = typeof r.percentage === 'number' && Number.isFinite(r.percentage) ? Math.round(r.percentage) : 1;
		return {
			recipientName: typeof r.recipientName === 'string' ? r.recipientName : '',
			relationship: typeof r.relationship === 'string' ? r.relationship : '',
			percentage: Math.min(33, Math.max(1, p)),
		};
	}

	function parse(v: QuestionResponseValue): NonCharitableBequestsResponse {
		if (v != null && typeof v === 'object' && !Array.isArray(v) && 'husbandInterested' in v) {
			const o = v as NonCharitableBequestsResponse;
			return {
				husbandInterested: !!o.husbandInterested,
				wifeInterested: !!o.wifeInterested,
				husbandBequests: Array.isArray(o.husbandBequests) ? o.husbandBequests.map(normalizeRow) : [],
				wifeBequests: Array.isArray(o.wifeBequests) ? o.wifeBequests.map(normalizeRow) : [],
			};
		}
		return emptyState();
	}

	let ncb = $derived(parse(value));

	let blockedPopout = $state(false);
	let thirdPopout = $state(false);

	function spouseLabel(key: 'husband-data' | 'wife-data'): string {
		const v = allResponses[key];
		if (isPersonalDataShape(v) && v.name.trim()) return v.name.trim();
		return key === 'husband-data' ? 'Husband' : 'Wife';
	}

	let charityPct = $derived(getTotalCharityPercentage(allResponses['charities']));
	let combinedPct = $derived(getCombinedWasiyyahPercentage(allResponses['charities'], ncb));
	let overCap = $derived(combinedPct > WASIYYAH_THIRD_PERCENT + 0.01);

	function emit(next: NonCharitableBequestsResponse) {
		onresponse(next);
	}

	$effect(() => {
		if (value == null || value === undefined) {
			onresponse(emptyState());
		}
	});

	function otherNonCharitySumExcluding(spouse: 'husband' | 'wife', idx: number): number {
		let s = 0;
		for (let i = 0; i < ncb.husbandBequests.length; i++) {
			if (spouse === 'husband' && i === idx) continue;
			s += ncb.husbandBequests[i]?.percentage ?? 0;
		}
		for (let i = 0; i < ncb.wifeBequests.length; i++) {
			if (spouse === 'wife' && i === idx) continue;
			s += ncb.wifeBequests[i]?.percentage ?? 0;
		}
		return s;
	}

	function maxPctFor(spouse: 'husband' | 'wife', idx: number): number {
		const other = otherNonCharitySumExcluding(spouse, idx);
		const headroom = WASIYYAH_THIRD_PERCENT - charityPct - other;
		return Math.max(0, Math.min(33, Math.floor(headroom + 1e-9)));
	}

	function setHusbandInterested(yes: boolean) {
		if (yes) {
			const rows = ncb.husbandBequests.length > 0 ? ncb.husbandBequests : [emptyRow()];
			emit({ ...ncb, husbandInterested: true, husbandBequests: rows });
		} else {
			emit({ ...ncb, husbandInterested: false, husbandBequests: [] });
		}
	}

	function setWifeInterested(yes: boolean) {
		if (yes) {
			const rows = ncb.wifeBequests.length > 0 ? ncb.wifeBequests : [emptyRow()];
			emit({ ...ncb, wifeInterested: true, wifeBequests: rows });
		} else {
			emit({ ...ncb, wifeInterested: false, wifeBequests: [] });
		}
	}

	function updateHusbandRow(index: number, patch: Partial<NonCharitableBequestEntry>) {
		const next = ncb.husbandBequests.map((r, i) => (i === index ? { ...r, ...patch } : r));
		emit({ ...ncb, husbandBequests: next });
	}

	function updateWifeRow(index: number, patch: Partial<NonCharitableBequestEntry>) {
		const next = ncb.wifeBequests.map((r, i) => (i === index ? { ...r, ...patch } : r));
		emit({ ...ncb, wifeBequests: next });
	}

	function setRowPercentage(spouse: 'husband' | 'wife', index: number, raw: number) {
		const maxP = maxPctFor(spouse, index);
		let pct = Math.round(raw);
		if (!Number.isFinite(pct)) pct = 1;
		pct = Math.min(33, Math.max(1, pct));
		if (maxP >= 1) {
			pct = Math.min(pct, maxP);
		}
		if (spouse === 'husband') {
			updateHusbandRow(index, { percentage: pct });
		} else {
			updateWifeRow(index, { percentage: pct });
		}
	}

	function addHusbandRow() {
		emit({ ...ncb, husbandBequests: [...ncb.husbandBequests, emptyRow()] });
	}

	function addWifeRow() {
		emit({ ...ncb, wifeBequests: [...ncb.wifeBequests, emptyRow()] });
	}

	function removeHusbandRow(index: number) {
		const next = ncb.husbandBequests.filter((_, i) => i !== index);
		emit({ ...ncb, husbandBequests: next.length > 0 ? next : [emptyRow()] });
	}

	function removeWifeRow(index: number) {
		const next = ncb.wifeBequests.filter((_, i) => i !== index);
		emit({ ...ncb, wifeBequests: next.length > 0 ? next : [emptyRow()] });
	}
</script>

<div class="space-y-6">
	<div class="rounded-2xl bg-white border border-navy/10 p-6 space-y-3 text-[14px] text-navy/70 leading-relaxed">
		<p>
			In addition to charitable bequests, Islamic law permits you to leave up to one third of your estate to individuals who are
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				role="button"
				tabindex="0"
				onclick={() => (blockedPopout = true)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						blockedPopout = true;
					}
				}}
				class="font-medium text-navy/85 underline decoration-navy/25 hover:decoration-navy/60 cursor-pointer transition-colors"
			>not entitled to an Islamic inheritance share</span>
			— for example, a grandchild whose parent is still living, a non-Muslim family member, or a close friend.
		</p>
		<p>This is optional. Most families leave this blank.</p>
		<p>
			Remember: the total of all bequests — charitable and non-charitable combined — cannot exceed
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				role="button"
				tabindex="0"
				onclick={() => (thirdPopout = true)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						thirdPopout = true;
					}
				}}
				class="font-medium text-navy/85 underline decoration-navy/25 hover:decoration-navy/60 cursor-pointer transition-colors"
			>one third of your estate</span>.
		</p>
	</div>

	<div class="rounded-xl border border-navy/10 bg-navy/4 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
		<span class="text-[13px] font-medium text-navy/75">Wasiyyah used (charity + below)</span>
		<span class="text-sm font-semibold tabular-nums {overCap ? 'text-red-500' : 'text-emerald-accent'}">
			{combinedPct.toFixed(1)}% / {WASIYYAH_THIRD_PERCENT.toFixed(1)}% max
		</span>
	</div>
	{#if charityPct > WASIYYAH_THIRD_PERCENT + 0.01}
		<p class="text-[13px] text-red-600 leading-relaxed">
			Your charitable allocations alone exceed the one-third limit. Go back and reduce them before adding non-charitable bequests.
		</p>
	{/if}

	<!-- Husband -->
	<div class="space-y-3">
		<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase">
			{spouseLabel('husband-data')}
		</div>
		<p class="text-[13px] text-navy/60">Would you like to name any non-charitable bequests?</p>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => setHusbandInterested(false)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{!ncb.husbandInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				No
			</button>
			<button
				type="button"
				onclick={() => setHusbandInterested(true)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{ncb.husbandInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				Yes
			</button>
		</div>

		{#if ncb.husbandInterested}
			<div class="space-y-3">
				{#each ncb.husbandBequests as row, i}
					<div class="rounded-2xl border border-navy/8 bg-white p-4 space-y-3">
						<div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
							<div class="sm:col-span-5">
								<label for="h-nc-name-{i}" class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Recipient name</label>
								<input
									id="h-nc-name-{i}"
									type="text"
									value={row.recipientName}
									oninput={(e) => updateHusbandRow(i, { recipientName: e.currentTarget.value })}
									class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
									placeholder="Full name"
								/>
							</div>
							<div class="sm:col-span-4">
								<label for="h-nc-rel-{i}" class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Relationship</label>
								<input
									id="h-nc-rel-{i}"
									type="text"
									value={row.relationship}
									oninput={(e) => updateHusbandRow(i, { relationship: e.currentTarget.value })}
									class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
									placeholder="e.g. Grandchild, friend"
								/>
							</div>
							<div class="sm:col-span-2">
								<label for="h-nc-pct-{i}" class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">% of estate</label>
								<input
									id="h-nc-pct-{i}"
									type="number"
									min="1"
									max="33"
									step="1"
									value={row.percentage}
									oninput={(e) => setRowPercentage('husband', i, parseInt(e.currentTarget.value, 10))}
									class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy tabular-nums focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
								/>
								<p class="text-[10px] text-navy/40 mt-1">Max {maxPctFor('husband', i)}% with current entries</p>
							</div>
							<div class="sm:col-span-1 flex justify-end">
								{#if ncb.husbandBequests.length > 1}
									<button
										type="button"
										onclick={() => removeHusbandRow(i)}
										aria-label="Remove bequest"
										class="p-2 rounded-lg text-navy/25 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
									>
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
				<button
					type="button"
					onclick={addHusbandRow}
					class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-navy/12 text-sm font-medium text-navy/70 hover:bg-navy/4 transition-colors cursor-pointer"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Add bequest
				</button>
			</div>
		{/if}
	</div>

	<!-- Wife -->
	<div class="space-y-3 pt-2 border-t border-navy/8">
		<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase">
			{spouseLabel('wife-data')}
		</div>
		<p class="text-[13px] text-navy/60">Would you like to name any non-charitable bequests?</p>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => setWifeInterested(false)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{!ncb.wifeInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				No
			</button>
			<button
				type="button"
				onclick={() => setWifeInterested(true)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{ncb.wifeInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				Yes
			</button>
		</div>

		{#if ncb.wifeInterested}
			<div class="space-y-3">
				{#each ncb.wifeBequests as row, i}
					<div class="rounded-2xl border border-navy/8 bg-white p-4 space-y-3">
						<div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
							<div class="sm:col-span-5">
								<label for="w-nc-name-{i}" class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Recipient name</label>
								<input
									id="w-nc-name-{i}"
									type="text"
									value={row.recipientName}
									oninput={(e) => updateWifeRow(i, { recipientName: e.currentTarget.value })}
									class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
									placeholder="Full name"
								/>
							</div>
							<div class="sm:col-span-4">
								<label for="w-nc-rel-{i}" class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Relationship</label>
								<input
									id="w-nc-rel-{i}"
									type="text"
									value={row.relationship}
									oninput={(e) => updateWifeRow(i, { relationship: e.currentTarget.value })}
									class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
									placeholder="e.g. Grandchild, friend"
								/>
							</div>
							<div class="sm:col-span-2">
								<label for="w-nc-pct-{i}" class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">% of estate</label>
								<input
									id="w-nc-pct-{i}"
									type="number"
									min="1"
									max="33"
									step="1"
									value={row.percentage}
									oninput={(e) => setRowPercentage('wife', i, parseInt(e.currentTarget.value, 10))}
									class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy tabular-nums focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10"
								/>
								<p class="text-[10px] text-navy/40 mt-1">Max {maxPctFor('wife', i)}% with current entries</p>
							</div>
							<div class="sm:col-span-1 flex justify-end">
								{#if ncb.wifeBequests.length > 1}
									<button
										type="button"
										onclick={() => removeWifeRow(i)}
										aria-label="Remove bequest"
										class="p-2 rounded-lg text-navy/25 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
									>
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
				<button
					type="button"
					onclick={addWifeRow}
					class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-navy/12 text-sm font-medium text-navy/70 hover:bg-navy/4 transition-colors cursor-pointer"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Add bequest
				</button>
			</div>
		{/if}
	</div>

	<WhatsAppHelpLink
		message="I have a question about who I can leave a bequest to."
		label="I have a question about who I can leave a bequest to"
	/>
</div>

<InfoPopout open={blockedPopout} onclose={() => (blockedPopout = false)} title="Not entitled to an Islamic inheritance share">
	<p>
		Under Islamic law, certain relatives are blocked from inheriting because a closer relative takes priority. For example, grandchildren are blocked if their parent — your child — is still alive. A bequest allows you to provide for them outside the inheritance system, up to the one-third limit.
	</p>
</InfoPopout>

<InfoPopout open={thirdPopout} onclose={() => (thirdPopout = false)} title="The one-third limit">
	<p>
		The one-third limit applies to all bequests combined — charitable and non-charitable. If you have already designated charitable bequests on the previous screen, those count toward this limit. Your trustee will reduce any excess proportionally.
	</p>
</InfoPopout>
