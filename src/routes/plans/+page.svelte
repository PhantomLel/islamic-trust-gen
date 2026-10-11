<script lang="ts">
	import {
		consultationBookingUrl,
		defaultPrepFee,
		formatUsdWhole,
		productName,
		productNameShortBare,
		productAttorneyReviewSentence
	} from '$lib/config';
</script>

<!-- ═══ NAV ═══ -->
<nav class="fixed top-0 inset-x-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-navy/10">
	<div class="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
		<a href="/" aria-label="Muslim Legacy Planning — home" class="flex items-center gap-3 transition-opacity hover:opacity-75">
			<img src="/mcdaniel.png" alt="" class="h-8 w-auto" />
			<span class="text-navy font-semibold text-sm tracking-tight hidden sm:inline" style="font-family: 'Playfair Display', Georgia, serif;">
				Muslim Legacy Planning
			</span>
		</a>
		<div class="flex items-center gap-3">
			<a href="/which-plan" class="text-navy/55 text-sm hover:text-navy transition-colors hidden sm:inline">
				Not sure? Take the quiz →
			</a>
			<a
				href="/free-islamic-will"
				class="px-5 py-2 text-sm font-medium text-cream bg-emerald-accent rounded-lg transition-all duration-200 hover:bg-emerald-light hover:-translate-y-px"
			>
				Free Islamic Will
			</a>
		</div>
	</div>
</nav>

<div class="bg-cream font-sans pt-16">

	<!-- ═══ PAGE HEADER ═══ -->
	<header class="pt-16 pb-14 px-6 border-b border-navy/8 relative">
		<div class="absolute inset-0 pointer-events-none"
			style="background: radial-gradient(ellipse 55% 70% at 20% 50%, rgba(74,124,111,0.07) 0%, transparent 60%);">
		</div>
		<div class="max-w-7xl mx-auto relative grid md:grid-cols-[1fr_auto] gap-8 items-end">
			<div>
				<div class="flex items-center gap-3 mb-5">
					<span class="w-6 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">All Plans</span>
				</div>
				<h1 class="text-4xl md:text-5xl tracking-tight text-navy text-balance leading-tight mb-4">
					Five ways to protect your family's legacy.
				</h1>
				<p class="text-navy/55 text-base leading-relaxed max-w-[54ch]">
					Every plan is attorney-supervised and designed around Islamic inheritance principles. Choose the level of service your situation requires — or start free and build from there.
				</p>
			</div>
			<a
				href="/which-plan"
				class="group shrink-0 inline-flex items-center gap-2 px-6 py-3 border border-navy/15 text-navy text-sm font-medium rounded-lg
					   transition-all duration-200 hover:border-navy/30 hover:bg-navy/4"
			>
				Not sure which plan?
				<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</header>

	<!-- ═══ PLANS ═══ -->
	<div class="max-w-7xl mx-auto px-6 py-14 flex flex-col gap-5">

		<!-- ── PLAN 1: Free Islamic Will ── -->
		<article class="rounded-2xl border border-emerald-accent/25 bg-white/60 overflow-hidden">
			<div class="grid lg:grid-cols-[1fr_1.1fr] divide-y lg:divide-y-0 lg:divide-x divide-navy/8">

				<!-- Left: identity -->
				<div class="p-8 md:p-10 flex flex-col gap-4">
					<div class="flex items-baseline justify-between gap-4">
						<div>
							<span class="text-[10px] tracking-[0.28em] uppercase text-emerald-accent/70 font-medium">Plan 01</span>
							<h2 class="text-2xl md:text-3xl tracking-tight text-navy mt-1">Islamic Will</h2>
						</div>
						<div class="text-right shrink-0">
							<div class="text-3xl tracking-tight text-navy">Free</div>
							<div class="text-navy/40 text-xs mt-0.5">no cost</div>
						</div>
					</div>

					<p class="text-navy/60 text-sm leading-relaxed">
						The starting point for many Muslim families. Attorney-informed and designed around Islamic inheritance principles — regardless of estate size or how much you already know about Islamic inheritance.
					</p>

					<div class="bg-navy/3 rounded-xl border border-navy/6 px-4 py-3">
						<p class="text-navy/45 text-xs leading-relaxed">
							Available for Texas and California. No attorney reviews your answers or the document.
						</p>
					</div>

					<div class="pt-2 mt-auto">
						<a
							href="/free-islamic-will"
							class="group inline-flex items-center gap-2 px-6 py-3 bg-emerald-accent text-cream text-sm font-medium rounded-lg
								   transition-all duration-200 hover:bg-emerald-light hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Create Your Free Islamic Will
							<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Right: what's included -->
				<div class="p-8 md:p-10">
					<div class="text-navy/35 text-[10px] tracking-[0.25em] uppercase mb-5">What's included</div>
					<ul class="flex flex-col gap-3.5">
						{#each [
							'Islamic distribution schedule following Qur\'anic fractions',
							'Community property acknowledgment (where applicable)',
							'Islamic reconciliation letter',
							'Signing instructions and witness requirements'
						] as item}
							<li class="flex items-start gap-3 text-sm text-navy/68">
								<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								{item}
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</article>

		<!-- ── PLAN 2: Guided Trust ── -->
		<article class="rounded-2xl border border-navy/12 bg-white/70 overflow-hidden shadow-sm shadow-navy/4">
			<div class="grid lg:grid-cols-[1fr_1.1fr] divide-y lg:divide-y-0 lg:divide-x divide-navy/8">

				<!-- Left: identity -->
				<div class="p-8 md:p-10 flex flex-col gap-4">
					<div class="flex items-baseline justify-between gap-4">
						<div>
							<span class="text-[10px] tracking-[0.28em] uppercase text-emerald-accent/70 font-medium">Plan 02 · Most popular</span>
							<h2 class="text-2xl md:text-3xl tracking-tight text-navy mt-1">{productName}</h2>
							<p class="text-navy/70 text-sm leading-relaxed mt-2">{productAttorneyReviewSentence}</p>
						</div>
						<div class="text-right shrink-0">
							<div class="text-3xl tracking-tight text-navy">{formatUsdWhole(defaultPrepFee)}</div>
							<div class="text-navy/40 text-xs mt-0.5">flat fee</div>
						</div>
					</div>

					<p class="text-navy/60 text-sm leading-relaxed">
						Islamic revocable living trust for individuals and families with straightforward estates. Build at your own pace — an attorney reviews, supervises, and signs the final trust.
					</p>

					<div class="bg-emerald-accent/6 rounded-xl border border-emerald-accent/15 px-4 py-3">
						<div class="text-emerald-accent text-[10px] tracking-[0.22em] uppercase mb-1 font-medium">Add-on available</div>
						<p class="text-navy/55 text-xs leading-relaxed">
							Business Succession Planning — $1,000. Available if you have any LLC or business ownership interest.
						</p>
					</div>

					<div class="text-navy/35 text-xs leading-relaxed">
						Attorney-supervised · Notarization included · Texas & California
					</div>

					<div class="pt-2 mt-auto">
						<a
							href="/trust"
							class="group inline-flex items-center gap-2 px-6 py-3 bg-navy text-cream text-sm font-medium rounded-lg
								   transition-all duration-200 hover:bg-navy-light hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Start Your {productNameShortBare()}
							<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Right: what's included -->
				<div class="p-8 md:p-10">
					<div class="text-navy/35 text-[10px] tracking-[0.25em] uppercase mb-5">What's included</div>
					<ul class="flex flex-col gap-3.5">
						{#each [
							"Distribution built around the Qur'anic shares",
							// 'Two pour-over wills (one per spouse)',
							'Digital document delivery',
							'Deed preparation and recording',
							'Homestead exemption guidance',
							'Email attorney access throughout'
						] as item}
							<li class="flex items-start gap-3 text-sm text-navy/68">
								<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								{item}
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</article>

		<!-- ── PLAN 3: Legacy Plan ── -->
		<article class="rounded-2xl bg-navy overflow-hidden">
			<div class="grid lg:grid-cols-[1fr_1.1fr] divide-y lg:divide-y-0 lg:divide-x divide-cream/10">

				<!-- Left: identity -->
				<div class="p-8 md:p-10 flex flex-col gap-4">
					<div class="flex items-baseline justify-between gap-4">
						<div>
							<span class="text-[10px] tracking-[0.28em] uppercase text-emerald-light/70 font-medium">Plan 03 · Full-service</span>
							<h2 class="text-2xl md:text-3xl tracking-tight text-cream mt-1">Legacy Plan</h2>
						</div>
						<div class="text-right shrink-0">
							<div class="text-3xl tracking-tight text-cream">$3,500</div>
							<div class="text-cream/40 text-xs mt-0.5">starting price</div>
						</div>
					</div>

					<p class="text-cream/65 text-sm leading-relaxed">
						Full-service Islamic estate planning, personally designed by your attorney. Every document drafted to your specific assets, family structure, and goals.
					</p>

					<div class="bg-cream/6 rounded-xl border border-cream/10 px-4 py-3">
						<div class="text-emerald-light text-[10px] tracking-[0.22em] uppercase mb-1 font-medium">Add-on available</div>
						<p class="text-cream/50 text-xs leading-relaxed">
							Business Succession Planning — $1,000. Applies if corporate document amendments are needed.
						</p>
					</div>

					<div class="text-cream/30 text-xs leading-relaxed">
						Texas & California
					</div>

					<div class="pt-2 mt-auto">
						<a
							href={consultationBookingUrl}
							class="group inline-flex items-center gap-2 px-6 py-3 bg-cream text-navy text-sm font-medium rounded-lg
								   transition-all duration-200 hover:bg-white hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Schedule a Consultation
							<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Right: what's included -->
				<div class="p-8 md:p-10">
					<div class="text-cream/30 text-[10px] tracking-[0.25em] uppercase mb-5">What's included</div>
					<ul class="flex flex-col gap-3">
						{#each [
							{ label: 'Dedicated Heba Strategy Session', sub: 'A personal attorney call before drafting begins to determine the right heba structure for your specific assets and family goals.' },
							{ label: 'Asset Distribution Review', sub: 'Guidance on which assets are best positioned for heirs vs. charitable giving, and how property titling affects what your family receives.' },
							{ label: 'Business Interest Review', sub: 'Attorney review of any LLC or business ownership for shariah compliance gaps.' },
							{ label: 'Trust drafting and deed preparation', sub: null },
							{ label: 'Deed recording with the county', sub: null },
							// { label: 'Two pour-over wills', sub: null },
							{ label: 'Healthcare directives and financial power of attorney', sub: null },
							{ label: 'Certification of trust and notarization of all documents', sub: null },
							{ label: 'Homestead exemption guidance and county-specific filing instructions', sub: null },
							{ label: 'Physical binder shipped to your door', sub: null },
							{ label: 'Unlimited email attorney access', sub: 'From strategy session through final delivery.' }
						] as item}
							<li class="flex items-start gap-3 text-sm text-cream/68">
								<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-light/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								<span>
									{item.label}
									{#if item.sub}
										<span class="block text-cream/40 text-xs mt-0.5">{item.sub}</span>
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</article>

		<!-- ── PLAN 4: Family Waqf Plan ── -->
		<article class="rounded-2xl border border-navy/12 bg-white/60 overflow-hidden">
			<div class="grid lg:grid-cols-[1fr_1.1fr] divide-y lg:divide-y-0 lg:divide-x divide-navy/8">

				<!-- Left: identity -->
				<div class="p-8 md:p-10 flex flex-col gap-4">
					<div class="flex items-baseline justify-between gap-4">
						<div>
							<span class="text-[10px] tracking-[0.28em] uppercase text-emerald-accent/70 font-medium">Plan 04 · Estate + Endowment</span>
							<h2 class="text-2xl md:text-3xl tracking-tight text-navy mt-1">Family Waqf Plan</h2>
						</div>
						<div class="text-right shrink-0">
							<div class="text-lg tracking-tight text-navy/70">Inquire</div>
							<div class="text-navy/40 text-xs mt-0.5">for pricing</div>
						</div>
					</div>

					<p class="text-navy/60 text-sm leading-relaxed">
						For families who want to protect their estate and build something that outlasts them. Includes everything in the Legacy Plan, plus the legal and operational infrastructure to create a lasting family endowment.
					</p>

					<p class="text-navy/60 text-sm leading-relaxed">
						The Family Waqf Plan: we draft the legal framework for your family waqf, built into your estate plan and designed for ongoing sadaqah jariyah.
					</p>

					<div class="pt-2 mt-auto">
						<a
							href={consultationBookingUrl}
							class="group inline-flex items-center gap-2 px-6 py-3 bg-navy text-cream text-sm font-medium rounded-lg
								   transition-all duration-200 hover:bg-navy-light hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Build Your Family Legacy
							<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Right: what's included -->
				<div class="p-8 md:p-10">
					<div class="text-navy/35 text-[10px] tracking-[0.25em] uppercase mb-3">Everything in the Legacy Plan, plus:</div>

					<ul class="flex flex-col gap-3.5 mb-7">
						{#each [
							{ label: '501(c)(3) formation', sub: 'Legal formation of the family\'s charitable entity — the institutional vehicle for your endowment.' },
							{ label: 'Endowment structure design', sub: 'Structuring charitable assets to flow to the right institutions in the right proportions, aligned with your family\'s values and goals.' }
						] as item}
							<li class="flex items-start gap-3 text-sm text-navy/68">
								<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								<span>
									{item.label}
									<span class="block text-navy/42 text-xs mt-0.5">{item.sub}</span>
								</span>
							</li>
						{/each}
					</ul>

					<div class="border-t border-navy/8 pt-5">
						<div class="text-navy/35 text-[10px] tracking-[0.25em] uppercase mb-3">Also includes all Legacy Plan items</div>
						<div class="flex flex-wrap gap-2">
							{#each ['Heba Strategy Session', 'Trust drafting', 'Deed recording', 'Pour-over wills', 'POA & healthcare directives', 'Physical binder', 'Attorney access'] as tag}
								<span class="px-2.5 py-1 rounded-md bg-navy/5 text-navy/50 text-[11px]">{tag}</span>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</article>

		<!-- ── PLAN 5: Advanced Planning ── -->
		<article class="rounded-2xl border border-navy/10 bg-navy/3 overflow-hidden">
			<div class="grid lg:grid-cols-[1fr_1.1fr] divide-y lg:divide-y-0 lg:divide-x divide-navy/8">

				<!-- Left: identity -->
				<div class="p-8 md:p-10 flex flex-col gap-4">
					<div class="flex items-baseline justify-between gap-4 flex-wrap">
						<div>
							<span class="text-[10px] tracking-[0.28em] uppercase text-navy/40 font-medium">Plan 05 · Strategic</span>
							<h2 class="text-2xl md:text-3xl tracking-tight text-navy mt-1">Advanced Planning</h2>
						</div>
						<div class="text-right shrink-0">
							<div class="text-lg tracking-tight text-navy/70">Consultation</div>
							<div class="text-navy/40 text-xs mt-0.5">required</div>
						</div>
					</div>

					<p class="text-navy/60 text-sm leading-relaxed">
						For Muslim professionals and families who want their estate plan to work strategically across legal, charitable, and financial dimensions. Requires coordination with a CPA or tax advisor.
					</p>

					<div class="bg-white/70 rounded-xl border border-navy/8 px-4 py-3">
						<p class="text-navy/45 text-xs leading-relaxed">
							This plan drafts legal structures and works alongside tax professionals. It does not provide tax advice. Families who can fund a CLAT with approximately $100,000 or more may benefit.
						</p>
					</div>

					<div class="pt-2 mt-auto">
						<a
							href={consultationBookingUrl}
							class="group inline-flex items-center gap-2 px-6 py-3 border border-navy/20 text-navy text-sm font-medium rounded-lg
								   transition-all duration-200 hover:border-navy/35 hover:bg-navy/4 hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Inquire About Advanced Planning
							<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Right: what's included -->
				<div class="p-8 md:p-10">
					<div class="text-navy/35 text-[10px] tracking-[0.25em] uppercase mb-5">Structures available</div>
					<ul class="flex flex-col gap-4">
						{#each [
							{
								label: 'Charitable Lead Annuity Trust (CLAT)',
								sub: 'Funds a stream of charitable payments for a set term while generating a significant income tax deduction in year one. Remaining assets pass to heirs at the end of the term. Well-suited to Muslim professionals with meaningful charitable obligations.'
							},
							{
								label: 'Charitable Remainder Trust (CRT)',
								sub: 'Provides an income stream to you or your family for a period of years or for life, with the remainder passing to a charitable institution. Can be structured to benefit a masjid or Islamic organization.'
							},
							{
								label: 'Intentionally Defective Grantor Trust (IDGT)',
								sub: 'Allows assets to appreciate outside the taxable estate while grantor pays income tax on trust income — effectively a tax-free gift to heirs. Used for families with appreciating business interests or investments.'
							},
							{
								label: 'Additional advanced structures',
								sub: 'Other structures available on a case-by-case basis following consultation. All structures are coordinated with your CPA or tax advisor.'
							}
						] as item}
							<li class="flex items-start gap-3 text-sm">
								<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-navy/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								<span>
									<span class="text-navy/75 font-medium">{item.label}</span>
									<span class="block text-navy/42 text-xs mt-0.5 leading-relaxed">{item.sub}</span>
								</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</article>

	</div>


	<!-- ═══ FOOTER (minimal) ═══ -->
	<footer class="px-6 py-10 border-t border-navy/8">
		<div class="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
			<p class="text-navy/35 text-xs">© 2026 McDaniel Estate Planning, PLLC. Licensed in Texas and California.</p>
			<div class="flex flex-wrap gap-6">
				<a href="/" class="text-navy/45 text-xs hover:text-navy/70 transition-colors">Home</a>
				<a href="/which-plan" class="text-navy/45 text-xs hover:text-navy/70 transition-colors">Which plan is right?</a>
				<a href="/trust" class="text-navy/45 text-xs hover:text-navy/70 transition-colors">{productNameShortBare()}</a>
				<a href={consultationBookingUrl} class="text-navy/45 text-xs hover:text-navy/70 transition-colors">Book Consultation</a>
			</div>
		</div>
	</footer>

</div>
