<script lang="ts">
	import { consultationBookingUrl, defaultPrepFee, formatUsd } from '$lib/config';
	import { slide } from 'svelte/transition';
	import { authClient } from '$lib/auth-client';

	let { data } = $props();
	let mobileMenuOpen = $state(false);
	let emailInput = $state('');
	let emailStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let openFaq = $state<number | null>(null);

	let scrollProgress = $state(0);
	let navScrolled = $state(false);

	function updateScroll() {
		const el = document.documentElement;
		const max = el.scrollHeight - el.clientHeight;
		scrollProgress = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
		navScrolled = el.scrollTop > 24;
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}

	async function handleEmailSubmit(e: Event) {
		e.preventDefault();
		if (!emailInput || emailStatus === 'loading') return;
		emailStatus = 'loading';
		try {
			const res = await fetch('/api/email-capture', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: emailInput })
			});
			emailStatus = res.ok ? 'success' : 'error';
			if (res.ok) emailInput = '';
		} catch {
			emailStatus = 'error';
		}
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
			{ threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
		);
		observer.observe(node);
		return { destroy() { observer.disconnect(); } };
	}

	// Reveals direct children in a staggered cascade as the container enters view.
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

	// Tracks the cursor to drive a soft radial spotlight on hover.
	function spotlight(node: HTMLElement) {
		function move(e: PointerEvent) {
			const r = node.getBoundingClientRect();
			node.style.setProperty('--mx', `${e.clientX - r.left}px`);
			node.style.setProperty('--my', `${e.clientY - r.top}px`);
		}
		node.addEventListener('pointermove', move);
		return { destroy() { node.removeEventListener('pointermove', move); } };
	}

	const problems = [
		{
			num: '01',
			title: 'Islamic inheritance is not automatic',
			body: "U.S. probate courts follow state intestacy law, not Qur'anic fractions. Without a properly structured plan, your heirs may receive nothing like what Allah prescribed."
		},
		{
			num: '02',
			title: 'A standard will may not reach your assets',
			body: 'Your home, retirement accounts, and joint bank accounts often pass outside of a will entirely. Standard legal documents may leave your most valuable assets unprotected.'
		},
		{
			num: '03',
			title: 'Community property creates unique complications',
			body: 'Texas and California treat marital assets as jointly owned by default. This creates specific conflicts with Islamic ownership and inheritance that most plans ignore.'
		}
	];

	const testimonials = [
		{
			quote: "Brother Leonard built a comprehensive estate plan for our complex estate that will allow us to avoid probate and fulfill our shariah obligations. His knowledge of Islamic law, Texas law, and tax rules gave us real confidence.",
			name: 'Dr. Mohammad Haque, MD',
			where: 'Masjid Hamza · Houston, TX'
		},
		{
			quote: "I have personally witnessed Brother Leonard's professionalism and integrity. His sincere concern for clients makes him a trustworthy advocate.",
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
			q: 'What is the difference between a will and a trust?',
			a: "A will expresses your wishes but must go through probate court before anyone receives anything — a process that can take months and is public record. A trust is a legal entity that holds your assets during your lifetime and distributes them privately and immediately when needed. For Muslim families, a trust also enforces Qur'anic shares in a way that courts cannot override."
		},
		{
			q: 'Is the free Islamic will legally binding?',
			a: 'Yes, when properly signed and witnessed according to your state\'s requirements. The free Islamic will is attorney-informed and designed to meet the formal validity requirements of your state. In Texas and California, it includes shariah-compliant distribution language drafted under attorney supervision.'
		},
		{
			q: 'Do you serve families outside Texas and California?',
			a: 'The free Islamic will and all educational resources are available in all states. Attorney-client legal services — the GoodTree Trust and Legacy Plan — are currently limited to Texas and California, where McDaniel Estate Planning holds active bar licensure.'
		},
		{
			q: 'What if I cannot afford the fee?',
			a: 'Start with the free Islamic will — it costs nothing and is the right starting point for every Muslim family. The GoodTree Trust offers riba-free installment financing. Families who qualify as zakat-eligible may qualify for free or reduced-cost services through our community program. Contact us directly to discuss your situation.'
		}
	];

	const videoCards = [
		{
			seed: 'vid1legal',
			title: "What happens to your home when you die — and why your will may not help",
			length: '11:24'
		},
		{
			seed: 'vid2waqf',
			title: "What is waqf and why does it matter for American Muslim families today",
			length: '8:47'
		},
		{
			seed: 'vid3inherit',
			title: "Islamic inheritance under U.S. law: the conflict most families don't know about",
			length: '14:02'
		}
	];
</script>

<svelte:window onscroll={updateScroll} />

<!-- Scroll progress -->
<div
	class="fixed top-0 inset-x-0 z-60 h-[2px] bg-emerald-accent/80 origin-left pointer-events-none transition-opacity duration-300"
	style="transform: scaleX({scrollProgress}); opacity: {scrollProgress > 0.005 ? 1 : 0};"
	aria-hidden="true"
></div>

<!-- ═══════════════════ NAV ═══════════════════ -->
<nav
	class="fixed top-0 inset-x-0 z-50 backdrop-blur-sm transition-all duration-300
		{navScrolled
			? 'bg-cream/95 border-b border-navy/10 shadow-[0_4px_24px_-12px_rgba(20,30,43,0.18)]'
			: 'bg-cream/70 border-b border-transparent'}"
>
	<div class="max-w-7xl mx-auto px-5 py-3">
		<div class="hidden md:grid items-center grid-cols-[auto_1fr_auto] gap-8">

			<a href="/" aria-label="Muslim Legacy Planning — home" class="flex items-center gap-3 transition-opacity hover:opacity-75">
				<img src="/mcdaniel.png" alt="" class="h-8 w-auto" />
				<span class="text-navy font-semibold text-sm tracking-tight whitespace-nowrap" style="font-family: 'Playfair Display', Georgia, serif;">
					Muslim Legacy Planning
				</span>
			</a>

			<div class="flex items-center gap-7 justify-center">
				<a href="/plans" class="text-navy/55 text-sm transition-colors hover:text-navy">Plans</a>
				<a href="#learn" class="text-navy/55 text-sm transition-colors hover:text-navy">Learn</a>
				<a href="#about" class="text-navy/55 text-sm transition-colors hover:text-navy">About</a>
				<a href="/trust" class="text-emerald-accent text-sm font-medium transition-colors hover:text-emerald-light">GoodTree Trust</a>
				{#if data.user}
					<a href="/dashboard" class="text-navy/55 text-sm transition-colors hover:text-navy">Dashboard</a>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				{#if data.user}
					<button
						onclick={handleLogout}
						class="px-4 py-1.5 text-sm text-navy/55 transition-colors hover:text-navy cursor-pointer"
					>Log out</button>
				{:else}
					<a href="/login" class="px-4 py-1.5 text-sm text-navy/60 transition-colors hover:text-navy">Log in</a>
				{/if}
				<a
					href="/free-islamic-will"
					class="px-5 py-2 text-sm font-medium text-cream bg-emerald-accent rounded-lg transition-all duration-200 hover:bg-emerald-light hover:-translate-y-px"
				>
					Free Islamic Will
				</a>
			</div>
		</div>

		<!-- Mobile nav -->
		<div class="flex items-center justify-between md:hidden">
			<a href="/" aria-label="Muslim Legacy Planning — home" class="flex items-center gap-2 transition-opacity hover:opacity-75">
				<img src="/mcdaniel.png" alt="" class="h-7 w-auto" />
				<span class="text-navy font-semibold text-xs tracking-tight" style="font-family: 'Playfair Display', Georgia, serif;">Muslim Legacy Planning</span>
			</a>
			<button
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				class="p-1.5 -mr-1 text-navy/50 hover:text-navy transition-colors cursor-pointer"
				aria-label="Toggle navigation menu"
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
		<div class="md:hidden mx-3 mt-1 mb-2 rounded-2xl bg-white/90 backdrop-blur-lg border border-navy/8 shadow-lg overflow-hidden">
			<div class="flex flex-col p-3 gap-1">
				<a href="/plans" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5">Plans</a>
				<a href="#learn" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5">Learn</a>
				<a href="#about" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5">About</a>
				<a href="/trust" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm font-medium text-emerald-accent rounded-xl hover:bg-emerald-accent/8">GoodTree Trust</a>
				<div class="h-px bg-navy/8 my-1 mx-2"></div>
				{#if data.user}
					<button onclick={() => { mobileMenuOpen = false; handleLogout(); }} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5 text-left cursor-pointer">Log out</button>
				{:else}
					<a href="/login" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/65 rounded-xl hover:bg-navy/5">Log in</a>
				{/if}
				<a href="/free-islamic-will" onclick={() => mobileMenuOpen = false} class="mx-2 mt-1 py-2.5 text-sm font-medium text-cream bg-emerald-accent rounded-xl text-center hover:bg-emerald-light">
					Free Islamic Will
				</a>
			</div>
		</div>
	{/if}
</nav>

<div class="bg-cream font-sans">

	<!-- ═══════════════════ HERO ═══════════════════ -->
	<section class="min-h-dvh grid lg:grid-cols-[58%_42%] overflow-hidden">
		<!-- Left: Content -->
		<div class="flex flex-col justify-center px-8 md:px-14 lg:px-20 xl:px-28 pt-32 pb-20 lg:pt-0 lg:pb-0 relative">
			<!-- Subtle radial gradient (visible on mobile, blends with image on desktop) -->
			<div class="absolute inset-0 pointer-events-none lg:hidden"
				style="background: radial-gradient(ellipse 70% 60% at 30% 40%, rgba(74,124,111,0.08) 0%, transparent 65%);">
			</div>
			<!-- Ambient drifting glow -->
			<div class="ambient-drift absolute -top-24 -left-16 w-136 h-136 pointer-events-none opacity-70"
				style="background: radial-gradient(circle at 50% 50%, rgba(74,124,111,0.10) 0%, transparent 60%);">
			</div>

			<div class="hero-stagger relative max-w-xl">
				<div class="flex items-center gap-3 mb-7">
					<span class="w-6 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">Islamic Estate Planning</span>
				</div>

				<h1 class="text-[2.6rem] md:text-5xl xl:text-[3.4rem] tracking-tight text-navy leading-[1.08] text-balance mb-6">
					Your family deserves a plan built on <span class="fill-word fill-word--1"><span class="fill-word__inner">faith</span></span> and <span class="fill-word fill-word--2"><span class="fill-word__inner">law</span></span>.
				</h1>

				<p class="text-navy/60 text-base md:text-[17px] leading-relaxed max-w-[52ch] mb-9">
					Muslim Legacy Planning offers attorney-led Islamic estate planning across the United States — wills, trusts, prenuptials, and business succession grounded in Qur'anic principles and U.S. law.
				</p>

				<div class="flex flex-col gap-3.5 mb-8">
					<a
						href="/free-islamic-will"
						class="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-emerald-accent text-cream text-sm font-medium rounded-lg w-full sm:w-auto
							   transition-all duration-300 hover:bg-emerald-light hover:shadow-lg hover:shadow-emerald-accent/20 hover:-translate-y-0.5 active:scale-[0.98]"
					>
						Create Your Free Islamic Will
						<svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
					</a>

					<a
						href="#products"
						class="text-navy/55 text-sm transition-colors hover:text-navy flex items-center gap-1.5 group pl-1"
					>
						<span>Explore all plans</span>
						<svg class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</a>
				</div>

				<div class="border-t border-navy/10 pt-6">
					<p class="text-navy/38 text-xs leading-relaxed max-w-[44ch]">
						Attorney-led platform. Legal services provided by McDaniel Estate Planning, PLLC — licensed in Texas and California.
					</p>
				</div>
			</div>
		</div>

		<!-- Right: Hero Image — swap the src to replace with final photography -->
		<div class="hidden lg:block relative overflow-hidden">
			<img
				src="https://picsum.photos/seed/homedocuments/900/1100"
				alt="A Muslim family reviewing estate planning documents at home"
				class="ken-burns absolute inset-0 w-full h-full object-cover"
				loading="eager"
			/>
			<!-- Overlay: left fade into cream + bottom darkening for any future caption -->
			<div class="absolute inset-0 pointer-events-none"
				style="background: linear-gradient(to right, rgba(250,246,240,0.45) 0%, transparent 20%), linear-gradient(to top, rgba(20,30,43,0.55) 0%, rgba(20,30,43,0.1) 45%, transparent 70%);">
			</div>
		</div>
	</section>

	<!-- ═══════════════════ THE PROBLEM ═══════════════════ -->
	<section id="problem" class="py-24 md:py-32 px-6 bg-white/50 scroll-mt-20">
		<div use:revealOnScroll class="scroll-reveal max-w-7xl mx-auto">

			<div class="grid md:grid-cols-[auto_1fr] gap-6 md:gap-16 items-end mb-16">
				<div>
					<div class="flex items-center gap-3 mb-5">
						<span class="w-6 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">The Problem</span>
					</div>
					<h2 class="text-3xl md:text-4xl tracking-tight text-navy leading-tight text-balance max-w-sm">
						Three things most Muslim families don't know.
					</h2>
				</div>
				<p class="text-navy/50 text-base leading-relaxed md:border-l md:border-navy/10 md:pl-10 max-w-lg">
					The U.S. legal system was not designed with Islamic inheritance in mind. Without deliberate planning, what you intend to leave behind may not arrive as you intended.
				</p>
			</div>

			<div use:revealStagger class="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-navy/8">
				{#each problems as p}
					<article class="py-10 md:py-0 md:px-10 first:md:pl-0 last:md:pr-0 flex flex-col gap-4">
						<span class="text-emerald-accent/55 text-[11px] tabular-nums tracking-widest">{p.num}</span>
						<h3 class="text-xl md:text-2xl text-navy tracking-tight leading-tight">{p.title}</h3>
						<p class="text-navy/55 text-sm leading-relaxed">{p.body}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════ PRODUCTS ═══════════════════ -->
	<section id="products" class="py-24 md:py-32 px-6 scroll-mt-20">
		<div use:revealOnScroll class="scroll-reveal max-w-7xl mx-auto">

			<div class="flex items-center gap-3 mb-5">
				<span class="w-6 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">Plans</span>
			</div>
			<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy text-balance max-w-md">
					Three ways to protect your family's future.
				</h2>
				<p class="text-navy/50 text-sm leading-relaxed max-w-xs">
					Every plan is shariah-compliant and attorney-supervised. Start free, or go as deep as your situation requires.
				</p>
			</div>

			<div use:revealStagger class="grid lg:grid-cols-2 gap-5">
				<!-- Free Islamic Will — primary, large card -->
				<article class="group/spot relative isolate rounded-2xl bg-emerald-accent overflow-hidden flex flex-col p-9 md:p-11 lg:row-span-2" use:spotlight>
					<div class="spotlight-glow is-light"></div>
					<!-- Subtle geometric texture -->
					<div class="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none"
						style="background: radial-gradient(circle at 100% 0%, rgba(255,255,255,0.6) 0%, transparent 60%);">
					</div>

					<div class="relative flex flex-col flex-1">
						<div class="text-cream/65 text-[10px] tracking-[0.28em] uppercase mb-5">No cost · Starting point for every Muslim family</div>

						<h3 class="text-3xl md:text-4xl tracking-tight text-cream leading-tight mb-3">
							Free Islamic Will
						</h3>
						<p class="text-cream/70 text-base leading-relaxed mb-8 max-w-[46ch]">
							Attorney-informed and shariah-grounded. The right first step for any Muslim family, regardless of estate size. Includes an Islamic distribution schedule, community property acknowledgment, and complete signing instructions.
						</p>

						<ul class="flex flex-col gap-3 mb-10 mt-auto">
							{#each ['Islamic distribution schedule', 'Community property acknowledgment', 'Islamic reconciliation letter', 'Signing instructions included', 'Valid in all 50 states'] as feature}
								<li class="flex items-start gap-2.5 text-sm text-cream/80">
									<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-cream/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
									{feature}
								</li>
							{/each}
						</ul>

						<div class="flex items-baseline gap-2 mb-8 pt-6 border-t border-cream/15">
							<span class="text-4xl tracking-tight text-cream font-light">Free</span>
							<span class="text-cream/55 text-sm">· no credit card required</span>
						</div>

						<a
							href="/free-islamic-will"
							class="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-cream text-navy text-sm font-medium rounded-lg
								   transition-all duration-300 hover:bg-white hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Create Your Free Islamic Will
							<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
						</a>
					</div>
				</article>

				<!-- GoodTree Trust -->
				<article class="group/spot relative isolate rounded-2xl bg-white/60 backdrop-blur border border-navy/10 p-8 md:p-9 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy/6" use:spotlight>
					<div class="spotlight-glow"></div>
					<div>
						<div class="text-emerald-accent/70 text-[10px] tracking-[0.28em] uppercase mb-3">Self-service · Online</div>
						<h3 class="text-2xl tracking-tight text-navy mb-1.5">GoodTree Trust</h3>
						<p class="text-navy/55 text-sm leading-relaxed">
							Attorney-drafted Islamic revocable living trust for individuals and families with straightforward estates. Build at your own pace, with attorney access throughout.
						</p>
					</div>

					<ul class="flex flex-col gap-2">
						{#each ['Attorney-drafted trust templates', 'Shariah-compliant distribution logic', 'Two pour-over wills', 'Deed preparation & recording', 'WhatsApp & email attorney access'] as feat}
							<li class="flex items-start gap-2 text-sm text-navy/65">
								<svg class="w-3 h-3 shrink-0 mt-1 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
								{feat}
							</li>
						{/each}
					</ul>

					<div class="flex items-baseline gap-1.5 pt-4 border-t border-navy/8 mt-auto">
						<span class="text-2xl tracking-tight text-navy">{formatUsd(defaultPrepFee)}</span>
						<span class="text-navy/40 text-xs">flat fee · attorney-supervised</span>
					</div>

					<a
						href="/trust"
						class="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-navy text-cream text-sm font-medium rounded-lg
							   transition-all duration-200 hover:bg-navy-light hover:-translate-y-0.5 active:scale-[0.98]"
					>
						Start Your GoodTree Trust
						<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</a>
				</article>

				<!-- Legacy Plan -->
				<article class="group/spot relative isolate rounded-2xl bg-white/60 backdrop-blur border border-navy/10 p-8 md:p-9 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy/6" use:spotlight>
					<div class="spotlight-glow"></div>
					<div>
						<div class="text-emerald-accent/70 text-[10px] tracking-[0.28em] uppercase mb-3">Full-service · Attorney-led</div>
						<h3 class="text-2xl tracking-tight text-navy mb-1.5">Legacy Plan</h3>
						<p class="text-navy/55 text-sm leading-relaxed">
							Personally designed by your attorney. Includes a dedicated Heba Strategy Session, trust drafting, deed recording, wills, healthcare directives, and hands-on delivery.
						</p>
					</div>

					<ul class="flex flex-col gap-2">
						{#each ['Dedicated Heba Strategy Session', 'Custom trust + pour-over wills', 'POAs & healthcare directives', 'Deed recording with the county', 'Physical binder shipped to your door'] as feat}
							<li class="flex items-start gap-2 text-sm text-navy/65">
								<svg class="w-3 h-3 shrink-0 mt-1 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
								{feat}
							</li>
						{/each}
					</ul>

					<div class="flex items-baseline gap-1.5 pt-4 border-t border-navy/8 mt-auto">
						<span class="text-2xl tracking-tight text-navy">from $3,200</span>
						<span class="text-navy/40 text-xs">riba-free financing available</span>
					</div>

					<a
						href={consultationBookingUrl}
						class="group inline-flex items-center justify-center gap-2 px-6 py-3 border border-navy/20 text-navy text-sm font-medium rounded-lg
							   transition-all duration-200 hover:border-navy/40 hover:bg-navy/4 hover:-translate-y-0.5 active:scale-[0.98]"
					>
						Schedule a Consultation
						<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</a>
				</article>
			</div>

			<div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-8 text-xs text-navy/38">
				<span>Not sure which plan fits your situation? <a href="/which-plan" class="underline underline-offset-2 hover:text-navy/60 transition-colors">Take the two-minute routing quiz →</a></span>
				<span class="hidden sm:inline w-px h-3 bg-navy/15"></span>
				<a href="/plans" class="hover:text-navy/60 transition-colors">View all five plans →</a>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ ENDOWMENT MOVEMENT ═══════════════════ -->
	<section id="endowment" class="py-24 md:py-32 px-6 bg-navy relative overflow-hidden scroll-mt-20">
		<!-- Subtle radial light -->
		<div class="absolute inset-0 pointer-events-none"
			style="background: radial-gradient(ellipse 70% 60% at 20% 50%, rgba(74,124,111,0.18) 0%, transparent 60%);">
		</div>
		<!-- Corner accents -->
		<div class="absolute top-10 left-8 md:left-16 w-8 h-8 border-t border-l border-emerald-accent/30 pointer-events-none"></div>
		<div class="absolute top-10 right-8 md:right-16 w-8 h-8 border-t border-r border-emerald-accent/30 pointer-events-none"></div>
		<div class="absolute bottom-10 left-8 md:left-16 w-8 h-8 border-b border-l border-emerald-accent/30 pointer-events-none"></div>
		<div class="absolute bottom-10 right-8 md:right-16 w-8 h-8 border-b border-r border-emerald-accent/30 pointer-events-none"></div>

		<div use:revealOnScroll class="scroll-reveal max-w-7xl mx-auto relative">
			<div class="grid md:grid-cols-[1.1fr_0.9fr] gap-14 md:gap-20 items-center">
				<div>
					<div class="flex items-center gap-3 mb-7">
						<span class="w-6 h-px bg-emerald-light/60"></span>
						<span class="text-emerald-light text-[11px] tracking-[0.28em] uppercase font-medium">The Endowment Movement</span>
					</div>
					<h2 class="text-3xl md:text-4xl xl:text-5xl tracking-tight text-cream leading-tight text-balance mb-6">
						From ad hoc fundraising to lasting endowment.
					</h2>
					<p class="text-cream/60 text-base leading-relaxed mb-5 max-w-[52ch]">
						The American Muslim community has funded its institutions for decades through iftar dinners and Ramadan drives. That model sustains — it does not build. Waqf changes that.
					</p>
					<p class="text-cream/60 text-base leading-relaxed mb-9 max-w-[52ch]">
						A family waqf endowment positions your estate to benefit your heirs in this life while sending a perpetual stream of sadaqah jariyah to the institutions your family loves — automatically, for generations.
					</p>
					<a
						href={consultationBookingUrl}
						class="group inline-flex items-center gap-2 px-7 py-3.5 border border-cream/20 text-cream text-sm font-medium rounded-lg
							   transition-all duration-300 hover:border-cream/40 hover:bg-cream/6 hover:-translate-y-0.5"
					>
						Learn about the Family Waqf Plan
						<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</a>
				</div>

				<div use:revealStagger class="flex flex-col gap-6">
					{#each [
						{ label: 'Sadaqah jariyah', body: 'Every dollar you endow continues to benefit your family and your masjid long after you are gone — no auction required.' },
						{ label: 'Afterfund partnership', body: 'Charitable assets invested in a shariah-compliant ETF, returning proceeds automatically to the institutions your family chooses.' },
						{ label: 'From estate plan to endowment', body: "The Family Waqf Plan moves your legacy from paperwork to purpose — structured within your estate plan, not separate from it." }
					] as item, i}
						<div class="flex gap-5 items-start">
							<span class="text-emerald-accent/50 text-[10px] tabular-nums tracking-widest mt-1 shrink-0">0{i + 1}</span>
							<div>
								<div class="text-cream text-sm font-medium mb-1.5">{item.label}</div>
								<p class="text-cream/50 text-sm leading-relaxed">{item.body}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ ATTORNEY ═══════════════════ -->
	<section id="about" class="py-24 md:py-32 px-6 scroll-mt-20">
		<div use:revealOnScroll class="scroll-reveal max-w-5xl mx-auto">
			<div class="grid md:grid-cols-[1fr_1.5fr] gap-10 md:gap-16 items-center">

				<div class="relative">
					<div class="absolute -inset-3 rounded-2xl border border-emerald-accent/15 pointer-events-none translate-x-3 translate-y-3"></div>
					<figure class="relative aspect-4/5 rounded-2xl overflow-hidden bg-navy-dark">
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
							<div class="text-cream/60 text-[10px] tracking-[0.28em] uppercase mb-1.5">Founding Attorney</div>
							<div class="text-cream text-xl tracking-tight">Leonard McDaniel, JD</div>
						</figcaption>
					</figure>
				</div>

				<div class="flex flex-col gap-5">
					<div class="flex items-center gap-3">
						<span class="w-6 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">Attorney Credibility</span>
					</div>
					<h2 class="text-3xl md:text-4xl tracking-tight text-navy leading-tight text-balance">
						Built at the intersection of fiqh and U.S. law.
					</h2>
					<p class="text-navy/62 text-base leading-relaxed">
						Brother Leonard embraced Islam in 2014 while studying history at UCLA, graduating magna cum laude. Inspired by a desire to serve his community with both faith and expertise, he earned his Juris Doctor at the University of Houston Law Center in 2017.
					</p>
					<p class="text-navy/62 text-base leading-relaxed">
						For the last five years, he has focused on probate and estate planning — helping Muslim families protect their wealth through thoughtful legal work grounded in classical fiqh and Texas and California law.
					</p>

					<div use:revealStagger class="flex flex-wrap gap-7 pt-5 border-t border-navy/10 mt-2">
						<div>
							<div class="text-2xl tabular-nums text-navy tracking-tight">2014</div>
							<div class="text-xs text-navy/40 tracking-wider uppercase mt-1">Embraced Islam</div>
						</div>
						<div>
							<div class="text-2xl tabular-nums text-navy tracking-tight">2017</div>
							<div class="text-xs text-navy/40 tracking-wider uppercase mt-1">UH Law, top of class</div>
						</div>
						<div>
							<div class="text-2xl tabular-nums text-navy tracking-tight">TX · CA</div>
							<div class="text-xs text-navy/40 tracking-wider uppercase mt-1">Licensed</div>
						</div>
					</div>

					<a
						href="https://mcdanielestateplanning.com"
						target="_blank"
						rel="noopener noreferrer"
						class="text-emerald-accent text-sm hover:text-emerald-light transition-colors flex items-center gap-1.5 group"
					>
						View full profile at McDanielEstatePlanning.com
						<svg class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ TESTIMONIALS ═══════════════════ -->
	<section id="testimonials" class="py-24 md:py-32 px-6 bg-white/50 scroll-mt-20">
		<div use:revealOnScroll class="scroll-reveal max-w-5xl mx-auto">
			<div class="flex items-center gap-3 mb-5">
				<span class="w-6 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">Community</span>
			</div>
			<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy text-balance">
					Trusted by families and imams across Texas.
				</h2>
				<a href="https://g.page/r/review" target="_blank" rel="noopener noreferrer"
					class="text-navy/45 text-xs underline underline-offset-2 hover:text-navy/70 transition-colors whitespace-nowrap">
					Read Google Reviews
				</a>
			</div>

			<div use:revealStagger class="grid md:grid-cols-2 gap-6 items-stretch">
				{#each testimonials as t}
					<figure
						class="h-full bg-cream border border-navy/8 rounded-2xl p-7 md:p-8 flex flex-col
							   transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
							   hover:border-navy/12 hover:shadow-[0_12px_32px_-12px_rgba(30,42,58,0.08)]"
					>
						<svg class="w-6 h-5 shrink-0 text-emerald-accent/40 mb-1" viewBox="0 0 24 18" fill="currentColor" aria-hidden="true">
							<path d="M0 18V10.5C0 4.71 3.63 1.41 10.88 0l1.07 1.95C8.26 3.06 6.26 5.1 5.78 8.4H10V18H0zm14 0V10.5C14 4.71 17.63 1.41 24.88 0l1.07 1.95C22.26 3.06 20.26 5.1 19.78 8.4H24V18H14z"/>
						</svg>
						<blockquote class="text-navy/72 text-[15px] leading-relaxed flex-1 min-h-0">
							{t.quote}
						</blockquote>
						<figcaption class="mt-auto flex flex-col gap-0.5 pt-5 border-t border-navy/8">
							<span class="text-navy font-medium text-sm">{t.name}</span>
							<span class="text-navy/45 text-xs tracking-wide">{t.where}</span>
						</figcaption>
					</figure>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════ VIDEO HUB ═══════════════════ -->
	<section id="learn" class="py-24 md:py-32 px-6 scroll-mt-20">
		<div use:revealOnScroll class="scroll-reveal max-w-7xl mx-auto">

			<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
				<div>
					<div class="flex items-center gap-3 mb-5">
						<span class="w-6 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">Learn</span>
					</div>
					<h2 class="text-3xl md:text-4xl tracking-tight text-navy text-balance max-w-md">
						Education is the foundation of good planning.
					</h2>
				</div>
				<a href="/videos" class="text-navy/50 text-sm hover:text-navy transition-colors flex items-center gap-1.5 group">
					View all videos
					<svg class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
				</a>
			</div>

			<div use:revealStagger class="grid md:grid-cols-3 gap-5">
				{#each videoCards as v, i}
					<a
						href="/videos"
						class="group block rounded-2xl overflow-hidden border border-navy/8 bg-white/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy/6"
					>
						<div class="relative aspect-video overflow-hidden">
							<img
								src="https://picsum.photos/seed/{v.seed}/800/450"
								alt=""
								class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
								loading="lazy"
							/>
							<div class="absolute inset-0 bg-navy/30 flex items-center justify-center transition-opacity duration-200 group-hover:bg-navy/20">
								<div class="w-12 h-12 rounded-full bg-cream/90 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
									<svg class="w-5 h-5 text-navy ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
								</div>
							</div>
							<div class="absolute bottom-3 right-3 bg-navy/70 text-cream text-[10px] px-2 py-0.5 rounded font-mono">{v.length}</div>
						</div>
						<div class="p-5">
							<p class="text-navy text-sm leading-snug font-medium">{v.title}</p>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════ EMAIL CAPTURE ═══════════════════ -->
	<section id="newsletter" class="py-20 md:py-24 px-6 bg-white/50 scroll-mt-20">
		<div use:revealOnScroll class="scroll-reveal max-w-2xl mx-auto text-center">
			<div class="flex items-center justify-center gap-3 mb-6">
				<span class="w-6 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">Free Resource</span>
				<span class="w-6 h-px bg-emerald-accent/60"></span>
			</div>
			<h2 class="text-2xl md:text-3xl tracking-tight text-navy text-balance mb-3">
				Not sure where to start?
			</h2>
			<p class="text-navy/55 text-base leading-relaxed mb-8 max-w-[46ch] mx-auto">
				Download our free Islamic estate planning checklist — a plain-English guide to what every Muslim family needs to know before meeting with an attorney.
			</p>

			<form onsubmit={handleEmailSubmit} class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
				<input
					type="email"
					bind:value={emailInput}
					placeholder="your@email.com"
					required
					disabled={emailStatus === 'loading' || emailStatus === 'success'}
					class="flex-1 px-4 py-3 text-sm text-navy bg-cream border border-navy/15 rounded-lg outline-none
						   focus:border-emerald-accent/60 focus:ring-1 focus:ring-emerald-accent/30 transition-all
						   placeholder:text-navy/30 disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={emailStatus === 'loading' || emailStatus === 'success'}
					class="px-6 py-3 text-sm font-medium text-cream bg-navy rounded-lg transition-all duration-200
						   hover:bg-navy-light hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
				>
					{#if emailStatus === 'loading'}
						Sending…
					{:else if emailStatus === 'success'}
						Check your inbox
					{:else}
						Get the checklist
					{/if}
				</button>
			</form>

			{#if emailStatus === 'error'}
				<p class="text-sm text-red-600 mt-3">Something went wrong. Please try again.</p>
			{/if}
			{#if emailStatus === 'success'}
				<p class="text-sm text-emerald-accent mt-3">Your checklist is on the way.</p>
			{/if}

			<p class="text-navy/30 text-xs mt-4">Your information is never shared with anyone.</p>
		</div>
	</section>

	<!-- ═══════════════════ FAQ ═══════════════════ -->
	<section id="faq" class="py-24 md:py-32 px-6 scroll-mt-20">
		<div use:revealOnScroll class="scroll-reveal max-w-3xl mx-auto">
			<div class="flex items-center justify-center gap-3 mb-6">
				<span class="w-6 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">FAQ</span>
				<span class="w-6 h-px bg-emerald-accent/60"></span>
			</div>
			<h2 class="text-2xl md:text-3xl tracking-tight text-navy text-center text-balance mb-12">Questions families ask first.</h2>

			<div class="space-y-3">
				{#each faqs as faq, i}
					<div class="bg-cream rounded-xl border border-navy/8 overflow-hidden {openFaq === i ? 'shadow-md shadow-navy/5' : ''}">
						<button
							onclick={() => toggleFaq(i)}
							class="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
						>
							<span class="text-navy text-sm font-medium pr-4">{faq.q}</span>
							<svg class="w-4 h-4 text-navy/35 shrink-0 transition-transform duration-200 {openFaq === i ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
						</button>
						{#if openFaq === i}
							<div transition:slide={{ duration: 200 }} class="px-6 pb-5">
								<p class="text-navy/58 text-sm leading-relaxed">{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════ FINAL CTA ═══════════════════ -->
	<section id="contact" class="py-24 md:py-32 px-6 scroll-mt-20">
		<div use:revealOnScroll class="scroll-reveal max-w-5xl mx-auto">
			<div class="relative bg-navy rounded-3xl px-8 py-16 md:px-16 md:py-20 overflow-hidden">
				<div class="absolute inset-0 pointer-events-none"
					style="background: radial-gradient(ellipse 65% 85% at 50% -10%, rgba(74,124,111,0.28) 0%, transparent 55%);">
				</div>
				<!-- Corner accents -->
				<div class="absolute top-8 left-8 w-7 h-7 border-t border-l border-emerald-accent/30 pointer-events-none"></div>
				<div class="absolute top-8 right-8 w-7 h-7 border-t border-r border-emerald-accent/30 pointer-events-none"></div>
				<div class="absolute bottom-8 left-8 w-7 h-7 border-b border-l border-emerald-accent/30 pointer-events-none"></div>
				<div class="absolute bottom-8 right-8 w-7 h-7 border-b border-r border-emerald-accent/30 pointer-events-none"></div>

				<div class="relative grid md:grid-cols-[1fr_auto] gap-10 items-center">
					<div>
						<div class="flex items-center gap-3 mb-6">
							<span class="w-6 h-px bg-emerald-light/60"></span>
							<span class="text-emerald-light text-[11px] tracking-[0.28em] uppercase font-medium">Begin</span>
						</div>
						<h2 class="text-3xl md:text-4xl xl:text-5xl tracking-tight text-cream leading-tight text-balance max-w-lg mb-5">
							Your family's legacy begins with one document.
						</h2>
						<p class="text-cream/55 text-base max-w-md leading-relaxed">
							Start with the free Islamic will — it costs nothing and takes less than ten minutes. Add to it when you're ready.
						</p>
					</div>

					<div class="flex flex-col gap-3 shrink-0">
						<a
							href="/free-islamic-will"
							class="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-cream text-navy text-sm font-medium rounded-lg whitespace-nowrap
								   transition-all duration-300 hover:bg-white hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Create Your Free Islamic Will
							<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
						</a>
						<a
							href={consultationBookingUrl}
							class="group inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-cream/18 text-cream text-sm font-medium rounded-lg whitespace-nowrap
								   transition-all duration-200 hover:border-cream/40 hover:bg-cream/5"
						>
							Book a Consultation
						</a>
						<div class="flex flex-col gap-1 pt-2 text-center">
							<a href="tel:+17136599668" class="text-cream/40 text-xs hover:text-cream/60 transition-colors">+1 (713) 659-9668</a>
							<a href="mailto:admin@mcdanielestateplanning.com" class="text-cream/40 text-xs hover:text-cream/60 transition-colors">admin@mcdanielestateplanning.com</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ FOOTER ═══════════════════ -->
	<footer class="px-6 pt-14 pb-10 border-t border-navy/8">
		<div class="max-w-7xl mx-auto">
			<div class="grid md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 md:gap-12 mb-12">
				<div>
					<a href="/" aria-label="Muslim Legacy Planning — home" class="inline-flex items-center gap-3 mb-5 transition-opacity hover:opacity-75">
						<img src="/mcdaniel.png" alt="" class="h-10 w-auto" />
						<span class="text-navy font-semibold text-sm" style="font-family: 'Playfair Display', Georgia, serif;">Muslim Legacy Planning</span>
					</a>
					<p class="text-navy/45 text-sm leading-relaxed max-w-xs">
						Attorney-led Islamic estate planning for Muslim families across the United States. Legal services provided by McDaniel Estate Planning, PLLC.
					</p>
					<p class="text-navy/30 text-xs mt-4 leading-relaxed max-w-xs">
						Licensed in Texas and California. This site is an educational and self-help resource. Use of this site does not create an attorney-client relationship.
					</p>
				</div>

				<div class="flex flex-col gap-2.5">
					<div class="text-navy/30 text-[10px] tracking-[0.25em] uppercase mb-1.5">Plans</div>
					<a href="/free-islamic-will" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">Free Islamic Will</a>
					<a href="/trust" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">GoodTree Trust</a>
					<a href="#products" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">Legacy Plan</a>
					<a href="/which-plan" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">Which plan is right?</a>
				</div>

				<div class="flex flex-col gap-2.5">
					<div class="text-navy/30 text-[10px] tracking-[0.25em] uppercase mb-1.5">Learn</div>
					<a href="/learn" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">Articles</a>
					<a href="/videos" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">Videos</a>
					<a href="/community-property" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">Community Property</a>
					<a href="/endowment" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">Endowment Movement</a>
				</div>

				<div class="flex flex-col gap-2.5">
					<div class="text-navy/30 text-[10px] tracking-[0.25em] uppercase mb-1.5">Contact</div>
					<a href="tel:+17136599668" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">+1 (713) 659-9668</a>
					<a href="mailto:admin@mcdanielestateplanning.com" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors break-all">admin@mcdanielestateplanning.com</a>
					<a href={consultationBookingUrl} class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">Book a Consultation</a>
					<a href="https://mcdanielestateplanning.com" target="_blank" rel="noopener noreferrer" class="text-navy/60 text-sm hover:text-emerald-accent transition-colors">McDaniel Estate Planning</a>
				</div>
			</div>

			<div class="flex flex-col md:flex-row gap-3 md:items-center md:justify-between pt-6 border-t border-navy/8">
				<p class="text-navy/35 text-xs">
					© 2026 McDaniel Estate Planning, PLLC. All rights reserved. Licensed in Texas and California.
				</p>
				<p class="text-navy/25 text-xs">
					Muslim Legacy Planning is a service of McDaniel Estate Planning, PLLC.
				</p>
			</div>
		</div>
	</footer>

</div>
