<script lang="ts">
	import { fly } from 'svelte/transition';
	import { consultationBookingUrl, defaultPrepFee, formatUsd } from '$lib/config';

	/* ─── Questions ─────────────────────────────────────────────────────── */
	const questions = [
		{
			text: 'Do you own a home?',
			sub: 'This includes any real property — a primary residence, rental, or land.'
		},
		{
			text: 'Are you married?',
			sub: ''
		},
		{
			text: 'Do you have children from a prior relationship — or does your spouse?',
			sub: "Blended family situations often require customized planning to make sure Qur'anic shares are honored for all children."
		},
		{
			text: 'Do you have any business ownership?',
			sub: 'This includes any LLC, partnership, sole proprietorship, or equity stake in a company — even a small one.'
		},
		{
			text: 'Do you have significant assets beyond a home and retirement accounts?',
			sub: 'For example: investment accounts, rental properties, substantial savings, or a family business valued above your home.'
		},
		{
			text: "Do you have questions about how your spouse's share should be structured under Islamic law?",
			sub: 'Heba — the mechanism for structuring community property in an Islamic estate plan — often requires an open attorney conversation to get right.'
		}
	] as const;

	/* ─── State ─────────────────────────────────────────────────────────── */
	let step = $state(0);
	let answers = $state<(boolean | null)[]>(questions.map(() => null));
	let showResults = $state(false);

	const currentAnswer = $derived(answers[step]);
	const canAdvance = $derived(currentAnswer !== null);

	/* ─── Actions ───────────────────────────────────────────────────────── */
	function select(val: boolean) {
		const next = answers.slice();
		next[step] = val;
		answers = next;
	}

	function advance() {
		if (!canAdvance) return;
		if (step < questions.length - 1) {
			step++;
		} else {
			showResults = true;
		}
	}

	function back() {
		if (step > 0) step--;
	}

	function restart() {
		showResults = false;
		step = 0;
		answers = questions.map(() => null);
	}

	/* ─── Routing logic ─────────────────────────────────────────────────── */
	type Tier = 'free-will' | 'goodtree' | 'legacy';
	type Rec = { tier: Tier; waqf: boolean; reason: string };

	function computeRec(a: (boolean | null)[]): Rec {
		const [home, married, blended, business, assets, heba] = a;
		const complex = blended || business || assets || heba;

		if (complex) {
			return {
				tier: 'legacy',
				waqf: !!(business || assets),
				reason:
					'Based on your answers, your situation may benefit from attorney guidance. The Legacy Plan includes a dedicated strategy session where your attorney works through these questions with you personally.'
			};
		}
		if (home || married) {
			return {
				tier: 'goodtree',
				waqf: false,
				reason:
					'Your situation — a home or married status with a straightforward family structure — is a strong fit for the GoodTree Trust. You can build your shariah-compliant trust online at your own pace, with attorney access throughout.'
			};
		}
		return {
			tier: 'free-will',
			waqf: false,
			reason:
				'The free Islamic will is the right starting point for your situation. It costs nothing and takes less than ten minutes to complete.'
		};
	}

	const rec = $derived(computeRec(answers));
	const progress = $derived(((step + 1) / questions.length) * 100);

	/* ─── Plan display config ───────────────────────────────────────────── */
	const plans = {
		'free-will': {
			eyebrow: 'Free · No cost · All states',
			name: 'Free Islamic Will',
			price: 'Free',
			priceNote: 'no credit card required',
			body: 'Attorney-informed and shariah-grounded. The starting point for every Muslim family — regardless of estate size or state of residence.',
			cta: { label: 'Create Your Free Islamic Will', href: '/free-islamic-will' },
			color: 'emerald'
		},
		goodtree: {
			eyebrow: 'Self-service · Online · TX & CA',
			name: 'GoodTree Trust',
			price: formatUsd(defaultPrepFee),
			priceNote: 'flat fee · attorney-supervised · notarization included',
			body: 'Build an attorney-supervised Islamic revocable trust at your own pace. Includes deed preparation, two pour-over wills, and WhatsApp attorney access throughout.',
			cta: { label: 'Start Your GoodTree Trust', href: '/trust' },
			color: 'navy'
		},
		legacy: {
			eyebrow: 'Full-service · In-person · TX & CA',
			name: 'Legacy Plan',
			price: 'from $3,500',
			priceNote: 'Texas & California',
			body: 'Personally designed by your attorney. Includes a dedicated Heba Strategy Session, trust drafting, deed recording, wills, powers of attorney, healthcare directives, and a physical binder shipped to your door.',
			cta: { label: 'Schedule a Consultation', href: consultationBookingUrl },
			color: 'navy'
		}
	} as const;

	const waqfPlan = {
		eyebrow: 'Full-service + Charitable endowment',
		name: 'Family Waqf Plan',
		price: 'Inquire for pricing',
		priceNote: 'includes everything in the Legacy Plan',
		body: 'For families who want to protect their estate and build something that outlasts them. Includes 501(c)(3) formation, endowment structure design, and facilitated Afterfund onboarding — coordinated directly on your behalf.',
		cta: { label: 'Inquire About the Waqf Plan', href: consultationBookingUrl }
	};

	const primary = $derived(plans[rec.tier]);
</script>

<svelte:head>
	<title>Which Plan Is Right for You — Muslim Legacy Planning</title>
	<meta
		name="description"
		content="Answer six questions to find the Islamic estate plan that fits your family's situation."
	/>
</svelte:head>

<!-- ═══ NAV ═══ -->
<nav class="fixed top-0 inset-x-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-navy/10">
	<div class="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
		<a
			href="/"
			aria-label="Muslim Legacy Planning — home"
			class="flex items-center gap-3 transition-opacity hover:opacity-75"
		>
			<img src="/mcdaniel.png" alt="" class="h-8 w-auto" />
			<span
				class="text-navy font-semibold text-sm tracking-tight hidden sm:inline"
				style="font-family: 'Playfair Display', Georgia, serif;"
			>
				Muslim Legacy Planning
			</span>
		</a>
		<div class="flex items-center gap-3">
			<a href="/plans" class="text-navy/55 text-sm hover:text-navy transition-colors hidden sm:inline">
				View all plans
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

<div class="bg-cream min-h-dvh font-sans pt-16 flex flex-col">

	{#if !showResults}
		<!-- ═══ QUESTION SCREEN ═══ -->
		<div class="flex-1 flex flex-col items-center justify-center px-6 py-16">
			<div class="w-full max-w-lg">

				<!-- Progress -->
				<div class="flex items-center justify-between mb-2">
					<span class="text-[11px] text-navy/40 tracking-wider uppercase font-medium">Which plan fits you?</span>
					<span class="text-[11px] text-navy/35">{step + 1} of {questions.length}</span>
				</div>
				<div class="w-full h-1 rounded-full bg-navy/6 overflow-hidden mb-10">
					<div
						class="h-full rounded-full bg-emerald-accent transition-all duration-500 ease-out"
						style="width: {progress}%"
					></div>
				</div>

				<!-- Question — updates in place, no transition wrapper -->
				<h2 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight leading-snug mb-3">
					{questions[step].text}
				</h2>
				{#if questions[step].sub}
					<p class="text-sm text-navy/55 leading-relaxed mb-8">
						{questions[step].sub}
					</p>
				{:else}
					<div class="mb-8"></div>
				{/if}

				<!-- Yes / No — show selected state, don't auto-advance -->
				<div class="flex gap-3 mb-8">
					{#each [{ label: 'Yes', value: true }, { label: 'No', value: false }] as opt}
						<button
							onclick={() => select(opt.value)}
							class="flex-1 px-5 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer
								{currentAnswer === opt.value
									? 'bg-emerald-accent/8 border-emerald-accent/30 text-navy font-medium'
									: 'bg-white border-navy/10 text-navy/65 hover:border-navy/20'}"
						>
							{opt.label}
						</button>
					{/each}
				</div>

				<!-- Back / Next nav -->
				<div class="flex items-center justify-between">
					<button
						onclick={back}
						disabled={step === 0}
						class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm text-navy/55
							   transition-all hover:text-navy hover:bg-navy/4
							   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Back
					</button>

					<button
						onclick={advance}
						disabled={!canAdvance}
						class="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy
							   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
							   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
					>
						{step === questions.length - 1 ? 'See my recommendation' : 'Next'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>
		</div>

	{:else}
		<!-- ═══ RESULTS SCREEN ═══ -->
		<div
			in:fly={{ y: 30, opacity: 0, duration: 400, delay: 80 }}
			class="flex-1 flex flex-col px-6 pt-14 pb-20"
		>
			<div class="max-w-2xl mx-auto w-full">

				<!-- Result header -->
				<div class="text-center mb-10">
					<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-accent/10 border border-emerald-accent/20 mb-6">
						<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
						<span class="text-emerald-accent text-[11px] tracking-[0.2em] uppercase font-medium">Your recommendation</span>
					</div>

					<h1 class="text-3xl md:text-4xl tracking-tight text-navy text-balance mb-4">
						{#if rec.tier === 'free-will'}
							Start with the free Islamic will.
						{:else if rec.tier === 'goodtree'}
							The GoodTree Trust fits your situation.
						{:else}
							The Legacy Plan is right for you.
						{/if}
					</h1>

					<p class="text-navy/55 text-base leading-relaxed max-w-[52ch] mx-auto">
						{rec.reason}
					</p>
				</div>

				<!-- Primary recommendation card -->
				<div class="rounded-2xl overflow-hidden border mb-5
					{rec.tier === 'goodtree' || rec.tier === 'legacy'
						? 'bg-navy border-navy'
						: 'bg-emerald-accent border-emerald-accent'}"
				>
					<div class="p-8 md:p-10">
						<div class="text-[10px] tracking-[0.28em] uppercase mb-4 opacity-60
							{rec.tier !== 'free-will' ? 'text-cream' : 'text-cream'}">
							{primary.eyebrow}
						</div>

						<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
							<h2 class="text-2xl md:text-3xl tracking-tight text-cream">{primary.name}</h2>
							<div class="text-right">
								<div class="text-2xl tracking-tight text-cream">{primary.price}</div>
								<div class="text-cream/50 text-xs mt-0.5">{primary.priceNote}</div>
							</div>
						</div>

						<p class="text-cream/70 text-sm leading-relaxed mb-7 max-w-[50ch]">
							{primary.body}
						</p>

						<a
							href={primary.cta.href}
							class="inline-flex items-center gap-2 px-7 py-3.5 bg-cream text-navy text-sm font-medium rounded-lg
								   transition-all duration-200 hover:bg-white hover:-translate-y-0.5 active:scale-[0.98]"
						>
							{primary.cta.label}
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Waqf card (when flagged) -->
				{#if rec.waqf}
					<div class="rounded-2xl border border-navy/12 bg-white/60 p-7 mb-5">
						<div class="flex items-start gap-5">
							<div class="w-8 h-8 rounded-full bg-emerald-accent/12 flex items-center justify-center shrink-0 mt-0.5">
								<svg class="w-4 h-4 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
									<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
								</svg>
							</div>
							<div>
								<div class="text-emerald-accent text-[10px] tracking-[0.25em] uppercase mb-1.5">Also worth considering</div>
								<h3 class="text-navy text-lg tracking-tight mb-1.5">{waqfPlan.name}</h3>
								<p class="text-navy/55 text-sm leading-relaxed mb-4">{waqfPlan.body}</p>
								<a
									href={waqfPlan.cta.href}
									class="text-emerald-accent text-sm hover:text-emerald-light transition-colors flex items-center gap-1.5 group"
								>
									{waqfPlan.cta.label}
									<svg class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</a>
							</div>
						</div>
					</div>
				{/if}


				<!-- Divider and all-plans link -->
				<div class="flex items-center gap-4 my-8">
					<div class="flex-1 h-px bg-navy/8"></div>
					<span class="text-navy/30 text-xs">This is a nudge, not a gate</span>
					<div class="flex-1 h-px bg-navy/8"></div>
				</div>

				<p class="text-center text-navy/45 text-sm mb-5">
					You can choose any plan regardless of this result.
				</p>

				<!-- Other plans (smaller, secondary) -->
				<div class="grid sm:grid-cols-2 gap-4 mb-8">
					{#each Object.entries(plans).filter(([k]) => k !== rec.tier) as [key, p]}
						<a
							href={p.cta.href}
							class="block rounded-xl border border-navy/10 bg-white/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-navy/5 group"
						>
							<div class="text-emerald-accent/65 text-[9px] tracking-[0.25em] uppercase mb-2">{p.eyebrow}</div>
							<div class="flex items-baseline justify-between gap-2 mb-2">
								<span class="text-navy text-base font-medium tracking-tight">{p.name}</span>
								<span class="text-navy/60 text-sm">{p.price}</span>
							</div>
							<p class="text-navy/48 text-xs leading-relaxed mb-3">{p.body.slice(0, 110)}…</p>
							<span class="text-emerald-accent text-xs flex items-center gap-1 group-hover:gap-1.5 transition-all">
								{p.cta.label}
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</span>
						</a>
					{/each}
				</div>

				<!-- Restart + view all -->
				<div class="text-center flex flex-col items-center gap-3">
					<a href="/plans" class="text-navy/45 text-xs hover:text-navy/70 transition-colors underline underline-offset-2">
						View all five plans in detail
					</a>
					<button
						onclick={restart}
						class="text-navy/30 text-xs hover:text-navy/55 transition-colors cursor-pointer"
					>
						Retake the questionnaire
					</button>
				</div>
			</div>
		</div>
	{/if}

</div>
