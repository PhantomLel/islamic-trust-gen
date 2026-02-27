<script lang="ts">
	import { siteName, siteTagline } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let mobileMenuOpen = $state(false);

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
		window.location.reload();
	}
</script>

<div class="h-screen w-screen overflow-hidden bg-cream font-sans flex items-center justify-center relative">

	<!-- background accent -->
	<div class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 60% 50% at 50% 55%, rgba(74,124,111,0.08) 0%, transparent 70%);">
	</div>

	<!-- navbar -->
	<nav class="absolute top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl z-20">
		<div class="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-white/70 backdrop-blur-lg border border-navy/[0.06]" style="box-shadow: 0 0 10px 2px rgba(74,124,111,0.45), 0 0 60px 12px rgba(74,124,111,0.25)">

			<!-- logo — emerald dot accent -->
			<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight whitespace-nowrap">
				<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
				{siteName}
			</a>

			<!-- desktop nav -->
			<div class="hidden md:flex items-center gap-8">
				<div class="flex items-center gap-6">
					<a href="#about" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">About</a>
					<a href="#contact" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">Contact</a>
					{#if data.user}
						<a href="/dashboard" class="text-navy/55 text-sm transition-colors hover:text-emerald-accent">Dashboard</a>
					{/if}
				</div>
				<div class="w-px h-5 bg-navy/10"></div>
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

			<!-- mobile hamburger -->
			<button
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				class="md:hidden p-1.5 -mr-1 text-navy/50 hover:text-navy transition-colors cursor-pointer"
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

		<!-- mobile dropdown -->
		{#if mobileMenuOpen}
			<div class="md:hidden mt-2 rounded-2xl bg-white/80 backdrop-blur-lg border border-navy/[0.06] shadow-lg overflow-hidden">
				<div class="flex flex-col p-3 gap-1">
					<a href="#about" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/[0.04] hover:text-emerald-accent">
						About
					</a>
					<a href="#contact" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/[0.04] hover:text-emerald-accent">
						Contact
					</a>
					{#if data.user}
						<a href="/dashboard" onclick={() => mobileMenuOpen = false} class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/[0.04] hover:text-emerald-accent">
							Dashboard
						</a>
					{/if}
					<div class="h-px bg-navy/6 my-1 mx-2"></div>
					{#if data.user}
						<button
							onclick={() => { mobileMenuOpen = false; handleLogout(); }}
							class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/[0.04] hover:text-emerald-accent text-left cursor-pointer"
						>
							Log out
						</button>
					{:else}
						<a href="/login" class="px-4 py-2.5 text-sm text-navy/60 rounded-xl transition-colors hover:bg-navy/[0.04] hover:text-emerald-accent">
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

	<!-- hero content -->
	<div class="relative flex flex-col items-center gap-10 px-6 text-center">

		<!-- eyebrow -->
		<div class="flex items-center gap-4">
			<span class="w-8 h-px bg-emerald-accent/60"></span>
			<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">
				{siteTagline}
			</span>
			<span class="w-8 h-px bg-emerald-accent/60"></span>
		</div>

		<!-- title -->
		<h1 class="font-sans text-6xl md:text-7xl tracking-tight text-navy leading-none">
			Secure Your Future
		</h1>

		<!-- description -->
		<p class="text-navy/55 text-base md:text-lg font-light max-w-lg leading-relaxed -mt-2">
			Islamic-compliant trusts crafted with clarity
		</p>

		<!-- CTA -->
		<a
			href="/signup"
			class="group mt-2 inline-flex items-center gap-2.5 px-9 py-3.5 bg-navy text-cream text-sm tracking-wider uppercase rounded-lg
				   transition-all duration-300 hover:bg-navy-light hover:shadow-xl hover:shadow-navy/15 hover:-translate-y-0.5"
		>
			Create a Trust Now
			<svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
			</svg>
		</a>

		<!-- emerald trust badges -->
		<div class="flex items-center gap-6 mt-2">
			<div class="flex items-center gap-2">
				<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
				<span class="text-navy/45 text-xs">Sharia Compliant</span>
			</div>
			<div class="w-px h-3 bg-navy/15"></div>
			<div class="flex items-center gap-2">
				<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
				<span class="text-navy/45 text-xs">Legally Binding</span>
			</div>
			<div class="w-px h-3 bg-navy/15"></div>
			<div class="flex items-center gap-2">
				<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
				<span class="text-navy/45 text-xs">Guided Process</span>
			</div>
		</div>
	</div>

	<!-- bottom mark -->
	<div class="absolute bottom-8 left-1/2 -translate-x-1/2">
		<div class="w-6 h-px bg-navy/15"></div>
	</div>
</div>
