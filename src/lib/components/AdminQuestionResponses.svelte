<script lang="ts">
	import { invalidateAll } from '$app/navigation';
import {
	allIntakeQuestions,
	type ChildResponse,
	type HeirResponse,
	type CharityResponse,
	type CharitiesResponse,
	type HeirsCalculatorResponse,
	type PersonalDataResponse,
	type QuestionResponseValue,
	type AssetAllocationEntry,
	type HebaAssetEntry,
	type SuccessorTrusteeEntry,
	type PourOverRepresentativeEntry,
	type MinorDistributionResponse
} from '$lib/config';
	import {
		getIntakeQuestionnaireProgress,
		isCharitiesResponseShape,
		isCustomCharityResponse,
		isNonCharitableBequestsShape,
		isPersonalDataShape,
		isQuestionResponseAnswered
	} from '$lib/question-response-helpers';
	import { resolveCharityName } from '$lib/charityLookup';
	import { isMasjidId } from '$lib/masajid';

	type TrustResponse = { id: string; response: unknown };
	type TrustDetails = {
		id: number;
		complete: boolean;
		responses: TrustResponse[];
		hasPaid?: boolean;
	};

	let { trust }: { trust: TrustDetails } = $props();

	let editing = $state(false);
	let editResponses = $state<Record<string, QuestionResponseValue>>({});
	let saving = $state(false);

	let trustProgress = $derived(
		getIntakeQuestionnaireProgress(trust.responses, { hasPaid: trust.hasPaid ?? false })
	);

	function enterEdit() {
		editing = true;
		const map: Record<string, QuestionResponseValue> = {};
		for (const response of trust.responses) {
			map[response.id] = response.response as QuestionResponseValue;
		}
		editResponses = map;
	}

	function exitEdit() {
		editing = false;
		editResponses = {};
	}

	function setEditValue(questionId: string, value: QuestionResponseValue) {
		editResponses = { ...editResponses, [questionId]: value };
	}

	function normalizeChildren(value: unknown): ChildResponse[] {
		if (!Array.isArray(value)) return [];
		return value
			.filter((child) => !!child && typeof child === 'object')
			.map((child) => {
				const entry = child as Partial<ChildResponse>;
				return {
					firstName: typeof entry.firstName === 'string' ? entry.firstName : '',
					lastName: typeof entry.lastName === 'string' ? entry.lastName : '',
					dob: typeof entry.dob === 'string' ? entry.dob : ''
				};
			});
	}

	function getEditChildren(questionId: string): ChildResponse[] {
		return normalizeChildren(editResponses[questionId]);
	}

	function normalizeHeirs(value: unknown): HeirResponse[] {
		if (!Array.isArray(value)) return [];
		return value
			.filter((heir) => !!heir && typeof heir === 'object')
			.map((heir) => {
				const entry = heir as Partial<HeirResponse>;
				return {
					firstName: typeof entry.firstName === 'string' ? entry.firstName : '',
					lastName: typeof entry.lastName === 'string' ? entry.lastName : ''
				};
			});
	}

	function getEditHeirs(questionId: string): HeirResponse[] {
		return normalizeHeirs(editResponses[questionId]);
	}

	function updateEditChild(questionId: string, index: number, field: keyof ChildResponse, value: string) {
		const next = getEditChildren(questionId);
		next[index] = {
			...next[index],
			[field]: value
		};
		setEditValue(questionId, next);
	}

	function addEditChild(questionId: string) {
		setEditValue(questionId, [
			...getEditChildren(questionId),
			{ firstName: '', lastName: '', dob: '' }
		]);
	}

	function removeEditChild(questionId: string, index: number) {
		const next = getEditChildren(questionId).filter((_, i) => i !== index);
		setEditValue(questionId, next.length > 0 ? next : null);
	}

	function updateEditHeir(questionId: string, index: number, field: keyof HeirResponse, value: string) {
		const next = getEditHeirs(questionId);
		next[index] = {
			...next[index],
			[field]: value
		};
		setEditValue(questionId, next);
	}

	function addEditHeir(questionId: string) {
		setEditValue(questionId, [...getEditHeirs(questionId), { firstName: '', lastName: '' }]);
	}

	function removeEditHeir(questionId: string, index: number) {
		const next = getEditHeirs(questionId).filter((_, i) => i !== index);
		setEditValue(questionId, next.length > 0 ? next : null);
	}

	function normalizeCharitiesArray(arr: unknown): CharityResponse[] {
		if (!Array.isArray(arr)) return [];
		return arr
			.filter((charity) => !!charity && typeof charity === 'object')
			.map((charity) => {
				const entry = charity as Partial<CharityResponse>;
				const base: CharityResponse = {
					charityId: typeof entry.charityId === 'string' ? entry.charityId : '',
					percentage: typeof entry.percentage === 'number' ? entry.percentage : 0
				};
				if (typeof entry.customName === 'string') {
					return {
						...base,
						customName: entry.customName,
						customEin: typeof entry.customEin === 'string' ? entry.customEin : ''
					};
				}
				return base;
			});
	}

	function normalizeCharitiesResponse(value: unknown): CharitiesResponse {
		if (isCharitiesResponseShape(value)) return value;
		return { husbandInterested: false, wifeInterested: false, husbandCharities: [], wifeCharities: [] };
	}

	function newAdminCustomCharityId(): string {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
		return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
	}

	function getEditCharitiesResponse(questionId: string): CharitiesResponse {
		return normalizeCharitiesResponse(editResponses[questionId]);
	}

	function setEditCharitiesResponse(questionId: string, next: CharitiesResponse) {
		setEditValue(questionId, next);
	}

	function setEditHusbandInterested(questionId: string, yes: boolean) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, yes ? { ...cr, husbandInterested: true } : { ...cr, husbandInterested: false, husbandCharities: [] });
	}

	function setEditWifeInterested(questionId: string, yes: boolean) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, yes ? { ...cr, wifeInterested: true } : { ...cr, wifeInterested: false, wifeCharities: [] });
	}

	function toggleEditHusbandCharity(questionId: string, charityId: string) {
		const cr = getEditCharitiesResponse(questionId);
		const exists = cr.husbandCharities.some((c) => c.charityId === charityId);
		const next = exists
			? cr.husbandCharities.filter((c) => c.charityId !== charityId)
			: [...cr.husbandCharities, { charityId, percentage: 0 }];
		setEditCharitiesResponse(questionId, { ...cr, husbandCharities: next });
	}

	function toggleEditWifeCharity(questionId: string, charityId: string) {
		const cr = getEditCharitiesResponse(questionId);
		const exists = cr.wifeCharities.some((c) => c.charityId === charityId);
		const next = exists
			? cr.wifeCharities.filter((c) => c.charityId !== charityId)
			: [...cr.wifeCharities, { charityId, percentage: 0 }];
		setEditCharitiesResponse(questionId, { ...cr, wifeCharities: next });
	}

	function updateEditHusbandCharityPct(questionId: string, charityId: string, percentage: number) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, { ...cr, husbandCharities: cr.husbandCharities.map((c) => c.charityId === charityId ? { ...c, percentage } : c) });
	}

	function updateEditWifeCharityPct(questionId: string, charityId: string, percentage: number) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, { ...cr, wifeCharities: cr.wifeCharities.map((c) => c.charityId === charityId ? { ...c, percentage } : c) });
	}

	function addEditHusbandCustomCharity(questionId: string) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, { ...cr, husbandCharities: [...cr.husbandCharities, { charityId: newAdminCustomCharityId(), percentage: 0, customName: '', customEin: '' }] });
	}

	function addEditWifeCustomCharity(questionId: string) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, { ...cr, wifeCharities: [...cr.wifeCharities, { charityId: newAdminCustomCharityId(), percentage: 0, customName: '', customEin: '' }] });
	}

	function removeEditHusbandCustomCharity(questionId: string, charityId: string) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, { ...cr, husbandCharities: cr.husbandCharities.filter((c) => c.charityId !== charityId) });
	}

	function removeEditWifeCustomCharity(questionId: string, charityId: string) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, { ...cr, wifeCharities: cr.wifeCharities.filter((c) => c.charityId !== charityId) });
	}

	function updateEditHusbandCustomField(questionId: string, charityId: string, field: 'customName' | 'customEin', fieldValue: string) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, { ...cr, husbandCharities: cr.husbandCharities.map((c) => c.charityId === charityId && isCustomCharityResponse(c) ? { ...c, [field]: fieldValue } : c) });
	}

	function updateEditWifeCustomField(questionId: string, charityId: string, field: 'customName' | 'customEin', fieldValue: string) {
		const cr = getEditCharitiesResponse(questionId);
		setEditCharitiesResponse(questionId, { ...cr, wifeCharities: cr.wifeCharities.map((c) => c.charityId === charityId && isCustomCharityResponse(c) ? { ...c, [field]: fieldValue } : c) });
	}

	function normalizePersonalData(value: unknown): PersonalDataResponse {
		if (isPersonalDataShape(value)) {
			return {
				name: typeof value.name === 'string' ? value.name : '',
				dob: typeof value.dob === 'string' ? value.dob : '',
				county: typeof value.county === 'string' ? value.county : ''
			};
		}
		return { name: '', dob: '', county: '' };
	}

	function updateEditPersonal(questionId: string, part: Partial<PersonalDataResponse>) {
		const next = { ...normalizePersonalData(editResponses[questionId]), ...part };
		setEditValue(questionId, next);
	}

	function normalizeHeirsCalculator(value: unknown): HeirsCalculatorResponse | null {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
		if (!('verified' in value)) return null;
		return value as HeirsCalculatorResponse;
	}

	function getRawResponse(responses: TrustResponse[], questionId: string): unknown {
		const response = responses.find((res) => res.id === questionId);
		return response?.response ?? null;
	}

	function getAnswer(responses: TrustResponse[], questionId: string): string {
		const raw = getRawResponse(responses, questionId);
		if (raw == null) return '—';
		if (isCharitiesResponseShape(raw)) {
			const total = raw.husbandCharities.length + raw.wifeCharities.length;
			if (total === 0 && !raw.husbandInterested && !raw.wifeInterested) return 'None';
			const parts: string[] = [];
			if (raw.husbandInterested) parts.push(`Husband: ${raw.husbandCharities.length} charity(ies)`);
			if (raw.wifeInterested) parts.push(`Wife: ${raw.wifeCharities.length} charity(ies)`);
			return parts.length > 0 ? parts.join(' · ') : 'None';
		}
		if (Array.isArray(raw)) {
			if (raw.length === 0) return '—';
			const first = raw[0];
			if (first && typeof first === 'object' && 'firstName' in first) {
				const children = normalizeChildren(raw);
				return children.length > 0 ? `${children.length} child(ren)` : '—';
			}
			return '—';
		}
		if (raw && typeof raw === 'object' && 'verified' in raw) {
			const hc = raw as HeirsCalculatorResponse;
			if (!hc.verified) return 'Not completed';
			return `${hc.namedHeirs.length} heir(s) — ${hc.namedHeirs.map(h => h.names.join(', ')).join('; ')}`;
		}
		if (isPersonalDataShape(raw)) {
			const p = normalizePersonalData(raw);
			if (!p.name.trim() && !p.dob.trim() && !p.county.trim()) return '—';
			const dobLabel = p.dob ? formatDob(p.dob) : '—';
			return `${p.name.trim() || '—'} · DOB ${dobLabel} · ${p.county.trim() || '—'} County`;
		}
		if (isNonCharitableBequestsShape(raw)) {
			if (!raw.husbandInterested && !raw.wifeInterested) return 'None';
			const parts: string[] = [];
			if (raw.husbandInterested && raw.husbandBequests.length > 0) {
				parts.push(
					`Husband: ${raw.husbandBequests.map((b) => `${b.recipientName} (${b.percentage}%)`).join('; ')}`
				);
			}
			if (raw.wifeInterested && raw.wifeBequests.length > 0) {
				parts.push(`Wife: ${raw.wifeBequests.map((b) => `${b.recipientName} (${b.percentage}%)`).join('; ')}`);
			}
			return parts.length > 0 ? parts.join(' · ') : '—';
		}
		if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
		return String(raw);
	}

	function formatDob(dob: string): string {
		const [year, month, day] = dob.split('-').map(Number);
		if (!year || !month || !day) return dob;
		return new Date(year, month - 1, day).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function isMinorDistributionShape(value: unknown): value is MinorDistributionResponse {
		return (
			value != null &&
			typeof value === 'object' &&
			!Array.isArray(value) &&
			'mode' in value &&
			['staggered', 'single-age', 'age-of-majority'].includes((value as { mode: string }).mode)
		);
	}

	const ownershipLabels: Record<string, string> = {
		heba: 'Heba (gift to spouse)',
		assets: 'Asset-by-asset designation',
		'50-50': 'Equal (50/50)',
		husband: 'Husband owns all',
		wife: 'Wife owns all'
	};

	const trusteeOnFirstDeathLabels: Record<string, string> = {
		'survivor-serves': 'Surviving spouse serves as trustee',
		'survivor-skipped': 'Survivor skips — go to successors directly'
	};

	function formatSpouse(spouse: string): string {
		if (spouse === '50-50') return 'Joint (50/50)';
		if (spouse === 'husband') return 'Husband';
		if (spouse === 'wife') return 'Wife';
		return spouse;
	}

	function getChildDisplayName(child: ChildResponse): string {
		const fullName = `${child.firstName} ${child.lastName}`.trim();
		return fullName || 'Unnamed child';
	}

	async function saveEdit() {
		saving = true;
		const responses = allIntakeQuestions.map((q) => ({
			id: q.id,
			response: editResponses[q.id] ?? null
		}));
		const formData = new FormData();
		formData.set('trustId', String(trust.id));
		formData.set('responses', JSON.stringify(responses));
		await fetch('?/save', { method: 'POST', body: formData });
		await invalidateAll();
		saving = false;
		exitEdit();
	}
</script>

<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden">
	<div class="px-6 py-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h2 class="text-sm font-medium text-navy">Intake Responses</h2>
			<div class="flex items-center gap-2">
				<div class="w-20 h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
					<div class="h-full rounded-full transition-all duration-500
								{trust.complete ? 'bg-emerald-accent' : trustProgress > 0 ? 'bg-amber-400' : 'bg-navy/10'}"
						style="width: {trustProgress}%"></div>
				</div>
				<span class="text-[11px] text-navy/40">{trustProgress}%</span>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if editing}
				<button onclick={exitEdit}
					class="text-[12px] text-navy/40 hover:text-navy transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-navy/[0.04]">
					Cancel
				</button>
				<button onclick={saveEdit} disabled={saving}
					class="text-[12px] text-white bg-emerald-accent hover:bg-emerald-accent/90 transition-colors cursor-pointer px-4 py-1.5 rounded-lg disabled:opacity-50">
					{saving ? 'Saving...' : 'Save'}
				</button>
			{:else}
				<button onclick={enterEdit}
					class="text-[12px] text-navy/40 hover:text-navy transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-navy/[0.04] flex items-center gap-1.5">
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
					Edit
				</button>
			{/if}
		</div>
	</div>

	<div class="border-t border-navy/[0.06] px-6 py-5">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
			{#each allIntakeQuestions as q}
				{@const raw = getRawResponse(trust.responses, q.id)}
				{@const answer = getAnswer(trust.responses, q.id)}
				<div class="flex flex-col gap-1.5 py-1 min-w-0">
					<span class="text-[12px] text-navy/40">{q.text}</span>
					{#if editing}
						{#if q.type === 'children'}
							{@const children = getEditChildren(q.id)}
							<div class="space-y-2">
								{#if children.length === 0}
									<div class="rounded-md border border-dashed border-navy/15 bg-white/60 px-3 py-2 text-[12px] text-navy/40">
										No children added.
									</div>
								{/if}
								{#each children as child, idx}
									<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,155px)_auto] gap-2 items-center rounded-md border border-navy/10 bg-white p-2">
										<input
											type="text"
											value={child.firstName}
											oninput={(e) => updateEditChild(q.id, idx, 'firstName', e.currentTarget.value)}
											placeholder="First name"
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
										/>
										<input
											type="text"
											value={child.lastName}
											oninput={(e) => updateEditChild(q.id, idx, 'lastName', e.currentTarget.value)}
											placeholder="Last name"
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
										/>
										<input
											type="date"
											value={child.dob}
											oninput={(e) => updateEditChild(q.id, idx, 'dob', e.currentTarget.value)}
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40 sm:col-span-1 xl:col-span-1"
										/>
										<button
											onclick={() => removeEditChild(q.id, idx)}
											class="h-[31px] px-2.5 rounded-md border border-navy/10 text-[11px] text-navy/50 hover:text-navy hover:border-navy/20 transition-colors cursor-pointer justify-self-start sm:col-span-2 xl:col-span-1 xl:justify-self-auto"
										>
											Remove
										</button>
									</div>
								{/each}
								<button
									onclick={() => addEditChild(q.id)}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border border-emerald-accent/25 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-all cursor-pointer"
								>
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									Add Child
								</button>
							</div>
						{:else if q.type === 'heir'}
							{@const heirs = getEditHeirs(q.id)}
							<div class="space-y-2">
								{#if heirs.length === 0}
									<div class="rounded-md border border-dashed border-navy/15 bg-white/60 px-3 py-2 text-[12px] text-navy/40">
										No heirs added.
									</div>
								{/if}
								{#each heirs as heir, idx}
									<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center rounded-md border border-navy/10 bg-white p-2">
										<input
											type="text"
											value={heir.firstName}
											oninput={(e) => updateEditHeir(q.id, idx, 'firstName', e.currentTarget.value)}
											placeholder="First name"
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
										/>
										<input
											type="text"
											value={heir.lastName}
											oninput={(e) => updateEditHeir(q.id, idx, 'lastName', e.currentTarget.value)}
											placeholder="Last name"
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
										/>
										<button
											onclick={() => removeEditHeir(q.id, idx)}
											class="h-[31px] px-2.5 rounded-md border border-navy/10 text-[11px] text-navy/50 hover:text-navy hover:border-navy/20 transition-colors cursor-pointer justify-self-start sm:col-span-2 xl:col-span-1 xl:justify-self-auto"
										>
											Remove
										</button>
									</div>
								{/each}
								<button
									onclick={() => addEditHeir(q.id)}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border border-emerald-accent/25 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-all cursor-pointer"
								>
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									Add Heir
								</button>
							</div>
						{:else if q.type === 'charities'}
							{@const ecr = getEditCharitiesResponse(q.id)}
							<div class="space-y-4">
								<!-- Husband -->
								<div class="space-y-2">
									<div class="text-[10px] font-semibold text-navy/40 tracking-wider uppercase">Husband</div>
									<div class="flex gap-2">
										<button type="button" onclick={() => setEditHusbandInterested(q.id, false)}
											class="flex-1 py-1.5 rounded-lg text-[11px] font-medium border-2 cursor-pointer transition-colors
												{!ecr.husbandInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/45'}">No</button>
										<button type="button" onclick={() => setEditHusbandInterested(q.id, true)}
											class="flex-1 py-1.5 rounded-lg text-[11px] font-medium border-2 cursor-pointer transition-colors
												{ecr.husbandInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/45'}">Yes</button>
									</div>
									{#if ecr.husbandInterested}
										<div class="space-y-1.5">
											{#each ecr.husbandCharities.filter((c) => isMasjidId(c.charityId)) as ch}
												<div class="rounded-md border border-emerald-accent/30 bg-emerald-accent/5 p-2 flex items-center gap-2">
													<span class="text-[11px] font-medium text-navy flex-1">{resolveCharityName(ch.charityId)}</span>
													<input type="number" min="0" max="100" step="0.1" value={ch.percentage}
														oninput={(e) => { const v = parseFloat(e.currentTarget.value); if (!isNaN(v)) updateEditHusbandCharityPct(q.id, ch.charityId, v); }}
														class="w-14 px-1.5 py-1 rounded border border-navy/10 text-[11px] text-navy outline-none focus:border-emerald-accent/40" placeholder="0" />
													<span class="text-[10px] text-navy/45">%</span>
													<button type="button" onclick={() => toggleEditHusbandCharity(q.id, ch.charityId)}
														class="text-[10px] text-navy/40 hover:text-red-600 cursor-pointer">Remove</button>
												</div>
											{/each}
											<div class="flex items-center justify-between mt-1">
												<span class="text-[10px] text-navy/45">Custom charities</span>
												<button type="button" onclick={() => addEditHusbandCustomCharity(q.id)}
													class="px-2 py-0.5 rounded text-[10px] border border-emerald-accent/25 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 cursor-pointer">+ Add</button>
											</div>
											{#each ecr.husbandCharities.filter((c) => isCustomCharityResponse(c)) as custom}
												<div class="rounded-md border border-navy/10 bg-white p-2 space-y-1.5">
													<div class="grid grid-cols-2 gap-1.5">
														<input type="text" value={custom.customName}
															oninput={(e) => updateEditHusbandCustomField(q.id, custom.charityId, 'customName', e.currentTarget.value)}
															placeholder="Legal name" class="px-2 py-1 rounded text-[11px] text-navy border border-navy/10 outline-none focus:border-emerald-accent/40" />
														<input type="text" value={custom.customEin}
															oninput={(e) => updateEditHusbandCustomField(q.id, custom.charityId, 'customEin', e.currentTarget.value)}
															placeholder="EIN" class="px-2 py-1 rounded text-[11px] text-navy border border-navy/10 outline-none focus:border-emerald-accent/40" />
													</div>
													<div class="flex items-center gap-2">
														<input type="number" min="0" max="100" step="0.1" value={custom.percentage}
															oninput={(e) => { const v = parseFloat(e.currentTarget.value); if (!isNaN(v)) updateEditHusbandCharityPct(q.id, custom.charityId, v); }}
															class="w-14 px-1.5 py-1 rounded border border-navy/10 text-[11px] text-navy outline-none focus:border-emerald-accent/40" placeholder="0" />
														<span class="text-[10px] text-navy/45">%</span>
														<button type="button" onclick={() => removeEditHusbandCustomCharity(q.id, custom.charityId)}
															class="ml-auto text-[10px] text-navy/40 hover:text-red-600 cursor-pointer">Remove</button>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>

								<!-- Wife -->
								<div class="space-y-2 pt-2 border-t border-navy/8">
									<div class="text-[10px] font-semibold text-navy/40 tracking-wider uppercase">Wife</div>
									<div class="flex gap-2">
										<button type="button" onclick={() => setEditWifeInterested(q.id, false)}
											class="flex-1 py-1.5 rounded-lg text-[11px] font-medium border-2 cursor-pointer transition-colors
												{!ecr.wifeInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/45'}">No</button>
										<button type="button" onclick={() => setEditWifeInterested(q.id, true)}
											class="flex-1 py-1.5 rounded-lg text-[11px] font-medium border-2 cursor-pointer transition-colors
												{ecr.wifeInterested ? 'border-navy bg-white text-navy' : 'border-navy/10 bg-white/60 text-navy/45'}">Yes</button>
									</div>
									{#if ecr.wifeInterested}
										<div class="space-y-1.5">
											{#each ecr.wifeCharities.filter((c) => isMasjidId(c.charityId)) as ch}
												<div class="rounded-md border border-emerald-accent/30 bg-emerald-accent/5 p-2 flex items-center gap-2">
													<span class="text-[11px] font-medium text-navy flex-1">{resolveCharityName(ch.charityId)}</span>
													<input type="number" min="0" max="100" step="0.1" value={ch.percentage}
														oninput={(e) => { const v = parseFloat(e.currentTarget.value); if (!isNaN(v)) updateEditWifeCharityPct(q.id, ch.charityId, v); }}
														class="w-14 px-1.5 py-1 rounded border border-navy/10 text-[11px] text-navy outline-none focus:border-emerald-accent/40" placeholder="0" />
													<span class="text-[10px] text-navy/45">%</span>
													<button type="button" onclick={() => toggleEditWifeCharity(q.id, ch.charityId)}
														class="text-[10px] text-navy/40 hover:text-red-600 cursor-pointer">Remove</button>
												</div>
											{/each}
											<div class="flex items-center justify-between mt-1">
												<span class="text-[10px] text-navy/45">Custom charities</span>
												<button type="button" onclick={() => addEditWifeCustomCharity(q.id)}
													class="px-2 py-0.5 rounded text-[10px] border border-emerald-accent/25 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 cursor-pointer">+ Add</button>
											</div>
											{#each ecr.wifeCharities.filter((c) => isCustomCharityResponse(c)) as custom}
												<div class="rounded-md border border-navy/10 bg-white p-2 space-y-1.5">
													<div class="grid grid-cols-2 gap-1.5">
														<input type="text" value={custom.customName}
															oninput={(e) => updateEditWifeCustomField(q.id, custom.charityId, 'customName', e.currentTarget.value)}
															placeholder="Legal name" class="px-2 py-1 rounded text-[11px] text-navy border border-navy/10 outline-none focus:border-emerald-accent/40" />
														<input type="text" value={custom.customEin}
															oninput={(e) => updateEditWifeCustomField(q.id, custom.charityId, 'customEin', e.currentTarget.value)}
															placeholder="EIN" class="px-2 py-1 rounded text-[11px] text-navy border border-navy/10 outline-none focus:border-emerald-accent/40" />
													</div>
													<div class="flex items-center gap-2">
														<input type="number" min="0" max="100" step="0.1" value={custom.percentage}
															oninput={(e) => { const v = parseFloat(e.currentTarget.value); if (!isNaN(v)) updateEditWifeCharityPct(q.id, custom.charityId, v); }}
															class="w-14 px-1.5 py-1 rounded border border-navy/10 text-[11px] text-navy outline-none focus:border-emerald-accent/40" placeholder="0" />
														<span class="text-[10px] text-navy/45">%</span>
														<button type="button" onclick={() => removeEditWifeCustomCharity(q.id, custom.charityId)}
															class="ml-auto text-[10px] text-navy/40 hover:text-red-600 cursor-pointer">Remove</button>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{:else if q.type === 'personal-data'}
							{@const epd = normalizePersonalData(editResponses[q.id])}
							<div class="space-y-2 max-w-md">
								<div>
									<label class="block text-[11px] text-navy/45 mb-1" for="edit-pd-name-{q.id}">Full legal name</label>
									<input
										id="edit-pd-name-{q.id}"
										type="text"
										value={epd.name}
										oninput={(e) => updateEditPersonal(q.id, { name: e.currentTarget.value })}
										class="w-full px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
									/>
								</div>
								<div>
									<label class="block text-[11px] text-navy/45 mb-1" for="edit-pd-dob-{q.id}">Date of birth</label>
									<input
										id="edit-pd-dob-{q.id}"
										type="date"
										value={epd.dob}
										oninput={(e) => updateEditPersonal(q.id, { dob: e.currentTarget.value })}
										class="w-full px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40 max-w-[200px]"
									/>
								</div>
								<div>
									<label class="block text-[11px] text-navy/45 mb-1" for="edit-pd-county-{q.id}">Texas county</label>
									<input
										id="edit-pd-county-{q.id}"
										type="text"
										value={epd.county}
										oninput={(e) => updateEditPersonal(q.id, { county: e.currentTarget.value })}
										class="w-full px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
									/>
								</div>
							</div>
					{:else if q.type === 'heirs-calculator'}
						{@const hc = normalizeHeirsCalculator(editResponses[q.id])}
						{#if hc?.verified && hc.namedHeirs.length > 0}
							<div class="space-y-1">
								{#each hc.namedHeirs as heir}
									<div class="text-[12px] text-navy flex items-center gap-2">
										<span class="font-medium">{heir.names.join(', ')}</span>
										<span class="text-navy/40">({heir.label} — {heir.totalShare.display})</span>
									</div>
								{/each}
							</div>
							<p class="text-[11px] text-navy/35 mt-1.5">Edit through the trust questionnaire.</p>
						{:else}
							<p class="text-[12px] text-navy/40">Not completed. Edit through the trust questionnaire.</p>
						{/if}
					{:else if q.type === 'boolean'}
						<div class="flex gap-2">
							{#each [{ label: 'Yes', value: true }, { label: 'No', value: false }] as opt}
									{@const sel = editResponses[q.id] === opt.value}
									<button onclick={() => setEditValue(q.id, opt.value)}
										class="px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
												{sel ? 'bg-emerald-accent/10 border-emerald-accent/30 text-navy font-medium' : 'bg-white border-navy/10 text-navy/50 hover:border-navy/20'}">
										{opt.label}
									</button>
								{/each}
							</div>
						{:else if q.type === 'select' && q.options}
							<div class="flex flex-wrap gap-2">
								{#each q.options as option}
									{@const sel = editResponses[q.id] === option}
									<button onclick={() => setEditValue(q.id, option)}
										class="px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
												{sel ? 'bg-emerald-accent/10 border-emerald-accent/30 text-navy font-medium' : 'bg-white border-navy/10 text-navy/50 hover:border-navy/20'}">
										{option}
									</button>
								{/each}
							</div>
						{:else if q.type === 'date'}
							<input type="date" value={editResponses[q.id] ?? ''}
								oninput={(e) => setEditValue(q.id, e.currentTarget.value || null)}
								class="px-3 py-1.5 rounded-lg text-[13px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40 w-full max-w-[200px]" />
						{:else}
							<input type={q.type === 'tel' ? 'tel' : 'text'} value={editResponses[q.id] ?? ''}
								oninput={(e) => setEditValue(q.id, e.currentTarget.value || null)}
								placeholder="—"
								class="px-3 py-1.5 rounded-lg text-[13px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40 w-full max-w-[280px] placeholder:text-navy/20" />
						{/if}
					{:else}
						{#if q.type === 'children'}
							{@const children = normalizeChildren(raw)}
							{#if children.length > 0}
								<div class="space-y-1.5">
									{#each children as child}
										<div class="text-[13px] text-navy font-medium">
											{getChildDisplayName(child)}
											<span class="text-navy/35 font-normal"> — {child.dob ? formatDob(child.dob) : 'No DOB provided'}</span>
										</div>
									{/each}
								</div>
							{:else}
								<span class="text-[13px] text-navy/25">—</span>
							{/if}
						{:else if q.type === 'heir'}
							{@const heirs = normalizeHeirs(raw)}
							{#if heirs.length > 0}
								<div class="space-y-1.5">
									{#each heirs as heir}
										<div class="text-[13px] text-navy font-medium">
											{`${heir.firstName} ${heir.lastName}`.trim() || 'Unnamed heir'}
										</div>
									{/each}
								</div>
							{:else}
								<span class="text-[13px] text-navy/25">—</span>
							{/if}
					{:else if q.type === 'charities'}
						{@const vcr = isCharitiesResponseShape(raw) ? raw : null}
						{#if vcr && (vcr.husbandInterested || vcr.wifeInterested)}
							<div class="space-y-2">
								{#if vcr.husbandInterested}
									<div>
										<div class="text-[10px] font-semibold text-navy/40 tracking-wider uppercase mb-1">Husband</div>
										{#each vcr.husbandCharities as ch}
											<div class="text-[12px] text-navy">
												{resolveCharityName(ch.charityId, ch.customName)}
												<span class="text-navy/40 font-normal"> — {ch.percentage}%</span>
											</div>
										{/each}
									</div>
								{/if}
								{#if vcr.wifeInterested}
									<div>
										<div class="text-[10px] font-semibold text-navy/40 tracking-wider uppercase mb-1">Wife</div>
										{#each vcr.wifeCharities as ch}
											<div class="text-[12px] text-navy">
												{resolveCharityName(ch.charityId, ch.customName)}
												<span class="text-navy/40 font-normal"> — {ch.percentage}%</span>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<span class="text-[13px] text-navy/25">—</span>
						{/if}
						{:else if q.type === 'personal-data'}
							{@const vp = normalizePersonalData(raw)}
							{#if vp.name.trim() || vp.dob.trim() || vp.county.trim()}
								<div class="text-[13px] text-navy space-y-0.5">
									{#if vp.name.trim()}<div><span class="text-navy/45">Name</span> {vp.name}</div>{/if}
									{#if vp.dob.trim()}<div><span class="text-navy/45">DOB</span> {formatDob(vp.dob)}</div>{/if}
									{#if vp.county.trim()}<div><span class="text-navy/45">County</span> {vp.county}</div>{/if}
								</div>
							{:else}
								<span class="text-[13px] text-navy/25">—</span>
							{/if}
					{:else if q.type === 'heirs-calculator'}
						{@const hc = normalizeHeirsCalculator(raw)}
						{#if hc?.verified && hc.namedHeirs.length > 0}
							<div class="space-y-1.5">
								{#each hc.namedHeirs as heir}
									<div class="text-[13px] text-navy font-medium flex items-center gap-2">
										<span>{heir.names.join(', ')}</span>
										<span class="text-[11px] text-navy/40 font-normal">({heir.label} — {heir.totalShare.display})</span>
									</div>
								{/each}
								{#if hc.awlApplied || hc.raddApplied}
									<div class="flex gap-1.5 mt-1">
										{#if hc.awlApplied}<span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700">ʿAwl</span>{/if}
										{#if hc.raddApplied}<span class="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">Radd</span>{/if}
									</div>
								{/if}
							</div>
				{:else}
					<span class="text-[13px] text-navy/25">—</span>
				{/if}
				{:else if q.type === 'ownership-allocation'}
					{#if typeof raw === 'string' && raw.trim()}
						<span class="text-[13px] text-navy font-medium">{ownershipLabels[raw] ?? raw}</span>
					{:else}
						<span class="text-[13px] text-navy/25">—</span>
					{/if}
				{:else if q.type === 'trustee-on-first-death'}
					{#if typeof raw === 'string' && raw.trim()}
						<span class="text-[13px] text-navy font-medium">{trusteeOnFirstDeathLabels[raw] ?? raw}</span>
					{:else}
						<span class="text-[13px] text-navy/25">—</span>
					{/if}
				{:else if q.type === 'heba'}
					<span class="text-[13px] text-navy/45 italic">Explanation only</span>
				{:else if q.type === 'assets'}
					{@const assets = Array.isArray(raw) ? (raw as AssetAllocationEntry[]) : []}
					{#if assets.length > 0}
						<div class="space-y-1">
							{#each assets as asset}
								<div class="text-[12px] text-navy">
									<span class="font-medium">{asset.assetName}</span>
									{#if asset.accountId}
										<span class="text-navy/35 text-[11px]"> #{asset.accountId}</span>
									{/if}
									<span class="text-navy/40"> — {formatSpouse(asset.spouse)}</span>
								</div>
							{/each}
						</div>
					{:else}
						<span class="text-[13px] text-navy/25">—</span>
					{/if}
				{:else if q.type === 'heba-assets'}
					{@const hebaAssets = Array.isArray(raw) ? (raw as HebaAssetEntry[]) : []}
					{#if hebaAssets.length > 0}
						<div class="space-y-1">
							{#each hebaAssets as asset}
								<div class="text-[12px] text-navy">
									<span class="font-medium">{asset.assetName}</span>
									{#if asset.accountId}
										<span class="text-navy/35 text-[11px]"> #{asset.accountId}</span>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<span class="text-[13px] text-navy/25">—</span>
					{/if}
				{:else if q.type === 'successor-trustees' || q.type === 'pour-over-representatives'}
					{@const people = Array.isArray(raw) ? (raw as (SuccessorTrusteeEntry | PourOverRepresentativeEntry)[]) : []}
					{#if people.length > 0}
						<div class="space-y-1">
							{#each people as person, idx}
								<div class="text-[12px] text-navy flex items-baseline gap-1.5">
									<span class="text-navy/30 tabular-nums text-[11px] shrink-0">{idx + 1}.</span>
									<span>
										<span class="font-medium">{person.fullName}</span>
										<span class="text-navy/40"> ({person.relationship}{person.contact ? ` · ${person.contact}` : ''})</span>
									</span>
								</div>
							{/each}
						</div>
					{:else}
						<span class="text-[13px] text-navy/25">—</span>
					{/if}
				{:else if q.type === 'minor-distribution'}
					{@const md = isMinorDistributionShape(raw) ? raw : null}
					{#if md}
						{#if md.mode === 'age-of-majority'}
							<span class="text-[13px] text-navy font-medium">At age of majority</span>
						{:else if md.mode === 'single-age'}
							{@const smd = md as { mode: 'single-age'; age: number }}
							<span class="text-[13px] text-navy font-medium">All at age {smd.age}</span>
						{:else if md.mode === 'staggered'}
							{@const s = md as { mode: 'staggered'; firstPercent: number; firstAge: number; secondPercent: number; secondAge: number; remainderAge: number }}
							<div class="text-[12px] text-navy space-y-0.5">
								<div>{s.firstPercent}% at age {s.firstAge}</div>
								<div>{s.secondPercent}% at age {s.secondAge}</div>
								<div>{100 - s.firstPercent - s.secondPercent}% at age {s.remainderAge}</div>
							</div>
						{/if}
					{:else}
						<span class="text-[13px] text-navy/25">—</span>
					{/if}
				{:else if q.type === 'non-charitable-bequests'}
					{@const ncb = isNonCharitableBequestsShape(raw) ? raw : null}
					{#if ncb && (ncb.husbandInterested || ncb.wifeInterested)}
						<div class="space-y-2">
							{#if ncb.husbandInterested && ncb.husbandBequests.length > 0}
								<div>
									<div class="text-[10px] font-semibold text-navy/40 tracking-wider uppercase mb-1">Husband</div>
									{#each ncb.husbandBequests as b}
										<div class="text-[12px] text-navy">
											<span class="font-medium">{b.recipientName}</span>
											<span class="text-navy/40"> ({b.relationship} — {b.percentage}%)</span>
										</div>
									{/each}
								</div>
							{/if}
							{#if ncb.wifeInterested && ncb.wifeBequests.length > 0}
								<div>
									<div class="text-[10px] font-semibold text-navy/40 tracking-wider uppercase mb-1">Wife</div>
									{#each ncb.wifeBequests as b}
										<div class="text-[12px] text-navy">
											<span class="font-medium">{b.recipientName}</span>
											<span class="text-navy/40"> ({b.relationship} — {b.percentage}%)</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<span class="text-[13px] text-navy/25">{ncb ? 'None' : '—'}</span>
					{/if}
				{:else}
					<span class="text-[13px] text-navy font-medium {answer === '—' ? 'text-navy/25' : ''}">{answer}</span>
				{/if}
			{/if}
		</div>
	{/each}
		</div>
	</div>
</div>
