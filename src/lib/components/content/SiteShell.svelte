<script lang="ts">
	import type { Snippet } from 'svelte';
	import { attorneyProfileUrl, consultationBookingUrl, firmDescriptionLine, firmIdentityLine, siteName } from '$lib/config';

	let { children, searchQuery = '' }: { children: Snippet; searchQuery?: string } = $props();
</script>

<div class="min-h-dvh bg-cream font-sans text-navy flex flex-col">
	<header class="border-b border-navy/10 bg-cream/95">
		<div class="max-w-5xl mx-auto px-5 py-3 flex flex-wrap items-center justify-between gap-3">
			<a href="/" aria-label="{siteName} — home" class="flex items-center gap-2.5 transition-opacity hover:opacity-75">
				<img src="/mcdaniel.png" alt="" class="h-7 w-auto" width="41" height="28" />
				<span class="font-semibold text-sm tracking-tight" style="font-family: 'Playfair Display', Georgia, serif;">{siteName}</span>
			</a>
			<nav aria-label="Primary" class="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-navy/65">
				<a href="/answers" class="hover:text-navy">Answers</a>
				<a href="/videos" class="hover:text-navy">Videos</a>
				<a href="/plans" class="hover:text-navy">Plans</a>
				<a href="/free-islamic-will" class="hover:text-navy">Free Islamic Will</a>
				<a href={attorneyProfileUrl} class="hover:text-navy">About</a>
				<a href={consultationBookingUrl} class="px-4 py-1.5 rounded-lg bg-emerald-accent text-cream font-medium hover:bg-emerald-light">Book a Consultation</a>
			</nav>
		</div>
	</header>

	<div class="flex-1">
		{@render children()}
	</div>

	<footer class="border-t border-navy/10 mt-16">
		<div class="max-w-5xl mx-auto px-5 py-8 text-xs text-navy/55 leading-relaxed space-y-2">
			<form action="/answers" method="get" class="flex gap-2 max-w-sm" role="search">
				<label class="sr-only" for="shell-search">Search answers and videos</label>
				<input id="shell-search" name="q" value={searchQuery} placeholder="Search answers and videos" class="flex-1 px-3 py-2 rounded-lg border border-navy/15 bg-white text-sm" />
				<button class="px-3 py-2 rounded-lg bg-navy text-cream text-sm">Search</button>
			</form>
			<p>{firmIdentityLine}</p>
			<p>{firmDescriptionLine} Use of this site does not create an attorney-client relationship.</p>
		</div>
	</footer>
</div>
