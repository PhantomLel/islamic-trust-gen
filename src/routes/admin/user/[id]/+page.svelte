<script lang="ts">
	import { siteName } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import AdminQuestionResponses from '$lib/components/AdminQuestionResponses.svelte';

	let { data } = $props();

	let trust = $derived(data.trusts[0] ?? null);

	let canDeleteUser = $derived(
		data.targetUser.id !== data.currentAdminId && data.targetUser.role !== 'admin'
	);

	let showDeleteModal = $state(false);
	let deleteError = $state<string | null>(null);

	let copiedEmail = $state(false);

	async function copyEmail() {
		await navigator.clipboard.writeText(data.targetUser.email);
		copiedEmail = true;
		setTimeout(() => { copiedEmail = false; }, 1500);
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	async function toggleEligibility(trustId: number, current: boolean | null) {
		const newValue = current === false ? true : false;
		const formData = new FormData();
		formData.set('trustId', String(trustId));
		formData.set('isEligible', String(newValue));
		await fetch('?/toggleEligibility', { method: 'POST', body: formData });
		await invalidateAll();
	}

	async function toggleConsultation() {
		const formData = new FormData();
		formData.set('userId', data.targetUser.id);
		formData.set('requested', String(!data.targetUser.requestedConsultation));
		await fetch('?/toggleConsultation', { method: 'POST', body: formData });
		await invalidateAll();
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}

	function openDeleteModal() {
		deleteError = null;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
	}
</script>

<div class="min-h-screen w-screen bg-cream font-sans relative">
	<div class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(74,124,111,0.05) 0%, transparent 70%);">
	</div>

	<!-- top bar -->
	<nav class="relative z-10 flex items-center justify-between px-6 md:px-8 py-5 border-b border-navy/[0.06] max-w-6xl mx-auto">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<div class="flex items-center gap-5">
			<span class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium">Admin</span>
			<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
		</div>
	</nav>

	<div class="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-10">
		<!-- breadcrumb -->
		<div class="mb-8">
			<a href="/admin" class="text-[12px] text-navy/35 hover:text-navy/60 transition-colors flex items-center gap-1.5">
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
				Back to all trusts
			</a>
		</div>

		<!-- user header -->
		<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6 md:p-8 mb-6">
			<div class="flex flex-col md:flex-row md:items-start justify-between gap-5">
				<div>
					<h1 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight mb-1">{data.targetUser.name}</h1>
					<div class="flex items-center gap-2 flex-wrap">
						<span class="text-navy/45 text-sm">{data.targetUser.email}</span>
						<button onclick={copyEmail}
							class="text-navy/25 hover:text-navy/60 transition-colors cursor-pointer" title="Copy email">
							{#if copiedEmail}
								<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							{:else}
								<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
							{/if}
						</button>
					</div>
					<div class="flex items-center gap-3 mt-2 text-[11px] text-navy/35 flex-wrap">
						<span>Joined {formatDate(data.targetUser.createdAt)}</span>
						<span class="text-navy/15">&middot;</span>
						<span>Role: {data.targetUser.role ?? 'client'}</span>
						<span class="text-navy/15">&middot;</span>
						<span>User ID: {data.targetUser.id}</span>
						{#if trust}
							<span class="text-navy/15">&middot;</span>
							<span>{trust.joint === null ? 'Type not selected' : trust.joint ? 'Joint trust' : 'Individual trust'}</span>
							<span class="text-navy/15">&middot;</span>
							<span>{trust.awaitingPayment ? 'Awaiting payment' : trust.complete ? 'Complete' : 'In progress'}</span>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-2 flex-wrap shrink-0">
					{#if trust}
						<button onclick={() => toggleEligibility(trust.id, trust.isEligible)}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
								   bg-navy/[0.03] text-navy/50 border-navy/10 hover:bg-navy/[0.06]">
							{#if trust.isEligible === false}
								<span class="w-1.5 h-1.5 rounded-full bg-rose-300"></span>
								Ineligible
							{:else if trust.isEligible === true}
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60"></span>
								Eligible
							{:else}
								<span class="w-1.5 h-1.5 rounded-full bg-navy/20"></span>
								Not screened
							{/if}
						</button>
					{/if}

					{#if data.targetUser.requestedConsultation}
						<button onclick={toggleConsultation}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
								bg-navy/[0.03] border-navy/10 hover:bg-navy/[0.06]
								{data.targetUser.requestedConsultation ? 'text-navy/50' : 'text-navy/35'}">
							<span class="w-1.5 h-1.5 rounded-full {data.targetUser.requestedConsultation ? 'bg-amber-300' : 'bg-navy/20'}"></span>
							Consultation requested
						</button>
					{/if}
					{#if trust?.awaitingPayment}
						<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border bg-navy/[0.03] border-navy/10 text-navy/50">
							<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
							Awaiting Payment
						</span>
					{/if}

					{#if canDeleteUser}
						<button
							type="button"
							onclick={openDeleteModal}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
								border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
						>
							Delete user
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- questionnaire answers -->
		{#if trust}
			<AdminQuestionResponses {trust} />
		{:else}
			<div class="rounded-2xl bg-white/60 border border-navy/[0.06] p-12 text-center">
				<p class="text-navy/40 text-sm">No trust created yet.</p>
			</div>
		{/if}
	</div>

	{#if showDeleteModal}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/25 backdrop-blur-sm"
			onclick={closeDeleteModal}
			role="presentation"
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative max-w-md w-full bg-white rounded-2xl shadow-2xl shadow-navy/15 p-7 outline-none border border-navy/[0.06]"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="delete-user-title"
				tabindex="-1"
			>
				<h3 id="delete-user-title" class="text-lg font-semibold text-navy mb-2">
					Delete this user?
				</h3>
				<p class="text-[13px] text-navy/65 leading-relaxed mb-1">
					This will permanently remove <span class="font-medium text-navy">{data.targetUser.name}</span>
					(<span class="font-mono text-[12px]">{data.targetUser.email}</span>) and all associated data
					including trusts and invoices. This cannot be undone.
				</p>
				{#if deleteError}
					<p class="mt-3 text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
						{deleteError}
					</p>
				{/if}
				<form
					method="POST"
					action="?/deleteUser"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'redirect') {
								closeDeleteModal();
								await goto(result.location);
							} else if (result.type === 'failure') {
								const d = result.data as { message?: string } | undefined;
								deleteError = d?.message ?? 'Could not delete user.';
							}
						};
					}}
					class="mt-6 flex flex-col-reverse sm:flex-row gap-3"
				>
					<input type="hidden" name="userId" value={data.targetUser.id} />
					<button
						type="button"
						onclick={closeDeleteModal}
						class="flex-1 py-2.5 rounded-xl text-sm font-medium text-navy bg-navy/6 hover:bg-navy/10 transition-colors cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
					>
						Delete permanently
					</button>
				</form>
			</div>
		</div>
	{/if}
</div>
