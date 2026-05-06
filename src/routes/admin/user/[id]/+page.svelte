<script lang="ts">
	import { siteName } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import AdminQuestionResponses from '$lib/components/AdminQuestionResponses.svelte';
	import type { UserFile } from '$lib/server/db/schema';
	import { createUploader } from '$lib/uploadthing';
	import { UploadDropzone } from '@uploadthing/svelte';

	let { data } = $props();

	let trust = $derived(data.trusts[0] ?? null);

	let canDeleteUser = $derived(
		data.targetUser.id !== data.currentAdminId && data.targetUser.role !== 'admin'
	);

	let showDeleteModal = $state(false);
	let deleteError = $state<string | null>(null);

	let copiedEmail = $state(false);

	type TabId = 'questionnaire' | 'files';
	let activeTab = $state<TabId>('questionnaire');

	type FileRow = {
		label: string;
		sublabel: string;
		url: string;
		deleteAction?: { action: string; fields: Record<string, string> };
	};
	let fileRows = $derived<FileRow[]>(buildFileRows(trust));
	let deletingKey = $state<string | null>(null);

	function buildFileRows(t: typeof trust): FileRow[] {
		if (!t) return [];
		const rows: FileRow[] = [];
		if (t.houseDeedUrl) {
			rows.push({ label: 'House deed', sublabel: 'Uploaded by client', url: t.houseDeedUrl });
		}
		for (const g of t.generatedFiles ?? []) {
			rows.push({
				label: g.filename,
				sublabel: `Generated · ${kindLabel(g.kind)} · ${formatDate(g.generatedAt)}`,
				url: g.url,
				deleteAction: { action: '?/deleteGeneratedFile', fields: { trustId: String(t.id), kind: g.kind } },
			});
		}
		for (const f of (t.userFiles ?? []) as UserFile[]) {
			rows.push({
				label: f.filename,
				sublabel: `Uploaded by admin· ${kindLabel(f.kind)}${f.uploadedAt ? ' · ' + formatDate(f.uploadedAt) : ''}`,
				url: f.url,
				deleteAction: { action: '?/deleteUserFile', fields: { trustId: String(t.id), fileId: f.id } },
			});
		}
		for (const url of t.fileUrls ?? []) {
			rows.push({ label: filenameFromUrl(url), sublabel: 'Other file', url });
		}
		return rows;
	}

	function kindLabel(kind: string): string {
		const map: Record<string, string> = {
			'joint-trust': 'Joint trust',
			'pour-over-will-husband': "Husband's pour-over will",
			'pour-over-will-wife': "Wife's pour-over will",
			'certification-of-trust': 'Certification of trust',
			'trust-document': 'Trust document',
			'other': 'Other',
		};
		return map[kind] ?? kind;
	}

	function filenameFromUrl(url: string): string {
		try {
			const u = new URL(url);
			const last = u.pathname.split('/').filter(Boolean).pop();
			return last ? decodeURIComponent(last) : url;
		} catch {
			return url;
		}
	}

	async function deleteFile(row: FileRow) {
		if (!row.deleteAction) return;
		const key = row.deleteAction.fields.kind ?? row.deleteAction.fields.fileId;
		deletingKey = key;
		const formData = new FormData();
		for (const [k, v] of Object.entries(row.deleteAction.fields)) formData.set(k, v);
		await fetch(row.deleteAction.action, { method: 'POST', body: formData });
		deletingKey = null;
		await invalidateAll();
	}

	// ── File upload (admin) ───────────────────────────────────────
	const FILE_KINDS = [
		{ value: 'trust-document', label: 'Trust Document' },
		{ value: 'pour-over-will-husband', label: 'Pour Over Will – Husband' },
		{ value: 'pour-over-will-wife', label: 'Pour Over Will – Wife' },
		{ value: 'other', label: 'Other' },
	] as const;

	let selectedKind = $state<string>('trust-document');
	let uploadError = $state('');
	let uploadSaved = $state(false);
	let uploadSaving = $state(false);

	const dropzoneAppearance = {
		container:
			'ut-ready:border-navy/12 ut-ready:hover:border-emerald-accent/45 ut-ready:bg-white/70 ut-ready:hover:bg-white ut-uploading:border-emerald-accent/45 ut-uploading:bg-emerald-accent/[0.04] border-2 border-dashed rounded-xl p-5 transition-all',
		label: 'text-navy text-[13px] font-medium tracking-tight',
		allowedContent: 'text-navy/42 text-[11px]',
		button: 'hidden',
		uploadIcon: 'text-emerald-accent/95 h-6 w-6',
	};

	const uploader = createUploader('userDocumentUploader', {
		config: { mode: 'auto' },
		onClientUploadComplete: async (files) => {
			if (!trust) return;
			const file = files?.[0] as any;
			// UploadThing v7+: ufsUrl is preferred; serverData carries what onUploadComplete returned
			const url = file?.ufsUrl ?? file?.serverData?.url ?? file?.url;
			const key = file?.key ?? file?.serverData?.key;
			if (!url) { uploadError = 'Upload succeeded but no URL returned.'; return; }
			uploadSaving = true;
			const formData = new FormData();
			formData.set('trustId', String(trust.id));
			formData.set('url', url);
			formData.set('filename', file?.name ?? 'document');
			formData.set('kind', selectedKind);
			if (key) formData.set('storageKey', key);
			const res = await fetch('?/saveUserFile', { method: 'POST', body: formData });
			uploadSaving = false;
			if (!res.ok) { uploadError = 'Could not save the file. Please try again.'; return; }
			uploadError = '';
			uploadSaved = true;
			setTimeout(() => { uploadSaved = false; }, 2500);
			await invalidateAll();
		},
		onUploadError: (err) => { uploadError = err.message ?? 'Upload failed.'; },
	});

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

				{#if trust}
					{@const canGenerate = trust.complete}
					<a
						href={canGenerate ? `/api/admin/trust/${trust.id}/document` : undefined}
						aria-disabled={!canGenerate}
						title={canGenerate ? 'Download the rendered joint trust .docx' : 'Available once the user completes the questionnaire.'}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-all
							{canGenerate
								? 'bg-emerald-accent/10 text-emerald-accent border-emerald-accent/30 hover:bg-emerald-accent/20 cursor-pointer'
								: 'bg-navy/[0.03] text-navy/35 border-navy/10 cursor-not-allowed pointer-events-none'}"
					>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
						Generate joint trust (.docx)
					</a>
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

		{#if trust}
			<!-- tabs -->
			<div class="flex items-center gap-1 mb-4 border-b border-navy/[0.08]" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'questionnaire'}
					onclick={() => (activeTab = 'questionnaire')}
					class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer
						{activeTab === 'questionnaire'
							? 'text-navy border-emerald-accent'
							: 'text-navy/45 border-transparent hover:text-navy/70'}"
				>
					Questionnaire
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'files'}
					onclick={() => (activeTab = 'files')}
					class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5
						{activeTab === 'files'
							? 'text-navy border-emerald-accent'
							: 'text-navy/45 border-transparent hover:text-navy/70'}"
				>
					Files
					<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-navy/[0.06] text-[10px] text-navy/55 tabular-nums">
						{fileRows.length}
					</span>
				</button>
			</div>

			{#if activeTab === 'questionnaire'}
				<AdminQuestionResponses {trust} />
		{:else if activeTab === 'files'}
			<!-- upload panel -->
			{#if trust}
				<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-5 mb-4">
					<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-4">Upload a file for this client</p>
					<div class="mb-3">
						<label for="admin-doc-kind" class="block text-[11px] text-navy/40 mb-1.5">Document type</label>
						<div class="relative inline-block w-full max-w-xs">
							<select
								id="admin-doc-kind"
								bind:value={selectedKind}
								class="w-full appearance-none rounded-lg border border-navy/10 bg-white px-3 py-2 text-[13px] text-navy pr-8
									   focus:outline-none focus:border-emerald-accent/40 focus:ring-1 focus:ring-emerald-accent/20 transition-all cursor-pointer"
							>
								{#each FILE_KINDS as kind}
									<option value={kind.value}>{kind.label}</option>
								{/each}
							</select>
							<div class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
								<svg class="w-3.5 h-3.5 text-navy/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
						</div>
					</div>

					<UploadDropzone {uploader} appearance={dropzoneAppearance}>
						<svelte:fragment slot="upload-icon">
							<svg class="w-6 h-6 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 17.25a4.5 4.5 0 01.86-8.917 5.25 5.25 0 0110.252 1.47A3.75 3.75 0 0118 17.25H8.25z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75V8.25m0 0l-2.25 2.25M12 8.25l2.25 2.25" />
							</svg>
						</svelte:fragment>
						<svelte:fragment slot="label">
							<span class="text-center">
								<span class="block text-[13px]">Drop a file here</span>
								<span class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-navy text-cream hover:bg-navy-light shadow-sm transition-all cursor-pointer">
									Browse files
								</span>
							</span>
						</svelte:fragment>
						<svelte:fragment slot="allowed-content">
							PDF, Word (.docx), or image · up to 32 MB
						</svelte:fragment>
					</UploadDropzone>

					{#if uploadSaving}
						<p class="mt-2 text-[12px] text-navy/45">Saving…</p>
					{/if}
					{#if uploadSaved}
						<div class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-accent/30 bg-emerald-accent/10 px-2.5 py-1 text-[11px] font-medium text-emerald-accent">
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							Uploaded successfully
						</div>
					{/if}
					{#if uploadError}
						<p class="mt-2 text-[12px] text-red-600">{uploadError}</p>
					{/if}
				</div>
			{/if}

			<!-- file list -->
			<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden">
				{#if fileRows.length === 0}
					<div class="p-12 text-center">
						<p class="text-navy/40 text-sm">No files yet.</p>
						<p class="text-navy/35 text-[12px] mt-1">Upload a file above, generate the trust document, or wait for the client to upload their house deed.</p>
					</div>
				{:else}
						<ul class="divide-y divide-navy/[0.06]">
							{#each fileRows as f}
								{@const deleteKey = f.deleteAction?.fields.kind ?? f.deleteAction?.fields.fileId}
								<li class="flex items-center justify-between gap-4 px-5 py-3.5">
									<div class="min-w-0">
										<div class="text-[13px] text-navy font-medium truncate">{f.label}</div>
										<div class="text-[11px] text-navy/45 mt-0.5">{f.sublabel}</div>
									</div>
									<div class="flex items-center gap-2 shrink-0">
										<a
											href={f.url}
											download
											target="_blank"
											rel="noopener"
											class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border bg-emerald-accent/10 text-emerald-accent border-emerald-accent/30 hover:bg-emerald-accent/20 transition-all cursor-pointer"
										>
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
											Download
										</a>
										{#if f.deleteAction}
											<button
												type="button"
												onclick={() => deleteFile(f)}
												disabled={deletingKey === deleteKey}
												class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-rose-200/60 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-all cursor-pointer disabled:opacity-40"
												title="Delete file"
											>
												{#if deletingKey === deleteKey}
													<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
												{:else}
													<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
												{/if}
											</button>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
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
