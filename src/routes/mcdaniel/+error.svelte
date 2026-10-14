<script lang="ts">
	import { page } from '$app/state';
	import { mepHref } from '$lib/mep/href';

	const heading = $derived(
		page.status === 403
			? 'You do not have access to this page'
			: page.status === 404
				? 'Page not found'
				: 'This page is unavailable'
	);

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/attorney', label: 'Attorney' },
		{ href: '/legacy-plan', label: 'Legacy Plan' },
		{ href: '/family-waqf-plan', label: 'Family Waqf Plan' },
		{ href: '/probate-estate-administration', label: 'Probate & Estate Administration' },
		{ href: '/business-succession-planning', label: 'Business Succession Planning' },
	];
</script>

<svelte:head>
	<title>{page.status} — McDaniel Estate Planning</title>
</svelte:head>

<main class="px-6 lg:px-10 pt-36 pb-24 max-w-3xl mx-auto">
	<p class="text-[12px] tracking-[0.22em] uppercase text-[#1F2D3D]/65">{page.status}</p>
	<h1 class="mep-serif text-4xl mt-3 text-[#1F2D3D]">{heading}</h1>
	<nav class="mt-8 flex flex-col" aria-label="Continue">
		{#each links as link}
			<a
				class="min-h-11 inline-flex items-center text-[#1F2D3D] border-b border-[#1F2D3D]/15"
				href={mepHref(page.url.pathname, link.href)}
			>{link.label}</a>
		{/each}
	</nav>
</main>
