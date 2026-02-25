<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { siteName } from '$lib/config';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{siteName}</title>
</svelte:head>

{@render children()}
