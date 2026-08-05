<script lang="ts">
	import type {
		AssetAllocationEntry,
		HebaAssetEntry,
		CharityResponse,
		CharitiesResponse,
		HeirsCalculatorResponse,
		MinorDistributionResponse,
		NonCharitableBequestsResponse,
		PersonalDataResponse,
		QuestionResponseValue,
		SuccessorTrusteeEntry,
		PourOverRepresentativeEntry,
	} from '$lib/config';
	import { allIntakeQuestions, charities } from '$lib/config';
	import {
		isIntakePhaseComplete,
		getIncompleteIntakeQuestions,
		isCharitiesResponseShape,
		isPersonalDataShape,
		isNonCharitableBequestsShape,
		meetsDiscountedCharityPledge,
	} from '$lib/question-response-helpers';

	let {
		value,
		onresponse,
		allResponses = {},
		onnavigate,
		oncomplete,
		completing = false,
		selectedPlan = null,
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		allResponses?: Record<string, QuestionResponseValue>;
		onnavigate?: (questionId: string) => void;
		oncomplete?: () => void;
		completing?: boolean;
		selectedPlan?: string | null;
	} = $props();

	$effect(() => {
		if (value !== true) onresponse(true);
	});

	let showConfirmModal = $state(false);

	function openConfirmModal() {
		if (!completing && !cannotFinalize) showConfirmModal = true;
	}

	function closeConfirmModal() {
		showConfirmModal = false;
	}

	function confirmAndSubmit() {
		showConfirmModal = false;
		oncomplete?.();
	}

	function pd(key: string): PersonalDataResponse | null {
		const v = allResponses[key];
		return isPersonalDataShape(v) ? v : null;
	}

	function heirs(key: string): HeirsCalculatorResponse | null {
		const v = allResponses[key];
		if (v && typeof v === 'object' && !Array.isArray(v) && 'verified' in v && (v as HeirsCalculatorResponse).verified) {
			return v as HeirsCalculatorResponse;
		}
		return null;
	}

	function formatDate(d: string): string {
		if (!d) return '—';
		const [y, m, day] = d.split('-').map(Number);
		if (!y || !m || !day) return d;
		return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	let husband = $derived(pd('husband-data'));
	let wife = $derived(pd('wife-data'));
	let marriageDate = $derived(typeof allResponses['marriage-date'] === 'string' ? allResponses['marriage-date'] : null);
	let ownershipChoice = $derived(typeof allResponses['ownership-allocation'] === 'string' ? allResponses['ownership-allocation'] : null);
	let assetsData = $derived.by(() => {
		const v = allResponses['assets'];
		if (Array.isArray(v) && v.length > 0 && typeof (v[0] as Record<string, unknown>)?.assetName === 'string') return v as AssetAllocationEntry[];
		return null;
	});
	let hebaAssetsData = $derived.by(() => {
		const v = allResponses['heba-assets'];
		if (Array.isArray(v) && v.length > 0 && typeof (v[0] as Record<string, unknown>)?.assetName === 'string') {
			return (v as HebaAssetEntry[]).filter((e) => e.assetName.trim());
		}
		return null;
	});
	let trusteeChoice = $derived(typeof allResponses['trustee-on-first-death'] === 'string' ? allResponses['trustee-on-first-death'] : null);
	function trusteeList(key: string): SuccessorTrusteeEntry[] | null {
		const v = allResponses[key];
		if (Array.isArray(v) && v.length > 0 && typeof (v[0] as Record<string, unknown>)?.fullName === 'string') {
			return v as SuccessorTrusteeEntry[];
		}
		return null;
	}
	let husbandSuccessorTrustees = $derived(trusteeList('husband-successor-trustees'));
	let wifeSuccessorTrustees = $derived(trusteeList('wife-successor-trustees'));
	function pourOverList(key: string): PourOverRepresentativeEntry[] | null {
		const v = allResponses[key];
		if (Array.isArray(v) && v.length > 0 && typeof (v[0] as Record<string, unknown>)?.fullName === 'string') {
			return v as PourOverRepresentativeEntry[];
		}
		return null;
	}
	let husbandPersonalReps = $derived(pourOverList('husband-personal-representatives'));
	let wifePersonalReps = $derived(pourOverList('wife-personal-representatives'));
	let husbandGuardians = $derived(pourOverList('husband-guardians'));
	let wifeGuardians = $derived(pourOverList('wife-guardians'));
	let madhab = $derived(typeof allResponses['madhab'] === 'string' ? allResponses['madhab'] : null);
	let husbandHeirs = $derived(heirs('husband-heirs'));
	let wifeHeirs = $derived(heirs('wife-heirs'));
	let minorDist = $derived.by(() => {
		const v = allResponses['minor-distribution'];
		if (v && typeof v === 'object' && !Array.isArray(v) && 'mode' in v) return v as MinorDistributionResponse;
		return null;
	});
	let charitiesData = $derived.by(() => {
		const v = allResponses['charities'];
		return isCharitiesResponseShape(v) ? v : null;
	});
	let ncbData = $derived.by(() => {
		const v = allResponses['non-charitable-bequests'];
		return isNonCharitableBequestsShape(v) ? v : null;
	});
	let trustName = $derived(typeof allResponses['trust-name'] === 'string' ? allResponses['trust-name'] : null);

	let discountedPledgeBlocksFinalize = $derived(
		selectedPlan === 'discounted' && !meetsDiscountedCharityPledge(allResponses['charities'])
	);
	let intakeFullyComplete = $derived(
		isIntakePhaseComplete(allResponses, allIntakeQuestions, { selectedPlan })
	);
	let cannotFinalize = $derived(!intakeFullyComplete || discountedPledgeBlocksFinalize);

	/** Friendly, section-style labels for questions listed as "incomplete" below (falls back to the question's own text). */
	let incompleteQuestionLabels = $derived.by((): Record<string, string> => {
		const h = husband?.name || 'Husband';
		const w = wife?.name || 'Wife';
		return {
			'husband-data': `${h} — Personal Information`,
			'wife-data': `${w} — Personal Information`,
			'marriage-date': 'Marriage Date',
			'husband-heirs': `${h}'s Heirs`,
			'wife-heirs': `${w}'s Heirs`,
			'ownership-allocation': 'Ownership Allocation',
			heba: '50/50 Mutual Gift (Heba)',
			assets: 'Asset by Asset Ownership',
			charities: 'Charitable Bequests',
			'non-charitable-bequests': 'Non-Charitable Bequests',
			'house-deed': 'House Deed',
			'trustee-on-first-death': 'Trustee Upon First Death',
			'husband-successor-trustees': `${h}'s Successor Trustees`,
			'wife-successor-trustees': `${w}'s Successor Trustees`,
			'heir-preview': 'Heirs Preview',
			'minor-distribution': "Children's Distribution Age",
			madhab: 'School of Jurisprudence',
			'trust-name': 'Trust Name',
			'husband-personal-representatives': `${h}'s Personal Representatives`,
			'wife-personal-representatives': `${w}'s Personal Representatives`,
			'husband-guardians': `${h}'s Guardians`,
			'wife-guardians': `${w}'s Guardians`,
		};
	});

	/** Active, required-for-completion questions that are still missing an answer (excludes this review step itself). */
	let incompleteQuestions = $derived(
		getIncompleteIntakeQuestions(allResponses, allIntakeQuestions, { selectedPlan })
			.filter((q) => q.id !== 'summary-review')
			.map((q) => ({ id: q.id, label: incompleteQuestionLabels[q.id] ?? q.text }))
	);

	function charityLabel(ch: CharityResponse): string {
		if (typeof ch.customName === 'string' && ch.customName.trim() !== '') {
			return ch.customName.trim();
		}
		return charities.find((c) => c.id === ch.charityId)?.name ?? ch.charityId;
	}

	function ownerLabel(s: string): string {
		if (s === '50-50') return '50 / 50';
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	const editBtnClass = 'text-[12px] font-medium text-emerald-accent hover:text-emerald-accent/80 transition-colors cursor-pointer';
</script>

<div class="space-y-5">
	<div class="rounded-2xl bg-white border border-navy/10 p-5">
		<p class="text-[14px] text-navy/70 leading-relaxed">
			Take a few minutes to read through the summary below. Make sure everything reflects your wishes. If anything needs to be changed, use the <span class="font-medium text-navy">Edit</span> buttons to go back.
		</p>
		<p class="text-[14px] text-navy/70 leading-relaxed mt-2">
			When you are satisfied, click <span class="font-medium text-navy">Confirm My Details</span>. You will be asked to confirm once more before your answers are finalized.
		</p>
	</div>

	<!-- Trust Name -->
	{#if trustName}
		<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
			<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
				<h3 class="text-sm font-semibold text-navy">Trust Name</h3>
				<button type="button" onclick={() => onnavigate?.('trust-name')} class={editBtnClass}>Edit</button>
			</div>
			<div class="px-5 py-4">
				<p class="text-[15px] font-medium text-navy">{trustName}</p>
			</div>
		</div>
	{/if}

	<!-- Personal Information -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Personal Information</h3>
			<button type="button" onclick={() => onnavigate?.('husband-data')} class={editBtnClass}>Edit</button>
		</div>
		<div class="px-5 py-4 space-y-4">
			{#if husband}
				<div>
					<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1">Husband</div>
					<p class="text-sm text-navy">{husband.name || '—'}</p>
					<p class="text-[13px] text-navy/55">DOB: {formatDate(husband.dob)} · {husband.county || '—'} County</p>
				</div>
			{/if}
			{#if wife}
				<div>
					<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1">Wife</div>
					<p class="text-sm text-navy">{wife.name || '—'}</p>
					<p class="text-[13px] text-navy/55">DOB: {formatDate(wife.dob)} · {wife.county || '—'} County</p>
				</div>
			{/if}
			{#if marriageDate}
				<div>
					<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1">Marriage Date</div>
					<p class="text-sm text-navy">{formatDate(marriageDate)}</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Ownership Allocation -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Ownership Allocation</h3>
			<button type="button" onclick={() => onnavigate?.('ownership-allocation')} class={editBtnClass}>Edit</button>
		</div>
		<div class="px-5 py-4">
			{#if ownershipChoice === 'heba'}
				<p class="text-sm text-navy font-medium">50/50 Mutual Gift (Heba)</p>
				<div class="mt-4">
					<div class="flex items-center justify-between mb-2">
						<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase">Listed Assets</div>
						<button type="button" onclick={() => onnavigate?.('heba-assets')} class={editBtnClass}>Edit</button>
					</div>
					{#if hebaAssetsData && hebaAssetsData.length > 0}
						<ul class="space-y-1">
							{#each hebaAssetsData as item}
								<li class="text-[13px] text-navy">{item.assetName}{item.accountId ? ` · ${item.accountId}` : ''}</li>
							{/each}
						</ul>
					{:else}
						<p class="text-[13px] text-navy/40">None listed</p>
					{/if}
				</div>
			{:else if ownershipChoice === 'assets'}
				<p class="text-sm text-navy font-medium">Asset by Asset</p>
				{#if assetsData && assetsData.length > 0}
					<div class="mt-3 rounded-xl border border-navy/8 overflow-hidden">
						<table class="w-full text-[13px]">
							<thead class="bg-navy/4">
								<tr>
									<th class="text-left px-3 py-2 font-medium text-navy/50">Asset</th>
									<th class="text-right px-3 py-2 font-medium text-navy/50">Owned By</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-navy/5">
								{#each assetsData.filter(a => a.assetName.trim()) as asset}
									<tr>
										<td class="px-3 py-2 text-navy">{asset.assetName}{asset.accountId ? ` (${asset.accountId})` : ''}</td>
										<td class="px-3 py-2 text-right text-navy/70">{ownerLabel(asset.spouse)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{:else}
				<p class="text-[13px] text-navy/40">Not selected</p>
			{/if}
		</div>
	</div>

	<!-- Trustee Upon First Death -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Trustee Upon First Death</h3>
			<button type="button" onclick={() => onnavigate?.('trustee-on-first-death')} class={editBtnClass}>Edit</button>
		</div>
		<div class="px-5 py-4">
			{#if trusteeChoice === 'survivor-serves'}
				<p class="text-sm text-navy">Surviving spouse serves as trustee</p>
			{:else if trusteeChoice === 'survivor-skipped'}
				<p class="text-sm text-navy">First successor trustee serves immediately</p>
			{:else}
				<p class="text-[13px] text-navy/40">Not selected</p>
			{/if}
		</div>
	</div>

	<!-- Successor Trustees -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Successor Trustees</h3>
		</div>
		<div class="px-5 py-4 space-y-4">
			{#each [
				{ label: `${husband?.name || 'Husband'}'s Successor Trustees`, list: husbandSuccessorTrustees, id: 'husband-successor-trustees' },
				{ label: `${wife?.name || 'Wife'}'s Successor Trustees`, list: wifeSuccessorTrustees, id: 'wife-successor-trustees' }
			] as section}
				<div>
					<div class="flex items-center justify-between mb-2">
						<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase">{section.label}</div>
						<button type="button" onclick={() => onnavigate?.(section.id)} class={editBtnClass}>Edit</button>
					</div>
					{#if section.list && section.list.filter(t => t.fullName.trim()).length > 0}
						<ol class="space-y-2">
							{#each section.list.filter(t => t.fullName.trim()) as trustee, i}
								<li class="flex items-baseline gap-3">
									<span class="text-[11px] font-semibold text-navy/30 tabular-nums">{i + 1}.</span>
									<div>
										<p class="text-sm text-navy font-medium">{trustee.fullName}</p>
										<p class="text-[13px] text-navy/55">{trustee.relationship}{trustee.contact ? ` · ${trustee.contact}` : ''}</p>
									</div>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="text-[13px] text-navy/40">None named</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Pour-Over Will: Personal Representatives -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Pour-Over Will — Personal Representatives</h3>
		</div>
		<div class="px-5 py-4 space-y-4">
			{#each [
				{ label: `${husband?.name || 'Husband'}'s Personal Representatives`, list: husbandPersonalReps, id: 'husband-personal-representatives' },
				{ label: `${wife?.name || 'Wife'}'s Personal Representatives`, list: wifePersonalReps, id: 'wife-personal-representatives' }
			] as section}
				<div>
					<div class="flex items-center justify-between mb-2">
						<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase">{section.label}</div>
						<button type="button" onclick={() => onnavigate?.(section.id)} class={editBtnClass}>Edit</button>
					</div>
					{#if section.list && section.list.filter((t) => t.fullName.trim()).length > 0}
						<ol class="space-y-2">
							{#each section.list.filter((t) => t.fullName.trim()) as rep, i}
								<li class="flex items-baseline gap-3">
									<span class="text-[11px] font-semibold text-navy/30 tabular-nums">{i + 1}.</span>
									<div>
										<p class="text-sm text-navy font-medium">{rep.fullName}</p>
										<p class="text-[13px] text-navy/55">{rep.relationship}{rep.contact ? ` · ${rep.contact}` : ''}</p>
									</div>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="text-[13px] text-navy/40">None named</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Pour-Over Will: Guardians -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Pour-Over Will — Guardians</h3>
		</div>
		<div class="px-5 py-4 space-y-4">
			{#each [
				{ label: `${husband?.name || 'Husband'}'s Guardians`, list: husbandGuardians, id: 'husband-guardians' },
				{ label: `${wife?.name || 'Wife'}'s Guardians`, list: wifeGuardians, id: 'wife-guardians' }
			] as section}
				<div>
					<div class="flex items-center justify-between mb-2">
						<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase">{section.label}</div>
						<button type="button" onclick={() => onnavigate?.(section.id)} class={editBtnClass}>Edit</button>
					</div>
					{#if section.list && section.list.filter((t) => t.fullName.trim()).length > 0}
						<ol class="space-y-2">
							{#each section.list.filter((t) => t.fullName.trim()) as guardian, i}
								<li class="flex items-baseline gap-3">
									<span class="text-[11px] font-semibold text-navy/30 tabular-nums">{i + 1}.</span>
									<div>
										<p class="text-sm text-navy font-medium">{guardian.fullName}</p>
										<p class="text-[13px] text-navy/55">{guardian.relationship}{guardian.contact ? ` · ${guardian.contact}` : ''}</p>
									</div>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="text-[13px] text-navy/40">None named</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- School of Jurisprudence -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">School of Jurisprudence</h3>
			<button type="button" onclick={() => onnavigate?.('madhab')} class={editBtnClass}>Edit</button>
		</div>
		<div class="px-5 py-4">
			<p class="text-sm text-navy">{madhab || '—'}</p>
		</div>
	</div>

	<!-- Heirs -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Heirs</h3>
			<button type="button" onclick={() => onnavigate?.('husband-heirs')} class={editBtnClass}>Edit</button>
		</div>
		<div class="px-5 py-4 space-y-4">
			{#if husbandHeirs && husbandHeirs.namedHeirs.length > 0}
				<div>
					<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-2">{husband?.name || 'Husband'}'s Heirs</div>
					<div class="space-y-1">
						{#each husbandHeirs.namedHeirs as heir}
							{#each heir.names as name}
								<div class="flex items-baseline justify-between text-[13px]">
									<span class="text-navy">{name} <span class="text-navy/45">({heir.label})</span></span>
									<span class="text-navy/60 tabular-nums">{heir.perPersonShare.numerator}/{heir.perPersonShare.denominator}</span>
								</div>
							{/each}
						{/each}
					</div>
				</div>
			{/if}
			{#if wifeHeirs && wifeHeirs.namedHeirs.length > 0}
				<div>
					<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-2">{wife?.name || 'Wife'}'s Heirs</div>
					<div class="space-y-1">
						{#each wifeHeirs.namedHeirs as heir}
							{#each heir.names as name}
								<div class="flex items-baseline justify-between text-[13px]">
									<span class="text-navy">{name} <span class="text-navy/45">({heir.label})</span></span>
									<span class="text-navy/60 tabular-nums">{heir.perPersonShare.numerator}/{heir.perPersonShare.denominator}</span>
								</div>
							{/each}
						{/each}
					</div>
				</div>
			{/if}
			{#if (!husbandHeirs || husbandHeirs.namedHeirs.length === 0) && (!wifeHeirs || wifeHeirs.namedHeirs.length === 0)}
				<p class="text-[13px] text-navy/40">No heirs entered</p>
			{/if}
		</div>
	</div>

	<!-- Minor Distribution -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Distribution age for children after your death</h3>
			<button type="button" onclick={() => onnavigate?.('minor-distribution')} class={editBtnClass}>Edit</button>
		</div>
		<div class="px-5 py-4">
			{#if minorDist?.mode === 'staggered'}
				<p class="text-sm text-navy font-medium">Staggered</p>
				<p class="text-[13px] text-navy/60 mt-1">
					{minorDist.firstPercent}% at age {minorDist.firstAge} · {minorDist.secondPercent}% at age {minorDist.secondAge} · remainder at age {minorDist.remainderAge}
				</p>
			{:else if minorDist?.mode === 'single-age'}
				<p class="text-sm text-navy">Full inheritance at age {minorDist.age}</p>
			{:else if minorDist?.mode === 'age-of-majority'}
				<p class="text-sm text-navy">Full inheritance at age 18 (age of majority)</p>
			{:else}
				<p class="text-[13px] text-navy/40">Not selected</p>
			{/if}
		</div>
	</div>

	<!-- Charitable Bequests -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Charitable Bequests</h3>
			<button type="button" onclick={() => onnavigate?.('charities')} class={editBtnClass}>Edit</button>
		</div>
		<div class="px-5 py-4">
			{#if charitiesData && (charitiesData.husbandInterested || charitiesData.wifeInterested)}
				<div class="space-y-3">
					{#if charitiesData.husbandInterested && charitiesData.husbandCharities.filter(c => c.percentage > 0).length > 0}
						<div>
							<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1">{husband?.name || 'Husband'}</div>
							{#each charitiesData.husbandCharities.filter(c => c.percentage > 0) as ch}
								<div class="flex items-baseline justify-between gap-3 text-[13px]">
									<span class="text-navy">
										{charityLabel(ch)}
										{#if typeof ch.customEin === 'string' && ch.customEin.trim() !== ''}
											<span class="text-navy/45 font-normal"> · EIN {ch.customEin.trim()}</span>
										{/if}
									</span>
									<span class="text-navy/60 tabular-nums shrink-0">{ch.percentage}%</span>
								</div>
							{/each}
						</div>
					{/if}
					{#if charitiesData.wifeInterested && charitiesData.wifeCharities.filter(c => c.percentage > 0).length > 0}
						<div>
							<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1">{wife?.name || 'Wife'}</div>
							{#each charitiesData.wifeCharities.filter(c => c.percentage > 0) as ch}
								<div class="flex items-baseline justify-between gap-3 text-[13px]">
									<span class="text-navy">
										{charityLabel(ch)}
										{#if typeof ch.customEin === 'string' && ch.customEin.trim() !== ''}
											<span class="text-navy/45 font-normal"> · EIN {ch.customEin.trim()}</span>
										{/if}
									</span>
									<span class="text-navy/60 tabular-nums shrink-0">{ch.percentage}%</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<p class="text-[13px] text-navy/40">None</p>
			{/if}
		</div>
	</div>

	<!-- Non-Charitable Bequests -->
	<div class="rounded-2xl border border-navy/10 bg-white overflow-hidden">
		<div class="flex items-center justify-between px-5 py-3 bg-navy/3 border-b border-navy/8">
			<h3 class="text-sm font-semibold text-navy">Non-Charitable Bequests</h3>
			<button type="button" onclick={() => onnavigate?.('non-charitable-bequests')} class={editBtnClass}>Edit</button>
		</div>
		<div class="px-5 py-4">
			{#if ncbData && (ncbData.husbandInterested || ncbData.wifeInterested)}
				<div class="space-y-3">
					{#if ncbData.husbandInterested && ncbData.husbandBequests.filter(b => b.recipientName.trim()).length > 0}
						<div>
							<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1">{husband?.name || 'Husband'}</div>
							{#each ncbData.husbandBequests.filter(b => b.recipientName.trim()) as b}
								<div class="flex items-baseline justify-between text-[13px]">
									<span class="text-navy">{b.recipientName} <span class="text-navy/45">({b.relationship})</span></span>
									<span class="text-navy/60 tabular-nums">{b.percentage}%</span>
								</div>
							{/each}
						</div>
					{/if}
					{#if ncbData.wifeInterested && ncbData.wifeBequests.filter(b => b.recipientName.trim()).length > 0}
						<div>
							<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1">{wife?.name || 'Wife'}</div>
							{#each ncbData.wifeBequests.filter(b => b.recipientName.trim()) as b}
								<div class="flex items-baseline justify-between text-[13px]">
									<span class="text-navy">{b.recipientName} <span class="text-navy/45">({b.relationship})</span></span>
									<span class="text-navy/60 tabular-nums">{b.percentage}%</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<p class="text-[13px] text-navy/40">None</p>
			{/if}
		</div>
	</div>

	<!-- Generate button -->
	<div class="pt-4 space-y-3">
		{#if discountedPledgeBlocksFinalize}
			<div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950 leading-relaxed">
				Your discounted plan includes a charitable wasiyyah pledge. Use <strong>Edit</strong> on Charitable Bequests
				above and allocate at least <strong>1%</strong> to one eligible charity before you can finalize.
			</div>
		{:else if !intakeFullyComplete}
			<div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950 leading-relaxed">
				<p>
					{incompleteQuestions.length === 1
						? 'One question is still incomplete:'
						: `${incompleteQuestions.length} questions are still incomplete:`}
				</p>
				{#if incompleteQuestions.length > 0}
					<ul class="mt-2 space-y-1.5">
						{#each incompleteQuestions as q}
							<li>
								<button
									type="button"
									onclick={() => onnavigate?.(q.id)}
									class="inline-flex items-center gap-1.5 font-medium text-amber-950 underline decoration-amber-400/70 underline-offset-2 hover:decoration-amber-600 cursor-pointer"
								>
									<svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
									</svg>
									{q.label}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
		<button
			type="button"
			onclick={openConfirmModal}
			disabled={completing || cannotFinalize}
			class="w-full py-4 rounded-2xl text-base font-semibold transition-all duration-200 cursor-pointer
				{completing || cannotFinalize
					? 'text-cream/90 bg-navy/25 cursor-not-allowed'
					: 'text-cream bg-emerald-accent hover:bg-emerald-accent/90 hover:shadow-xl hover:shadow-emerald-accent/15'}
				disabled:cursor-not-allowed"
		>
			{completing ? 'Loading' : 'Confirm My Details'}
		</button>
	</div>

	{#if showConfirmModal}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/20 backdrop-blur-sm"
			onclick={closeConfirmModal}
			role="presentation"
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl shadow-navy/15 p-7 outline-none"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirm-trust-title"
				tabindex="-1"
			>
				<button
					type="button"
					onclick={closeConfirmModal}
					aria-label="Close"
					class="absolute top-4 right-4 p-1.5 rounded-lg text-navy/30 hover:text-navy/60 hover:bg-navy/6 transition-colors cursor-pointer"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
				<div class="pr-8">
					<div class="w-8 h-8 rounded-full bg-navy/6 flex items-center justify-center mb-4">
						<svg class="w-4 h-4 text-navy/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/>
						</svg>
					</div>
					<h3 id="confirm-trust-title" class="text-base font-semibold text-navy mb-3">
						Ready to finalize your trust intake?
					</h3>

					<div
						class="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200/70 mb-4"
					>
						<svg
							class="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						<p class="text-[13px] text-amber-800 leading-relaxed font-medium">
							After you continue, you will <span class="underline decoration-amber-600/50 underline-offset-2">not</span> be able to return to this questionnaire to change your answers. Please use the Edit links above if anything still needs updating.
						</p>
					</div>

					<p class="text-[13.5px] text-navy/65 leading-relaxed">
						Our attorneys will review the details and documents you have provided and work with you to ensure a smooth experience as your trust moves forward.
					</p>
				</div>

				<div class="mt-6 flex flex-col-reverse sm:flex-row gap-3">
					<button
						type="button"
						onclick={closeConfirmModal}
						class="flex-1 py-2.5 rounded-xl text-sm font-medium text-navy bg-navy/6 hover:bg-navy/10 transition-colors cursor-pointer"
					>
						Go back
					</button>
					<button
						type="button"
						onclick={confirmAndSubmit}
						disabled={completing}
						class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
							{completing
								? 'text-cream/90 bg-emerald-accent/50 cursor-wait'
								: 'text-cream bg-emerald-accent hover:bg-emerald-accent/90'}
							disabled:cursor-wait"
					>
						{completing ? 'Submitting…' : 'Yes, finalize and continue'}
					</button>
				</div>
			</div>
		</div>
	{/if}

</div>
