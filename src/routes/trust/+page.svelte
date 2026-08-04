<script lang="ts">
	import { siteName, defaultPrepFee, formatUsd, wasiyyahDiscount } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { slide } from 'svelte/transition';

	const discountedPrepFee = defaultPrepFee - wasiyyahDiscount;

	let { data } = $props();
	let mobileMenuOpen = $state(false);
	let openConcern = $state<number | null>(null);

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
		window.location.reload();
	}

	function toggleConcern(index: number) {
		openConcern = openConcern === index ? null : index;
	}

	function revealOnScroll(node: HTMLElement) {
		if (typeof IntersectionObserver === 'undefined') {
			node.classList.add('is-visible');
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					node.classList.add('is-visible');
					observer.unobserve(node);
				}
			},
			{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
		);
		observer.observe(node);
		return { destroy() { observer.disconnect(); } };
	}

	const steps = [
		{
			label: 'Answer the questionnaire',
			body: 'Roughly an hour, at your own pace. We walk you through heirs, property, trustees, and Qur\'anic shares with built-in guidance for each decision.',
			meta: '≈ 60 min · save & resume'
		},
		{
			label: 'Attorney review & drafting',
			body: 'A licensed Texas attorney reviews your answers and drafts a revocable living trust, pour-over will, and supporting documents tailored to your family.',
			meta: '2–5 business days'
		},
		{
			label: 'Sign with a notary',
			body: 'Book a remote or in-person notary session through a licensed notary. We coordinate the signing of every document in the right order.',
			meta: 'Remote or in-person'
		},
		{
			label: 'Deed recorded',
			body: 'We prepare and record your deed transferring the homestead into your trust, then guide you through preserving your Texas homestead exemption.',
			meta: 'County clerk filing included'
		},
		{
			label: 'Make Your Trust Work',
			body: 'Your documents are only the first step. Our guided dashboard walks you through signing follow-through, updating banks and brokerages, and storing originals where your family can find them — with checklists and progress tracking.',
			meta: 'Guided dashboard'
		}
	];

	const included = [
		{
			title: 'Revocable living trust',
			body: 'The core instrument — drafted by a licensed Texas attorney and structured to enforce Qur\'anic inheritance shares privately, outside of probate.'
		},
		{
			title: 'Pour-over wills',
			body: 'Companion wills for both spouses that sweep any remaining assets into your trust on death, with executors and guardians of your choosing.'
		},
		{
			title: 'Certification of trust',
			body: 'The short, signed summary you hand to banks, brokerages, and title companies — proves the trust exists without exposing its contents.'
		},
		{
			title: 'Homestead exemption guide',
			body: 'Step-by-step instructions, with visual aids, to keep your Texas homestead exemption in place after the deed transfers into your trust.'
		}
	];

	const concerns = [
		{
			question: 'Will I lose control of my home?',
			answer: 'No. Your trust is revocable, and you remain the trustee while you are alive and competent. You keep full control of your home — live in it, refinance it, sell it, or transfer it just as you do now. The trust changes how the property is held, not who controls it.'
		},
		{
			question: 'Will my property taxes go up?',
			answer: 'No. Transferring your homestead into a revocable living trust does not increase your property taxes. We also provide a step-by-step guide, with visual aids, to ensure your Texas homestead exemption remains in place after the transfer.'
		},
		{
			question: 'Will my mortgage company object?',
			answer: 'No. Federal law (the Garn–St. Germain Act) protects transfers of a primary residence into a revocable living trust. As long as you remain a beneficiary and continue making payments, lenders cannot call the loan due solely because of the transfer.'
		},
		{
			question: 'Is this legally valid in Texas?',
			answer: 'Yes. Your trust is drafted and supervised by a licensed Texas attorney and structured under Texas law. It is a legally binding estate planning instrument designed to avoid probate when properly funded.'
		},
		{
			question: 'Are trusts only for wealthy families?',
			answer: 'No. In many cases, working families benefit the most from avoiding probate. A properly structured trust reduces court involvement, preserves privacy, and ensures assets are distributed according to Islamic inheritance principles.'
		}
	];
</script>

<!-- ═══════════════════ NAV ═══════════════════ -->
<nav class="fixed top-0 inset-x-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-navy/10">
	<div class="max-w-6xl mx-auto px-5 py-2.5">
		<div class="hidden md:grid items-center grid-cols-[1fr_auto_1fr]">
			<div class="justify-self-start flex items-center gap-3">
				<a href="/trust" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight whitespace-nowrap">
					<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
					{siteName}
				</a>
				<span class="text-navy/20">·</span>
				<a href="/" class="inline-flex items-center gap-1.5 text-navy/45 hover:text-navy transition-colors" aria-label="McDaniel Estate Planning — home">
					<img src="/mcdaniel.png" alt="" class="h-6 w-auto opacity-70" />
					<span class="sr-only">McDaniel Estate Planning</span>
					<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
				</a>
			</div>

			<div class="justify-self-center flex items-center gap-7">
				<a href="#how" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">How It Works</a>
				<a href="#included" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">What's Included</a>
				<a href="#eligibility" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">Eligibility</a>
				<a href="#concerns" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">FAQ</a>
				{#if data.user}
					<a href="/dashboard" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">Dashboard</a>
				{/if}
			</div>

			<div class="justify-self-end">
				{#if data.user}
					<button
						onclick={handleLogout}
						class="px-4 py-1.5 text-sm text-navy/60 transition-colors hover:text-navy cursor-pointer"
					>
						Log out
					</button>
				{:else}
					<div class="flex items-center gap-2.5">
						<a href="/login" class="px-4 py-1.5 text-sm text-navy/70 transition-colors hover:text-navy">Log in</a>
						<a href="/signup" class="px-4 py-1.5 text-sm font-medium text-cream bg-navy rounded-lg transition-all duration-200 hover:bg-navy-light">
							Sign up
						</a>
					</div>
				{/if}
			</div>
		</div>

		<div class="flex items-center justify-between md:hidden">
			<a href="/trust" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight whitespace-nowrap">
				<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
				{siteName}
			</a>
			<button
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				class="p-1.5 -mr-1 text-navy/50 hover:text-navy transition-colors cursor-pointer"
				aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
				{:else}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
				{/if}
			</button>
		</div>
	</div>

	{#if mobileMenuOpen}
		<div class="md:hidden mt-2 mx-3 rounded-2xl bg-white/85 backdrop-blur-lg border border-navy/6 shadow-lg overflow-hidden">
			<div class="flex flex-col p-3 gap-1">
				<a href="#how" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 hover:text-emerald-accent">How it works</a>
				<a href="#included" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 hover:text-emerald-accent">What's included</a>
				<a href="#eligibility" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 hover:text-emerald-accent">Eligibility</a>
				<a href="#concerns" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 hover:text-emerald-accent">FAQ</a>
				<a href="/" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/50 rounded-xl hover:bg-navy/5">McDaniel Estate Planning ↗</a>
				<div class="h-px bg-navy/6 my-1 mx-2"></div>
				{#if data.user}
					<a href="/dashboard" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5">Dashboard</a>
					<button onclick={() => { mobileMenuOpen = false; handleLogout(); }} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 text-left cursor-pointer">Log out</button>
				{:else}
					<a href="/login" class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5">Log in</a>
					<a href="/signup" class="mx-2 mt-1 py-2.5 text-sm font-medium text-cream bg-navy rounded-xl text-center hover:bg-navy-light">Sign up</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<div class="bg-cream font-sans">

	<!-- ═══════════════════ HERO ═══════════════════ -->
	<section class="min-h-dvh flex items-center justify-center relative pt-24 pb-16">
		<div class="absolute inset-0 pointer-events-none"
			style="background: radial-gradient(ellipse 65% 55% at 50% 45%, rgba(74,124,111,0.09) 0%, transparent 70%);">
		</div>

		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-28 left-10 md:left-20 w-7 h-7 md:w-9 md:h-9 border-t border-l border-emerald-accent/50"></div>
			<div class="absolute top-28 right-10 md:right-20 w-7 h-7 md:w-9 md:h-9 border-t border-r border-emerald-accent/50"></div>
			<div class="absolute bottom-16 left-10 md:left-20 w-7 h-7 md:w-9 md:h-9 border-b border-l border-emerald-accent/50"></div>
			<div class="absolute bottom-16 right-10 md:right-20 w-7 h-7 md:w-9 md:h-9 border-b border-r border-emerald-accent/50"></div>
		</div>

		<div use:revealOnScroll class="scroll-reveal relative flex flex-col items-center gap-6 px-6 text-center max-w-3xl">

			<a href="/" class="inline-flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur border border-navy/8 text-[11px] text-navy/55 hover:border-emerald-accent/40 hover:text-navy transition-all">
				<img src="/mcdaniel.png" alt="" class="h-5 w-auto" />
				A product of McDaniel Estate Planning
				<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
			</a>

			<h1 class="text-4xl md:text-6xl tracking-tight text-navy leading-[1.05] text-balance">
				Build your Islamic trust online, in about an hour.
			</h1>

			<p class="text-navy/60 text-base md:text-lg font-light max-w-xl leading-relaxed text-balance">
				An attorney-supervised revocable trust for Texas families — Qur'anic inheritance enforced 
			</p>
			<div class="flex flex-col sm:flex-row items-center gap-3 mt-3">
				<a
					href="/signup"
					class="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-navy text-cream text-sm tracking-wider uppercase rounded-lg
						   transition-all duration-300 hover:bg-navy-light hover:shadow-xl hover:shadow-navy/15 hover:-translate-y-0.5"
				>
					Begin Your Trust
					<svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
				</a>
				<a
					href="#how"
					class="group inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-navy/70 hover:text-emerald-accent transition-colors"
				>
					See how it works
					<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
				</a>
			</div>

			<div class="mt-6 w-full max-w-lg rounded-2xl border border-navy/8 bg-white/60 backdrop-blur overflow-hidden shadow-[0_12px_32px_-16px_rgba(31,42,55,0.18)]">
				<div class="flex items-center justify-between gap-6 px-6 pt-5 pb-4">
					<div class="text-left">
						<div class="text-[10px] tracking-[0.25em] uppercase text-navy/40 mb-1.5">Flat fee</div>
						<div class="flex items-baseline gap-2.5">
							<span class="text-3xl tabular-nums tracking-tight text-navy">{formatUsd(defaultPrepFee)}</span>
							<span class="text-navy/35 text-xs">one-time</span>
						</div>
					</div>
					<div class="hidden sm:flex items-center gap-2 text-navy/45 text-[11px] leading-snug text-right max-w-48">
						<svg class="w-3.5 h-3.5 text-emerald-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						<span>Attorney drafting, review &amp; deed recording included</span>
					</div>
				</div>

				<!-- Discount card -->
				<div class="relative mx-3 mb-3 rounded-xl border border-emerald-accent/20 bg-linear-to-br from-emerald-accent/8 to-emerald-accent/2 overflow-hidden">
					<div
						class="absolute -right-6 -top-8 w-28 h-28 rounded-full pointer-events-none"
						style="background: radial-gradient(circle, rgba(74,124,111,0.16) 0%, transparent 70%);"
					></div>
					<div class="relative flex items-center gap-4 px-5 py-4">
						<div class="shrink-0 w-10 h-10 rounded-xl bg-emerald-accent/12 border border-emerald-accent/20 flex items-center justify-center">
							<svg class="w-5 h-5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-baseline gap-2 flex-wrap">
								<span class="text-sm font-semibold text-navy">Pay {formatUsd(discountedPrepFee)}</span>
								<span class="text-navy/35 text-xs line-through tabular-nums">{formatUsd(defaultPrepFee)}</span>
								<span class="text-[10px] font-semibold tracking-wide uppercase text-emerald-accent">Save {formatUsd(wasiyyahDiscount)}</span>
							</div>
							<p class="text-[11px] text-navy/50 leading-relaxed mt-0.5">
								Pledge a charitable gift to a masjid or Islamic institution of your choice.
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-2">
				<div class="flex items-center gap-2">
					<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					<span class="text-navy/45 text-xs">Attorney-supervised</span>
				</div>
				<div class="w-px h-3 bg-navy/15 sm:block hidden"></div>
				<div class="flex items-center gap-2">
					<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					<span class="text-navy/45 text-xs">Qur'anic inheritance, enforced</span>
				</div>
				<div class="w-px h-3 bg-navy/15 sm:block hidden"></div>
				<div class="flex items-center gap-2">
					<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					<span class="text-navy/45 text-xs">Deed prepared & recorded</span>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ HOW IT WORKS ═══════════════════ -->
	<section id="how" class="py-20 md:py-28 px-6 scroll-mt-24">
		<div use:revealOnScroll class="scroll-reveal max-w-6xl mx-auto">

			<div class="grid md:grid-cols-[1fr_2fr] gap-10 md:gap-16 mb-14 items-end">
				<div>
					<div class="flex items-center gap-4 mb-5">
						<span class="w-8 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">How it works</span>
					</div>
					<h2 class="text-3xl md:text-4xl tracking-tight text-navy leading-tight text-balance">
						From sign-up to a funded trust, in five steps.
					</h2>
				</div>
				<p class="text-navy/55 text-base leading-relaxed md:pl-8 md:border-l md:border-navy/10 md:pt-2">
					No hourly billing, no chasing paperwork. You answer the questions, the attorney does the rest, and we record the deed at your county clerk.
				</p>
			</div>

			<ol class="relative">
				<div class="absolute left-[15px] md:left-[19px] top-2 bottom-2 w-px bg-navy/10 hidden sm:block"></div>

				{#each steps as step, i}
					<li class="relative grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-5 md:gap-8 py-6 md:py-8 {i > 0 ? 'border-t border-navy/8' : ''}">
						<div class="relative z-10 flex items-start">
							<span class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-cream border border-navy/15 text-navy tabular-nums text-sm flex items-center justify-center font-medium">
								{i + 1}
							</span>
						</div>
						<div class="flex flex-col gap-2 pt-1">
							<h3 class="text-xl md:text-2xl text-navy tracking-tight">{step.label}</h3>
							<p class="text-navy/60 text-sm md:text-[15px] leading-relaxed max-w-xl">{step.body}</p>
						</div>
						<div class="hidden md:block text-right pt-2">
							<span class="text-navy/40 text-[11px] tracking-wider uppercase">{step.meta}</span>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</section>

	<!-- ═══════════════════ WHAT'S INCLUDED ═══════════════════ -->
	<section id="included" class="py-20 md:py-28 px-6 bg-white/40 scroll-mt-24 relative">
		<div use:revealOnScroll class="scroll-reveal max-w-5xl mx-auto">

			<div class="grid md:grid-cols-[1.1fr_1.4fr] gap-10 md:gap-16 items-start">
				<div class="md:sticky md:top-28">
					<div class="flex items-center gap-4 mb-5">
						<span class="w-8 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">What's included</span>
					</div>
					<h2 class="text-3xl md:text-4xl tracking-tight text-navy leading-tight text-balance mb-5">
						Four documents. One flat fee. Nothing extra to buy.
					</h2>
					<p class="text-navy/60 text-base leading-relaxed mb-7">
						Drafted by a licensed Texas attorney, reviewed before they reach your inbox, and signed in front of a notary we arrange for you.
					</p>

					<div class="inline-flex items-baseline gap-3 px-5 py-4 bg-cream border border-navy/10 rounded-2xl mb-5">
						<span class="text-3xl tabular-nums tracking-tight text-navy">{formatUsd(defaultPrepFee)}</span>
						<span class="text-navy/50 text-xs">flat · everything below</span>
					</div>

					<div class="flex flex-col gap-1.5">
						<div class="inline-flex items-center gap-2 text-emerald-accent text-xs">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							<span class="font-medium">Notarization included</span>
						</div>
						<div class="inline-flex items-center gap-2 text-emerald-accent text-xs">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							<span class="font-medium">Attorney review on every document</span>
						</div>
						<div class="inline-flex items-center gap-2 text-emerald-accent text-xs">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							<span class="font-medium">No upsells, no hourly billing</span>
						</div>
					</div>
				</div>

				<ul class="grid grid-cols-1 gap-px bg-navy/8 border border-navy/8 rounded-2xl overflow-hidden">
					{#each included as item, i}
						<li class="bg-cream p-6 md:p-7 flex items-start gap-5 transition-colors hover:bg-white/70">
							<span class="text-emerald-accent/70 text-[10px] tabular-nums tracking-widest pt-1.5 shrink-0">0{i + 1}</span>
							<div class="flex flex-col gap-1.5">
								<h3 class="text-navy text-base md:text-lg tracking-tight">{item.title}</h3>
								<p class="text-navy/55 text-sm leading-relaxed">{item.body}</p>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ ELIGIBILITY ═══════════════════ -->
	<section id="eligibility" class="py-20 md:py-28 px-6 scroll-mt-24">
		<div use:revealOnScroll class="scroll-reveal max-w-5xl mx-auto">

			<div class="text-center mb-14">
				<div class="flex items-center justify-center gap-4 mb-5">
					<span class="w-8 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Eligibility</span>
					<span class="w-8 h-px bg-emerald-accent/60"></span>
				</div>
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy text-balance">Is this right for your family?</h2>
			</div>

			<div class="grid md:grid-cols-[1.3fr_1fr] gap-5 md:gap-6 items-start">

				<!-- for you — primary card -->
				<div class="bg-cream border border-emerald-accent/25 rounded-2xl p-8 md:p-10 relative overflow-hidden">
					<div class="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-50"
						style="background: radial-gradient(circle at top right, rgba(74,124,111,0.18) 0%, transparent 70%);">
					</div>
					<div class="relative">
						<div class="flex items-center gap-2 mb-6">
							<span class="text-emerald-accent text-[10px] tracking-[0.25em] uppercase">Good fit</span>
						</div>
						<h3 class="text-2xl md:text-3xl text-navy tracking-tight mb-6 text-balance">The online trust works for you if…</h3>
						<ul class="grid sm:grid-cols-2 gap-x-6 gap-y-4">
							{#each ['You live in Texas', 'You own one primary residence', 'You want to avoid probate', 'You want Islamic shares enforced'] as item}
								<li class="flex items-start gap-3 text-navy/75 text-[15px] leading-relaxed">
									<svg class="w-4 h-4 text-emerald-accent shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
									<span>{item}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>

				<!-- not for — quieter card -->
				<div class="bg-white/40 rounded-2xl p-7 md:p-8 md:translate-y-6">
					<div class="text-navy/40 text-[10px] tracking-[0.25em] uppercase mb-5">Talk to us in person instead</div>
					<ul class="space-y-3.5">
						{#each ['Business owners needing entity structuring', 'Multiple properties or investment real estate', 'Blended families with complex custody', 'Special-needs beneficiaries', 'Estates approaching the federal tax threshold'] as item}
							<li class="flex items-start gap-2.5 text-navy/55 text-sm leading-relaxed">
								<span class="text-navy/30 mt-1.5 text-xs">—</span>
								<span>{item}</span>
							</li>
						{/each}
					</ul>
					<a href="/" class="mt-6 inline-flex items-center gap-2 text-emerald-accent text-sm font-medium hover:text-emerald-light transition-colors">
						See in-person plans
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ FAQ ═══════════════════ -->
	<section id="concerns" class="relative py-20 md:py-28 px-6 bg-white/40 scroll-mt-24">
		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-8 left-5 md:left-20 w-7 h-7 md:w-9 md:h-9 border-t border-l border-emerald-accent/50"></div>
			<div class="absolute top-8 right-5 md:right-20 w-7 h-7 md:w-9 md:h-9 border-t border-r border-emerald-accent/50"></div>
			<div class="absolute bottom-8 left-5 md:left-20 w-7 h-7 md:w-9 md:h-9 border-b border-l border-emerald-accent/50"></div>
			<div class="absolute bottom-8 right-5 md:right-20 w-7 h-7 md:w-9 md:h-9 border-b border-r border-emerald-accent/50"></div>
		</div>

		<div use:revealOnScroll class="scroll-reveal max-w-3xl mx-auto relative">
			<div class="text-center mb-12">
				<div class="flex items-center justify-center gap-4 mb-5">
					<span class="w-8 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">FAQ</span>
					<span class="w-8 h-px bg-emerald-accent/60"></span>
				</div>
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy text-balance">Common concerns, answered.</h2>
			</div>

			<div class="space-y-2.5">
				{#each concerns as concern, i}
					<div class="bg-cream rounded-xl border border-navy/8 overflow-hidden transition-shadow duration-200 {openConcern === i ? 'shadow-md shadow-navy/5' : ''}">
						<button
							onclick={() => toggleConcern(i)}
							class="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer group"
						>
							<span class="text-navy text-sm font-medium pr-4">{concern.question}</span>
							<svg
								class="w-4 h-4 text-navy/35 shrink-0 transition-transform duration-200 {openConcern === i ? 'rotate-180' : ''}"
								fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						{#if openConcern === i}
							<div transition:slide={{ duration: 200 }} class="px-6 pb-5">
								<p class="text-navy/60 text-sm leading-relaxed">{concern.answer}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════ CTA ═══════════════════ -->
	<section class="py-20 md:py-28 px-6">
		<div use:revealOnScroll class="scroll-reveal max-w-4xl mx-auto">
			<div class="relative bg-navy rounded-3xl px-8 py-14 md:px-16 md:py-20 text-center overflow-hidden">
				<div class="absolute inset-0 pointer-events-none opacity-40"
					style="background: radial-gradient(ellipse 60% 80% at 50% 0%, rgba(74,124,111,0.35) 0%, transparent 60%);">
				</div>
				<div class="relative flex flex-col items-center gap-6">
					<div class="flex items-center gap-4">
						<span class="w-8 h-px bg-emerald-light/60"></span>
						<span class="text-emerald-light text-[11px] tracking-[0.3em] uppercase font-medium">Begin</span>
						<span class="w-8 h-px bg-emerald-light/60"></span>
					</div>
					<h2 class="text-3xl md:text-5xl tracking-tight text-cream leading-[1.1] text-balance max-w-2xl">
						Your trust, drafted by an attorney. About an hour to begin.
					</h2>
					<p class="text-cream/60 text-base max-w-lg leading-relaxed">
						Save and resume any time. 
					</p>
					<div class="flex flex-col sm:flex-row items-center gap-3 mt-3">
						<a
							href="/signup"
							class="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-cream text-navy text-sm tracking-wider uppercase rounded-lg font-medium
								   transition-all duration-300 hover:bg-white hover:-translate-y-0.5"
						>
							Begin Your Trust
							<svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
						</a>
						<a
							href="/"
							class="group inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-cream border border-cream/20 rounded-lg
								   transition-all duration-200 hover:border-cream/50 hover:bg-cream/5"
						>
							Book a consultation instead
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ FOOTER ═══════════════════ -->
	<footer class="px-6 pt-12 pb-10 border-t border-navy/8">
		<div use:revealOnScroll class="scroll-reveal max-w-6xl mx-auto">
			<div class="grid md:grid-cols-[1.4fr_1fr_1fr] gap-10 md:gap-16 mb-10">
				<div>
					<a href="/trust" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
						<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
						{siteName}
					</a>
					<p class="text-navy/50 text-sm leading-relaxed mt-4 max-w-sm">
						The online Islamic trust from McDaniel Estate Planning, PLLC. Attorney-supervised, structured under Texas law, and grounded in Qur'anic inheritance principles.
					</p>
				</div>

				<div class="flex flex-col gap-2.5">
					<div class="text-navy/35 text-[10px] tracking-[0.25em] uppercase mb-1.5">The product</div>
					<a href="#how" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">How it works</a>
					<a href="#included" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">What's included</a>
					<a href="#eligibility" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">Eligibility</a>
					<a href="#concerns" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">FAQ</a>
				</div>

				<div class="flex flex-col gap-2.5">
					<div class="text-navy/35 text-[10px] tracking-[0.25em] uppercase mb-1.5">The firm</div>
					<a href="/" class="inline-flex items-center gap-2 text-navy/65 text-sm hover:text-navy transition-colors">
						<img src="/mcdaniel.png" alt="" class="h-7 w-auto" />
						<span class="sr-only">McDaniel Estate Planning</span>
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</a>
					<a href="/#plans" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">In-person plans</a>
					<a href="tel:+17136599668" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">+1 (713) 659-9668</a>
				</div>
			</div>

			<div class="flex flex-col md:flex-row gap-3 md:items-center md:justify-between pt-6 border-t border-navy/8">
				<p class="text-navy/40 text-xs">
					© 2026 McDaniel Estate Planning, PLLC. Licensed in Texas and California.
				</p>
				<p class="text-navy/35 text-xs italic">
					{siteName} is a service of McDaniel Estate Planning, PLLC.
				</p>
			</div>
		</div>
	</footer>
</div>
