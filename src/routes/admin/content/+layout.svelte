<script lang="ts">
	let { data, children } = $props();
</script>

<svelte:head>
	<title>Content — Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-dvh bg-cream text-navy font-sans">
	<header class="border-b border-navy/10 bg-white">
		<div class="max-w-6xl mx-auto px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
			<a href="/admin/content" class="font-semibold tracking-tight">Content</a>
			<nav class="flex flex-wrap gap-x-5 gap-y-1 text-navy/65" aria-label="Content admin">
				<a href="/admin/content" class="hover:text-navy">Answers</a>
				<a href="/admin/content/videos" class="hover:text-navy">Videos</a>
				<a href="/admin/content/categories" class="hover:text-navy">Categories</a>
				{#if data.staff.canManageTaxonomy}<a href="/admin/content/redirects" class="hover:text-navy">Redirects</a>{/if}
				<a href="/admin/content/media" class="hover:text-navy">Images</a>
				{#if data.staff.canManageTeam}<a href="/admin/content/team" class="hover:text-navy">Team</a>{/if}
				<a href="/admin/content/security" class="hover:text-navy">Security</a>
			</nav>
			<span class="ml-auto text-xs text-navy/45">{data.staff.name} · {data.staff.role}</span>
		</div>
	</header>
	<div class="max-w-6xl mx-auto px-5 py-8">
		{@render children()}
	</div>
</div>
