<script lang="ts">
	type FractionJSON = { numerator: number; denominator: number; display: string; decimal: number };
	type HeirResult = {
		heirType: string;
		label: string;
		count: number;
		totalShare: FractionJSON;
		perPersonShare: FractionJSON;
		shareType: string;
		reasons: string[];
	};
	type BlockedResult = { heirType: string; label: string; reason: string };
	type ApiResponse = {
		heirs: HeirResult[];
		blockedHeirs: BlockedResult[];
		totalFixedShares: FractionJSON;
		residual: FractionJSON;
		awlApplied: boolean;
		raddApplied: boolean;
		dhawulArhamNeeded: boolean;
		notes: string[];
		error?: string;
	};

	let decedentGender = $state<'male' | 'female'>('male');
	let spouse = $state(true);
	let fatherAlive = $state(false);
	let motherAlive = $state(true);
	let sons = $state(0);
	let daughters = $state(1);
	let sonsOfSons = $state(0);
	let daughtersOfSons = $state(0);
	let paternalGrandfatherAlive = $state(false);
	let paternalGrandmotherAlive = $state(false);
	let maternalGrandmotherAlive = $state(false);
	let fullBrothers = $state(0);
	let fullSisters = $state(0);
	let paternalHalfBrothers = $state(0);
	let paternalHalfSisters = $state(0);
	let maternalHalfBrothers = $state(0);
	let maternalHalfSisters = $state(0);
	let fullPaternalUncles = $state(0);

	// Dhawul Arham (display-only, not sent to API)
	let maternalGrandfatherAlive = $state(false);
	let daughtersSons = $state(0);
	let daughtersDaughters = $state(0);
	let fullNephews = $state(0);
	let maternalUncles = $state(0);
	let maternalAunts = $state(0);
	let paternalAunts = $state(0);

	let result = $state<ApiResponse | null>(null);
	let loading = $state(false);
	let apiError = $state('');

	let hasDhawulArham = $derived(
		maternalGrandfatherAlive || daughtersSons > 0 || daughtersDaughters > 0 ||
		fullNephews > 0 || maternalUncles > 0 || maternalAunts > 0 || paternalAunts > 0
	);

	async function calculate() {
		loading = true;
		apiError = '';
		result = null;

		try {
			const res = await fetch('/api/inheritance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					decedentGender, spouse,
					fatherAlive, motherAlive,
					sons, daughters,
					sonsOfSons, daughtersOfSons,
					paternalGrandfatherAlive, paternalGrandmotherAlive, maternalGrandmotherAlive,
					fullBrothers, fullSisters,
					paternalHalfBrothers, paternalHalfSisters,
					maternalHalfBrothers, maternalHalfSisters,
					fullPaternalUncles,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				apiError = data.error ?? `HTTP ${res.status}`;
			} else {
				result = data as ApiResponse;
			}
		} catch (e) {
			apiError = e instanceof Error ? e.message : 'Network error';
		} finally {
			loading = false;
		}
	}

	function pct(f: FractionJSON): string {
		return (f.decimal * 100).toFixed(2) + '%';
	}

	const presets: Record<string, () => void> = {
		'Basic: Wife + 2 Sons + 1 Daughter + Parents': () => {
			decedentGender = 'male'; spouse = true;
			fatherAlive = true; motherAlive = true;
			sons = 2; daughters = 1;
			sonsOfSons = 0; daughtersOfSons = 0;
			paternalGrandfatherAlive = false; paternalGrandmotherAlive = false; maternalGrandmotherAlive = false;
			fullBrothers = 0; fullSisters = 0;
			paternalHalfBrothers = 0; paternalHalfSisters = 0;
			maternalHalfBrothers = 0; maternalHalfSisters = 0;
			fullPaternalUncles = 0;
		},
		'ʿAwl: Husband + Mother + 2 Full Sisters': () => {
			decedentGender = 'female'; spouse = true;
			fatherAlive = false; motherAlive = true;
			sons = 0; daughters = 0;
			sonsOfSons = 0; daughtersOfSons = 0;
			paternalGrandfatherAlive = false; paternalGrandmotherAlive = false; maternalGrandmotherAlive = false;
			fullBrothers = 0; fullSisters = 2;
			paternalHalfBrothers = 0; paternalHalfSisters = 0;
			maternalHalfBrothers = 0; maternalHalfSisters = 0;
			fullPaternalUncles = 0;
		},
		'Umariyyah: Husband + Father + Mother': () => {
			decedentGender = 'female'; spouse = true;
			fatherAlive = true; motherAlive = true;
			sons = 0; daughters = 0;
			sonsOfSons = 0; daughtersOfSons = 0;
			paternalGrandfatherAlive = false; paternalGrandmotherAlive = false; maternalGrandmotherAlive = false;
			fullBrothers = 0; fullSisters = 0;
			paternalHalfBrothers = 0; paternalHalfSisters = 0;
			maternalHalfBrothers = 0; maternalHalfSisters = 0;
			fullPaternalUncles = 0;
		},
		'Radd: Mother + 1 Daughter': () => {
			decedentGender = 'male'; spouse = false;
			fatherAlive = false; motherAlive = true;
			sons = 0; daughters = 1;
			sonsOfSons = 0; daughtersOfSons = 0;
			paternalGrandfatherAlive = false; paternalGrandmotherAlive = false; maternalGrandmotherAlive = false;
			fullBrothers = 0; fullSisters = 0;
			paternalHalfBrothers = 0; paternalHalfSisters = 0;
			maternalHalfBrothers = 0; maternalHalfSisters = 0;
			fullPaternalUncles = 0;
		},
		'Spouse only (Dhawul Arḥām)': () => {
			decedentGender = 'male'; spouse = true;
			fatherAlive = false; motherAlive = false;
			sons = 0; daughters = 0;
			sonsOfSons = 0; daughtersOfSons = 0;
			paternalGrandfatherAlive = false; paternalGrandmotherAlive = false; maternalGrandmotherAlive = false;
			fullBrothers = 0; fullSisters = 0;
			paternalHalfBrothers = 0; paternalHalfSisters = 0;
			maternalHalfBrothers = 0; maternalHalfSisters = 0;
			fullPaternalUncles = 0;
		},
		'Complex: Wife + 2 Daughters + Granddaughter + Mother + Full Sister': () => {
			decedentGender = 'male'; spouse = true;
			fatherAlive = false; motherAlive = true;
			sons = 0; daughters = 2;
			sonsOfSons = 0; daughtersOfSons = 1;
			paternalGrandfatherAlive = false; paternalGrandmotherAlive = false; maternalGrandmotherAlive = false;
			fullBrothers = 0; fullSisters = 1;
			paternalHalfBrothers = 0; paternalHalfSisters = 0;
			maternalHalfBrothers = 0; maternalHalfSisters = 0;
			fullPaternalUncles = 0;
		},
		'Clear all': () => {
			decedentGender = 'male'; spouse = false;
			fatherAlive = false; motherAlive = false;
			sons = 0; daughters = 0;
			sonsOfSons = 0; daughtersOfSons = 0;
			paternalGrandfatherAlive = false; paternalGrandmotherAlive = false; maternalGrandmotherAlive = false;
			fullBrothers = 0; fullSisters = 0;
			paternalHalfBrothers = 0; paternalHalfSisters = 0;
			maternalHalfBrothers = 0; maternalHalfSisters = 0;
			fullPaternalUncles = 0;
			maternalGrandfatherAlive = false;
			daughtersSons = 0; daughtersDaughters = 0;
			fullNephews = 0; maternalUncles = 0; maternalAunts = 0; paternalAunts = 0;
			result = null; apiError = '';
		},
	};
</script>

<div class="min-h-screen bg-cream p-4 md:p-8 font-sans">
	<div class="max-w-6xl mx-auto">
		<div class="mb-6">
			<h1 class="text-2xl font-semibold text-navy tracking-tight">Inheritance Calculator — Test Bench</h1>
			<p class="text-sm text-navy/40 mt-1">Configure heirs below, then calculate shares. For testing only.</p>
		</div>

		<!-- Presets -->
		<div class="mb-6 flex flex-wrap gap-2">
			{#each Object.entries(presets) as [label, fn]}
				<button
					onclick={fn}
					class="px-3 py-1.5 text-xs rounded-lg border border-navy/10 text-navy/60
						   hover:border-emerald-accent/40 hover:text-emerald-accent transition-all cursor-pointer"
				>{label}</button>
			{/each}
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- ─── LEFT: Inputs ─── -->
			<div class="space-y-4">
				<!-- Decedent -->
				<fieldset class="rounded-xl bg-white/70 border border-navy/[0.06] p-4">
					<legend class="text-[11px] text-navy/35 tracking-wider uppercase font-medium px-1">Decedent</legend>
					<div class="flex items-center gap-4 mt-1">
						<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
							<input type="radio" bind:group={decedentGender} value="male" class="accent-emerald-accent" /> Male
						</label>
						<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
							<input type="radio" bind:group={decedentGender} value="female" class="accent-emerald-accent" /> Female
						</label>
					</div>
				</fieldset>

				<!-- Spouse & Parents -->
				<fieldset class="rounded-xl bg-white/70 border border-navy/[0.06] p-4">
					<legend class="text-[11px] text-navy/35 tracking-wider uppercase font-medium px-1">Spouse & Parents</legend>
					<div class="grid grid-cols-3 gap-3 mt-1">
						<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
							<input type="checkbox" bind:checked={spouse} class="accent-emerald-accent" />
							{decedentGender === 'male' ? 'Wife' : 'Husband'}
						</label>
						<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
							<input type="checkbox" bind:checked={fatherAlive} class="accent-emerald-accent" /> Father
						</label>
						<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
							<input type="checkbox" bind:checked={motherAlive} class="accent-emerald-accent" /> Mother
						</label>
					</div>
				</fieldset>

				<!-- Children -->
				<fieldset class="rounded-xl bg-white/70 border border-navy/[0.06] p-4">
					<legend class="text-[11px] text-navy/35 tracking-wider uppercase font-medium px-1">Children</legend>
					<div class="grid grid-cols-2 gap-3 mt-1">
						<label class="text-sm text-navy">
							Sons
							<input type="number" min="0" bind:value={sons}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
						<label class="text-sm text-navy">
							Daughters
							<input type="number" min="0" bind:value={daughters}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
					</div>
				</fieldset>

				<!-- Grandchildren through sons -->
				<fieldset class="rounded-xl bg-white/70 border border-navy/[0.06] p-4">
					<legend class="text-[11px] text-navy/35 tracking-wider uppercase font-medium px-1">Grandchildren (through sons)</legend>
					<div class="grid grid-cols-2 gap-3 mt-1">
						<label class="text-sm text-navy">
							Son's Sons
							<input type="number" min="0" bind:value={sonsOfSons}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
						<label class="text-sm text-navy">
							Son's Daughters
							<input type="number" min="0" bind:value={daughtersOfSons}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
					</div>
				</fieldset>

				<!-- Grandparents -->
				<fieldset class="rounded-xl bg-white/70 border border-navy/[0.06] p-4">
					<legend class="text-[11px] text-navy/35 tracking-wider uppercase font-medium px-1">Grandparents</legend>
					<div class="grid grid-cols-1 gap-2 mt-1">
						<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
							<input type="checkbox" bind:checked={paternalGrandfatherAlive} class="accent-emerald-accent" />
							Paternal Grandfather
						</label>
						<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
							<input type="checkbox" bind:checked={paternalGrandmotherAlive} class="accent-emerald-accent" />
							Paternal Grandmother
						</label>
						<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
							<input type="checkbox" bind:checked={maternalGrandmotherAlive} class="accent-emerald-accent" />
							Maternal Grandmother
						</label>
					</div>
				</fieldset>

				<!-- Siblings -->
				<fieldset class="rounded-xl bg-white/70 border border-navy/[0.06] p-4">
					<legend class="text-[11px] text-navy/35 tracking-wider uppercase font-medium px-1">Siblings</legend>
					<div class="grid grid-cols-2 gap-3 mt-1">
						<label class="text-sm text-navy">
							Full Brothers
							<input type="number" min="0" bind:value={fullBrothers}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
						<label class="text-sm text-navy">
							Full Sisters
							<input type="number" min="0" bind:value={fullSisters}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
						<label class="text-sm text-navy">
							Paternal Half-Brothers
							<input type="number" min="0" bind:value={paternalHalfBrothers}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
						<label class="text-sm text-navy">
							Paternal Half-Sisters
							<input type="number" min="0" bind:value={paternalHalfSisters}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
						<label class="text-sm text-navy">
							Maternal Half-Brothers
							<input type="number" min="0" bind:value={maternalHalfBrothers}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
						<label class="text-sm text-navy">
							Maternal Half-Sisters
							<input type="number" min="0" bind:value={maternalHalfSisters}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
					</div>
				</fieldset>

				<!-- Uncles -->
				<fieldset class="rounded-xl bg-white/70 border border-navy/[0.06] p-4">
					<legend class="text-[11px] text-navy/35 tracking-wider uppercase font-medium px-1">Uncles</legend>
					<div class="grid grid-cols-2 gap-3 mt-1">
						<label class="text-sm text-navy">
							Full Paternal Uncles
							<input type="number" min="0" bind:value={fullPaternalUncles}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm
									   focus:outline-none focus:border-emerald-accent/50" />
						</label>
					</div>
				</fieldset>

				<!-- Dhawul Arham -->
				<fieldset class="rounded-xl bg-white/70 border border-navy/[0.06] p-4 opacity-60">
					<legend class="text-[11px] text-navy/35 tracking-wider uppercase font-medium px-1">
						Dhawul Arḥām <span class="text-red-400 normal-case">(not yet supported)</span>
					</legend>
					<div class="grid grid-cols-2 gap-3 mt-1">
						<label class="flex items-center gap-2 text-sm text-navy/50 cursor-pointer col-span-2">
							<input type="checkbox" bind:checked={maternalGrandfatherAlive} class="accent-navy/30" />
							Maternal Grandfather
						</label>
						<label class="text-sm text-navy/50">
							Daughter's Sons
							<input type="number" min="0" bind:value={daughtersSons}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-1.5 text-sm
									   focus:outline-none" />
						</label>
						<label class="text-sm text-navy/50">
							Daughter's Daughters
							<input type="number" min="0" bind:value={daughtersDaughters}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-1.5 text-sm
									   focus:outline-none" />
						</label>
						<label class="text-sm text-navy/50">
							Full Nephews (brother's sons)
							<input type="number" min="0" bind:value={fullNephews}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-1.5 text-sm
									   focus:outline-none" />
						</label>
						<label class="text-sm text-navy/50">
							Maternal Uncles
							<input type="number" min="0" bind:value={maternalUncles}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-1.5 text-sm
									   focus:outline-none" />
						</label>
						<label class="text-sm text-navy/50">
							Maternal Aunts
							<input type="number" min="0" bind:value={maternalAunts}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-1.5 text-sm
									   focus:outline-none" />
						</label>
						<label class="text-sm text-navy/50">
							Paternal Aunts
							<input type="number" min="0" bind:value={paternalAunts}
								class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-1.5 text-sm
									   focus:outline-none" />
						</label>
					</div>
				</fieldset>

				<button
					onclick={calculate}
					disabled={loading}
					class="w-full py-3 rounded-xl text-sm font-medium transition-all cursor-pointer
						   bg-navy text-cream hover:bg-navy-light disabled:opacity-50"
				>
					{loading ? 'Calculating…' : 'Calculate Shares'}
				</button>
			</div>

			<!-- ─── RIGHT: Results ─── -->
			<div class="space-y-4">
				{#if apiError}
					<div class="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{apiError}</div>
				{/if}

				{#if hasDhawulArham}
					<div class="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
						Dhawul arḥām heirs are present but not yet supported by the calculator.
						They are excluded from the calculation below.
					</div>
				{/if}

				{#if result}
					<!-- Summary badges -->
					<div class="flex flex-wrap gap-2">
						{#if result.awlApplied}
							<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">ʿAwl Applied</span>
						{/if}
						{#if result.raddApplied}
							<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800">Radd Applied</span>
						{/if}
						{#if result.dhawulArhamNeeded}
							<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-100 text-red-800">Dhawul Arḥām Needed</span>
						{/if}
						<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-navy/5 text-navy/60">
							Fixed total: {result.totalFixedShares.display}
						</span>
						{#if result.residual.decimal > 0}
							<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-navy/5 text-navy/60">
								Residual: {result.residual.display}
							</span>
						{/if}
					</div>

					<!-- Heir shares -->
					{#if result.heirs.length > 0}
						<div class="rounded-xl bg-white/70 border border-navy/[0.06] overflow-hidden">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-navy/[0.06] text-[11px] text-navy/35 uppercase tracking-wider">
										<th class="text-left p-3 font-medium">Heir</th>
										<th class="text-center p-3 font-medium">#</th>
										<th class="text-right p-3 font-medium">Total Share</th>
										<th class="text-right p-3 font-medium">Per Person</th>
										<th class="text-right p-3 font-medium">%</th>
										<th class="text-left p-3 font-medium">Type</th>
									</tr>
								</thead>
								<tbody>
									{#each result.heirs as heir}
										<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
											<td class="p-3 text-navy font-medium">{heir.label}</td>
											<td class="p-3 text-center text-navy/60">{heir.count}</td>
											<td class="p-3 text-right font-mono text-navy">{heir.totalShare.display}</td>
											<td class="p-3 text-right font-mono text-navy/60">{heir.perPersonShare.display}</td>
											<td class="p-3 text-right text-navy/50">{pct(heir.totalShare)}</td>
											<td class="p-3">
												<span class="px-2 py-0.5 rounded text-[10px] font-medium
													{heir.shareType === 'fixed' ? 'bg-emerald-accent/10 text-emerald-accent' :
													 heir.shareType === 'residuary' ? 'bg-blue-50 text-blue-700' :
													 'bg-purple-50 text-purple-700'}">
													{heir.shareType === 'fixed_and_residuary' ? 'fixed + res.' : heir.shareType}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Visual bar chart -->
						<div class="rounded-xl bg-white/70 border border-navy/[0.06] p-4 space-y-2">
							<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-3">Share Distribution</p>
							{#each result.heirs as heir}
								<div class="flex items-center gap-3">
									<span class="text-xs text-navy/60 w-40 truncate shrink-0">{heir.label}</span>
									<div class="flex-1 h-5 rounded overflow-hidden" style="background: rgba(30,42,58,0.04)">
										<div
											class="h-full rounded transition-all duration-500"
											style="width: {Math.max(heir.totalShare.decimal * 100, 1)}%;
												   background: {heir.shareType === 'fixed' ? 'rgba(74,124,111,0.7)' :
												   heir.shareType === 'residuary' ? 'rgba(96,165,250,0.7)' :
												   'rgba(167,139,250,0.7)'}"
										></div>
									</div>
									<span class="text-xs font-mono text-navy/40 w-14 text-right shrink-0">{pct(heir.totalShare)}</span>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Reasons -->
					{#if result.heirs.length > 0}
						<div class="rounded-xl bg-white/70 border border-navy/[0.06] p-4">
							<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-3">Reasoning</p>
							<div class="space-y-2">
								{#each result.heirs as heir}
									<div>
										<span class="text-xs font-medium text-navy">{heir.label}:</span>
										<span class="text-xs text-navy/50 ml-1">{heir.reasons.join(' → ')}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Blocked heirs -->
					{#if result.blockedHeirs.length > 0}
						<div class="rounded-xl bg-white/70 border border-navy/[0.06] p-4">
							<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-3">Blocked Heirs</p>
							<div class="space-y-1.5">
								{#each result.blockedHeirs as bh}
									<div class="flex items-center gap-2 text-xs">
										<span class="text-navy/60 line-through">{bh.label}</span>
										<span class="text-navy/35">— {bh.reason}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Notes -->
					{#if result.notes.length > 0}
						<div class="rounded-xl bg-amber-50/60 border border-amber-200/40 p-4">
							<p class="text-[11px] text-amber-700/60 tracking-wider uppercase font-medium mb-2">Notes</p>
							{#each result.notes as note}
								<p class="text-xs text-amber-800/70 leading-relaxed">{note}</p>
							{/each}
						</div>
					{/if}

					<!-- Error -->
					{#if result.error}
						<div class="rounded-xl bg-red-50 border border-red-200/60 p-4">
							<p class="text-xs text-red-700">{result.error}</p>
						</div>
					{/if}

					<!-- Raw JSON toggle -->
					<details class="rounded-xl bg-white/70 border border-navy/[0.06]">
						<summary class="p-4 text-[11px] text-navy/35 tracking-wider uppercase font-medium cursor-pointer
								 hover:text-navy/50 transition-colors">
							Raw API Response
						</summary>
						<pre class="p-4 pt-0 text-[11px] text-navy/50 overflow-x-auto leading-relaxed">{JSON.stringify(result, null, 2)}</pre>
					</details>
				{:else if !apiError}
					<div class="rounded-xl bg-white/70 border border-navy/[0.06] p-8 text-center text-navy/30 text-sm">
						Configure heirs on the left and click "Calculate Shares" to see results.
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
