<script lang="ts">
	import { page } from '$app/state';
	import { siteName } from '$lib/config';

	const heading = $derived(
		page.status === 403
			? 'You do not have access to this page'
			: page.status === 404
				? 'Page not found'
				: 'This page is unavailable'
	);

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/plans', label: 'Plans' },
		{ href: '/free-islamic-will', label: 'Free Islamic Will' },
		{ href: '/inheritance-calculator', label: 'Inheritance Calculator' },
	];
</script>

<svelte:head>
	<title>{page.status} — {siteName}</title>
</svelte:head>

<div class="min-h-dvh bg-cream text-navy flex flex-col">
	<header class="border-b border-navy/10">
		<div class="max-w-3xl mx-auto px-6 h-16 flex items-center">
			<a href="/" class="min-h-11 inline-flex items-center font-semibold tracking-tight" style="font-family: 'Playfair Display', Georgia, serif;">
				{siteName}
			</a>
		</div>
	</header>
	<main class="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
		<p class="text-[12px] tracking-[0.22em] uppercase text-navy/65">{page.status}</p>
		<h1 class="text-4xl mt-3 tracking-tight text-navy">{heading}</h1>
		<nav class="mt-8 flex flex-col" aria-label="Continue">
			{#each links as link}
				<a class="min-h-11 inline-flex items-center text-emerald-accent underline underline-offset-4" href={link.href}>{link.label}</a>
			{/each}
		</nav>
	</main>
</div>
