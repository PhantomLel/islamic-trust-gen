<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolveSeo, jsonLdScript, type PageSeo } from '$lib/seo';
	import { env } from '$env/dynamic/public';
	import { captureFirstTouchUtm } from '$lib/utm';
	import '../app.css';

	let { children, data } = $props();
	const origin = browser ? window.location.origin : (env.PUBLIC_ORIGIN ?? '');
	const isLocalOrigin = origin.toLowerCase().includes('localhost');

	const seo = $derived(
		resolveSeo({
			routeId: page.route.id,
			url: page.url,
			pageSeo: (page.data as { seo?: PageSeo }).seo ?? null,
			localPrefix: isLocalOrigin,
		})
	);
	const onMep = $derived(
		seo?.site === 'mcdaniel' ||
			(page.route.id?.startsWith('/mcdaniel') ?? false) ||
			page.url.pathname === '/mcdaniel' ||
			page.url.pathname.startsWith('/mcdaniel/')
	);

	if (browser) captureFirstTouchUtm();

	afterNavigate(({ from, to, type }) => {
		if (!browser || type === 'popstate') return;
		if (from && to && from.url.pathname === to.url.pathname) return;
		if (to?.url.hash) return;
		const html = document.documentElement;
		const prev = html.style.scrollBehavior;
		html.style.scrollBehavior = 'auto';
		window.scrollTo(0, 0);
		requestAnimationFrame(() => {
			html.style.scrollBehavior = prev;
		});
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href={onMep ? '/favicon-mep.png' : '/favicon-mlp.png'} />
	{#if seo}
		<title>{seo.title}</title>
		{#if seo.description}
			<meta name="description" content={seo.description} />
		{/if}
		<link rel="canonical" href={seo.canonical} />
		{#if seo.robots}
			<meta name="robots" content={seo.robots} />
		{/if}
		{#if seo.description}
			<meta property="og:title" content={seo.title} />
			<meta property="og:description" content={seo.description} />
			<meta property="og:type" content={seo.type} />
			<meta property="og:url" content={seo.canonical} />
			<meta property="og:site_name" content={seo.siteLabel} />
			<meta property="og:image" content={(seo.image.startsWith('http') ? seo.image : seo.origin + seo.image)} />
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={seo.title} />
			<meta name="twitter:description" content={seo.description} />
			<meta name="twitter:image" content={(seo.image.startsWith('http') ? seo.image : seo.origin + seo.image)} />
			{#if seo.type === 'article' && seo.publishedTime}
				<meta property="article:published_time" content={seo.publishedTime} />
			{/if}
			{#if seo.type === 'article' && seo.modifiedTime}
				<meta property="article:modified_time" content={seo.modifiedTime} />
			{/if}
		{/if}
		{#each seo.jsonLd as block}
			{@html jsonLdScript(block)}
		{/each}
	{/if}
</svelte:head>

{@render children()}
