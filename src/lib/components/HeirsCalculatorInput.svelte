<script lang="ts">
	import type {
		HeirsCalculatorResponse,
		PersonalDataResponse,
		QuestionResponseValue,
	} from "$lib/config";
	import { isPersonalDataShape } from "$lib/question-response-helpers";
	import { isMarriedSpouseExcluded } from "$lib/free-will/logic";
	import type { CalculationResultJSON } from "$lib/inheritance/types";

	let {
		value,
		onresponse,
		questionId = '',
		allResponses = {},
	} = $props<{
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		questionId?: string;
		allResponses?: Record<string, QuestionResponseValue>;
	}>();

	/**
	 * For husband-heirs the decedent is the husband, so the spouse heir is the wife —
	 * pre-fill from the wife-data response, and vice-versa.
	 */
	function getSpouseAutoName(): string {
		const sourceId = questionId === 'husband-heirs' ? 'wife-data' : 'husband-data';
		const raw = allResponses[sourceId];
		if (isPersonalDataShape(raw)) return (raw as PersonalDataResponse).name.trim();
		return '';
	}

	const sharedChildHeirTypes = new Set([
		'son',
		'daughter',
		'sons_of_sons',
		'daughters_of_sons',
	]);

	/** In a joint trust, children are shared — pre-fill from the other spouse's heirs step. */
	function getSiblingHeirsResponse(): HeirsCalculatorResponse | null {
		if (questionId !== 'husband-heirs' && questionId !== 'wife-heirs') return null;
		const siblingId = questionId === 'husband-heirs' ? 'wife-heirs' : 'husband-heirs';
		const raw = allResponses[siblingId];
		if (
			raw &&
			typeof raw === 'object' &&
			!Array.isArray(raw) &&
			'verified' in raw &&
			'namedHeirs' in raw
		) {
			return raw as HeirsCalculatorResponse;
		}
		return null;
	}

	function getSharedChildAutoName(heirType: string, index: number): string {
		if (!sharedChildHeirTypes.has(heirType)) return '';
		const sibling = getSiblingHeirsResponse();
		if (!sibling?.namedHeirs) return '';
		const match = sibling.namedHeirs.find((h) => h.heirType === heirType);
		return match?.names[index]?.trim() ?? '';
	}

	/** Joint trust collects both spouses before heirs; free will only has one. */
	function isJointTrustHeirsFlow(): boolean {
		return (
			isPersonalDataShape(allResponses['husband-data']) &&
			isPersonalDataShape(allResponses['wife-data'])
		);
	}

	/** Free will maps earlier parent-name answers into father-name / mother-name keys. */
	function getOwnParentAutoName(heirType: 'father' | 'mother'): string {
		if (isJointTrustHeirsFlow()) return '';
		const key = heirType === 'father' ? 'father-name' : 'mother-name';
		const raw = allResponses[key];
		return typeof raw === 'string' ? raw.trim() : '';
	}

	function getInitialSpouse(): boolean {
		if (existing?.estateInput?.spouse !== undefined) return existing.estateInput.spouse;
		if ('spouse-present' in allResponses) return allResponses['spouse-present'] === true;
		return true;
	}

	function getInitialParentAlive(field: 'father-alive' | 'mother-alive'): boolean {
		const stored =
			field === 'father-alive'
				? existing?.estateInput?.fatherAlive
				: existing?.estateInput?.motherAlive;
		if (stored !== undefined) return stored;
		return allResponses[field] === true;
	}

	// ── Parse existing saved response ─────────────────────────────────────────

	function parseExisting(): HeirsCalculatorResponse | null {
		if (
			value &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			"verified" in value
		) {
			return value as HeirsCalculatorResponse;
		}
		return null;
	}

	const existing = parseExisting();

	// ── Phase state ───────────────────────────────────────────────────────────

	type Phase = "configure" | "results" | "verified";
	let phase = $state<Phase>(existing?.verified ? "verified" : "configure");

	// ── Estate input state ────────────────────────────────────────────────────

	// Derive gender from question ID: husband-heirs → male, wife-heirs → female.
	let decedentGender = $derived<'male' | 'female'>(
		questionId === 'wife-heirs' ? 'female' : 'male'
	);

	// Spouse defaults to true for joint trust; will flow passes `spouse-present`.
	let spouse = $state(getInitialSpouse());
	let fatherAlive = $state(getInitialParentAlive('father-alive'));
	let motherAlive = $state(getInitialParentAlive('mother-alive'));

	/** B2: parents marked deceased earlier are hidden and forced off in the calculator. */
	const fatherKnownDeceased = $derived(
		'father-alive' in allResponses && allResponses['father-alive'] === false,
	);
	const motherKnownDeceased = $derived(
		'mother-alive' in allResponses && allResponses['mother-alive'] === false,
	);

	$effect(() => {
		if (fatherKnownDeceased) fatherAlive = false;
		if (motherKnownDeceased) motherAlive = false;
	});

	/** B1: married in intake but spouse unchecked — requires explicit confirmation. */
	let spouseExclusionConfirmed = $state(existing?.spouseExclusionConfirmed ?? false);
	let showSpouseExclusionDialog = $state(false);
	let pendingAction = $state<'calculate' | 'confirm' | null>(null);

	const spouseExcluded = $derived(isMarriedSpouseExcluded(allResponses, spouse));

	$effect(() => {
		if (!spouseExcluded) spouseExclusionConfirmed = false;
	});
	let sons = $state(existing?.estateInput?.sons ?? 0);
	let daughters = $state(existing?.estateInput?.daughters ?? 0);
	let sonsOfSons = $state(existing?.estateInput?.sonsOfSons ?? 0);
	let daughtersOfSons = $state(existing?.estateInput?.daughtersOfSons ?? 0);
	let paternalGrandfatherAlive = $state(
		existing?.estateInput?.paternalGrandfatherAlive ?? false,
	);
	let paternalGrandmotherAlive = $state(
		existing?.estateInput?.paternalGrandmotherAlive ?? false,
	);
	let maternalGrandmotherAlive = $state(
		existing?.estateInput?.maternalGrandmotherAlive ?? false,
	);
	let fullBrothers = $state(existing?.estateInput?.fullBrothers ?? 0);
	let fullSisters = $state(existing?.estateInput?.fullSisters ?? 0);
	let paternalHalfBrothers = $state(
		existing?.estateInput?.paternalHalfBrothers ?? 0,
	);
	let paternalHalfSisters = $state(
		existing?.estateInput?.paternalHalfSisters ?? 0,
	);
	let maternalHalfBrothers = $state(
		existing?.estateInput?.maternalHalfBrothers ?? 0,
	);
	let maternalHalfSisters = $state(
		existing?.estateInput?.maternalHalfSisters ?? 0,
	);
	let fullPaternalUncles = $state(
		existing?.estateInput?.fullPaternalUncles ?? 0,
	);

	function getEstateInput() {
		return {
			decedentGender,
			spouse,
			fatherAlive,
			motherAlive,
			sons,
			daughters,
			sonsOfSons,
			daughtersOfSons,
			paternalGrandfatherAlive,
			paternalGrandmotherAlive,
			maternalGrandmotherAlive,
			fullBrothers,
			fullSisters,
			paternalHalfBrothers,
			paternalHalfSisters,
			maternalHalfBrothers,
			maternalHalfSisters,
			fullPaternalUncles,
		};
	}

	// ── Calculation state ─────────────────────────────────────────────────────

	let calcResult = $state<CalculationResultJSON | null>(null);
	let loading = $state(false);
	let apiError = $state("");

	// ── Names state ───────────────────────────────────────────────────────────

	let names = $state<Record<string, string[]>>({});

	function initNames(heirs: CalculationResultJSON["heirs"]) {
		const spouseHeirType = decedentGender === 'male' ? 'wife' : 'husband';
		const spouseAutoName = getSpouseAutoName();

		const n: Record<string, string[]> = {};
		for (const heir of heirs) {
			const existing_names = names[heir.heirType];
			n[heir.heirType] = Array.from(
				{ length: heir.count },
				(_, i) => {
					// Prefer already-entered name, then shared children, then the surviving spouse.
					const saved = existing_names?.[i] ?? '';
					if (saved !== '') return saved;
					const childName = getSharedChildAutoName(heir.heirType, i);
					if (childName !== '') return childName;
					if (heir.heirType === spouseHeirType && i === 0 && spouseAutoName !== '') {
						return spouseAutoName;
					}
					if (heir.heirType === 'father' && i === 0) {
						const fatherName = getOwnParentAutoName('father');
						if (fatherName !== '') return fatherName;
					}
					if (heir.heirType === 'mother' && i === 0) {
						const motherName = getOwnParentAutoName('mother');
						if (motherName !== '') return motherName;
					}
					return '';
				},
			);
		}
		names = n;
	}

	// Initialize names from existing saved response
	if (existing?.namedHeirs) {
		for (const nh of existing.namedHeirs) {
			names[nh.heirType] = nh.names;
		}
	}

	// ── Calculate ─────────────────────────────────────────────────────────────

	function requestCalculate() {
		if (spouseExcluded && !spouseExclusionConfirmed) {
			pendingAction = 'calculate';
			showSpouseExclusionDialog = true;
			return;
		}
		void calculate();
	}

	function confirmSpouseExclusion() {
		spouseExclusionConfirmed = true;
		showSpouseExclusionDialog = false;
		const action = pendingAction;
		pendingAction = null;
		if (action === 'calculate') void calculate();
		else if (action === 'confirm') confirmShares();
	}

	function cancelSpouseExclusion() {
		showSpouseExclusionDialog = false;
		pendingAction = null;
	}

	async function calculate() {
		loading = true;
		apiError = "";
		try {
			const resp = await fetch("/api/inheritance", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(getEstateInput()),
			});
			const data = await resp.json();
			if (!resp.ok) {
				apiError =
					data.error ?? "Calculation failed. Please try again.";
				loading = false;
				return;
			}
			calcResult = data;
			initNames(data.heirs);
			phase = "results";
		} catch {
			apiError =
				"Network error. Please check your connection and try again.";
		}
		loading = false;
	}

	// ── Names validation ──────────────────────────────────────────────────────

	let allNamesFilled = $derived(
		calcResult != null &&
			!calcResult.dhawulArhamNeeded &&
			!calcResult.error &&
			calcResult.heirs.length > 0 &&
			calcResult.heirs.every((h) =>
				(names[h.heirType] ?? []).every((n) => n.trim() !== ""),
			),
	);

	// ── Confirm ───────────────────────────────────────────────────────────────

	function confirmShares() {
		if (!calcResult || !allNamesFilled) return;

		if (spouseExcluded && !spouseExclusionConfirmed) {
			pendingAction = 'confirm';
			showSpouseExclusionDialog = true;
			return;
		}

		const response: HeirsCalculatorResponse = {
			estateInput: getEstateInput(),
			namedHeirs: calcResult.heirs.map((h) => ({
				heirType: h.heirType,
				label: h.label,
				count: h.count,
				names: names[h.heirType] ?? [],
				totalShare: h.totalShare,
				perPersonShare: h.perPersonShare,
				shareType: h.shareType,
				reasons: h.reasons,
			})),
			blockedHeirs: calcResult.blockedHeirs,
			awlApplied: calcResult.awlApplied,
			raddApplied: calcResult.raddApplied,
			dhawulArhamNeeded: calcResult.dhawulArhamNeeded,
			notes: calcResult.notes,
			verified: true,
			...(spouseExcluded ? { spouseExclusionConfirmed: true } : {}),
		};

		onresponse(response);
		phase = "verified";
	}

	function editHeirs() {
		phase = "configure";
		calcResult = null;
		apiError = "";
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	const shareColors = [
		"rgba(74,124,111,0.75)",
		"rgba(59,130,246,0.75)",
		"rgba(168,85,247,0.75)",
		"rgba(245,158,11,0.75)",
		"rgba(239,68,68,0.75)",
		"rgba(20,184,166,0.75)",
		"rgba(249,115,22,0.75)",
		"rgba(236,72,153,0.75)",
	];

	const fieldClass = `w-full px-3 py-2 rounded-lg border border-navy/10 bg-white text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10 placeholder:text-navy/25`;
	const numberClass = `w-16 px-2.5 py-2 rounded-lg border border-navy/10 bg-white text-sm text-navy text-center outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10`;

	function clampNumber(val: string): number {
		const n = parseInt(val, 10);
		return isNaN(n) || n < 0 ? 0 : n;
	}

	// Verified state — derive from saved value
	let verifiedData = $derived(
		phase === "verified" &&
			value &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			"verified" in value
			? (value as HeirsCalculatorResponse)
			: null,
	);
</script>

<!-- ── VERIFIED SUMMARY ─────────────────────────────────────────────────── -->
{#if phase === "verified" && verifiedData}
	<div class="space-y-4">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div
					class="w-5 h-5 rounded-full bg-emerald-accent/15 flex items-center justify-center"
				>
					<svg
						class="w-3 h-3 text-emerald-accent"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
				<span class="text-sm font-medium text-navy"
					>Inheritance shares calculated successfully</span
				>
			</div>
			<button
				onclick={editHeirs}
				class="text-xs text-emerald-accent hover:text-emerald-accent/80 transition-colors cursor-pointer"
			>
				Edit
			</button>
		</div>

		<!-- Badges -->
		{#if verifiedData.awlApplied || verifiedData.raddApplied || verifiedData.dhawulArhamNeeded}
			<div class="flex flex-wrap gap-1.5">
				{#if verifiedData.awlApplied}
					<span
						class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700"
						>ʿAwl applied</span
					>
				{/if}
				{#if verifiedData.raddApplied}
					<span
						class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700"
						>Radd applied</span
					>
				{/if}
				{#if verifiedData.dhawulArhamNeeded}
					<span
						class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700"
						>Dhawul Arham</span
					>
				{/if}
			</div>
		{/if}

		<!-- Named heirs — one section per category, one row per person -->
		<div class="space-y-3">
			{#each verifiedData.namedHeirs as heir}
				<div class="rounded-xl border border-navy/[0.07] overflow-hidden">
					<!-- Category header -->
					<div class="px-4 py-2.5 bg-navy/[0.02] border-b border-navy/[0.05] flex items-center justify-between gap-3">
						<div class="flex items-center gap-2">
							<span class="text-[11px] font-semibold text-navy/55 uppercase tracking-wider">{heir.label}</span>
							{#if heir.count > 1}
								<span class="text-[11px] text-navy/35">×{heir.count}</span>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<span class="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-accent/10 text-emerald-accent">
								{heir.totalShare.display} total
							</span>
						</div>
					</div>
					<!-- One row per person -->
					{#each heir.names as name, nIdx}
						<div class="px-4 py-3 flex items-center justify-between gap-3 {nIdx < heir.names.length - 1 ? 'border-b border-navy/[0.04]' : ''} bg-white/60">
							<span class="text-sm font-medium text-navy">{name}</span>
							<div class="text-right shrink-0">
								<div class="text-sm font-semibold text-emerald-accent tabular-nums">
									{heir.perPersonShare.display}
								</div>
								<div class="text-[11px] text-navy/40 tabular-nums">
									{(heir.perPersonShare.decimal * 100).toFixed(1)}%
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>

		{#if verifiedData.blockedHeirs.length > 0}
			<div
				class="rounded-lg bg-navy/[0.03] border border-navy/[0.06] px-3 py-2.5"
			>
				<p class="text-[11px] font-medium text-navy/50 mb-1.5">
					Blocked from inheriting:
				</p>
				<div class="space-y-0.5">
					{#each verifiedData.blockedHeirs as bh}
						<p class="text-[11px] text-navy/50">
							{bh.label} —
							<span class="text-navy/35">{bh.reason}</span>
						</p>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- ── CONFIGURE + RESULTS ────────────────────────────────────────────────── -->
{:else}
	<div class="space-y-5">
		<!-- Info notice -->
		<div
			class="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200/70"
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
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<p class="text-xs text-amber-700 leading-relaxed">
				Only include heirs who are Muslim, of legitimate lineage, and
				alive at time of death. Non-Muslims, adopted relatives, and
				those of illegitimate lineage are not eligible.
			</p>
		</div>

		<!-- ── CONFIGURE SECTION ──────────────────────────────────────────── -->
		<div class="space-y-4">

			<!-- Spouse -->
			<div
				class="rounded-xl border border-navy/[0.07] bg-white/50 overflow-hidden"
			>
				<div
					class="px-4 py-2.5 bg-navy/[0.02] border-b border-navy/[0.06]"
				>
					<p
						class="text-xs font-semibold text-navy/60 uppercase tracking-wide"
					>
						Spouse
					</p>
				</div>
				<div class="px-4 py-3">
					<label class="flex items-center gap-3 cursor-pointer">
						<button
							role="checkbox"
							aria-checked={spouse}
							onclick={() => (spouse = !spouse)}
							class="w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer
								{spouse
								? 'border-emerald-accent bg-emerald-accent'
								: 'border-navy/25 bg-white hover:border-navy/40'}"
						>
							{#if spouse}
								<svg
									class="w-3 h-3 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="3"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{/if}
						</button>
						<span class="text-sm text-navy"
							>{decedentGender === "male" ? "Wife" : "Husband"} (surviving
							spouse)</span
						>
					</label>
					{#if spouseExcluded && !spouseExclusionConfirmed}
						<div
							class="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200/70"
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
							<p class="text-xs text-amber-800 leading-relaxed">
								You told us you're married. Your spouse is not included in this calculation — you'll need to confirm that before continuing.
							</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Children & Grandchildren -->
			<div
				class="rounded-xl border border-navy/[0.07] bg-white/50 overflow-hidden"
			>
				<div
					class="px-4 py-2.5 bg-navy/[0.02] border-b border-navy/[0.06]"
				>
					<p
						class="text-xs font-semibold text-navy/60 uppercase tracking-wide"
					>
						Children & Grandchildren (through sons)
					</p>
				</div>
				<div class="px-4 py-3 grid grid-cols-2 gap-3">
					{#each [{ label: "Sons", bind: "sons" }, { label: "Daughters", bind: "daughters" }, { label: "Son's Sons (grandsons)", bind: "sonsOfSons" }, { label: "Son's Daughters (granddaughters)", bind: "daughtersOfSons" }] as row}
						<div class="flex items-center justify-between gap-2">
							<span class="text-xs text-navy/70 leading-tight"
								>{row.label}</span
							>
							<input
								type="number"
								min="0"
								value={row.bind === "sons"
									? sons
									: row.bind === "daughters"
										? daughters
										: row.bind === "sonsOfSons"
											? sonsOfSons
											: daughtersOfSons}
								oninput={(e) => {
									const v = clampNumber(
										e.currentTarget.value,
									);
									if (row.bind === "sons") sons = v;
									else if (row.bind === "daughters")
										daughters = v;
									else if (row.bind === "sonsOfSons")
										sonsOfSons = v;
									else daughtersOfSons = v;
								}}
								class={numberClass}
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Parents -->
			{#if !fatherKnownDeceased || !motherKnownDeceased}
			<div
				class="rounded-xl border border-navy/[0.07] bg-white/50 overflow-hidden"
			>
				<div
					class="px-4 py-2.5 bg-navy/[0.02] border-b border-navy/[0.06]"
				>
					<p
						class="text-xs font-semibold text-navy/60 uppercase tracking-wide"
					>
						Parents
					</p>
				</div>
				<div class="px-4 py-3 space-y-2.5">
					{#if !fatherKnownDeceased}
					<label class="flex items-center gap-3 cursor-pointer">
						<button
							role="checkbox"
							aria-checked={fatherAlive}
							onclick={() => {
								fatherAlive = !fatherAlive;
							}}
							class="w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer
								{fatherAlive
								? 'border-emerald-accent bg-emerald-accent'
								: 'border-navy/25 bg-white hover:border-navy/40'}"
						>
							{#if fatherAlive}
								<svg
									class="w-3 h-3 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="3"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{/if}
						</button>
						<span class="text-sm text-navy"
							>Father (alive)</span
						>
					</label>
					{/if}
					{#if !motherKnownDeceased}
					<label class="flex items-center gap-3 cursor-pointer">
						<button
							role="checkbox"
							aria-checked={motherAlive}
							onclick={() => {
								motherAlive = !motherAlive;
							}}
							class="w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer
								{motherAlive
								? 'border-emerald-accent bg-emerald-accent'
								: 'border-navy/25 bg-white hover:border-navy/40'}"
						>
							{#if motherAlive}
								<svg
									class="w-3 h-3 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="3"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{/if}
						</button>
						<span class="text-sm text-navy"
							>Mother (alive)</span
						>
					</label>
					{/if}
				</div>
			</div>
			{/if}

			<!-- Grandparents -->
			<div
				class="rounded-xl border border-navy/[0.07] bg-white/50 overflow-hidden"
			>
				<div
					class="px-4 py-2.5 bg-navy/[0.02] border-b border-navy/[0.06]"
				>
					<p
						class="text-xs font-semibold text-navy/60 uppercase tracking-wide"
					>
						Grandparents
					</p>
				</div>
				<div class="px-4 py-3 space-y-2.5">
					{#each [{ label: "Paternal Grandfather", state: "paternalGrandfatherAlive" }, { label: "Paternal Grandmother", state: "paternalGrandmotherAlive" }, { label: "Maternal Grandmother", state: "maternalGrandmotherAlive" }] as row}
						<label class="flex items-center gap-3 cursor-pointer">
							<button
								role="checkbox"
								aria-checked={row.state ===
								"paternalGrandfatherAlive"
									? paternalGrandfatherAlive
									: row.state === "paternalGrandmotherAlive"
										? paternalGrandmotherAlive
										: maternalGrandmotherAlive}
								onclick={() => {
									if (
										row.state === "paternalGrandfatherAlive"
									)
										paternalGrandfatherAlive =
											!paternalGrandfatherAlive;
									else if (
										row.state === "paternalGrandmotherAlive"
									)
										paternalGrandmotherAlive =
											!paternalGrandmotherAlive;
									else
										maternalGrandmotherAlive =
											!maternalGrandmotherAlive;
								}}
								class="w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer
									{(
									row.state === 'paternalGrandfatherAlive'
										? paternalGrandfatherAlive
										: row.state ===
											  'paternalGrandmotherAlive'
											? paternalGrandmotherAlive
											: maternalGrandmotherAlive
								)
									? 'border-emerald-accent bg-emerald-accent'
									: 'border-navy/25 bg-white hover:border-navy/40'}"
							>
								{#if row.state === "paternalGrandfatherAlive" ? paternalGrandfatherAlive : row.state === "paternalGrandmotherAlive" ? paternalGrandmotherAlive : maternalGrandmotherAlive}
									<svg
										class="w-3 h-3 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="3"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								{/if}
							</button>
							<span class="text-sm text-navy"
								>{row.label} (alive)</span
							>
						</label>
					{/each}
				</div>
			</div>

			<!-- Siblings -->
			<div
				class="rounded-xl border border-navy/[0.07] bg-white/50 overflow-hidden"
			>
				<div
					class="px-4 py-2.5 bg-navy/[0.02] border-b border-navy/[0.06]"
				>
					<p
						class="text-xs font-semibold text-navy/60 uppercase tracking-wide"
					>
						Siblings
					</p>
				</div>
				<div class="px-4 py-3 grid grid-cols-2 gap-3">
					{#each [{ label: "Full Brothers", bind: "fullBrothers" }, { label: "Full Sisters", bind: "fullSisters" }, { label: "Paternal Half-Brothers", bind: "paternalHalfBrothers" }, { label: "Paternal Half-Sisters", bind: "paternalHalfSisters" }, { label: "Maternal Half-Brothers", bind: "maternalHalfBrothers" }, { label: "Maternal Half-Sisters", bind: "maternalHalfSisters" }] as row}
						<div class="flex items-center justify-between gap-2">
							<span class="text-xs text-navy/70 leading-tight"
								>{row.label}</span
							>
							<input
								type="number"
								min="0"
								value={row.bind === "fullBrothers"
									? fullBrothers
									: row.bind === "fullSisters"
										? fullSisters
										: row.bind === "paternalHalfBrothers"
											? paternalHalfBrothers
											: row.bind === "paternalHalfSisters"
												? paternalHalfSisters
												: row.bind ===
													  "maternalHalfBrothers"
													? maternalHalfBrothers
													: maternalHalfSisters}
								oninput={(e) => {
									const v = clampNumber(
										e.currentTarget.value,
									);
									if (row.bind === "fullBrothers")
										fullBrothers = v;
									else if (row.bind === "fullSisters")
										fullSisters = v;
									else if (
										row.bind === "paternalHalfBrothers"
									)
										paternalHalfBrothers = v;
									else if (row.bind === "paternalHalfSisters")
										paternalHalfSisters = v;
									else if (
										row.bind === "maternalHalfBrothers"
									)
										maternalHalfBrothers = v;
									else maternalHalfSisters = v;
								}}
								class={numberClass}
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Uncles -->
			<div
				class="rounded-xl border border-navy/[0.07] bg-white/50 overflow-hidden"
			>
				<div
					class="px-4 py-2.5 bg-navy/[0.02] border-b border-navy/[0.06]"
				>
					<p
						class="text-xs font-semibold text-navy/60 uppercase tracking-wide"
					>
						Paternal Uncles
					</p>
				</div>
				<div class="px-4 py-3">
					<div class="flex items-center justify-between gap-2">
						<span class="text-xs text-navy/70"
							>Full Paternal Uncles</span
						>
						<input
							type="number"
							min="0"
							value={fullPaternalUncles}
							oninput={(e) =>
								(fullPaternalUncles = clampNumber(
									e.currentTarget.value,
								))}
							class={numberClass}
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Error -->
		{#if apiError}
			<div
				class="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200"
			>
				<svg
					class="w-4 h-4 text-red-500 shrink-0 mt-0.5"
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
				<p class="text-xs text-red-600">{apiError}</p>
			</div>
		{/if}

		<!-- Calculate button -->
		<button
			onclick={requestCalculate}
			disabled={loading}
			class="w-full py-3 rounded-xl text-sm font-medium text-white bg-navy transition-all hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
		>
			{loading
				? "Calculating..."
				: calcResult
					? "Recalculate Shares"
					: "Calculate Shares"}
		</button>

		<!-- ── RESULTS SECTION ──────────────────────────────────────────────── -->
		{#if calcResult && phase === "results"}
			<div class="pt-2 space-y-4">
				<!-- Summary badges -->
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-semibold text-navy">
						Calculated Shares
					</h3>
					<div class="flex gap-1.5">
						{#if calcResult.awlApplied}
							<span
								class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700"
								>ʿAwl</span
							>
						{/if}
						{#if calcResult.raddApplied}
							<span
								class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700"
								>Radd</span
							>
						{/if}
					</div>
				</div>

				<!-- Error / Dhawul Arham notice -->
				{#if calcResult.error}
					<div
						class="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200/70"
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
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p class="text-xs text-amber-700 leading-relaxed">
							{calcResult.error}
						</p>
					</div>
				{/if}

				<!-- Notes -->
				{#if calcResult.notes.length > 0}
					<div class="space-y-1.5">
						{#each calcResult.notes as note}
							<div
								class="flex items-start gap-2 px-3 py-2 rounded-lg bg-navy/[0.03] border border-navy/[0.06]"
							>
								<span
									class="text-[11px] text-navy/50 leading-relaxed"
									>{note}</span
								>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Heirs with name inputs -->
				{#if calcResult.heirs.length > 0}
					<div class="space-y-3">
						{#each calcResult.heirs as heir, hIdx}
							<div
								class="rounded-xl border border-navy/[0.08] bg-white overflow-hidden"
							>
								<!-- Heir header with share -->
								<div
									class="px-4 py-3 flex items-center justify-between gap-3 border-b border-navy/[0.06]"
									style="background: linear-gradient(135deg, {shareColors[
										hIdx % shareColors.length
									]}15, transparent);"
								>
									<div class="flex items-center gap-2.5">
										<div
											class="w-3 h-3 rounded-full shrink-0"
											style="background: {shareColors[
												hIdx % shareColors.length
											]};"
										></div>
										<span
											class="text-sm font-medium text-navy"
											>{heir.label}</span
										>
										{#if heir.count > 1}
											<span class="text-xs text-navy/40"
												>×{heir.count}</span
											>
										{/if}
									</div>
									<div
										class="flex items-center gap-3 text-right"
									>
										<div>
											<span
												class="text-sm font-bold text-navy"
												>{heir.totalShare.display}</span
											>
											{#if heir.count > 1}
												<span
													class="text-xs text-navy/40 ml-1"
													>({heir.perPersonShare
														.display} each)</span
												>
											{/if}
										</div>
										<span
											class="text-xs text-navy/50 tabular-nums"
											>{(
												heir.totalShare.decimal * 100
											).toFixed(1)}%</span
										>
									</div>
								</div>

								<!-- Name inputs -->
								<div class="px-4 py-3 space-y-2">
									{#each names[heir.heirType] ?? [] as _, nIdx}
										<div class="flex items-center gap-2">
											{#if heir.count > 1}
												<span
													class="text-[11px] text-navy/40 w-14 shrink-0"
												>
													{heir.label}
													{nIdx + 1}
												</span>
											{/if}
											<input
												type="text"
												value={names[heir.heirType]?.[
													nIdx
												] ?? ""}
												oninput={(e) => {
													const arr = [
														...(names[
															heir.heirType
														] ?? []),
													];
													arr[nIdx] =
														e.currentTarget.value;
													names = {
														...names,
														[heir.heirType]: arr,
													};
												}}
												placeholder={heir.count === 1
													? `Full name of ${heir.label.toLowerCase()}`
													: `Full name`}
												class={fieldClass}
											/>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>

					<!-- Blocked heirs -->
					{#if calcResult.blockedHeirs.length > 0}
						<div
							class="rounded-lg bg-navy/[0.02] border border-navy/[0.06] px-3.5 py-3"
						>
							<p
								class="text-[11px] font-medium text-navy/50 mb-2"
							>
								Blocked from inheriting:
							</p>
							<div class="space-y-1">
								{#each calcResult.blockedHeirs as bh}
									<p class="text-[11px] text-navy/45">
										{bh.label} —
										<span class="text-navy/30"
											>{bh.reason}</span
										>
									</p>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Confirm button -->
					<button
						onclick={confirmShares}
						disabled={!allNamesFilled}
						class="w-full py-3 rounded-xl text-sm font-medium transition-all cursor-pointer
							{allNamesFilled
							? 'text-white bg-emerald-accent hover:bg-emerald-accent/90 hover:shadow-lg hover:shadow-emerald-accent/15'
							: 'text-navy/30 bg-navy/[0.04] cursor-not-allowed'}"
					>
						{#if !allNamesFilled}
							Enter all names above to confirm
						{:else}
							Confirm Shares & Names
						{/if}
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if showSpouseExclusionDialog}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40"
			role="dialog"
			aria-modal="true"
			aria-labelledby="spouse-exclusion-title"
		>
			<div class="w-full max-w-md rounded-2xl bg-white border border-navy/10 shadow-xl p-6 space-y-4">
				<h3 id="spouse-exclusion-title" class="text-lg font-medium text-navy">
					Exclude your spouse from this calculation?
				</h3>
				<p class="text-sm text-navy/65 leading-relaxed">
					You told us you're married. Your spouse is not included in this calculation — are you sure you want to continue without them?
				</p>
				<div class="flex flex-col-reverse sm:flex-row gap-2 pt-1">
					<button
						type="button"
						onclick={cancelSpouseExclusion}
						class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-navy border border-navy/12 hover:bg-navy/[0.03] transition-colors cursor-pointer"
					>
						Go back
					</button>
					<button
						type="button"
						onclick={confirmSpouseExclusion}
						class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-navy hover:bg-navy-light transition-colors cursor-pointer"
					>
						Yes, continue without spouse
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
