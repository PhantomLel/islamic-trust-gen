<script lang="ts">
	import { page } from '$app/state';
	import ReviewsBlock from '$lib/components/ReviewsBlock.svelte';
	import TestimonialDisclaimer from '$lib/components/TestimonialDisclaimer.svelte';
	import {
		attorneyName,
		consultationBookingUrl,
		mlpOrigin,
		productNameShortCapitalized
	} from '$lib/config';
	import { mepHref } from '$lib/mep/href';

	const freeWillUrl = `${mlpOrigin}/free-islamic-will`;
	const trustUrl = `${mlpOrigin}/trust`;

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

	const services: { num: string; title: string; body: string; href: string; external?: boolean }[] = [
		{
			num: '01',
			title: 'Islamic Estate Planning Consultations',
			body: 'A structured attorney review of your family, assets, and planning goals through the lens of Islamic inheritance and U.S. law.',
			href: consultationBookingUrl,
			external: true
		},
		{
			num: '02',
			title: 'Legacy Plan',
			body: 'A full-service plan personally designed by your attorney: a revocable living trust, pour-over wills, powers of attorney and healthcare directives, deed preparation and recording, and a dedicated heba strategy session. From $3,500.',
			href: '/legacy-plan'
		},
		{
			num: '03',
			title: 'Family Waqf Plan',
			body: 'We draft the legal framework for your family waqf, built into your estate plan and designed for ongoing sadaqah jariyah.',
			href: '/family-waqf-plan'
		},
		{
			num: '04',
			title: 'Probate & Estate Administration',
			body: 'Guiding families through the court process after a death, including estates with Islamic distribution instructions.',
			href: '/probate-estate-administration'
		},
		{
			num: '05',
			title: 'Business Succession Planning',
			body: 'Succession and estate planning for business owners, and customized planning for blended families and multiple properties.',
			href: '/business-succession-planning'
		}
	];
</script>

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

				<div>
					<div use:revealStagger class="divide-y divide-[#1F2D3D]/10 border-y border-[#1F2D3D]/10">
						{#each services as service}
							<a
								href={service.external ? service.href : mepHref(page.url.pathname, service.href)}
								target={service.external ? '_blank' : undefined}
								rel={service.external ? 'noopener' : undefined}
								class="group grid sm:grid-cols-[3.5rem_1fr] gap-2 sm:gap-6 py-7 transition-colors duration-300 hover:bg-[#1F2D3D]/[0.025] sm:px-2 -mx-2"
							>
								<span class="text-[12px] tracking-[0.15em] text-[#9A7B45] pt-1.5 font-medium">{service.num}</span>
								<div>
									<h3 class="mep-serif text-[1.25rem] leading-snug mb-2 group-hover:text-[#9A7B45] transition-colors duration-300">{service.title}</h3>
									<p class="text-[14px] leading-relaxed text-[#1F2D3D]/60 max-w-[60ch]">{service.body}</p>
								</div>
							</a>
						{/each}
					</div>
					<p class="text-[14.5px] leading-relaxed text-[#1F2D3D]/70 mt-8 max-w-[62ch]">
						Prefer to start online? <a href={trustUrl} class="border-b border-[#9A7B45]/50 hover:border-[#9A7B45]">{productNameShortCapitalized()}</a>
						and the <a href={freeWillUrl} class="border-b border-[#9A7B45]/50 hover:border-[#9A7B45]">free Islamic will</a>
						are available at <a href={mlpOrigin} class="border-b border-[#9A7B45]/50 hover:border-[#9A7B45]">Muslim Legacy Planning</a>.
					</p>
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

					<h2 class="mep-serif text-[2.2rem] md:text-[2.7rem] leading-[1.12] tracking-tight mb-8">
						{attorneyName}
					</h2>

					<div class="space-y-5 text-[15.5px] leading-relaxed text-[#1F2D3D]/72 max-w-[58ch]">
						<p>
							Leonard McDaniel is an estate planning attorney licensed in Texas and California. He has focused on
							estate planning for Muslim families since 2022.
						</p>
					</div>

					<p class="mt-8 text-[14.5px] leading-relaxed text-[#1F2D3D]/70">
						2017 — UH Law Center, JD · 2021 — Licensed in Texas · 2023 — Licensed in California
					</p>

					<a
						href={mepHref(page.url.pathname, '/attorney')}
						class="inline-block mt-6 text-[14.5px] text-[#1F2D3D]/75 hover:text-[#1F2D3D] border-b border-[#9A7B45]/50 hover:border-[#9A7B45] pb-0.5 transition-colors duration-300"
					>
						Read Leonard McDaniel&rsquo;s full profile
					</a>
				</div>
			</div>
		</section>

		<!-- ═══════════════════ SECTION 5 — TESTIMONIALS ═══════════════════ -->
		<section id="reviews" class="py-24 md:py-32 px-6 lg:px-10 scroll-mt-20">
			<div use:revealOnScroll class="scroll-reveal max-w-6xl mx-auto">
				<div class="flex items-center gap-3 mb-10">
					<span class="w-8 h-px bg-[#9A7B45]"></span>
					<h2 class="text-[11px] tracking-[0.3em] uppercase text-[#9A7B45] font-normal">Client Experiences</h2>
				</div>
				<ReviewsBlock linksClass="text-[#9A7B45]" />
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
								Muslim Legacy Planning is the Islamic estate-planning service of McDaniel Estate Planning, PLLC. It is where families can create a free Islamic will, build an attorney-guided online trust, and learn about Islamic estate planning. McDaniel Estate Planning is the law firm that provides the legal services.
							</p>
						</div>
						<div class="lg:justify-self-end">
							<a
								href={mlpOrigin}
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
						Plan your estate thoughtfully — in faith and in law.
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
