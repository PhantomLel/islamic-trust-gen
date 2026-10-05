<script lang="ts">
	import {
		attorneyProfileUrl,
		consultationBookingUrl,
		firmDescriptionLine,
		googleReviewsUrl,
		productNameMidSentence
	} from '$lib/config';
	import TestimonialDisclaimer from '$lib/components/TestimonialDisclaimer.svelte';

	const freeWillUrl = 'https://muslimlegacyplanning.com/free-islamic-will';
	const mlpUrl = 'https://muslimlegacyplanning.com';
	const firmDescriptionInline = firmDescriptionLine.replace(/^An /, 'an ');

	let mobileMenuOpen = $state(false);
	let navScrolled = $state(false);

	function updateScroll() {
		navScrolled = document.documentElement.scrollTop > 24;
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
			{ threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
		);
		observer.observe(node);
		return { destroy() { observer.disconnect(); } };
	}

	function revealStagger(node: HTMLElement) {
		const items = Array.from(node.children) as HTMLElement[];
		items.forEach((el, i) => {
			el.classList.add('reveal-item');
			el.style.setProperty('--reveal-i', String(i));
		});
		if (typeof IntersectionObserver === 'undefined') {
			node.classList.add('reveal-in');
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					node.classList.add('reveal-in');
					observer.unobserve(node);
				}
			},
			{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
		);
		observer.observe(node);
		return { destroy() { observer.disconnect(); } };
	}

	const navLinks = [
		{ href: '#why-legal', label: 'Why Legal Implementation' },
		{ href: '#services', label: 'Services' },
		{ href: '#attorney', label: 'Attorney' },
		{ href: '#reviews', label: 'Reviews' }
	];

	const pillars = [
		{
			numeral: 'I',
			title: 'Islamic inheritance is not automatic',
			body: 'A standard American will — or no will at all — follows state intestacy law, not faraid. Without deliberate legal structuring, property may not be distributed according to Islamic inheritance principles.'
		},
		{
			numeral: 'II',
			title: 'A will may not control everything',
			body: 'Homes, beneficiary designations, retirement accounts, joint accounts, and community property can pass entirely outside your will. These assets often require additional planning to align with your intentions.'
		},
		{
			numeral: 'III',
			title: 'Documents must work in court and in real life',
			body: 'A complete plan may need deeds, trust funding, guardianship provisions, powers of attorney, and a probate strategy — drafted so they hold up when your family actually needs them.'
		}
	];

	const services = [
		{
			num: '01',
			title: 'Islamic Estate Planning Consultations',
			body: 'A structured attorney review of your family, assets, and planning goals through the lens of Islamic inheritance and U.S. law.'
		},
		{
			num: '02',
			title: 'Revocable Living Trust Planning',
			body: 'Trust-based plans designed to avoid probate, preserve privacy, and carry out faraid distribution with legal precision.'
		},
		{
			num: '03',
			title: 'Islamic Wills',
			body: 'Wills drafted to honor Qur\u2019anic inheritance shares while satisfying the formalities your state courts require.'
		},
		{
			num: '04',
			title: 'Trust Funding & Deed Preparation',
			body: 'Retitling real property and accounts into your trust — the step that determines whether a trust actually works.'
		},
		{
			num: '05',
			title: 'Probate & Estate Administration',
			body: 'Guiding families through the court process after a death, including estates with Islamic distribution instructions.'
		},
		{
			num: '06',
			title: 'Advanced Planning for Complex Families & Business Owners',
			body: 'Customized planning for blended families, business interests, multiple properties, and multi-state considerations.'
		}
	];

	const testimonials: { quote: string; name: string; detail: string; featured?: boolean }[] = [
		{
			quote: "I have personally witnessed Brother Leonard's professionalism and integrity. His sincere concern for clients makes him a trustworthy advocate.",
			name: 'Dr. Sh. Mamdouh Mahmoud',
			detail: 'Klein Islamic Center · Houston, TX'
		},
		{
			quote: 'As a father of four, I wanted my family secure. Leonard explained both Islamic inheritance and Texas law clearly, reduced costs where possible, and offered unmatched value.',
			name: 'Muhammed Johnson',
			detail: 'Bear Creek Masjid · Houston, TX'
		}
	];
</script>

<svelte:window onscroll={updateScroll} />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..700;1,300..700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="mep min-h-[100dvh] bg-[#FCFBF8] text-[#1F2D3D] antialiased">

	<!-- ═══════════════════ NAVIGATION ═══════════════════ -->
	<header
		class="fixed top-0 inset-x-0 z-50 transition-all duration-500 {navScrolled
			? 'bg-[#FCFBF8]/92 backdrop-blur-md border-b border-[#1F2D3D]/8 shadow-[0_1px_0_rgba(31,45,61,0.04)]'
			: 'bg-transparent border-b border-transparent'}"
	>
		<div class="max-w-7xl mx-auto px-6 lg:px-10 h-[4.5rem] flex items-center justify-between">
			<a href="#top" class="group flex items-baseline gap-2.5">
				<span class="mep-serif text-[1.15rem] leading-none tracking-tight">McDaniel Estate Planning</span>
				<span class="hidden sm:inline text-[10px] tracking-[0.22em] uppercase text-[#1F2D3D]/50">PLLC</span>
			</a>

			<nav class="hidden lg:flex items-center gap-9">
				{#each navLinks as link}
					<a
						href={link.href}
						class="text-[13px] tracking-[0.04em] text-[#1F2D3D]/65 hover:text-[#1F2D3D] transition-colors duration-300"
					>{link.label}</a>
				{/each}
				<a
					href={consultationBookingUrl}
					target="_blank"
					rel="noopener"
					class="inline-flex items-center gap-2 bg-[#1F2D3D] text-[#FCFBF8] text-[13px] tracking-[0.04em] px-5 py-2.5 hover:bg-[#2B3D52] active:translate-y-px transition-all duration-300"
				>
					Book a Legal Consultation
				</a>
			</nav>

			<button
				class="lg:hidden flex flex-col gap-[5px] p-2 -mr-2"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle menu"
				aria-expanded={mobileMenuOpen}
			>
				<span class="block w-5 h-px bg-[#1F2D3D] transition-transform duration-300 {mobileMenuOpen ? 'translate-y-[6px] rotate-45' : ''}"></span>
				<span class="block w-5 h-px bg-[#1F2D3D] transition-opacity duration-300 {mobileMenuOpen ? 'opacity-0' : ''}"></span>
				<span class="block w-5 h-px bg-[#1F2D3D] transition-transform duration-300 {mobileMenuOpen ? '-translate-y-[6px] -rotate-45' : ''}"></span>
			</button>
		</div>

		{#if mobileMenuOpen}
			<div class="lg:hidden bg-[#FCFBF8] border-b border-[#1F2D3D]/8 px-6 pb-6 pt-2">
				<nav class="flex flex-col gap-1">
					{#each navLinks as link}
						<a
							href={link.href}
							onclick={() => (mobileMenuOpen = false)}
							class="py-3 text-[15px] text-[#1F2D3D]/75 border-b border-[#1F2D3D]/6"
						>{link.label}</a>
					{/each}
					<a
						href={consultationBookingUrl}
						target="_blank"
						rel="noopener"
						class="mt-4 inline-flex justify-center bg-[#1F2D3D] text-[#FCFBF8] text-[14px] px-5 py-3.5 active:translate-y-px"
					>Book a Legal Consultation</a>
				</nav>
			</div>
		{/if}
	</header>

	<main id="top">

		<!-- ═══════════════════ SECTION 1 — HERO ═══════════════════ -->
		<section class="relative pt-36 md:pt-44 pb-20 md:pb-28 px-6 lg:px-10 overflow-hidden">
			<!-- faint vertical hairline echoing legal stationery -->
			<div class="hidden xl:block absolute top-0 bottom-0 left-[calc(50%+22rem)] w-px bg-[#1F2D3D]/6 pointer-events-none"></div>

			<div class="max-w-7xl mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-14 lg:gap-20 items-center">
				<div class="hero-stagger">
					<div class="flex items-center gap-3 mb-8">
						<span class="w-8 h-px bg-[#9A7B45]"></span>
						<span class="text-[11px] tracking-[0.3em] uppercase text-[#9A7B45]">Attorney-Led Practice · Texas &amp; California</span>
					</div>

					<h1 class="mep-serif text-[2.6rem] leading-[1.08] md:text-[3.6rem] lg:text-[4rem] tracking-tight mb-8 max-w-[16ch]">
						Islamic Estate Planning, Backed by a&nbsp;Licensed&nbsp;Attorney
					</h1>

					<p class="text-[1.06rem] md:text-lg leading-relaxed text-[#1F2D3D]/72 max-w-[58ch] mb-5">
						McDaniel Estate Planning helps Muslim families create legally sound wills, trusts, deeds,
						and probate plans designed to honor Islamic inheritance principles while complying with U.S.&nbsp;law.
					</p>

					<p class="text-[13.5px] leading-relaxed text-[#1F2D3D]/55 max-w-[58ch] mb-10">
						Legal services provided by Leonard McDaniel, attorney licensed in Texas and California.
					</p>

					<div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-7">
						<a
							href={consultationBookingUrl}
							target="_blank"
							rel="noopener"
							class="inline-flex justify-center items-center bg-[#1F2D3D] text-[#FCFBF8] text-[14.5px] tracking-[0.03em] px-8 py-4 hover:bg-[#2B3D52] active:translate-y-px transition-all duration-300 shadow-[0_14px_30px_-18px_rgba(31,45,61,0.5)]"
						>
							Book a Legal Consultation
						</a>
						<a
							href={freeWillUrl}
							class="group inline-flex items-center gap-2 text-[14.5px] text-[#1F2D3D]/75 hover:text-[#1F2D3D] transition-colors duration-300"
						>
							<span class="border-b border-[#9A7B45]/50 group-hover:border-[#9A7B45] pb-0.5 transition-colors duration-300">Get the Free Islamic Will</span>
							<svg class="w-3.5 h-3.5 translate-y-px group-hover:translate-x-0.5 transition-transform duration-300" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
								<path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</a>
					</div>
				</div>

				<div class="hero-stagger relative max-w-md mx-auto w-full lg:max-w-none">
					<div class="relative">
						<div class="absolute -inset-px translate-x-4 translate-y-4 border border-[#9A7B45]/35 pointer-events-none"></div>
						<div class="relative aspect-[4/5] bg-[#16202E] overflow-hidden">
							<img
								src="/pfp.jpg"
								alt="Leonard McDaniel, founding attorney of McDaniel Estate Planning"
								class="w-full h-full object-cover"
							/>
						</div>
					</div>
					<div class="mt-6 flex items-baseline justify-between border-t border-[#1F2D3D]/12 pt-4">
						<div>
							<p class="mep-serif text-[1.05rem]">Leonard McDaniel</p>
							<p class="text-[12px] tracking-[0.08em] text-[#1F2D3D]/55 mt-0.5">Attorney at Law</p>
						</div>
						<p class="text-[11px] tracking-[0.18em] uppercase text-[#9A7B45] text-right">TX · CA</p>
					</div>
				</div>
			</div>
		</section>

		<!-- ═══════════════════ SECTION 2 — WHY LEGAL IMPLEMENTATION ═══════════════════ -->
		<section id="why-legal" class="py-24 md:py-32 px-6 lg:px-10 bg-white border-y border-[#1F2D3D]/6 scroll-mt-20">
			<div use:revealOnScroll class="scroll-reveal max-w-7xl mx-auto">
				<div class="grid lg:grid-cols-[1fr_2.2fr] gap-10 lg:gap-20 mb-16 md:mb-20 items-end">
					<div class="flex items-center gap-3">
						<span class="w-8 h-px bg-[#9A7B45]"></span>
						<span class="text-[11px] tracking-[0.3em] uppercase text-[#9A7B45]">The Legal Reality</span>
					</div>
					<h2 class="mep-serif text-3xl md:text-[2.6rem] leading-[1.15] tracking-tight max-w-[26ch]">
						Why Islamic estate planning needs legal implementation
					</h2>
				</div>

				<div use:revealStagger class="grid md:grid-cols-3 gap-x-12 gap-y-12">
					{#each pillars as pillar}
						<div class="border-t border-[#1F2D3D]/15 pt-7">
							<span class="mep-serif text-[1.4rem] text-[#9A7B45] block mb-5">{pillar.numeral}</span>
							<h3 class="mep-serif text-[1.3rem] leading-snug mb-4">{pillar.title}</h3>
							<p class="text-[14.5px] leading-relaxed text-[#1F2D3D]/65">{pillar.body}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ═══════════════════ SECTION 3 — SERVICES ═══════════════════ -->
		<section id="services" class="py-24 md:py-32 px-6 lg:px-10 scroll-mt-20">
			<div use:revealOnScroll class="scroll-reveal max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.7fr] gap-12 lg:gap-24">
				<div class="lg:sticky lg:top-32 self-start">
					<div class="flex items-center gap-3 mb-7">
						<span class="w-8 h-px bg-[#9A7B45]"></span>
						<span class="text-[11px] tracking-[0.3em] uppercase text-[#9A7B45]">Services</span>
					</div>
					<h2 class="mep-serif text-3xl md:text-[2.6rem] leading-[1.15] tracking-tight mb-6">
						A focused estate planning practice
					</h2>
					<p class="text-[15px] leading-relaxed text-[#1F2D3D]/65 max-w-[44ch]">
						Every engagement begins with an attorney review of your family, assets, and planning goals.
						Flat-fee options are available after that review.
					</p>
				</div>

				<div use:revealStagger class="divide-y divide-[#1F2D3D]/10 border-y border-[#1F2D3D]/10">
					{#each services as service}
						<div class="group grid sm:grid-cols-[3.5rem_1fr] gap-2 sm:gap-6 py-7 transition-colors duration-300 hover:bg-[#1F2D3D]/[0.025] sm:px-2 -mx-2">
							<span class="text-[12px] tracking-[0.15em] text-[#9A7B45] pt-1.5 font-medium">{service.num}</span>
							<div>
								<h3 class="mep-serif text-[1.25rem] leading-snug mb-2">{service.title}</h3>
								<p class="text-[14px] leading-relaxed text-[#1F2D3D]/60 max-w-[60ch]">{service.body}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ═══════════════════ SECTION 4 — ATTORNEY PROFILE ═══════════════════ -->
		<section id="attorney" class="py-24 md:py-32 px-6 lg:px-10 bg-white border-y border-[#1F2D3D]/6 scroll-mt-20">
			<div use:revealOnScroll class="scroll-reveal max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-14 lg:gap-24 items-center">

				<div class="relative max-w-md mx-auto w-full lg:max-w-none">
					<div class="absolute -inset-px -translate-x-4 translate-y-4 border border-[#9A7B45]/35 pointer-events-none"></div>
					<figure class="relative aspect-[4/5] bg-[#16202E] overflow-hidden">
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
							<div class="text-[#FCFBF8]/60 text-[10px] tracking-[0.28em] uppercase mb-1.5">Founding Attorney</div>
							<div class="mep-serif text-[#FCFBF8] text-xl tracking-tight">Leonard McDaniel, JD</div>
						</figcaption>
					</figure>
				</div>

				<div>
					<div class="flex items-center gap-3 mb-7">
						<span class="w-8 h-px bg-[#9A7B45]"></span>
						<span class="text-[11px] tracking-[0.3em] uppercase text-[#9A7B45]">Attorney Credibility</span>
					</div>

					<h2 class="mep-serif text-[2.2rem] md:text-[2.7rem] leading-[1.12] tracking-tight mb-8 max-w-[20ch]">
						Built at the intersection of fiqh and U.S. law.
					</h2>

					<div class="space-y-5 text-[15.5px] leading-relaxed text-[#1F2D3D]/72 max-w-[58ch]">
						<p>
							Leonard McDaniel embraced Islam in 2014 while studying history at UCLA, graduating magna cum laude.
							Having come to Islam as an adult, he understands firsthand how converts and lifelong Muslims alike
							navigate the intersection of faith, family, and American law. He earned his Juris Doctor at the
							University of Houston Law Center in 2017.
						</p>
						<p>
							Since 2022, his practice has focused on probate and estate planning — helping Muslim
							families protect their wealth through thoughtful legal work grounded in classical fiqh and Texas
							and California law. He built {productNameMidSentence()} so that more families could put an attorney-supervised plan in place that reflects Islamic inheritance and is structured under the law of the state where they live.
						</p>
					</div>

					<a
						href={attorneyProfileUrl}
						class="inline-block mt-6 text-[14.5px] text-[#1F2D3D]/75 hover:text-[#1F2D3D] border-b border-[#9A7B45]/50 hover:border-[#9A7B45] pb-0.5 transition-colors duration-300"
					>
						Read Leonard McDaniel&rsquo;s full profile
					</a>

					<div use:revealStagger class="flex flex-wrap gap-x-10 gap-y-6 mt-8 pt-7 border-t border-[#1F2D3D]/12">
						<div>
							<div class="mep-serif text-2xl tabular-nums tracking-tight">2014</div>
							<div class="text-[11px] text-[#9A7B45] tracking-[0.18em] uppercase mt-1.5">Embraced Islam</div>
						</div>
						<div>
							<div class="mep-serif text-2xl tabular-nums tracking-tight">2017</div>
							<div class="text-[11px] text-[#9A7B45] tracking-[0.18em] uppercase mt-1.5">UH Law</div>
						</div>
						<div>
							<div class="mep-serif text-2xl tracking-tight">TX · CA</div>
							<div class="text-[11px] text-[#9A7B45] tracking-[0.18em] uppercase mt-1.5">Licensed</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ═══════════════════ SECTION 5 — TESTIMONIALS ═══════════════════ -->
		<section id="reviews" class="py-24 md:py-32 px-6 lg:px-10 scroll-mt-20">
			<div use:revealOnScroll class="scroll-reveal max-w-6xl mx-auto">
				<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16 md:mb-20">
					<div>
						<div class="flex items-center gap-3 mb-5">
							<span class="w-8 h-px bg-[#9A7B45]"></span>
							<span class="text-[11px] tracking-[0.3em] uppercase text-[#9A7B45]">Client Experiences</span>
						</div>
					</div>
					<a
						href={googleReviewsUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-[#1F2D3D]/45 text-xs underline underline-offset-2 hover:text-[#1F2D3D]/70 transition-colors duration-300 whitespace-nowrap"
					>
						Read our Google reviews.
					</a>
				</div>

				<div use:revealStagger class="grid lg:grid-cols-2 gap-x-20 gap-y-14">
					{#each testimonials as t}
						<figure class="{t.featured ? 'lg:col-span-2 lg:max-w-[52rem]' : ''} border-t border-[#1F2D3D]/12 pt-8">
							<blockquote class="mep-serif {t.featured ? 'text-[1.5rem] md:text-[1.85rem]' : 'text-[1.15rem]'} leading-[1.45] text-[#1F2D3D]/90">
								&ldquo;{t.quote}&rdquo;
							</blockquote>
							<figcaption class="mt-6 flex items-baseline gap-3">
								<span class="w-5 h-px bg-[#9A7B45] translate-y-[-3px]"></span>
								<span>
									<span class="block text-[13.5px] font-medium text-[#1F2D3D]/85">{t.name}</span>
									<span class="block text-[12px] text-[#1F2D3D]/50 mt-0.5">{t.detail}</span>
								</span>
							</figcaption>
						</figure>
					{/each}
				</div>
				<TestimonialDisclaimer class="mt-12 text-[12.5px] leading-relaxed text-[#1F2D3D]/60 max-w-[52rem]" />

			</div>
		</section>

		<!-- ═══════════════════ SECTION 6 — RELATIONSHIP TO MLP ═══════════════════ -->
		<section class="px-6 lg:px-10 pb-24 md:pb-32">
			<div use:revealOnScroll class="scroll-reveal max-w-7xl mx-auto">
				<div class="relative bg-[#1F2D3D] text-[#FCFBF8] px-8 py-16 md:px-20 md:py-24 overflow-hidden">
					<div class="absolute inset-0 pointer-events-none opacity-50"
						style="background: radial-gradient(ellipse 70% 90% at 85% -10%, rgba(200,168,107,0.18) 0%, transparent 55%);"></div>
					<div class="absolute top-8 right-8 w-10 h-10 border-t border-r border-[#C8A86B]/30 pointer-events-none"></div>
					<div class="absolute bottom-8 left-8 w-10 h-10 border-b border-l border-[#C8A86B]/30 pointer-events-none"></div>

					<div class="relative grid lg:grid-cols-[1.5fr_1fr] gap-12 items-center">
						<div>
							<div class="flex items-center gap-3 mb-7">
								<span class="w-8 h-px bg-[#C8A86B]/70"></span>
								<span class="text-[11px] tracking-[0.3em] uppercase text-[#C8A86B]">One Practice, Two Platforms</span>
							</div>
							<h2 class="mep-serif text-3xl md:text-[2.5rem] leading-[1.15] tracking-tight mb-6 max-w-[22ch]">
								The Legal Practice Behind Muslim Legacy Planning
							</h2>
							<p class="text-[15.5px] leading-relaxed text-[#FCFBF8]/72 max-w-[62ch]">
								Muslim Legacy Planning is {firmDescriptionInline} It is where Muslim families
								can create a free Islamic will, complete {productNameMidSentence()}, and access attorney-reviewed
								estate plans. McDaniel Estate Planning is the licensed law firm that backs all of it.
							</p>
						</div>
						<div class="lg:justify-self-end">
							<a
								href={mlpUrl}
								class="group inline-flex items-center gap-3 border border-[#C8A86B]/50 hover:border-[#C8A86B] text-[14.5px] tracking-[0.03em] px-8 py-4 hover:bg-[#C8A86B]/8 active:translate-y-px transition-all duration-300"
							>
								Visit Muslim Legacy Planning
								<svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
									<path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ═══════════════════ SECTION 7 — FINAL CTA ═══════════════════ -->
		<section id="contact" class="py-24 md:py-36 px-6 lg:px-10 border-t border-[#1F2D3D]/8 scroll-mt-20">
			<div use:revealOnScroll class="scroll-reveal max-w-7xl mx-auto grid lg:grid-cols-[1.5fr_1fr] gap-12 items-end">
				<div>
					<div class="flex items-center gap-3 mb-8">
						<span class="w-8 h-px bg-[#9A7B45]"></span>
						<span class="text-[11px] tracking-[0.3em] uppercase text-[#9A7B45]">Begin</span>
					</div>
					<h2 class="mep-serif text-[2.2rem] md:text-[3.2rem] leading-[1.12] tracking-tight max-w-[20ch]">
						Plan your estate with confidence — religiously and legally.
					</h2>
				</div>
				<div class="flex flex-col gap-4 lg:items-end">
					<a
						href={consultationBookingUrl}
						target="_blank"
						rel="noopener"
						class="inline-flex justify-center items-center bg-[#1F2D3D] text-[#FCFBF8] text-[14.5px] tracking-[0.03em] px-9 py-4 hover:bg-[#2B3D52] active:translate-y-px transition-all duration-300 shadow-[0_14px_30px_-18px_rgba(31,45,61,0.5)] w-full sm:w-auto"
					>
						Book a Legal Consultation
					</a>
					<a
						href={freeWillUrl}
						class="group inline-flex justify-center items-center gap-2 text-[14px] text-[#1F2D3D]/70 hover:text-[#1F2D3D] transition-colors duration-300 py-2"
					>
						<span class="border-b border-[#9A7B45]/50 group-hover:border-[#9A7B45] pb-0.5 transition-colors duration-300">Start with the Free Islamic Will</span>
					</a>
				</div>
			</div>
		</section>
	</main>

	<!-- ═══════════════════ FOOTER ═══════════════════ -->
	<footer class="border-t border-[#1F2D3D]/8 px-6 lg:px-10 py-12 md:py-14">
		<div class="max-w-7xl mx-auto">
			<div class="flex flex-col md:flex-row md:items-baseline md:justify-between gap-6">
				<div>
					<p class="mep-serif text-[1.05rem]">McDaniel Estate Planning, PLLC</p>
					<p class="text-[12.5px] text-[#1F2D3D]/55 mt-1.5">
						A statewide practice serving clients across Texas and California.
					</p>
				</div>
				<div class="flex items-center gap-7 text-[13px] text-[#1F2D3D]/60">
					<a href="#services" class="hover:text-[#1F2D3D] transition-colors duration-300">Services</a>
					<a href="#attorney" class="hover:text-[#1F2D3D] transition-colors duration-300">Attorney</a>
					<a href={mlpUrl} class="hover:text-[#1F2D3D] transition-colors duration-300">Muslim Legacy Planning</a>
				</div>
			</div>
			<div class="mt-10 border-t border-[#1F2D3D]/8 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
				<p class="text-[11.5px] leading-relaxed text-[#1F2D3D]/45 max-w-[72ch]">
					Attorney Advertising. The information on this site is for general informational purposes only and
					does not constitute legal advice. Viewing this site does not create an attorney&ndash;client relationship.
				</p>
				<p class="text-[11.5px] text-[#1F2D3D]/45 whitespace-nowrap">
					&copy; {new Date().getFullYear()} McDaniel Estate Planning, PLLC
				</p>
			</div>
		</div>
	</footer>
</div>

<style>
	.mep {
		font-family: 'Figtree', 'Helvetica Neue', Arial, sans-serif;
		font-weight: 400;
	}
	.mep :global(.mep-serif),
	.mep .mep-serif {
		font-family: 'Playfair Display', Georgia, serif;
		font-weight: 500;
	}
</style>
