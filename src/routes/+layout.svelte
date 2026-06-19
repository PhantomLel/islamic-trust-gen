<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { siteName } from '$lib/config';
	import { env } from '$env/dynamic/public';
	import '../app.css';

	let { children } = $props();
	const origin = browser ? window.location.origin : (env.PUBLIC_ORIGIN ?? '');
	const isLocalOrigin = origin.toLowerCase().includes('localhost');

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
	<link rel="icon" type="image/png" href="/mcdaniel.png" />
	{#if !page.url.pathname.startsWith('/mcdaniel')}
		<title>{ (isLocalOrigin ? 'LOCAL - ' : '') + siteName + ' — Islamic Estate Planning' }</title>
		<meta name="description" content="Attorney-led Islamic estate planning for Muslim families. Wills, trusts, prenuptials, and business succession grounded in Qur'anic principles and U.S. law." />
	{/if}
</svelte:head>

{@render children()}
