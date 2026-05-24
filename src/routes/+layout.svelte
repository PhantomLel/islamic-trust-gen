<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
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
	<link rel="icon" href={favicon} />
	<title>{ (isLocalOrigin ? 'LOCAL - ' : '') + siteName }</title>
</svelte:head>

{@render children()}
