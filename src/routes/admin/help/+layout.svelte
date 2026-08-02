<script lang="ts">
	import { page } from '$app/stores';
	import { siteName } from '$lib/config';
	import { authClient } from '$lib/auth-client';

	let { children } = $props();

	const tabs = [
		{ href: '/admin/help', label: 'Overview', match: (p: string) => p === '/admin/help' },
		{
			href: '/admin/help/conversations',
			label: 'Conversations',
			match: (p: string) => p.startsWith('/admin/help/conversations'),
		},
		{
			href: '/admin/help/escalations',
			label: 'Escalations',
			match: (p: string) => p.startsWith('/admin/help/escalations'),
		},
		{
			href: '/admin/help/unanswered',
			label: 'Unanswered',
			match: (p: string) => p.startsWith('/admin/help/unanswered'),
		},
		{ href: '/admin/help/macros', label: 'Macros', match: (p: string) => p.startsWith('/admin/help/macros') },
		{ href: '/admin/help/test', label: 'Test', match: (p: string) => p.startsWith('/admin/help/test') },
		{ href: '/admin/help/settings', label: 'Settings', match: (p: string) => p.startsWith('/admin/help/settings') },
	];

	const activeTab = $derived(tabs.find((t) => t.match($page.url.pathname))?.href ?? '');

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}
</script>

<div class="min-h-screen w-screen bg-cream font-sans">
	<nav class="flex items-center justify-between px-6 md:px-8 py-5 border-b border-navy/[0.06] max-w-7xl mx-auto">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<div class="flex items-center gap-5">
			<a href="/admin" class="text-sm text-navy/50 transition-colors hover:text-navy">← Admin</a>
			<span class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium">Help Assistant</span>
			<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
		</div>
	</nav>

	<div class="max-w-7xl mx-auto px-6 md:px-8 py-10">
		<div class="mb-8 flex flex-wrap items-center gap-1 rounded-xl border border-navy/[0.06] bg-navy/[0.04] p-1 w-fit">
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer
						{activeTab === tab.href ? 'bg-white text-navy shadow-sm' : 'text-navy/45 hover:text-navy/70'}"
				>
					{tab.label}
				</a>
			{/each}
		</div>

		{@render children?.()}
	</div>
</div>
