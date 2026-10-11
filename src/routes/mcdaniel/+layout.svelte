<script lang="ts">
	import { page } from '$app/state';
	import { consultationBookingUrl, formatFirmNapLine, mlpOrigin, productNameShortBare } from '$lib/config';
	import { mepHref } from '$lib/mep/href';

	let mobileMenuOpen = $state(false);
	let navScrolled = $state(false);

	function updateScroll() {
		navScrolled = document.documentElement.scrollTop > 24;
	}

	const navLinks = [
		{ href: '#why-legal', label: 'Why Legal Implementation' },
		{ href: '#services', label: 'Services' },
		{ href: '#attorney', label: 'Attorney' },
		{ href: '#reviews', label: 'Reviews' }
	];

	const pageLinks = [
		{ href: '/legacy-plan', label: 'Legacy Plan' },
		{ href: '/family-waqf-plan', label: 'Family Waqf Plan' },
		{ href: '/probate-estate-administration', label: 'Probate & Estate Administration' },
		{ href: '/business-succession-planning', label: 'Business Succession Planning' },
		{ href: '/attorney', label: 'Attorney' }
	];

	let { children } = $props();
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
	<header
		class="fixed top-0 inset-x-0 z-50 transition-all duration-500 {navScrolled
			? 'bg-[#FCFBF8]/92 backdrop-blur-md border-b border-[#1F2D3D]/8 shadow-[0_1px_0_rgba(31,45,61,0.04)]'
			: 'bg-transparent border-b border-transparent'}"
	>
		<div class="max-w-7xl mx-auto px-6 lg:px-10 h-[4.5rem] flex items-center justify-between">
			<a href={mepHref(page.url.pathname, '/')} class="group flex items-baseline gap-2.5">
				<span class="mep-serif text-[1.15rem] leading-none tracking-tight">McDaniel Estate Planning</span>
				<span class="hidden sm:inline text-[10px] tracking-[0.22em] uppercase text-[#1F2D3D]/50">PLLC</span>
			</a>

			<nav class="hidden lg:flex items-center gap-9">
				{#each navLinks as link}
					<a
						href={mepHref(page.url.pathname, link.href)}
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
							href={mepHref(page.url.pathname, link.href)}
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

	{@render children()}

	<footer class="border-t border-[#1F2D3D]/8 px-6 lg:px-10 py-12 md:py-14">
		<div class="max-w-7xl mx-auto">
			<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
				<div class="max-w-xl">
					<p class="mep-serif text-[1.05rem]">McDaniel Estate Planning, PLLC</p>
					<p class="text-[12.5px] text-[#1F2D3D]/55 mt-1.5">Serving clients in Texas and California.</p>
					<p class="text-[12.5px] text-[#1F2D3D]/55 mt-2">{formatFirmNapLine()}</p>
				</div>
				<nav class="flex flex-col gap-2 text-[13px] text-[#1F2D3D]/60">
					{#each pageLinks as link}
						<a href={mepHref(page.url.pathname, link.href)} class="hover:text-[#1F2D3D] transition-colors duration-300">{link.label}</a>
					{/each}
					<a href={`${mlpOrigin}/free-islamic-will`} class="hover:text-[#1F2D3D] transition-colors duration-300">Free Islamic Will</a>
					<a href={`${mlpOrigin}/trust`} class="hover:text-[#1F2D3D] transition-colors duration-300">{productNameShortBare()}</a>
					<a href={mlpOrigin} class="hover:text-[#1F2D3D] transition-colors duration-300">Muslim Legacy Planning</a>
				</nav>
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
