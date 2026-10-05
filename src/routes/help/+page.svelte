<script lang="ts">
	import HelpLauncher from '$lib/components/help/HelpLauncher.svelte';
	import { siteName, productNameShort } from '$lib/config';

	let { data } = $props();
</script>

<svelte:head>
	<title>Help — {siteName}</title>
</svelte:head>

<main class="mx-auto max-w-lg px-4 py-16 text-center">
	<h1 class="font-serif text-3xl text-navy">{siteName} Help Assistant</h1>
	<p class="mt-3 text-navy/80">
		Use the help button to ask a question about using {productNameShort}, your trust, funding, or Islamic
		inheritance concepts in the app.
	</p>
</main>

<HelpLauncher surface="help_center" stepKey={null} trustId={null} blockedStepKeys={data.helpBlockedSteps} />
