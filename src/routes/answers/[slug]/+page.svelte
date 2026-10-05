<script lang="ts">
	import ContentPage from '$lib/components/content/ContentPage.svelte';
	import SiteShell from '$lib/components/content/SiteShell.svelte';

	let { data } = $props();
</script>

<SiteShell>
	<ContentPage view={data.view} />
</SiteShell>
