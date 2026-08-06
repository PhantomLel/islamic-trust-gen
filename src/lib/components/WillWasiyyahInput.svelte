<script lang="ts">
	import MasajidBequestPicker from '$lib/components/MasajidBequestPicker.svelte';
	import { hasMasajidCatalog, isMasjidId } from '$lib/masajid';
	import { WILL_WASIYYAH_CAP, type WillWasiyyahEntry, type WillWasiyyahResponse, type WillResponseValue } from '$lib/free-will/config';

	let {
		value,
		onresponse,
		stateCode = '',
	}: {
		value: WillResponseValue;
		onresponse: (val: WillResponseValue) => void;
		stateCode?: string;
	} = $props();

	function isWasiyyahShape(v: unknown): v is WillWasiyyahResponse {
		return (
			!!v &&
			typeof v === 'object' &&
			'interested' in v &&
			typeof (v as any).interested === 'boolean' &&
			Array.isArray((v as any).bequests)
		);
	}

	function isCustomEntry(e: WillWasiyyahEntry): boolean {
		return typeof e.customName === 'string';
	}

	const emptyState = (): WillWasiyyahResponse => ({ interested: false, bequests: [] });

	function parse(v: unknown): WillWasiyyahResponse {
		if (isWasiyyahShape(v)) return v;
		return emptyState();
	}

	let data = $derived(parse(value));

	function emit(next: WillWasiyyahResponse) {
		onresponse(next);
	}

	$effect(() => {
		if (value == null || value === undefined) {
			onresponse(emptyState());
		}
	});

	let showMasjidPicker = $derived(hasMasajidCatalog(stateCode));

	// Drop catalog masjid selections when the user's state has no regional list.
	$effect(() => {
		const code = stateCode;
		if (hasMasajidCatalog(code)) return;
		const current = parse(value);
		const withoutMasajids = current.bequests.filter((b) => !isMasjidId(b.charityId));
		if (withoutMasajids.length !== current.bequests.length) {
			onresponse({ ...current, bequests: withoutMasajids });
		}
	});

	function newCustomId(): string {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
		return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
	}

	function setInterested(yes: boolean) {
		if (yes) {
			emit({ ...data, interested: true });
		} else {
			emit({ interested: false, bequests: [] });
		}
	}

	function isPresetSelected(charityId: string): boolean {
		return data.bequests.some((b) => b.charityId === charityId);
	}

	function togglePreset(charityId: string) {
		const exists = data.bequests.some((b) => b.charityId === charityId);
		if (exists) {
			emit({ ...data, bequests: data.bequests.filter((b) => b.charityId !== charityId) });
		} else {
			emit({ ...data, bequests: [...data.bequests, { charityId, percentage: 0 }] });
		}
	}

	function updatePercentage(charityId: string, percentage: number) {
		emit({
			...data,
			bequests: data.bequests.map((b) => (b.charityId === charityId ? { ...b, percentage } : b)),
		});
	}

	function addCustomCharity() {
		emit({
			...data,
			bequests: [
				...data.bequests,
				{ charityId: newCustomId(), percentage: 0, customName: '', customEin: '' },
			],
		});
	}

	function removeCustom(charityId: string) {
		emit({ ...data, bequests: data.bequests.filter((b) => b.charityId !== charityId) });
	}

	function updateCustomField(
		charityId: string,
		field: 'customName' | 'customEin' | 'einDeferred',
		val: string | boolean,
	) {
		emit({
			...data,
			bequests: data.bequests.map((b) =>
				b.charityId === charityId && isCustomEntry(b)
					? { ...b, [field]: val }
					: b,
			),
		});
	}

	function masjidIds(): string[] {
		return data.bequests.filter((b) => isMasjidId(b.charityId)).map((b) => b.charityId);
	}

	let totalPct = $derived(data.bequests.reduce((s, b) => s + (b.percentage || 0), 0));
	let overCap = $derived(totalPct > WILL_WASIYYAH_CAP + 0.01);
</script>

<div class="space-y-5">
	<!-- Intro -->
	<div class="rounded-2xl bg-white border border-navy/10 p-5 space-y-2 text-[14px] text-navy/70 leading-relaxed">
		<p>
			Islamic law permits you to leave up to one-third of your estate to anyone of your choosing — charities, institutions, or individuals. This portion is called your <strong class="text-navy/85">wasiyyah</strong>.
		</p>
		<p class="text-[13px] text-navy/50">This is optional. Most families leave this blank or donate to a local masjid or Islamic charity.</p>
	</div>

	<!-- Yes / No interest toggle -->
	<div class="space-y-2">
		<p class="text-[13px] text-navy/60">Would you like to include a wasiyyah in your will?</p>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => setInterested(false)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{!data.interested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				No
			</button>
			<button
				type="button"
				onclick={() => setInterested(true)}
				class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border-2
					{data.interested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/50 hover:border-navy/20'}"
			>
				Yes
			</button>
		</div>
	</div>

	{#if data.interested}
		<div class="space-y-3">
			<!-- Running total meter -->
			<div class="rounded-xl border border-navy/10 bg-navy/4 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
				<span class="text-[13px] font-medium text-navy/75">Wasiyyah used</span>
				<span class="text-sm font-semibold tabular-nums {overCap ? 'text-red-500' : 'text-emerald-accent'}">
					{totalPct.toFixed(1)}% / {WILL_WASIYYAH_CAP.toFixed(1)}% max
				</span>
			</div>
			{#if overCap}
				<p class="text-[13px] text-red-600 leading-relaxed">
					Total wasiyyah exceeds the one-third limit. Please reduce your allocations.
				</p>
			{/if}

			{#if showMasjidPicker}
				<MasajidBequestPicker
					idPrefix="will-masjid"
					stateCode={stateCode}
					selectedIds={masjidIds()}
					getPercentage={(id) => data.bequests.find((b) => b.charityId === id)?.percentage ?? 0}
					onselect={(id) => togglePreset(id)}
					onremove={(id) => togglePreset(id)}
					onPercentageChange={updatePercentage}
				/>
			{/if}

			<!-- Custom charities / recipients -->
			<div class="rounded-xl border border-navy/10 bg-navy/2 p-4">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
					<div>
						<h3 class="text-sm font-medium text-navy">Other charities or recipients</h3>
						<p class="text-xs text-navy/55 mt-0.5">Add any U.S. charity by legal name and EIN, or any other recipient.</p>
					</div>
					<button
						type="button"
						onclick={addCustomCharity}
						class="shrink-0 px-3 py-2 rounded-lg text-sm font-medium border border-emerald-accent/30 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-colors cursor-pointer"
					>
						Add recipient
					</button>
				</div>
				{#each data.bequests.filter((b) => isCustomEntry(b)) as custom}
					<div class="rounded-lg border border-navy/10 bg-white p-3 mb-3 last:mb-0">
						<div class="grid gap-3 sm:grid-cols-2">
							<div>
								<label for="w-custom-name-{custom.charityId}" class="block text-xs text-navy/55 mb-1">Name</label>
								<input
									id="w-custom-name-{custom.charityId}"
									type="text"
									value={custom.customName}
									oninput={(e) => updateCustomField(custom.charityId, 'customName', e.currentTarget.value)}
									placeholder="Charity or recipient name"
									class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
								/>
							</div>
							<div>
								<label for="w-custom-ein-{custom.charityId}" class="block text-xs text-navy/55 mb-1">EIN (if charity)</label>
								<input
									id="w-custom-ein-{custom.charityId}"
									type="text"
									value={custom.customEin}
									disabled={custom.einDeferred}
									oninput={(e) => updateCustomField(custom.charityId, 'customEin', e.currentTarget.value)}
									placeholder="e.g. 12-3456789"
									class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10 disabled:opacity-50"
								/>
								<label class="mt-2 flex items-start gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={custom.einDeferred === true}
										onchange={(e) => {
											const deferred = e.currentTarget.checked;
											updateCustomField(custom.charityId, 'einDeferred', deferred);
											if (deferred) updateCustomField(custom.charityId, 'customEin', '');
										}}
										class="mt-0.5 w-4 h-4 accent-emerald-accent cursor-pointer shrink-0"
									/>
									<span class="text-xs text-navy/55 leading-relaxed">I&apos;ll add the EIN later</span>
								</label>
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
										if (!isNaN(val)) updatePercentage(custom.charityId, val);
									}}
									class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
									placeholder="0"
								/>
								<span class="text-sm text-navy/50 shrink-0">%</span>
							</div>
							<button
								type="button"
								onclick={() => removeCustom(custom.charityId)}
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
