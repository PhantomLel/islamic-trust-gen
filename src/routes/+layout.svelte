<script lang="ts">
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import { siteName } from '$lib/config';
	import { env } from '$env/dynamic/public';
	import '../app.css';

	let { children } = $props();
	const origin = browser ? window.location.origin : (env.PUBLIC_ORIGIN ?? '');
	const isLocalOrigin = origin.toLowerCase().includes('localhost');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{ (isLocalOrigin ? 'LOCAL - ' : '') + siteName }</title>
</svelte:head>

{@render children()}
