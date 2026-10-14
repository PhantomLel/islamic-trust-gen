<script lang="ts">
	import { siteName } from '$lib/config';

	let {
		title,
		subtitle,
		children,
	}: {
		title: string;
		subtitle: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class="min-h-dvh w-full bg-cream font-sans flex flex-col relative">
	<div
		class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 80% 55% at 50% 20%, rgba(74,124,111,0.06) 0%, transparent 70%);"
	></div>

	<nav class="relative z-10 shrink-0 flex items-center justify-between px-5 md:px-8 py-4 border-b border-navy/[0.06]">
		<a href="/" class="min-h-11 flex items-center gap-3 transition-opacity hover:opacity-75">
			<img src="/mcdaniel.png" alt="" aria-hidden="true" width="500" height="337" class="h-7 w-auto" />
			<span class="text-navy font-semibold text-sm tracking-tight" style="font-family: 'Playfair Display', Georgia, serif;">
				{siteName}
			</span>
		</a>
		<a href="/free-islamic-will" class="text-sm text-navy/65 hover:text-navy transition-colors">Free Islamic Will</a>
	</nav>

	<main class="relative z-10 flex-1 px-6 py-10 md:py-14">
		<div class="max-w-2xl mx-auto">
			<div class="mb-10">
				<span class="text-[11px] text-emerald-accent tracking-[0.2em] uppercase font-medium">Educational guide</span>
				<h1 class="text-3xl md:text-4xl text-navy tracking-tight leading-tight mt-3 mb-4">{title}</h1>
				<p class="text-navy/65 text-base leading-relaxed max-w-xl">{subtitle}</p>
			</div>
			<div class="space-y-8">
				{@render children()}
			</div>
		</div>
	</main>

	<footer class="relative z-10 shrink-0 border-t border-navy/[0.06] px-6 py-4 text-center">
		<p class="text-navy/65 text-xs leading-relaxed">
			© 2026 McDaniel Estate Planning, PLLC. Licensed in Texas and California.
		</p>
		<p class="mt-1">
			<a href="/privacy" class="text-navy/65 text-xs underline underline-offset-2 hover:text-navy min-h-11 inline-flex items-center">Privacy Policy</a>
		</p>
	</footer>
</div>
