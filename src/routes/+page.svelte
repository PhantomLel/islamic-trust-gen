<script lang="ts">
	import { siteName, consultationBookingUrl } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { slide } from 'svelte/transition';

	let { data } = $props();
	let mobileMenuOpen = $state(false);
	let openFaq = $state<number | null>(null);

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
		window.location.reload();
	}

	function toggleFaq(i: number) {
		openFaq = openFaq === i ? null : i;
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

	const services = [
		{
			title: 'Islamic Trust Services',
			body: 'Revocable living trusts drafted to honor Qur\'anic inheritance shares, keep your estate out of probate, and protect your family\'s privacy.',
			meta: 'Qur\'anic shares · Probate-free · Private'
		},
		{
			title: 'Islamic Prenuptial Agreements',
			body: 'Marriage agreements grounded in both Texas law and classical fiqh — clear on mahr, separate property, and the rights of each spouse.',
			meta: 'Nikah & civil · Mahr · Fairness'
		},
		{
			title: 'Business Succession Planning',
			body: 'For Muslim entrepreneurs: transition ownership of an LLC, partnership, or family business cleanly across generations under tax and shariah rules.',
			meta: 'LLCs · Operating agreements · Tax'
		},
		{
			title: 'Islamic & Tax Law Consultation',
			body: 'Where Islamic inheritance meets U.S. tax — zakat on investments, charitable endowments (waqf), and estate tax strategy in one conversation.',
			meta: 'Zakat · Waqf · Estate tax'
		}
	];

	const compareRows = [
		{
			label: 'Probate court',
			icon: 'M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6',
			willHeadline: 'Required',
			will: 'Months of court delay before heirs receive anything, with the estate exposed on the public record.',
			trustHeadline: 'Avoided entirely',
			trust: 'Assets pass privately to your trustee the moment they are needed — no court, no public file.'
		},
		{
			label: 'Children\'s inheritance',
			icon: 'M12 11a4 4 0 100-8 4 4 0 000 8zM6 21v-1a6 6 0 0112 0v1',
			willHeadline: 'Lump sum at 18',
			will: 'Locked until your child turns 18, then handed over in full on a single day — no matter the amount.',
			trustHeadline: 'Released on your terms',
			trust: 'Held by a trustee and released at an age you choose — 21, 25, or staggered over several milestones.'
		},
		{
			label: 'Islamic inheritance',
			icon: 'M4 4h12a4 4 0 014 4v12H8a4 4 0 01-4-4V4z M4 4v12a4 4 0 004 4',
			willHeadline: 'Often overridden',
			will: 'Texas courts apply state intestacy rules and routinely override Qur\'anic fractions written in a will.',
			trustHeadline: 'Enforced as written',
			trust: 'Qur\'anic shares are carried out privately by your trustee, exactly as you and the attorney structured them.'
		},
		{
			label: 'True cost',
			icon: 'M12 8c-2 0-3 1-3 2.5S10 13 12 13s3 1 3 2.5S14 18 12 18m0-10V6m0 12v2',
			willHeadline: 'Cheap up front',
			will: 'Looks inexpensive on day one. Probate fees and attorney time often run into the thousands later.',
			trustHeadline: 'Pays for itself',
			trust: 'Higher upfront. Saves the estate thousands of dollars and months of court time when it matters.'
		}
	];

	const plans = [
		{
			eyebrow: 'In-person — community',
			name: 'Community Trust',
			price: '$1,250',
			priceNote: 'or $104.16/mo × 12, riba-free · free for zakat-eligible families',
			tagline: 'Affordable, in-person shariah-compliant trust.',
			body: 'A straightforward in-person plan to keep probate courts out of your inheritance — without the $3,000–$4,000 price tag of a traditional estate plan.',
			features: [
				'In-person attorney drafting',
				'Riba-free 12-month financing',
				'Zakat-eligible? It\'s free',
				'Covers one primary residence'
			],
			cta: { label: 'Book Consultation', href: consultationBookingUrl },
			highlighted: false
		},
		{
			eyebrow: 'Online — most popular',
			name: 'Amana Trust',
			price: '$849',
			priceNote: 'flat fee · attorney-supervised · notarization included',
			tagline: 'Online Islamic trust for one Texas homestead.',
			body: 'Build an attorney-supervised revocable trust at your own pace, online. We draft and record your deed, and walk you through preserving your homestead exemption.',
			features: [
				'Revocable living trust',
				'Pour-over wills + certification',
				'Deed prepared & recorded',
				'Homestead exemption guide'
			],
			cta: { label: 'Start Online', href: '/trust' },
			highlighted: true
		},
		{
			eyebrow: 'Full estate plan',
			name: 'Legacy Trust Estate Plan',
			price: 'from $2,650',
			priceNote: 'riba-free financing · 50% down',
			tagline: 'Complete, custom protection for complex estates.',
			body: 'A fully customized plan: trust, wills, powers of attorney, healthcare directives, charitable planning, and hands-on support to make sure the plan actually works in real life.',
			features: [
				'Custom trust + wills',
				'POAs & healthcare directives',
				'Charitable & waqf planning',
				'Real-property funding included'
			],
			cta: { label: 'Book Consultation', href: consultationBookingUrl },
			highlighted: false
		}
	];

	const testimonials = [
		{
			quote: 'Brother Leonard built a comprehensive estate plan for our complex estate that will allow us to avoid probate and fulfill our shariah obligations. His knowledge of Islamic law, Texas law, and tax rules gave us real confidence.',
			name: 'Dr. Mohammad Haque, MD',
			where: 'Masjid Hamza · Houston, TX'
		},
		{
			quote: 'I have personally witnessed Brother Leonard\'s professionalism and integrity. His sincere concern for clients makes him a trustworthy advocate.',
			name: 'Dr. Sh. Mamdouh Mahmoud',
			where: 'Klein Islamic Center · Houston, TX'
		},
		{
			quote: 'After my father\'s passing, Leonard guided me through probate with care. He made a difficult time genuinely easier.',
			name: 'Aidah Aqil',
			where: 'Atlanta, GA'
		},
		{
			quote: 'As a father of four, I wanted my family secure. Leonard explained both Islamic inheritance and Texas law clearly, reduced costs where possible, and offered unmatched value.',
			name: 'Muhammed Johnson',
			where: 'Bear Creek Masjid · Houston, TX'
		}
	];

	const faqs = [
		{
			q: 'Do I need a will or a trust?',
			a: 'For most Muslim families in Texas and California, a properly funded revocable trust is the better instrument. A will alone forces your estate through probate court — where Qur\'anic shares are routinely overridden by state intestacy rules. A trust keeps your estate private, avoids probate, and enforces your shariah-compliant distribution exactly as you wrote it.'
		},
		{
			q: 'Are you available outside of Texas?',
			a: 'We are currently licensed in Texas and California. If you live elsewhere we are happy to discuss whether a referral or limited-scope consultation makes sense for your situation.'
		},
		{
			q: 'What if I cannot afford the fee?',
			a: 'The Community Trust is provided free of charge to families who qualify as zakat-eligible. We also offer riba-free 12-month financing on the Community Trust and 50% down riba-free financing on the Legacy Estate Plan.'
		},
		{
			q: 'How is the online Amana Trust different from the in-person plans?',
			a: 'The online trust is a focused product for Texas residents with one primary residence and a straightforward family situation. You complete the questionnaire at your own pace, an attorney reviews and signs the trust, and we record the deed. Families with multiple properties, businesses, blended families, special-needs beneficiaries, or large taxable estates are better served by the Community Trust or Legacy plan.'
		}
	];
</script>

<!-- ═══════════════════ NAV ═══════════════════ -->
<nav class="fixed top-0 inset-x-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-navy/10">
	<div class="max-w-6xl mx-auto px-5 py-2.5">
		<div class="hidden md:grid items-center grid-cols-[1fr_auto_1fr]">
			<div class="justify-self-start">
				<a href="/" class="flex items-center gap-2.5 text-navy whitespace-nowrap transition-opacity hover:opacity-70" aria-label="McDaniel Estate Planning — home">
					<img src="/mcdaniel.png" alt="" class="h-9 w-auto" />
					<span class="sr-only">McDaniel Estate Planning</span>
				</a>
			</div>

			<div class="justify-self-center flex items-center gap-7">
				<a href="#services" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">Services</a>
				<a href="#plans" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">Plans</a>
				<a href="#about" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">About</a>
				<a href="/trust" class="text-emerald-accent text-sm font-medium transition-colors hover:text-emerald-light">Trust App →</a>
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
						<a href={consultationBookingUrl} class="px-4 py-1.5 text-sm font-medium text-cream bg-navy rounded-lg transition-all duration-200 hover:bg-navy-light">
							Book Consultation
						</a>
					</div>
				{/if}
			</div>
		</div>

		<div class="flex items-center justify-between md:hidden">
			<a href="/" class="flex items-center gap-2 text-navy whitespace-nowrap transition-opacity hover:opacity-70" aria-label="McDaniel Estate Planning — home">
				<img src="/mcdaniel.png" alt="" class="h-8 w-auto" />
				<span class="sr-only">McDaniel Estate Planning</span>
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
				<a href="#services" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 hover:text-emerald-accent">Services</a>
				<a href="#plans" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 hover:text-emerald-accent">Plans</a>
				<a href="#about" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 hover:text-emerald-accent">About</a>
				<a href="/trust" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm font-medium text-emerald-accent rounded-xl hover:bg-emerald-accent/8">Trust App →</a>
				<div class="h-px bg-navy/6 my-1 mx-2"></div>
				{#if data.user}
					<button onclick={() => { mobileMenuOpen = false; handleLogout(); }} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 text-left cursor-pointer">Log out</button>
				{:else}
					<a href="/login" class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5">Log in</a>
					<a href={consultationBookingUrl} class="mx-2 mt-1 py-2.5 text-sm font-medium text-cream bg-navy rounded-xl text-center hover:bg-navy-light">Book Consultation</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<div class="bg-cream font-sans">

	<!-- ═══════════════════ HERO ═══════════════════ -->
	<section class="min-h-[100dvh] flex items-center justify-center relative pt-24 pb-16">
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
			<div class="flex items-center gap-4">
				<span class="w-8 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Texas & California</span>
				<span class="w-8 h-px bg-emerald-accent/60"></span>
			</div>

			<h1 class="text-4xl md:text-6xl tracking-tight text-navy leading-[1.05] text-balance">
				Islamically-compliant estate planning for Muslim families.
			</h1>

			<p class="text-navy/60 text-base md:text-lg font-light max-w-xl leading-relaxed text-balance">
				Protecting your family's future while honoring the laws of Allah. Wills, trusts, prenuptials, and business succession — drafted by a Muslim attorney, grounded in both Texas law and classical fiqh.
			</p>

			<div class="flex flex-col sm:flex-row items-center gap-3 mt-3">
				<a
					href={consultationBookingUrl}
					class="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-navy text-cream text-sm tracking-wider uppercase rounded-lg
						   transition-all duration-300 hover:bg-navy-light hover:shadow-xl hover:shadow-navy/15 hover:-translate-y-0.5"
				>
					Book Free Consultation
					<svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
				</a>
				<a
					href="/trust"
					class="group inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-navy border border-navy/15 rounded-lg
						   transition-all duration-200 hover:border-emerald-accent/50 hover:text-emerald-accent hover:bg-emerald-accent/4"
				>
					Build Your Trust Online
					<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
				</a>
			</div>

			<div class="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-4">
				<div class="flex items-center gap-2">
					<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					<span class="text-navy/45 text-xs">Licensed in TX & CA</span>
				</div>
				<div class="w-px h-3 bg-navy/15 sm:block hidden"></div>
				<div class="flex items-center gap-2">
					<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					<span class="text-navy/45 text-xs">Qur'anic inheritance, enforced</span>
				</div>
				<div class="w-px h-3 bg-navy/15 sm:block hidden"></div>
				<div class="flex items-center gap-2">
					<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					<span class="text-navy/45 text-xs">Riba-free financing</span>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ SERVICES ═══════════════════ -->
	<section id="services" class="py-20 md:py-28 px-6 scroll-mt-24">
		<div use:revealOnScroll class="scroll-reveal max-w-6xl mx-auto">

			<div class="grid md:grid-cols-[1fr_2fr] gap-10 md:gap-16 mb-14 md:mb-16 items-end">
				<div>
					<div class="flex items-center gap-4 mb-5">
						<span class="w-8 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Practice Areas</span>
					</div>
					<h2 class="text-3xl md:text-4xl tracking-tight text-navy leading-tight text-balance">
						Four areas of practice, one tradition.
					</h2>
				</div>
				<p class="text-navy/55 text-base leading-relaxed md:pl-8 md:border-l md:border-navy/10 md:pt-2">
					Every plan begins with one question — what does Allah ask of you, and what does Texas (or California) require? Our work sits at that intersection.
				</p>
			</div>

			<div class="grid md:grid-cols-2 gap-px bg-navy/8 border border-navy/8 rounded-2xl overflow-hidden">
				{#each services as svc, i}
					<article class="bg-cream p-8 md:p-10 flex flex-col gap-4 transition-colors hover:bg-white/60">
						<div class="flex items-baseline gap-3">
							<span class="text-emerald-accent/70 text-[11px] tabular-nums tracking-widest">0{i + 1}</span>
							<h3 class="text-xl md:text-2xl text-navy tracking-tight">{svc.title}</h3>
						</div>
						<p class="text-navy/60 text-sm leading-relaxed">{svc.body}</p>
						<div class="text-navy/40 text-[11px] tracking-wider uppercase pt-2 mt-auto">
							{svc.meta}
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════ WILL vs TRUST ═══════════════════ -->
	<section id="compare" class="relative py-20 md:py-28 px-6 bg-white/40 scroll-mt-24">
		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-8 left-5 md:left-20 w-7 h-7 md:w-9 md:h-9 border-t border-l border-emerald-accent/50"></div>
			<div class="absolute top-8 right-5 md:right-20 w-7 h-7 md:w-9 md:h-9 border-t border-r border-emerald-accent/50"></div>
			<div class="absolute bottom-8 left-5 md:left-20 w-7 h-7 md:w-9 md:h-9 border-b border-l border-emerald-accent/50"></div>
			<div class="absolute bottom-8 right-5 md:right-20 w-7 h-7 md:w-9 md:h-9 border-b border-r border-emerald-accent/50"></div>
		</div>

		<div use:revealOnScroll class="scroll-reveal max-w-5xl mx-auto relative">
			<div class="text-center mb-14">
				<div class="flex items-center justify-center gap-4 mb-5">
					<span class="w-8 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Will vs Trust</span>
					<span class="w-8 h-px bg-emerald-accent/60"></span>
				</div>
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy text-balance">Why a trust matters for Muslim families.</h2>
			</div>

			<div class="hidden md:grid grid-cols-[1fr_1fr] gap-6 mb-4 px-1">
				<div class="flex items-center gap-3">
					<span class="w-7 h-7 rounded-full bg-navy/8 flex items-center justify-center">
						<svg class="w-3.5 h-3.5 text-navy/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</span>
					<span class="text-navy/50 text-[11px] tracking-[0.25em] uppercase font-medium">With only a will</span>
				</div>
				<div class="flex items-center gap-3">
					<span class="w-7 h-7 rounded-full bg-emerald-accent/15 flex items-center justify-center">
						<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					</span>
					<span class="text-emerald-accent text-[11px] tracking-[0.25em] uppercase font-medium">With a properly funded trust</span>
				</div>
			</div>

			<div class="flex flex-col gap-4">
				{#each compareRows as row, i}
					<article class="bg-cream border border-navy/10 rounded-2xl overflow-hidden">
						<header class="flex items-center gap-3 px-6 md:px-7 py-4 border-b border-navy/8">
							<span class="text-emerald-accent/70 text-[10px] tabular-nums tracking-widest">0{i + 1}</span>
							<svg class="w-4 h-4 text-navy/55" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
								<path stroke-linecap="round" stroke-linejoin="round" d={row.icon} />
							</svg>
							<h3 class="text-navy text-base md:text-lg tracking-tight">{row.label}</h3>
						</header>

						<div class="grid md:grid-cols-2">
							<!-- Will side -->
							<div class="relative p-6 md:p-7 md:border-r border-navy/8 border-b md:border-b-0">
								<div class="flex items-baseline gap-3 mb-2 md:hidden">
									<svg class="w-3.5 h-3.5 text-navy/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
									<span class="text-navy/45 text-[10px] tracking-[0.25em] uppercase">With only a will</span>
								</div>
								<div class="text-navy/85 text-base md:text-lg tracking-tight mb-1.5 line-through decoration-navy/25 decoration-1 underline-offset-4">
									{row.willHeadline}
								</div>
								<p class="text-navy/55 text-sm leading-relaxed">{row.will}</p>
							</div>

							<!-- Trust side -->
							<div class="relative p-6 md:p-7 bg-emerald-accent/6">
								<div class="flex items-baseline gap-3 mb-2 md:hidden">
									<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
									<span class="text-emerald-accent text-[10px] tracking-[0.25em] uppercase">With a trust</span>
								</div>
								<div class="text-navy text-base md:text-lg tracking-tight mb-1.5 font-medium">
									{row.trustHeadline}
								</div>
								<p class="text-navy/70 text-sm leading-relaxed">{row.trust}</p>
							</div>
						</div>
					</article>
				{/each}
			</div>

			<p class="text-center text-navy/45 text-xs mt-8 italic max-w-2xl mx-auto leading-relaxed">
				Texas courts apply Texas law and will block Qur'anic shares unless your plan is structured to enforce them privately.
			</p>
		</div>
	</section>

	<!-- ═══════════════════ PLANS ═══════════════════ -->
	<section id="plans" class="py-20 md:py-28 px-6 scroll-mt-24">
		<div use:revealOnScroll class="scroll-reveal max-w-6xl mx-auto">

			<div class="text-center mb-14 md:mb-16">
				<div class="flex items-center justify-center gap-4 mb-5">
					<span class="w-8 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Trust Plans</span>
					<span class="w-8 h-px bg-emerald-accent/60"></span>
				</div>
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy text-balance">Three ways to protect your estate.</h2>
				<p class="text-navy/55 text-sm md:text-base mt-4 max-w-xl mx-auto">
					From a focused online trust to a fully customized estate plan — every option is shariah-compliant and attorney-supervised.
				</p>
			</div>

			<div class="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
				{#each plans as plan}
					<article class="flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1
						{plan.highlighted
							? 'bg-navy text-cream border-navy shadow-xl shadow-navy/15'
							: 'bg-white/60 backdrop-blur border-navy/8 hover:border-emerald-accent/30 hover:shadow-lg hover:shadow-navy/5'}"
					>
						<div class="p-7 md:p-8 flex flex-col gap-5 flex-1">
							<div class="flex items-center justify-between min-h-[20px]">
								<span class="text-[10px] tracking-[0.25em] uppercase {plan.highlighted ? 'text-emerald-light' : 'text-emerald-accent/80'}">
									{plan.eyebrow}
								</span>
							</div>

							<div>
								<h3 class="text-2xl tracking-tight {plan.highlighted ? 'text-cream' : 'text-navy'}">{plan.name}</h3>
								<p class="text-sm mt-1.5 {plan.highlighted ? 'text-cream/65' : 'text-navy/55'}">{plan.tagline}</p>
							</div>

							<div class="flex items-baseline gap-2 pt-2 border-t {plan.highlighted ? 'border-cream/15' : 'border-navy/8'}">
								<span class="text-3xl tracking-tight tabular-nums {plan.highlighted ? 'text-cream' : 'text-navy'}">{plan.price}</span>
							</div>
							<p class="text-xs {plan.highlighted ? 'text-cream/55' : 'text-navy/45'} -mt-3 leading-relaxed">{plan.priceNote}</p>

							<p class="text-sm leading-relaxed {plan.highlighted ? 'text-cream/75' : 'text-navy/60'}">
								{plan.body}
							</p>

							<ul class="flex flex-col gap-2.5 pt-2 mt-auto">
								{#each plan.features as feature}
									<li class="flex items-start gap-2.5 text-sm {plan.highlighted ? 'text-cream/80' : 'text-navy/65'}">
										<svg class="w-3.5 h-3.5 shrink-0 mt-1 {plan.highlighted ? 'text-emerald-light' : 'text-emerald-accent'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
										<span>{feature}</span>
									</li>
								{/each}
							</ul>
						</div>

						<div class="px-7 md:px-8 pb-7 md:pb-8">
							<a
								href={plan.cta.href}
								class="block w-full text-center px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200
									{plan.highlighted
										? 'bg-cream text-navy hover:bg-white hover:-translate-y-0.5'
										: 'bg-navy text-cream hover:bg-navy-light hover:-translate-y-0.5'}"
							>
								{plan.cta.label}
							</a>
						</div>
					</article>
				{/each}
			</div>

			<p class="text-center text-navy/40 text-xs mt-8 max-w-2xl mx-auto leading-relaxed">
				The in-person plans include the transfer of one real-property deed. Additional fees may apply for multiple properties, business interests, or other assets that need to be funded into your trust.
			</p>
		</div>
	</section>

	<!-- ═══════════════════ ABOUT ═══════════════════ -->
	<section id="about" class="relative py-20 md:py-28 px-6 bg-white/40 scroll-mt-24">
		<div use:revealOnScroll class="scroll-reveal max-w-5xl mx-auto">

			<div class="grid md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-center">
				<div class="relative">
					<div class="absolute -inset-3 rounded-2xl border border-emerald-accent/20 pointer-events-none translate-x-3 translate-y-3"></div>
					<figure class="relative aspect-4/5 rounded-2xl overflow-hidden bg-navy">
						<img
							src="/pfp.jpg"
							alt="Leonard McDaniel, founding attorney of McDaniel Estate Planning"
							class="w-full h-full object-cover"
							loading="lazy"
						/>
						<div class="absolute inset-0 pointer-events-none"
							style="background: linear-gradient(to top, rgba(20,30,43,0.85) 0%, rgba(20,30,43,0.15) 45%, transparent 65%);">
						</div>
						<figcaption class="absolute bottom-6 left-6 right-6">
							<div class="text-cream/70 text-[10px] tracking-[0.3em] uppercase mb-1.5">Founding Attorney</div>
							<div class="text-cream text-xl tracking-tight">Leonard McDaniel, JD</div>
						</figcaption>
					</figure>
				</div>

				<div class="flex flex-col gap-5">
					<div class="flex items-center gap-4">
						<span class="w-8 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">About</span>
					</div>
					<h2 class="text-3xl md:text-4xl tracking-tight text-navy leading-tight text-balance">
						A practice built at the intersection of fiqh and U.S. law.
					</h2>
					<p class="text-navy/65 text-base leading-relaxed">
						Brother Leonard embraced Islam in 2014 while studying history at UCLA, where he graduated magna cum laude. Inspired by a desire to serve his community with both faith and expertise, he earned his Juris Doctor at the University of Houston Law Center in 2017, graduating at the top of his class.
					</p>
					<p class="text-navy/65 text-base leading-relaxed">
						For the last five years, Brother Leonard has practiced probate and estate planning — helping families protect their wealth through thoughtful legal work. As a continuing student of the Qur'an and the fiqh of inheritance, he is committed to aligning every estate plan with both Islamic principles and U.S. law.
					</p>

					<div class="flex flex-wrap gap-6 pt-4 border-t border-navy/10 mt-2">
						<div>
							<div class="text-2xl tabular-nums text-navy tracking-tight">2014</div>
							<div class="text-xs text-navy/45 tracking-wider uppercase mt-1">Embraced Islam</div>
						</div>
						<div>
							<div class="text-2xl tabular-nums text-navy tracking-tight">2017</div>
							<div class="text-xs text-navy/45 tracking-wider uppercase mt-1">UH Law, top of class</div>
						</div>
						<div>
							<div class="text-2xl tabular-nums text-navy tracking-tight">TX · CA</div>
							<div class="text-xs text-navy/45 tracking-wider uppercase mt-1">Currently licensed</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ TESTIMONIALS ═══════════════════ -->
	<section class="py-20 md:py-28 px-6">
		<div use:revealOnScroll class="scroll-reveal max-w-5xl mx-auto">

			<div class="text-center mb-14">
				<div class="flex items-center justify-center gap-4 mb-5">
					<span class="w-8 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">From Our Community</span>
					<span class="w-8 h-px bg-emerald-accent/60"></span>
				</div>
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy text-balance">Trusted by families and imams across Texas.</h2>
			</div>

			<div class="grid md:grid-cols-2 gap-5 md:gap-6">
				{#each testimonials as t, i}
					<figure class="bg-white/60 backdrop-blur rounded-2xl border border-navy/8 p-7 md:p-8 flex flex-col gap-5
						{i % 3 === 0 ? 'md:translate-y-2' : ''}"
					>
						<svg class="w-6 h-6 text-emerald-accent/50" viewBox="0 0 24 24" fill="currentColor">
							<path d="M9.5 6c-2.5 0-4.5 2-4.5 4.5v7h6v-7h-3c0-1.5 1-2.5 2.5-2.5v-2zm9 0c-2.5 0-4.5 2-4.5 4.5v7h6v-7h-3c0-1.5 1-2.5 2.5-2.5v-2z"/>
						</svg>
						<blockquote class="text-navy/75 text-[15px] leading-relaxed">
							{t.quote}
						</blockquote>
						<figcaption class="flex flex-col gap-0.5 pt-3 border-t border-navy/8 mt-auto">
							<span class="text-navy font-medium text-sm">{t.name}</span>
							<span class="text-navy/50 text-xs tracking-wide">{t.where}</span>
						</figcaption>
					</figure>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════ FAQ ═══════════════════ -->
	<section id="faq" class="py-20 md:py-28 px-6 bg-white/40 scroll-mt-24">
		<div use:revealOnScroll class="scroll-reveal max-w-3xl mx-auto">
			<div class="text-center mb-12">
				<div class="flex items-center justify-center gap-4 mb-5">
					<span class="w-8 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">FAQ</span>
					<span class="w-8 h-px bg-emerald-accent/60"></span>
				</div>
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy text-balance">Questions families ask first.</h2>
			</div>

			<div class="space-y-3">
				{#each faqs as faq, i}
					<div class="bg-cream rounded-xl border border-navy/8 overflow-hidden transition-shadow duration-200 {openFaq === i ? 'shadow-md shadow-navy/5' : ''}">
						<button
							onclick={() => toggleFaq(i)}
							class="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer group"
						>
							<span class="text-navy text-sm font-medium pr-4">{faq.q}</span>
							<svg class="w-4 h-4 text-navy/35 shrink-0 transition-transform duration-200 {openFaq === i ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
						</button>
						{#if openFaq === i}
							<div transition:slide={{ duration: 200 }} class="px-6 pb-5">
								<p class="text-navy/60 text-sm leading-relaxed">{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════ CTA ═══════════════════ -->
	<section id="contact" class="py-20 md:py-28 px-6 scroll-mt-24">
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
						Ready to protect your family's future?
					</h2>
					<p class="text-cream/60 text-base max-w-lg leading-relaxed">
						Schedule a free consultation, or begin your shariah-compliant trust online today.
					</p>

					<div class="flex flex-col sm:flex-row items-center gap-3 mt-3">
						<a
							href={consultationBookingUrl}
							class="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-cream text-navy text-sm tracking-wider uppercase rounded-lg font-medium
								   transition-all duration-300 hover:bg-white hover:-translate-y-0.5"
						>
							Book Free Consultation
							<svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
						</a>
						<a
							href="/trust"
							class="group inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-cream border border-cream/20 rounded-lg
								   transition-all duration-200 hover:border-cream/50 hover:bg-cream/5"
						>
							Build Your Trust Online
							<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</a>
					</div>

					<div class="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-4 text-cream/50 text-xs">
						<a href="tel:+17136599668" class="hover:text-cream transition-colors">+1 (713) 659-9668</a>
						<span class="w-px h-3 bg-cream/15"></span>
						<a href="mailto:admin@mcdanielestateplanning.com" class="hover:text-cream transition-colors">admin@mcdanielestateplanning.com</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ FOOTER ═══════════════════ -->
	<footer class="px-6 pt-14 pb-10 border-t border-navy/8">
		<div use:revealOnScroll class="scroll-reveal max-w-6xl mx-auto">
			<div class="grid md:grid-cols-[1.4fr_1fr_1fr] gap-10 md:gap-16 mb-10">
				<div>
					<a href="/" class="inline-flex items-center transition-opacity hover:opacity-70" aria-label="McDaniel Estate Planning — home">
						<img src="/mcdaniel.png" alt="" class="h-12 w-auto" />
						<span class="sr-only">McDaniel Estate Planning</span>
					</a>
					<p class="text-navy/50 text-sm leading-relaxed mt-5 max-w-sm">
						Islamically-compliant estate planning for Muslim families. Currently accepting clients in Texas and California.
					</p>
				</div>

				<div class="flex flex-col gap-2.5">
					<div class="text-navy/35 text-[10px] tracking-[0.25em] uppercase mb-1.5">Services</div>
					<a href="#services" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">Islamic Trust</a>
					<a href="#services" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">Prenuptial Agreements</a>
					<a href="#services" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">Business Succession</a>
					<a href="/trust" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">Amana Trust App →</a>
				</div>

				<div class="flex flex-col gap-2.5">
					<div class="text-navy/35 text-[10px] tracking-[0.25em] uppercase mb-1.5">Contact</div>
					<a href="tel:+17136599668" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">+1 (713) 659-9668</a>
					<a href="mailto:admin@mcdanielestateplanning.com" class="text-navy/65 text-sm hover:text-emerald-accent transition-colors break-all">admin@mcdanielestateplanning.com</a>
					<a href={consultationBookingUrl} class="text-navy/65 text-sm hover:text-emerald-accent transition-colors">Book consultation</a>
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
