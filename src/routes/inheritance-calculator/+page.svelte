<script lang="ts">
	import { siteName, consultationBookingUrl } from '$lib/config';

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

	let mobileMenuOpen = $state(false);

	let decedentGender = $state<'male' | 'female'>('male');
	let spouse = $state(false);
	let fatherAlive = $state(false);
	let motherAlive = $state(false);
	let sons = $state(0);
	let daughters = $state(0);
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

	// Distant relatives (dhawul arḥām) — display-only, not sent to the calculator yet.
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
	let showReasoning = $state(false);
	let hasCalculated = $state(false);

	let hasDhawulArham = $derived(
		maternalGrandfatherAlive || daughtersSons > 0 || daughtersDaughters > 0 ||
		fullNephews > 0 || maternalUncles > 0 || maternalAunts > 0 || paternalAunts > 0
	);

	let hasAnyHeir = $derived(
		spouse || fatherAlive || motherAlive || sons > 0 || daughters > 0 ||
		sonsOfSons > 0 || daughtersOfSons > 0 ||
		paternalGrandfatherAlive || paternalGrandmotherAlive || maternalGrandmotherAlive ||
		fullBrothers > 0 || fullSisters > 0 ||
		paternalHalfBrothers > 0 || paternalHalfSisters > 0 ||
		maternalHalfBrothers > 0 || maternalHalfSisters > 0 ||
		fullPaternalUncles > 0
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
				apiError = data.error ?? `Something went wrong (HTTP ${res.status}).`;
			} else {
				result = data as ApiResponse;
			}
		} catch (e) {
			apiError = 'Network error — please check your connection and try again.';
		} finally {
			loading = false;
			hasCalculated = true;
		}
	}

	function pct(f: FractionJSON): string {
		return (f.decimal * 100).toFixed(2) + '%';
	}

	function resetAll() {
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
		result = null; apiError = ''; hasCalculated = false;
	}

	const examples: Record<string, () => void> = {
		'Spouse + 2 sons + 1 daughter + parents': () => {
			resetAll();
			decedentGender = 'male'; spouse = true;
			fatherAlive = true; motherAlive = true;
			sons = 2; daughters = 1;
		},
		'Husband + mother + 2 sisters': () => {
			resetAll();
			decedentGender = 'female'; spouse = true;
			motherAlive = true;
			fullSisters = 2;
		},
		'Husband + father + mother': () => {
			resetAll();
			decedentGender = 'female'; spouse = true;
			fatherAlive = true; motherAlive = true;
		},
		'Mother + 1 daughter, no other heirs': () => {
			resetAll();
			decedentGender = 'male';
			motherAlive = true; daughters = 1;
		},
		'Spouse only, no children or parents': () => {
			resetAll();
			decedentGender = 'male'; spouse = true;
		},
	};
</script>

<svelte:head>
	<title>Islamic Inheritance Calculator (Farāʾiḍ) | {siteName}</title>
	<meta
		name="description"
		content="Estimate how your estate would be divided among your Islamic heirs under the Qur'anic shares (farāʾiḍ). Free, instant, and easy to use."
	/>
</svelte:head>

<div class="min-h-dvh bg-cream font-sans flex flex-col">
	<!-- ═══════════════════ NAV ═══════════════════ -->
	<nav class="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-navy/10">
		<div class="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2.5 transition-opacity hover:opacity-75">
				<img src="/mcdaniel.png" alt="" class="h-7 w-auto" />
				<span class="text-navy font-semibold text-sm tracking-tight whitespace-nowrap" style="font-family: 'Playfair Display', Georgia, serif;">
					{siteName}
				</span>
			</a>

			<div class="hidden md:flex items-center gap-6">
				<a href="/islamic-heirs-explained" class="text-navy/55 text-sm transition-colors hover:text-navy">Who counts as an heir?</a>
				<a href="/free-islamic-will" class="text-navy/55 text-sm transition-colors hover:text-navy">Free Islamic Will</a>
				<a
					href={consultationBookingUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="px-4 py-2 text-sm font-medium text-cream bg-emerald-accent rounded-lg transition-all duration-200 hover:bg-emerald-light"
				>
					Book a Consultation
				</a>
			</div>

			<button
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				class="p-1.5 -mr-1 text-navy/50 hover:text-navy transition-colors cursor-pointer md:hidden"
				aria-label="Toggle navigation menu"
			>
				{#if mobileMenuOpen}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
				{:else}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
				{/if}
			</button>
		</div>

		{#if mobileMenuOpen}
			<div class="md:hidden mx-3 mb-2 rounded-2xl bg-white/90 backdrop-blur-lg border border-navy/8 shadow-lg overflow-hidden">
				<div class="flex flex-col p-3 gap-1">
					<a href="/islamic-heirs-explained" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5">Who counts as an heir?</a>
					<a href="/free-islamic-will" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5">Free Islamic Will</a>
					<a href={consultationBookingUrl} target="_blank" rel="noopener noreferrer" onclick={() => mobileMenuOpen = false} class="mx-2 mt-1 py-2.5 text-sm font-medium text-cream bg-emerald-accent rounded-xl text-center hover:bg-emerald-light">
						Book a Consultation
					</a>
				</div>
			</div>
		{/if}
	</nav>

	<!-- ═══════════════════ HEADER ═══════════════════ -->
	<header class="px-6 pt-14 pb-10 md:pt-20 md:pb-12 relative overflow-hidden">
		<div class="absolute inset-0 pointer-events-none"
			style="background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(74,124,111,0.09) 0%, transparent 70%);">
		</div>
		<div class="max-w-3xl mx-auto text-center relative">
			<div class="flex items-center justify-center gap-3 mb-5">
				<span class="w-6 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">Free Tool</span>
				<span class="w-6 h-px bg-emerald-accent/60"></span>
			</div>
			<h1 class="text-3xl md:text-5xl tracking-tight text-navy leading-[1.1] text-balance mb-5">
				Islamic Inheritance Calculator
			</h1>
			<p class="text-navy/60 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
				See how an estate is divided among Islamic heirs under the Qur'anic shares (farāʾiḍ) — enter who survives, and get an instant, itemized breakdown.
			</p>
		</div>
	</header>

	<!-- ═══════════════════ CALCULATOR ═══════════════════ -->
	<main class="flex-1 px-4 md:px-6 pb-16">
		<div class="max-w-6xl mx-auto">

			<div class="rounded-2xl bg-sky-50 border border-sky-200 p-4 mb-6 flex gap-3 items-start max-w-3xl mx-auto">
				<svg class="w-5 h-5 text-sky-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div class="text-sm text-sky-900 leading-relaxed">
					Non-Muslim relatives and adopted children are not eligible for Islamic inheritance, and only relatives from legitimate (recognized) lineage receive a share.
					Provision for anyone outside these shares can still be made through a waṣiyyah (bequest) of up to one-third of the estate.
					<a href="/islamic-heirs-explained" class="underline underline-offset-2 font-medium hover:text-sky-700">Learn who counts as an heir →</a>
				</div>
			</div>

			<!-- Examples -->
			<div class="mb-6 flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
				<span class="text-xs text-navy/40 self-center mr-1">Try an example:</span>
				{#each Object.entries(examples) as [label, fn]}
					<button
						onclick={fn}
						class="px-3 py-1.5 text-xs rounded-lg border border-navy/10 text-navy/60 bg-white/60
							   hover:border-emerald-accent/40 hover:text-emerald-accent transition-all cursor-pointer"
					>{label}</button>
				{/each}
				<button
					onclick={resetAll}
					class="px-3 py-1.5 text-xs rounded-lg border border-navy/10 text-navy/40 bg-white/60
						   hover:border-navy/25 hover:text-navy transition-all cursor-pointer"
				>Clear all</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- ─── LEFT: Inputs ─── -->
				<div class="space-y-4">
					<!-- Decedent -->
					<fieldset class="rounded-2xl bg-white/70 border border-navy/8 p-5">
						<legend class="text-[11px] text-navy/40 tracking-wider uppercase font-medium px-1">Who passed away?</legend>
						<div class="flex items-center gap-4 mt-2">
							<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
								<input type="radio" bind:group={decedentGender} value="male" class="accent-emerald-accent w-4 h-4" /> Man
							</label>
							<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
								<input type="radio" bind:group={decedentGender} value="female" class="accent-emerald-accent w-4 h-4" /> Woman
							</label>
						</div>
					</fieldset>

					<!-- Spouse & Parents -->
					<fieldset class="rounded-2xl bg-white/70 border border-navy/8 p-5">
						<legend class="text-[11px] text-navy/40 tracking-wider uppercase font-medium px-1">Spouse &amp; parents surviving</legend>
						<div class="grid grid-cols-3 gap-3 mt-2">
							<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
								<input type="checkbox" bind:checked={spouse} class="accent-emerald-accent w-4 h-4" />
								{decedentGender === 'male' ? 'Wife' : 'Husband'}
							</label>
							<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
								<input type="checkbox" bind:checked={fatherAlive} class="accent-emerald-accent w-4 h-4" /> Father
							</label>
							<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
								<input type="checkbox" bind:checked={motherAlive} class="accent-emerald-accent w-4 h-4" /> Mother
							</label>
						</div>
					</fieldset>

					<!-- Children -->
					<fieldset class="rounded-2xl bg-white/70 border border-navy/8 p-5">
						<legend class="text-[11px] text-navy/40 tracking-wider uppercase font-medium px-1">Children</legend>
						<div class="grid grid-cols-2 gap-3 mt-2">
							<label class="text-sm text-navy">
								Sons
								<input type="number" min="0" bind:value={sons}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
							<label class="text-sm text-navy">
								Daughters
								<input type="number" min="0" bind:value={daughters}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
						</div>
					</fieldset>

					<!-- Grandchildren through sons -->
					<fieldset class="rounded-2xl bg-white/70 border border-navy/8 p-5">
						<legend class="text-[11px] text-navy/40 tracking-wider uppercase font-medium px-1">Grandchildren (only if their parent — your son — has already passed)</legend>
						<div class="grid grid-cols-2 gap-3 mt-2">
							<label class="text-sm text-navy">
								Son's sons
								<input type="number" min="0" bind:value={sonsOfSons}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
							<label class="text-sm text-navy">
								Son's daughters
								<input type="number" min="0" bind:value={daughtersOfSons}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
						</div>
					</fieldset>

					<!-- Grandparents -->
					<fieldset class="rounded-2xl bg-white/70 border border-navy/8 p-5">
						<legend class="text-[11px] text-navy/40 tracking-wider uppercase font-medium px-1">Grandparents surviving (only if the parent between them has passed)</legend>
						<div class="grid grid-cols-1 gap-2 mt-2">
							<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
								<input type="checkbox" bind:checked={paternalGrandfatherAlive} class="accent-emerald-accent w-4 h-4" />
								Paternal grandfather (father's father)
							</label>
							<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
								<input type="checkbox" bind:checked={paternalGrandmotherAlive} class="accent-emerald-accent w-4 h-4" />
								Paternal grandmother (father's mother)
							</label>
							<label class="flex items-center gap-2 text-sm text-navy cursor-pointer">
								<input type="checkbox" bind:checked={maternalGrandmotherAlive} class="accent-emerald-accent w-4 h-4" />
								Maternal grandmother (mother's mother)
							</label>
						</div>
					</fieldset>

					<!-- Siblings -->
					<fieldset class="rounded-2xl bg-white/70 border border-navy/8 p-5">
						<legend class="text-[11px] text-navy/40 tracking-wider uppercase font-medium px-1">Siblings (only relevant if no children/grandchildren and no father)</legend>
						<div class="grid grid-cols-2 gap-3 mt-2">
							<label class="text-sm text-navy">
								Full brothers
								<input type="number" min="0" bind:value={fullBrothers}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
							<label class="text-sm text-navy">
								Full sisters
								<input type="number" min="0" bind:value={fullSisters}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
							<label class="text-sm text-navy">
								Paternal half-brothers
								<input type="number" min="0" bind:value={paternalHalfBrothers}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
							<label class="text-sm text-navy">
								Paternal half-sisters
								<input type="number" min="0" bind:value={paternalHalfSisters}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
							<label class="text-sm text-navy">
								Maternal half-brothers
								<input type="number" min="0" bind:value={maternalHalfBrothers}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
							<label class="text-sm text-navy">
								Maternal half-sisters
								<input type="number" min="0" bind:value={maternalHalfSisters}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
						</div>
					</fieldset>

					<!-- Uncles -->
					<fieldset class="rounded-2xl bg-white/70 border border-navy/8 p-5">
						<legend class="text-[11px] text-navy/40 tracking-wider uppercase font-medium px-1">Uncles (only relevant if no closer heirs above)</legend>
						<div class="grid grid-cols-2 gap-3 mt-2">
							<label class="text-sm text-navy">
								Full paternal uncles
								<input type="number" min="0" bind:value={fullPaternalUncles}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm
										   focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/30" />
							</label>
						</div>
					</fieldset>

					<!-- Dhawul Arham -->
					<details class="rounded-2xl bg-white/50 border border-navy/8 p-5">
						<summary class="text-[11px] text-navy/40 tracking-wider uppercase font-medium cursor-pointer select-none">
							Other relatives <span class="text-amber-600 normal-case">(not yet supported below)</span>
						</summary>
						<p class="text-xs text-navy/45 leading-relaxed mt-3 mb-3">
							These relatives (called dhawul arḥām) only inherit when none of the heirs above exist. This calculator flags when they may be relevant, but does not yet compute their shares — an attorney or scholar should be consulted in these cases.
						</p>
						<div class="grid grid-cols-2 gap-3">
							<label class="flex items-center gap-2 text-sm text-navy/60 cursor-pointer col-span-2">
								<input type="checkbox" bind:checked={maternalGrandfatherAlive} class="accent-navy/30 w-4 h-4" />
								Maternal grandfather
							</label>
							<label class="text-sm text-navy/60">
								Daughter's sons
								<input type="number" min="0" bind:value={daughtersSons}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-2 text-sm focus:outline-none" />
							</label>
							<label class="text-sm text-navy/60">
								Daughter's daughters
								<input type="number" min="0" bind:value={daughtersDaughters}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-2 text-sm focus:outline-none" />
							</label>
							<label class="text-sm text-navy/60">
								Nephews (brother's sons)
								<input type="number" min="0" bind:value={fullNephews}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-2 text-sm focus:outline-none" />
							</label>
							<label class="text-sm text-navy/60">
								Maternal uncles
								<input type="number" min="0" bind:value={maternalUncles}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-2 text-sm focus:outline-none" />
							</label>
							<label class="text-sm text-navy/60">
								Maternal aunts
								<input type="number" min="0" bind:value={maternalAunts}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-2 text-sm focus:outline-none" />
							</label>
							<label class="text-sm text-navy/60">
								Paternal aunts
								<input type="number" min="0" bind:value={paternalAunts}
									class="mt-1 block w-full rounded-lg border border-navy/10 bg-white/50 px-3 py-2 text-sm focus:outline-none" />
							</label>
						</div>
					</details>

					<button
						onclick={calculate}
						disabled={loading || !hasAnyHeir}
						class="group w-full py-3.5 rounded-xl text-sm font-medium transition-all cursor-pointer
							   bg-emerald-accent text-cream hover:bg-emerald-light disabled:opacity-40 disabled:cursor-not-allowed
							   flex items-center justify-center gap-2"
					>
						{#if loading}
							Calculating…
						{:else}
							Calculate Shares
							<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						{/if}
					</button>
					{#if !hasAnyHeir}
						<p class="text-xs text-navy/35 text-center -mt-2">Select at least one surviving relative above to calculate.</p>
					{/if}
				</div>

				<!-- ─── RIGHT: Results ─── -->
				<div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
					{#if apiError}
						<div class="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{apiError}</div>
					{/if}

					{#if hasDhawulArham}
						<div class="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
							You've indicated distant relatives (dhawul arḥām) who may inherit in certain cases. This calculator does not yet compute their shares — they're excluded below. Please consult an attorney or scholar for this situation.
						</div>
					{/if}

					{#if result}
						<!-- Summary badges -->
						<div class="rounded-2xl bg-white/70 border border-navy/8 p-5">
							<p class="text-[11px] text-navy/40 tracking-wider uppercase font-medium mb-3">Summary</p>
							<div class="flex flex-wrap gap-2 mb-2">
								{#if result.awlApplied}
									<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">ʿAwl applied</span>
								{/if}
								{#if result.raddApplied}
									<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800">Radd applied</span>
								{/if}
								{#if result.dhawulArhamNeeded}
									<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-100 text-red-800">Distant relatives needed</span>
								{/if}
								<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-navy/5 text-navy/60">
									Fixed shares total: {result.totalFixedShares.display}
								</span>
								{#if result.residual.decimal > 0}
									<span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-navy/5 text-navy/60">
										Remainder: {result.residual.display}
									</span>
								{/if}
							</div>
							{#if result.awlApplied || result.raddApplied}
								<p class="text-xs text-navy/45 leading-relaxed mt-2">
									{#if result.awlApplied}The fixed shares added up to more than the whole estate, so each was proportionally reduced (ʿawl). {/if}
									{#if result.raddApplied}The fixed shares left a remainder with no residuary heir to claim it, so it was returned proportionally to the fixed-share heirs (radd).{/if}
								</p>
							{/if}
						</div>

						<!-- Heir shares -->
						{#if result.heirs.length > 0}
							<div class="rounded-2xl bg-white/70 border border-navy/8 overflow-hidden">
								<div class="p-5 pb-0">
									<p class="text-[11px] text-navy/40 tracking-wider uppercase font-medium">Each heir's share</p>
								</div>
								<div class="overflow-x-auto">
									<table class="w-full text-sm">
										<thead>
											<tr class="border-b border-navy/8 text-[11px] text-navy/35 uppercase tracking-wider">
												<th class="text-left p-3 font-medium">Heir</th>
												<th class="text-center p-3 font-medium">#</th>
												<th class="text-right p-3 font-medium">Total share</th>
												<th class="text-right p-3 font-medium">Per person</th>
												<th class="text-right p-3 font-medium">%</th>
											</tr>
										</thead>
										<tbody>
											{#each result.heirs as heir}
												<tr class="border-b border-navy/4 hover:bg-navy/2 transition-colors">
													<td class="p-3 text-navy font-medium">{heir.label}</td>
													<td class="p-3 text-center text-navy/60">{heir.count}</td>
													<td class="p-3 text-right font-mono text-navy">{heir.totalShare.display}</td>
													<td class="p-3 text-right font-mono text-navy/60">{heir.perPersonShare.display}</td>
													<td class="p-3 text-right text-navy/50">{pct(heir.totalShare)}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>

							<!-- Visual bar chart -->
							<div class="rounded-2xl bg-white/70 border border-navy/8 p-5 space-y-2.5">
								<p class="text-[11px] text-navy/40 tracking-wider uppercase font-medium mb-2">Share distribution</p>
								{#each result.heirs as heir}
									<div class="flex items-center gap-3">
										<span class="text-xs text-navy/60 w-36 truncate shrink-0">{heir.label}</span>
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
								<div class="flex flex-wrap gap-x-4 gap-y-1 pt-3 mt-1 border-t border-navy/6">
									<span class="inline-flex items-center gap-1.5 text-[11px] text-navy/45">
										<span class="w-2.5 h-2.5 rounded-sm" style="background: rgba(74,124,111,0.7)"></span>
										Fixed share (farḍ)
									</span>
									<span class="inline-flex items-center gap-1.5 text-[11px] text-navy/45">
										<span class="w-2.5 h-2.5 rounded-sm" style="background: rgba(96,165,250,0.7)"></span>
										Residuary (ʿaṣabah)
									</span>
									<span class="inline-flex items-center gap-1.5 text-[11px] text-navy/45">
										<span class="w-2.5 h-2.5 rounded-sm" style="background: rgba(167,139,250,0.7)"></span>
										Fixed + residuary
									</span>
								</div>
							</div>
						{/if}

						<!-- Reasoning (collapsed by default) -->
						{#if result.heirs.length > 0}
							<div class="rounded-2xl bg-white/70 border border-navy/8 overflow-hidden">
								<button
									onclick={() => showReasoning = !showReasoning}
									class="w-full flex items-center justify-between p-5 text-left cursor-pointer"
								>
									<span class="text-[11px] text-navy/40 tracking-wider uppercase font-medium">Why these shares?</span>
									<svg class="w-4 h-4 text-navy/35 shrink-0 transition-transform duration-200 {showReasoning ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
								</button>
								{#if showReasoning}
									<div class="px-5 pb-5 space-y-2.5">
										{#each result.heirs as heir}
											<div>
												<span class="text-xs font-medium text-navy">{heir.label}:</span>
												<span class="text-xs text-navy/50 ml-1">{heir.reasons.join(' → ')}</span>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}

						<!-- Blocked heirs -->
						{#if result.blockedHeirs.length > 0}
							<div class="rounded-2xl bg-white/70 border border-navy/8 p-5">
								<p class="text-[11px] text-navy/40 tracking-wider uppercase font-medium mb-3">Not eligible to inherit here</p>
								<div class="space-y-1.5">
									{#each result.blockedHeirs as bh}
										<div class="flex items-start gap-2 text-xs">
											<span class="text-navy/55 line-through shrink-0">{bh.label}</span>
											<span class="text-navy/35">— {bh.reason}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Notes -->
						{#if result.notes.length > 0}
							<div class="rounded-2xl bg-amber-50/60 border border-amber-200/40 p-5">
								<p class="text-[11px] text-amber-700/70 tracking-wider uppercase font-medium mb-2">Notes</p>
								{#each result.notes as note}
									<p class="text-xs text-amber-800/70 leading-relaxed">{note}</p>
								{/each}
							</div>
						{/if}

						<!-- Error -->
						{#if result.error}
							<div class="rounded-2xl bg-red-50 border border-red-200/60 p-5">
								<p class="text-xs text-red-700">{result.error}</p>
							</div>
						{/if}

						<!-- Next step CTA -->
						<div class="rounded-2xl bg-navy p-6 space-y-4">
							<p class="text-cream text-[15px] leading-relaxed">
								This is what Islamic law prescribes. Without a properly funded trust, U.S. probate courts may not distribute your estate this way.
							</p>
							<div class="flex flex-col sm:flex-row gap-3">
								<a
									href="/trust"
									class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-navy bg-cream transition-all hover:bg-white"
								>
									Make it enforceable — see the GoodTree Trust
								</a>
								<a
									href={consultationBookingUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-cream border border-cream/25 transition-all hover:bg-cream/10"
								>
									Book a consultation
								</a>
							</div>
						</div>
					{:else if !apiError && hasCalculated}
						<div class="rounded-2xl bg-white/70 border border-navy/8 p-8 text-center text-navy/30 text-sm">
							No result yet — adjust the heirs on the left and calculate again.
						</div>
					{:else if !apiError}
						<div class="rounded-2xl bg-white/70 border border-navy/8 p-10 text-center">
							<svg class="w-8 h-8 text-navy/15 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>
							<p class="text-navy/40 text-sm leading-relaxed max-w-xs mx-auto">
								Select the surviving relatives on the left — or try an example above — then click "Calculate Shares" to see the breakdown.
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</main>

	<!-- ═══════════════════ FOOTER ═══════════════════ -->
	<footer class="border-t border-navy/6 px-6 py-8">
		<div class="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
			<p class="text-navy/40 text-xs leading-relaxed max-w-xl">
				This calculator is an educational tool and does not constitute legal or religious advice. Islamic inheritance can involve nuances not captured here — always confirm your specific situation with a qualified scholar or attorney.
			</p>
			<p class="text-navy/30 text-xs whitespace-nowrap">
				© 2026 McDaniel Estate Planning, PLLC.
			</p>
		</div>
	</footer>
</div>
