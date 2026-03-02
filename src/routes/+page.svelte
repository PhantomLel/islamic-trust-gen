<script lang="ts">
	import { siteName, siteTagline } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { slide } from 'svelte/transition';

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
			{
				threshold: 0.15,
				rootMargin: '0px 0px -8% 0px'
			}
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	const concerns = [
		{
			question: 'Will I lose control of my home?',
			answer: 'No. Your trust is revocable, and you remain the trustee while you are alive and competent. That means you keep full control over your home — you can live in it, refinance it, sell it, or transfer it just as you do now. The trust simply changes how the property is held, not who controls it.'
		},
		{
			question: 'Will my property taxes go up?',
			answer: 'No. Transferring your homestead into a revocable living trust does not increase your property taxes. We also provide a step-by-step guide, complete with visual aids, to ensure your Texas homestead exemption remains properly in place after the transfer.'
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
			answer: 'No. In many cases, working families benefit the most from avoiding probate. A properly structured trust helps reduce court involvement, preserve privacy, and ensure assets are distributed in accordance with Islamic inheritance principles.'
		}
	];
</script>

<!-- fixed navbar -->
<nav class="fixed top-0 inset-x-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-navy/10">
	<div class="max-w-6xl mx-auto px-5 py-2.5">
		<div class="hidden md:grid items-center grid-cols-[1fr_auto_1fr]">
			<!-- left -->
			<div class="justify-self-start">
				<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight whitespace-nowrap">
					<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
					{siteName}
				</a>
			</div>

			<!-- center -->
			<div class="justify-self-center flex items-center gap-7">
				<a href="#eligibility" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">Who This Is For</a>
				<a href="#concerns" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">FAQ</a>
				{#if data.user}
					<a href="/dashboard" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">Dashboard</a>
				{/if}
			</div>

			<!-- right -->
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
						<a href="/login" class="px-4 py-1.5 text-sm text-navy/70 transition-colors hover:text-navy">
							Log in
						</a>
						<a href="/signup" class="px-4 py-1.5 text-sm font-medium text-cream bg-navy rounded-lg transition-all duration-200 hover:bg-navy-light">
							Sign up
						</a>
					</div>
				{/if}
			</div>
		</div>

		<div class="flex items-center justify-between md:hidden">
			<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight whitespace-nowrap">
				<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
				{siteName}
			</a>

		<!-- mobile hamburger -->
			<button
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				class="p-1.5 -mr-1 text-navy/50 hover:text-navy transition-colors cursor-pointer"
				aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- mobile dropdown -->
	{#if mobileMenuOpen}
		<div class="md:hidden mt-2 rounded-2xl bg-white/80 backdrop-blur-lg border border-navy/6 shadow-lg overflow-hidden">
			<div class="flex flex-col p-3 gap-1">
				<a href="#eligibility" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/4 hover:text-emerald-accent">
					About
				</a>
				<a href="#concerns" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/4 hover:text-emerald-accent">
					FAQ
				</a>
				{#if data.user}
					<a href="/dashboard" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/4 hover:text-emerald-accent">
						Dashboard
					</a>
				{/if}
				<div class="h-px bg-navy/6 my-1 mx-2"></div>
				{#if data.user}
					<button
						onclick={() => { mobileMenuOpen = false; handleLogout(); }}
						class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/4 hover:text-emerald-accent text-left cursor-pointer"
					>
						Log out
					</button>
				{:else}
					<a href="/login" class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/4 hover:text-emerald-accent">
						Log in
					</a>
					<a href="/signup" class="mx-2 mt-1 py-2.5 text-sm font-medium text-cream bg-navy rounded-xl text-center transition-all hover:bg-navy-light">
						Sign up
					</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<!-- page -->
<div class="bg-cream font-sans">

	<!-- ═══════════════════ HERO ═══════════════════ -->
	<section class="min-h-screen flex items-center justify-center relative">

		<div class="absolute inset-0 pointer-events-none"
			style="background: radial-gradient(ellipse 60% 50% at 50% 55%, rgba(74,124,111,0.08) 0%, transparent 70%);">
		</div>

		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-28 left-10 md:left-20 w-7 h-7 md:w-9 md:h-9 border-t border-l border-emerald-accent/50"></div>
			<div class="absolute top-28 right-10 md:right-20 w-7 h-7 md:w-9 md:h-9 border-t border-r border-emerald-accent/50"></div>
			<div class="absolute bottom-16 left-10 md:left-20 w-7 h-7 md:w-9 md:h-9 border-b border-l border-emerald-accent/50"></div>
			<div class="absolute bottom-16 right-10 md:right-20 w-7 h-7 md:w-9 md:h-9 border-b border-r border-emerald-accent/50"></div>

		</div>

		<div use:revealOnScroll class="scroll-reveal relative flex flex-col items-center gap-7 px-6 text-center">

			<div class="flex items-center gap-4">
				<span class="w-8 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">
					{siteTagline}
				</span>
				<span class="w-8 h-px bg-emerald-accent/60"></span>
			</div>

			<h1 class="text-4xl md:text-5xl tracking-tight text-navy leading-none">
				Islamic Wills & Trusts, Properly Structured
			</h1>

			<p class="text-navy/55 text-base md:text-lg font-light max-w-lg leading-relaxed -mt-1">
				Attorney-supervised Islamic wills and trusts for Texas families.
			</p>

			<div class="flex items-center gap-3.5 max-w-xl bg-emerald-accent/6 border border-emerald-accent/20 rounded-xl px-5 py-3.5 -mt-1">
				<p class="text-navy/70 text-[13px] md:text-sm leading-relaxed text-left font-medium">
					We draft and record your deed — and provide a step-by-step guide to secure your Texas homestead exemption.
				</p>
			</div>

			<a
				href="/signup"
				class="group inline-flex items-center gap-2.5 px-9 py-3.5 bg-navy text-cream text-sm tracking-wider uppercase rounded-lg
					   transition-all duration-300 hover:bg-navy-light hover:shadow-xl hover:shadow-navy/15 hover:-translate-y-0.5"
			>
				Begin Your Estate Plan
				<svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
				</svg>
			</a>

			<div class="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-1">
				<div class="flex items-center gap-2">
					<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					<span class="text-navy/45 text-xs">Attorney Supervised</span>
				</div>
				<div class="w-px h-3 bg-navy/15 sm:block hidden"></div>
				<div class="flex items-center gap-2">
					<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					<span class="text-navy/45 text-xs">Structured According to Qur'anic Inheritance Principles</span>
				</div>
				<div class="w-px h-3 bg-navy/15 sm:block hidden"></div>
				<div class="flex items-center gap-2">
					<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					<span class="text-navy/45 text-xs">Deed Prepared & Recorded</span>
				</div>
			</div>

			<a
				href="#eligibility"
				class="group inline-flex items-center gap-2 mt-4 text-sm font-medium text-navy/55 transition-colors hover:text-emerald-accent"
			>
				Is This Right For You?
				<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</a>
		</div>

	</section>

	<!-- ═══════════════════ WHO THIS IS FOR ═══════════════════ -->
	<section id="eligibility" class="py-20 md:py-28 px-6 scroll-mt-24 min-h-[calc(100vh-10rem)] flex items-center justify-center" >
		<div use:revealOnScroll class="scroll-reveal max-w-3xl mx-auto">

			<div class="text-center mb-14">
				<div class="flex items-center justify-center gap-4 mb-6">
					<span class="w-8 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Eligibility</span>
					<span class="w-8 h-px bg-emerald-accent/60"></span>
				</div>
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy">Who This Is For</h2>
			</div>

			<div class="grid md:grid-cols-2 gap-6 md:gap-8">

				<!-- for you -->
				<div class="bg-white/60 backdrop-blur rounded-2xl border border-navy/6 p-7 md:p-8">
					<h3 class="text-navy font-semibold text-[15px] mb-6 flex items-center gap-2.5">
						<span class="w-7 h-7 rounded-full bg-emerald-accent/10 flex items-center justify-center shrink-0">
							<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</span>
						This Trust Is For You If
					</h3>
					<ul class="space-y-4">
						<li class="flex items-start gap-3 text-navy/65 text-sm leading-relaxed">
							<svg class="w-4 h-4 text-emerald-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
							You live in Texas
						</li>
						<li class="flex items-start gap-3 text-navy/65 text-sm leading-relaxed">
							<svg class="w-4 h-4 text-emerald-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
							You own one primary residence
						</li>
						<li class="flex items-start gap-3 text-navy/65 text-sm leading-relaxed">
							<svg class="w-4 h-4 text-emerald-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
							You want to avoid probate
						</li>
						<li class="flex items-start gap-3 text-navy/65 text-sm leading-relaxed">
							<svg class="w-4 h-4 text-emerald-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
							You want Islamic inheritance structured properly
						</li>
					</ul>
				</div>

				<!-- not designed for -->
				<div class="bg-white/60 backdrop-blur rounded-2xl border border-navy/6 p-7 md:p-8">
					<h3 class="text-navy font-semibold text-[15px] mb-6 flex items-center gap-2.5">
						<span class="w-7 h-7 rounded-full bg-navy/6 flex items-center justify-center shrink-0">
							<svg class="w-3.5 h-3.5 text-navy/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</span>
						This Trust Is Not Designed For
					</h3>
					<ul class="space-y-4">
						<li class="flex items-start gap-3 text-navy/55 text-sm leading-relaxed">
							<svg class="w-4 h-4 text-navy/30 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
							</svg>
							Business owners needing entity structuring
						</li>
						<li class="flex items-start gap-3 text-navy/55 text-sm leading-relaxed">
							<svg class="w-4 h-4 text-navy/30 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
							</svg>
							Multiple properties or investment real estate
						</li>
						<li class="flex items-start gap-3 text-navy/55 text-sm leading-relaxed">
							<svg class="w-4 h-4 text-navy/30 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
							</svg>
							Blended families with complex custody
						</li>
						<li class="flex items-start gap-3 text-navy/55 text-sm leading-relaxed">
							<svg class="w-4 h-4 text-navy/30 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
							</svg>
							Special needs planning
						</li>
						<li class="flex items-start gap-3 text-navy/55 text-sm leading-relaxed">
							<svg class="w-4 h-4 text-navy/30 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
							</svg>
							Large taxable estates
						</li>
					</ul>
				</div>
			</div>

			<div class="flex justify-center mt-10">
				<a
					href="#concerns"
					class="group inline-flex items-center gap-2 text-sm font-medium text-emerald-accent transition-colors hover:text-emerald-light"
				>
					Concerns?
					<svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
					</svg>
				</a>
			</div>
		</div>
	</section>

	<!-- ═══════════════════ COMMON CONCERNS ═══════════════════ -->
	<section id="concerns" class="relative py-20 md:py-28 px-6 bg-white/40 scroll-mt-24 min-h-[calc(100vh-10rem)]">
		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-8 left-5 md:left-20 w-7 h-7 md:w-9 md:h-9 border-t border-l border-emerald-accent/50"></div>
			<div class="absolute top-8 right-5 md:right-20 w-7 h-7 md:w-9 md:h-9 border-t border-r border-emerald-accent/50"></div>
			<div class="absolute bottom-8 left-5 md:left-20 w-7 h-7 md:w-9 md:h-9 border-b border-l border-emerald-accent/50"></div>
			<div class="absolute bottom-8 right-5 md:right-20 w-7 h-7 md:w-9 md:h-9 border-b border-r border-emerald-accent/50"></div>
		</div>
		<div use:revealOnScroll class="scroll-reveal max-w-2xl mx-auto">

			<div class="text-center mb-14">
				<div class="flex items-center justify-center gap-4 mb-6">
					<span class="w-8 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">FAQ</span>
					<span class="w-8 h-px bg-emerald-accent/60"></span>
				</div>
				<h2 class="text-3xl md:text-4xl tracking-tight text-navy">Common Concerns</h2>
			</div>

			<div class="space-y-3">
				{#each concerns as concern, i}
					<div class="bg-white/70 backdrop-blur rounded-xl border border-navy/6 overflow-hidden transition-shadow duration-200 {openConcern === i ? 'shadow-md shadow-navy/5' : ''}">
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
								<p class="text-navy/55 text-sm leading-relaxed">{concern.answer}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="flex justify-center mt-10">
				<a
					href="/signup"
					class="group inline-flex items-center gap-2.5 px-9 py-3.5 bg-navy text-cream text-sm tracking-wider uppercase rounded-lg
						   transition-all duration-300 hover:bg-navy-light hover:shadow-xl hover:shadow-navy/15 hover:-translate-y-0.5"
				>
					Begin Your Estate Plan
					<svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
					</svg>
				</a>
			</div>
		</div>

	</section>

	<!-- ═══════════════════ AUTHORITY FOOTER ═══════════════════ -->
	<footer class="py-10 px-6 border-t border-navy/8">
		<div use:revealOnScroll class="scroll-reveal max-w-3xl mx-auto flex flex-col items-center gap-4">
			<a href="/" class="flex items-center gap-2 text-navy/60 font-semibold text-sm tracking-tight">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60"></span>
				{siteName}
			</a>
			<p class="text-navy/40 text-xs tracking-wide text-center leading-relaxed">
				Amana Legacy is a service of McDaniel Estate Planning, PLLC. Licensed in the States of Texas and California.
			</p>
		</div>
	</footer>
</div>
