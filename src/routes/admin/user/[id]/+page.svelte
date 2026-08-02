<script lang="ts">
	import { tick } from 'svelte';
	import { renderAsync } from 'docx-preview';
	import { siteName, screeningQuestions } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import AdminQuestionResponses from '$lib/components/AdminQuestionResponses.svelte';
	import AdminUserNotes from '$lib/components/AdminUserNotes.svelte';
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

	let showApproveModal = $state(false);
	let approveError = $state<string | null>(null);
	let approving = $state(false);

	let showFinalizeModal = $state(false);
	let finalizeError = $state<string | null>(null);
	let finalizing = $state(false);
	let showFinalizeSuccess = $state(false);

	let copiedEmail = $state(false);

	type TabId = 'questionnaire' | 'trustWork' | 'drip' | 'help' | 'files' | 'notes';
	let activeTab = $state<TabId>('questionnaire');

	type FileRow = {
		label: string;
		sublabel: string;
		url: string;
		deleteAction?: { action: string; fields: Record<string, string> };
	};
	let fileRows = $derived<FileRow[]>(buildFileRows(trust));
	let deletingKey = $state<string | null>(null);
	let showDeleteFileModal = $state(false);
	let fileToDelete = $state<FileRow | null>(null);
	let deleteFileError = $state<string | null>(null);

	let showDocxPreview = $state(false);
	let docxPreviewEl = $state<HTMLDivElement | null>(null);
	let docxPreviewTitle = $state('');
	let docxPreviewLoading = $state(false);
	let docxPreviewError = $state('');

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

	function trustStatusLabel(status: string): string {
		const map: Record<string, string> = {
			started: 'Started',
			'awaiting-payment': 'Awaiting Payment',
			'awaiting-answers': 'Awaiting Answers',
			review: 'Requires Review',
			'notarization-pending': 'Notarization Pending',
			'notarization-scheduled': 'Notarization Scheduled',
			completed: 'Completed',
		};
		return map[status] ?? status;
	}

	function trustStatusColor(status: string): string {
		const map: Record<string, string> = {
			started: 'bg-navy/10 text-navy/60',
			'awaiting-payment': 'bg-amber-50 text-amber-700',
			'awaiting-answers': 'bg-blue-50 text-blue-700',
			review: 'bg-purple-50 text-purple-700',
			'notarization-pending': 'bg-orange-50 text-orange-700',
			'notarization-scheduled': 'bg-sky-50 text-sky-700',
			completed: 'bg-emerald-50 text-emerald-700',
		};
		return map[status] ?? 'bg-navy/10 text-navy/60';
	}

	type NotarizationCard = {
		monthShort: string;
		day: string;
		weekday: string;
		fullDate: string;
		timeRange: string;
		timeZone: string;
		relative: string;
	};

	function buildNotarizationCard(startIso: string, endIso: string | null): NotarizationCard {
		const start = new Date(startIso);
		const end = endIso ? new Date(endIso) : null;
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const shortTz =
			new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
				.formatToParts(start)
				.find((p) => p.type === 'timeZoneName')?.value ?? tz;

		const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		const timeRange = end
			? `${startTime} – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
			: startTime;

		return {
			monthShort: start.toLocaleDateString('en-US', { month: 'short' }),
			day: start.toLocaleDateString('en-US', { day: 'numeric' }),
			weekday: start.toLocaleDateString('en-US', { weekday: 'long' }),
			fullDate: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
			timeRange,
			timeZone: shortTz,
			relative: relativeDayLabel(start),
		};
	}

	function relativeDayLabel(date: Date): string {
		const startOfDay = (d: Date) => {
			const x = new Date(d);
			x.setHours(0, 0, 0, 0);
			return x;
		};
		const diffDays = Math.round(
			(startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86_400_000
		);
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Tomorrow';
		if (diffDays === -1) return 'Yesterday';
		if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
		if (diffDays >= 7 && diffDays < 14) return 'Next week';
		if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
		return '';
	}

	let notarizationCard = $derived.by(() => {
		const t = trust;
		if (t?.status !== 'notarization-scheduled') return null;
		if (!t.notarizationStartTime) return { fallback: true as const };
		return { fallback: false as const, ...buildNotarizationCard(t.notarizationStartTime, t.notarizationEndTime) };
	});

	function isLikelyDocx(row: FileRow): boolean {
		if (/\.docx$/i.test(row.label.trim())) return true;
		try {
			return /\.docx$/i.test(new URL(row.url).pathname);
		} catch {
			return false;
		}
	}

	function closeDocxPreview() {
		if (docxPreviewEl) docxPreviewEl.innerHTML = '';
		showDocxPreview = false;
		docxPreviewLoading = false;
		docxPreviewError = '';
		docxPreviewTitle = '';
	}

	async function openDocxPreview(row: FileRow) {
		const t = trust;
		if (!t) return;
		docxPreviewTitle = row.label;
		docxPreviewError = '';
		docxPreviewLoading = true;
		showDocxPreview = true;
		await tick();
		const el = docxPreviewEl;
		if (!el) {
			docxPreviewLoading = false;
			docxPreviewError = 'Preview could not open.';
			return;
		}
		el.innerHTML = '';
		try {
			const res = await fetch(`/api/admin/trust/${t.id}/file?url=${encodeURIComponent(row.url)}`);
			if (!res.ok) {
				docxPreviewError =
					res.status === 413
						? 'File is too large to preview.'
						: 'Could not load this file for preview.';
				return;
			}
			const buf = await res.arrayBuffer();
			await renderAsync(buf, el, undefined, {
				inWrapper: true,
				ignoreLastRenderedPageBreak: false,
			});
		} catch {
			el.innerHTML = '';
			docxPreviewError = 'Preview failed. Try downloading the file instead.';
		} finally {
			docxPreviewLoading = false;
		}
	}

	function openDeleteFileModal(row: FileRow) {
		if (!row.deleteAction) return;
		deleteFileError = null;
		fileToDelete = row;
		showDeleteFileModal = true;
	}

	function closeDeleteFileModal() {
		showDeleteFileModal = false;
		fileToDelete = null;
		deleteFileError = null;
	}

	async function confirmDeleteFile() {
		const row = fileToDelete;
		if (!row?.deleteAction) return;
		const key = row.deleteAction.fields.kind ?? row.deleteAction.fields.fileId;
		deletingKey = key;
		deleteFileError = null;
		try {
			const formData = new FormData();
			for (const [k, v] of Object.entries(row.deleteAction.fields)) formData.set(k, v);
			const res = await fetch(row.deleteAction.action, { method: 'POST', body: formData });
			if (!res.ok) {
				deleteFileError = 'Could not delete file. Please try again.';
				return;
			}
			closeDeleteFileModal();
			await invalidateAll();
		} catch {
			deleteFileError = 'Could not delete file. Please try again.';
		} finally {
			deletingKey = null;
		}
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

	let generateLoading = $state(false);
	let generateError = $state('');

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
			// UploadThing v7+: read ufsUrl from the upload result or server callback payload
			const url = file?.ufsUrl ?? file?.serverData?.ufsUrl;
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

	async function generateJointTrustDoc() {
		if (!trust?.complete) return;
		generateError = '';
		generateLoading = true;
		try {
			const res = await fetch(`/api/admin/trust/${trust.id}/document`, { method: 'POST' });
			let body: { message?: string } = {};
			try {
				body = await res.json();
			} catch {
				/* non-JSON */
			}
			if (!res.ok) {
				generateError =
					typeof body.message === 'string' && body.message
						? body.message
						: `Generation failed (${res.status}).`;
				return;
			}
			await invalidateAll();
		} catch {
			generateError = 'Something went wrong. Please try again.';
		} finally {
			generateLoading = false;
		}
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

	function openApproveModal() {
		approveError = null;
		showApproveModal = true;
	}

	function closeApproveModal() {
		if (approving) return;
		showApproveModal = false;
	}

	async function confirmApproveDocuments() {
		if (!trust) return;
		approveError = null;
		approving = true;
		try {
			const formData = new FormData();
			formData.set('trustId', String(trust.id));
			const res = await fetch('?/approveDocuments', { method: 'POST', body: formData });
			if (!res.ok) {
				approveError = 'Could not approve documents. Please try again.';
				return;
			}
			showApproveModal = false;
			await invalidateAll();
		} catch {
			approveError = 'Something went wrong. Please try again.';
		} finally {
			approving = false;
		}
	}

	function openFinalizeModal() {
		finalizeError = null;
		showFinalizeModal = true;
	}

	function closeFinalizeModal() {
		if (finalizing) return;
		showFinalizeModal = false;
	}

	async function confirmFinalizeCase() {
		if (!trust) return;
		finalizeError = null;
		finalizing = true;
		try {
			const formData = new FormData();
			formData.set('trustId', String(trust.id));
			const res = await fetch('?/finalizeCase', { method: 'POST', body: formData });
			if (!res.ok) {
				finalizeError = 'Could not finalize the case. Please try again.';
				return;
			}
			showFinalizeModal = false;
			await invalidateAll();
			showFinalizeSuccess = true;
		} catch {
			finalizeError = 'Something went wrong. Please try again.';
		} finally {
			finalizing = false;
		}
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
						{#if trust}
							<span class="text-navy/15">&middot;</span>
							<span>{trust.joint === null ? 'Type not selected' : trust.joint ? 'Joint trust' : 'Individual trust'}</span>
							<span class="text-navy/15">&middot;</span>
							<span
								class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium {trustStatusColor(trust.status)}"
							>
								{trustStatusLabel(trust.status)}
							</span>
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

					{#if trust && trust.status === 'review' && !trust.approved}
						<button
							type="button"
							onclick={openApproveModal}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
								border-emerald-accent/30 bg-emerald-accent/10 text-emerald-accent hover:bg-emerald-accent/20"
						>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							Approve Documents
						</button>
					{/if}

					{#if trust && trust.approved && trust.status !== 'completed'}
						<button
							type="button"
							onclick={openFinalizeModal}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
								border-navy bg-navy text-cream hover:bg-navy-light"
						>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							Finalize case
						</button>
					{/if}

					{#if trust && trust.status === 'completed'}
						<span
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-emerald-accent/30 bg-emerald-accent/10 text-emerald-accent"
						>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							Case finalized
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

	{#if trust && notarizationCard}
				<div class="rounded-2xl border border-emerald-accent/20 bg-white/70 backdrop-blur-sm p-6 md:p-7 shadow-sm mb-6">
					{#if notarizationCard.fallback}
						<div class="min-w-0 flex-1 flex flex-col">
							<div class="flex flex-wrap items-center gap-2 mb-2">
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-emerald-accent/12 text-emerald-accent border border-emerald-accent/30">
									<svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
									Notarization scheduled
								</span>
							</div>
							<p class="text-[17px] md:text-[18px] font-semibold text-navy tracking-tight leading-snug">
								Appointment booked — awaiting Calendly time details.
							</p>
							<p class="text-[13px] text-navy/55 mt-2 leading-relaxed">
								The booking was recorded, but the meeting time was not returned. Check Calendly or the client's confirmation email.
							</p>
							{#if trust.notarizationBookedAt}
								<p class="text-[11px] text-navy/35 mt-2 tabular-nums">
									Booking confirmed {formatDate(trust.notarizationBookedAt)}
								</p>
							{/if}
						</div>
					{:else}
					<div class="flex flex-col sm:flex-row sm:items-stretch gap-5">
						<div class="shrink-0 w-20 sm:w-24 rounded-xl border border-emerald-accent/30 bg-white overflow-hidden text-center shadow-sm">
							<div class="bg-emerald-accent text-white text-[10px] tracking-[0.18em] uppercase font-semibold py-1.5">
								{notarizationCard.monthShort}
							</div>
							<div class="py-2.5">
								<div class="text-[32px] leading-none font-semibold text-navy tabular-nums">{notarizationCard.day}</div>
								<div class="text-[10px] text-navy/45 mt-1.5 tracking-wider uppercase">{notarizationCard.weekday.slice(0, 3)}</div>
							</div>
						</div>

						<div class="min-w-0 flex-1 flex flex-col">
							<div class="flex flex-wrap items-center gap-2 mb-2">
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-emerald-accent/12 text-emerald-accent border border-emerald-accent/30">
									<svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
									Notarization scheduled
								</span>
								{#if notarizationCard.relative}
									<span class="text-[11px] text-navy/45">{notarizationCard.relative}</span>
								{/if}
							</div>
							<p class="text-[17px] md:text-[18px] font-semibold text-navy tracking-tight leading-snug">
								{notarizationCard.weekday}, {notarizationCard.fullDate}
							</p>
							<p class="text-[13px] text-navy/55 mt-1">
								<span class="font-medium text-navy/75">{notarizationCard.timeRange}</span>
								<span class="text-navy/40"> · {notarizationCard.timeZone}</span>
							</p>
							<p class="text-[12px] text-navy/45 leading-relaxed mt-3">
								Calendly emails the client a confirmation with the meeting link and a reminder before the appointment.
							</p>
							{#if trust.notarizationBookedAt}
								<p class="text-[11px] text-navy/35 mt-2 tabular-nums">
									Booking confirmed {formatDate(trust.notarizationBookedAt)}
								</p>
							{/if}
						</div>
					</div>
					{/if}
				</div>
	{/if}

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
					aria-selected={activeTab === 'trustWork'}
					onclick={() => (activeTab = 'trustWork')}
					class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer
						{activeTab === 'trustWork'
							? 'text-navy border-emerald-accent'
							: 'text-navy/45 border-transparent hover:text-navy/70'}"
				>
					Make Your Trust Work
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'drip'}
					onclick={() => (activeTab = 'drip')}
					class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer
						{activeTab === 'drip'
							? 'text-navy border-emerald-accent'
							: 'text-navy/45 border-transparent hover:text-navy/70'}"
				>
					Marketing Drip
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'help'}
					onclick={() => (activeTab = 'help')}
					class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5
						{activeTab === 'help'
							? 'text-navy border-emerald-accent'
							: 'text-navy/45 border-transparent hover:text-navy/70'}"
				>
					Help Conversations
					{#if data.helpConversations.length > 0}
						<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-navy/[0.06] text-[10px] text-navy/55 tabular-nums">
							{data.helpConversations.length}
						</span>
					{/if}
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
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'notes'}
					onclick={() => (activeTab = 'notes')}
					class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5
						{activeTab === 'notes'
							? 'text-navy border-emerald-accent'
							: 'text-navy/45 border-transparent hover:text-navy/70'}"
				>
					Notes
					{#if data.notes.length > 0}
						<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-accent/15 text-[10px] text-emerald-accent tabular-nums">
							{data.notes.length}
						</span>
					{/if}
				</button>
			</div>

	{#if activeTab === 'questionnaire'}
		{#if trust}
				{#if trust && (trust.screeningAnswers || trust.isEligible !== null)}
					<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6 md:p-7 mb-6">
						<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-4">Eligibility screening</p>
						{#if data.targetUser.county}
							<p class="text-[13px] text-navy/70 mb-4">
								<span class="text-navy/45">Texas county (profile):</span>
								<span class="font-medium text-navy/85">{data.targetUser.county}</span>
							</p>
						{/if}
				{#if trust.screeningAnswers}
						<ul class="space-y-3">
							{#each screeningQuestions as q}
								{@const ans = trust.screeningAnswers?.[q.id]}
								<li class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 text-[13px] border-b border-navy/[0.06] last:border-0 pb-3 last:pb-0">
									<span class="text-navy/70 leading-relaxed">{q.text}</span>
									<span
										class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tabular-nums
											{ans === true ? 'bg-amber-50 text-amber-800 border border-amber-200/80' : ans === false ? 'bg-emerald-accent/8 text-navy/75 border border-emerald-accent/25' : 'bg-navy/[0.06] text-navy/45 border border-navy/10'}"
									>
										{ans === true ? 'Yes' : ans === false ? 'No' : '—'}
									</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-[13px] text-navy/50 leading-relaxed">
							Screening answers were not stored for this trust (submitted before this feature was added).
						</p>
					{/if}
				</div>
			{/if}

			<!-- LOE Agreement record -->
			{#if trust}
				<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6 md:p-7 mb-6">
					<div class="flex items-center justify-between mb-4">
						<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium">LOE Agreement</p>
						{#if trust.loeAcceptedAt}
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-accent/10 text-emerald-accent border border-emerald-accent/25">
								<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
								Accepted
							</span>
						{:else}
							<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-navy/[0.05] text-navy/50 border border-navy/10">
								Not yet accepted
							</span>
						{/if}
					</div>

					{#if trust.loeAcceptedAt}
						{@const loe = trust.loeAgreementData}
						<div class="space-y-2 text-[13px]">
							<div class="flex justify-between gap-4 py-1.5 border-b border-navy/[0.05]">
								<span class="text-navy/45">Accepted at (server time)</span>
								<span class="font-medium text-navy/80 tabular-nums">{new Date(trust.loeAcceptedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}</span>
							</div>
							{#if loe}
								<div class="flex justify-between gap-4 py-1.5 border-b border-navy/[0.05]">
									<span class="text-navy/45">Agreement version</span>
									<span class="font-medium text-navy/80">{loe.version}</span>
								</div>
								<div class="flex justify-between gap-4 py-1.5 border-b border-navy/[0.05]">
									<span class="text-navy/45">Client timestamp</span>
									<span class="font-medium text-navy/80 tabular-nums">{new Date(loe.clientTimestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}</span>
								</div>
								<div class="flex justify-between gap-4 py-1.5 border-b border-navy/[0.05]">
									<span class="text-navy/45">Date entered by user</span>
									<span class="font-medium text-navy/80">{loe.userEnteredDate}</span>
								</div>
								{#if loe.checkboxes}
									<div class="pt-2">
										<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-2">Checkbox confirmations</p>
										<ul class="space-y-1.5">
								{#each [
											{ cbKey: 'limitedScope', cbLabel: 'Limited-scope engagement acknowledged' },
											{ cbKey: 'situationFits', cbLabel: 'Situation fits the online plan' },
											{ cbKey: 'islamicPrinciples', cbLabel: 'Islamic inheritance principles acknowledged' },
											{ cbKey: 'noTaxPlanning', cbLabel: 'No tax planning / out-of-scope services acknowledged' },
											{ cbKey: 'noHeirRepresentation', cbLabel: 'No heir representation acknowledged' },
											{ cbKey: 'keepOriginalsSafe', cbLabel: 'Will keep signed originals safe' },
											{ cbKey: 'homesteadGuidanceOnly', cbLabel: 'Homestead guidance only (no filing)' },
										] as { cbKey, cbLabel }}
											{@const checked = loe.checkboxes[cbKey as keyof typeof loe.checkboxes]}
											<li class="flex items-center gap-2 text-[12px]">
												{#if checked}
													<svg class="w-3.5 h-3.5 text-emerald-accent shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
													<span class="text-navy/70">{cbLabel}</span>
												{:else}
													<svg class="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
													<span class="text-red-600/80">{cbLabel}</span>
												{/if}
											</li>
										{/each}
										</ul>
									</div>
								{/if}
							{/if}
						</div>
					{:else}
						<p class="text-[13px] text-navy/45 leading-relaxed">
							The user has not yet accepted the Limited-Scope App Engagement agreement.
						</p>
					{/if}
				</div>
			{/if}

			<!-- Planning Warning agreement record -->
			{#if trust}
				<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6 md:p-7 mb-6">
					<div class="flex items-center justify-between mb-4">
						<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium">Planning Warning Agreement</p>
						{#if trust.warningAcceptedAt}
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-accent/10 text-emerald-accent border border-emerald-accent/25">
								<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
								Accepted
							</span>
						{:else}
							<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-navy/[0.05] text-navy/50 border border-navy/10">
								Not yet accepted
							</span>
						{/if}
					</div>

					{#if trust.warningAcceptedAt}
						{@const wa = trust.warningAgreementData}
						<div class="space-y-2 text-[13px]">
							<div class="flex justify-between gap-4 py-1.5 border-b border-navy/[0.05]">
								<span class="text-navy/45">Accepted at (server time)</span>
								<span class="font-medium text-navy/80 tabular-nums">{new Date(trust.warningAcceptedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}</span>
							</div>
							{#if wa}
								<div class="flex justify-between gap-4 py-1.5 border-b border-navy/[0.05]">
									<span class="text-navy/45">Agreement version</span>
									<span class="font-medium text-navy/80">{wa.version}</span>
								</div>
								<div class="flex justify-between gap-4 py-1.5 border-b border-navy/[0.05]">
									<span class="text-navy/45">Client timestamp</span>
									<span class="font-medium text-navy/80 tabular-nums">{new Date(wa.clientTimestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}</span>
								</div>
								<div class="flex justify-between gap-4 py-1.5 border-b border-navy/[0.05]">
									<span class="text-navy/45">Date entered by user</span>
									<span class="font-medium text-navy/80">{wa.userEnteredDate}</span>
								</div>
								{#if wa.checkboxes}
									<div class="pt-2">
										<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-2">Checkbox confirmations</p>
										<ul class="space-y-1.5">
											{#each [
												{ cbKey: 'basicPlanningOnly', cbLabel: 'Basic planning only acknowledged' },
												{ cbKey: 'largeComplexEstateRisk', cbLabel: 'Large/complex estate risk acknowledged' },
												{ cbKey: 'noAdvancedOptimization', cbLabel: 'No advanced optimization acknowledged' },
												{ cbKey: 'heirDisagreementRisk', cbLabel: 'Heir disagreement risk acknowledged' },
												{ cbKey: 'choseAppOverConsultation', cbLabel: 'Chose app over consultation' },
											] as { cbKey, cbLabel }}
												{@const checked = wa.checkboxes[cbKey as keyof typeof wa.checkboxes]}
												<li class="flex items-center gap-2 text-[12px]">
													{#if checked}
														<svg class="w-3.5 h-3.5 text-emerald-accent shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
														<span class="text-navy/70">{cbLabel}</span>
													{:else}
														<svg class="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
														<span class="text-red-600/80">{cbLabel}</span>
													{/if}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							{/if}
						</div>
					{:else}
						<p class="text-[13px] text-navy/45 leading-relaxed">
							The user has not yet accepted the Planning Warning agreement (shown before payment).
						</p>
					{/if}
				</div>
			{/if}

			<AdminQuestionResponses {trust} />
		{:else}
			<div class="rounded-2xl bg-white/60 border border-navy/[0.06] p-12 text-center mb-6">
				<p class="text-navy/40 text-sm">No trust created yet.</p>
			</div>
		{/if}
	{:else if activeTab === 'trustWork'}
	<!-- ── Make Your Trust Work ───────────────────────────────────────── -->
	{#each data.fundingByTrust as fb}
		{#if fb.dashboard}
			{@const fd = fb.dashboard}
			<div class="rounded-2xl border border-navy/[0.08] bg-white/60 p-6 mb-6">
				<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
					<div>
						<span class="text-[10px] tracking-[0.22em] uppercase font-semibold text-emerald-accent">Make Your Trust Work</span>
						<p class="text-[13px] text-navy/50 mt-1">Trust #{fb.trustId}</p>
					</div>
					<a
						href="/make-your-trust-work/{fb.trustId}"
						class="text-[12px] px-3 py-1.5 rounded-lg border border-navy/10 text-navy/70 hover:border-emerald-accent/30 transition-colors"
						>Open user view</a
					>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
					<div>
						<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Progress</p>
						<p class="text-[13px] text-navy/80 font-medium tabular-nums">{fd.progress.journey.pct}%</p>
					</div>
					<div>
						<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Prepare</p>
						<p class="text-[13px] text-navy/80 font-medium tabular-nums">{fd.progress.prepare.done}/{fd.progress.prepare.total}</p>
					</div>
					<div>
						<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Complete</p>
						<p class="text-[13px] text-navy/80 font-medium tabular-nums">
							{#if fd.progress.completePhaseLocked}
								Locked
							{:else}
								{fd.progress.complete.done}/{fd.progress.complete.total}
							{/if}
						</p>
					</div>
					<div>
						<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5 flex items-center gap-1">
							Pour-over will
							<span
								class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-navy/20 text-[9px] font-semibold text-navy/40 cursor-help"
								title="Controls whether Make Your Trust Work shows pour-over will signing steps and sends the day-21 will reminder. Does not change or remove the generated will documents. Normally detected from the document package; toggling it here overrides that detection permanently."
								aria-label="Controls whether Make Your Trust Work shows pour-over will signing steps and sends the day-21 will reminder. Does not change or remove the generated will documents. Normally detected from the document package; toggling it here overrides that detection permanently."
							>i</span>
						</p>
						<form method="POST" action="?/togglePourOverIncluded" use:enhance class="inline">
							<input type="hidden" name="trustId" value={fb.trustId} />
							<input type="hidden" name="included" value={fd.pourOverWillIncluded ? 'false' : 'true'} />
							<button type="submit" class="text-[13px] text-emerald-accent font-medium cursor-pointer hover:underline">
								{fd.pourOverWillIncluded ? 'Included' : 'Not included'} (toggle)
							</button>
						</form>
						<p class="text-[10px] text-navy/35 leading-snug mt-1 max-w-[11rem]">
							{fd.pourOverWillManual
								? 'Set manually — no longer auto-detected from the document package.'
								: 'Auto-detected from the document package.'}
						</p>
					</div>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
					<div>
						<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Homeowner</p>
						<p class="text-[13px] text-navy/80 font-medium">
							{fd.isHomeowner === null ? 'Not answered' : fd.isHomeowner ? 'Yes' : 'No'}
						</p>
						<p class="text-[10px] text-navy/35 leading-snug mt-1 max-w-[11rem]">
							Controls the deed, homeowners insurance, and homestead cards.
						</p>
					</div>
					<div class="sm:col-span-3">
						<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Retirement beneficiary</p>
						<p
							class="text-[13px] font-medium {fd.retirementBeneficiary === 'other' ||
							fd.retirementBeneficiary === 'not_sure'
								? 'text-red-600'
								: 'text-navy/80'}"
						>
							{fd.retirementBeneficiary === 'spouse_sole'
								? 'Spouse is sole primary beneficiary'
								: fd.retirementBeneficiary === 'other'
									? 'Nonspouse, trust, or charity named'
									: fd.retirementBeneficiary === 'not_sure'
										? 'User is not sure'
										: 'Not asked (unmarried or no retirement accounts)'}
						</p>
					</div>
				</div>

				{#if fd.actionNeededNote}
					<div class="mb-4 rounded-xl border border-red-200 bg-red-50/70 p-3">
						<p class="text-[11px] uppercase tracking-wider text-red-700 font-semibold mb-1">Action needed (user-visible)</p>
						<p class="text-[13px] text-navy/75 leading-relaxed">{fd.actionNeededNote}</p>
						<form method="POST" action="?/clearFundingActionNeeded" use:enhance class="mt-2">
							<input type="hidden" name="trustId" value={fb.trustId} />
							<button type="submit" class="text-[12px] text-navy/50 underline cursor-pointer">Clear note</button>
						</form>
					</div>
				{/if}

				<form method="POST" action="?/setFundingActionNeeded" use:enhance class="space-y-3 mb-4">
					<input type="hidden" name="trustId" value={fb.trustId} />
					<label class="block">
						<span class="text-[10px] uppercase tracking-wider text-navy/35 font-medium">Set action-needed note</span>
						<select
							class="mt-1 w-full rounded-xl border border-navy/10 bg-white px-3 py-2 text-[13px] text-navy"
							onchange={(e) => {
								const sel = e.currentTarget;
								const tpl = data.fundingNoteTemplates.find((t) => t.id === sel.value);
								const ta = sel.form?.querySelector('textarea[name="note"]') as HTMLTextAreaElement | null;
								if (tpl && ta) ta.value = tpl.body;
							}}
						>
							<option value="">Template…</option>
							{#each data.fundingNoteTemplates as tpl}
								<option value={tpl.id}>{tpl.label}</option>
							{/each}
						</select>
					</label>
					<textarea
						name="note"
						rows="3"
						required
						class="w-full rounded-xl border border-navy/10 bg-white px-3 py-2 text-[13px] text-navy"
						placeholder="User-visible note"
					></textarea>
					<label class="flex items-center gap-2 text-[12px] text-navy/60">
						<input type="checkbox" name="sendEmail" value="true" class="rounded border-navy/20" />
						Also send action-needed email
					</label>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-navy text-cream text-[12px] font-medium cursor-pointer hover:bg-navy-light"
						>Save action needed</button
					>
				</form>

				{#if fd.openFlags.length}
					<div>
						<p class="text-[10px] uppercase tracking-wider text-navy/35 font-medium mb-2">Open flags</p>
						<ul class="space-y-2">
							{#each fd.openFlags as flag}
								<li class="flex items-start justify-between gap-3 rounded-lg border border-navy/8 px-3 py-2">
									<div>
										<p class="text-[12px] font-medium text-navy">{flag.flagKey} <span class="text-navy/35 font-normal">({flag.severity})</span></p>
										{#if flag.reason}
											<p class="text-[11px] text-navy/50 mt-0.5">{flag.reason}</p>
										{/if}
									</div>
									<form method="POST" action="?/resolveFundingFlag" use:enhance>
										<input type="hidden" name="flagId" value={flag.id} />
										<button type="submit" class="text-[11px] text-emerald-accent cursor-pointer hover:underline">Resolve</button>
									</form>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}
	{/each}
	{#if !data.fundingByTrust.some((fb) => fb.dashboard)}
		<div class="rounded-2xl bg-white/60 border border-navy/[0.06] p-12 text-center mb-6">
			<p class="text-navy/40 text-sm">No funding dashboard yet.</p>
			<p class="text-navy/35 text-[12px] mt-1">This appears once a trust's documents are approved.</p>
		</div>
	{/if}
	{:else if activeTab === 'drip'}
	<!-- ── Marketing Drip Panel ───────────────────────────────────────── -->
	{#if data.dripLead}
		{@const dl = data.dripLead}
		<div class="rounded-2xl border border-navy/[0.08] bg-white/60 p-6 mb-6">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<span class="text-[10px] tracking-[0.22em] uppercase font-semibold text-emerald-accent">Marketing Drip</span>
				</div>
				<div class="flex items-center gap-2">
					{#if dl.sequenceStatus === 'active'}
						<form method="POST" action="?/dripStop" use:enhance>
							<input type="hidden" name="email" value={dl.email} />
							<button type="submit" class="text-[11px] px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer">Stop sequence</button>
						</form>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
				<div>
					<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Sequence</p>
					<p class="text-[13px] text-navy/80 font-medium">{dl.currentSequence?.replace(/_/g, ' ') ?? '—'}</p>
				</div>
				<div>
					<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Status</p>
					<p class="text-[13px] font-medium
						{dl.sequenceStatus === 'active' ? 'text-emerald-accent' :
						dl.sequenceStatus === 'stopped_paid' ? 'text-navy/55' :
						dl.sequenceStatus === 'unsubscribed' ? 'text-red-500' :
						'text-navy/45'}">
						{dl.sequenceStatus?.replace(/_/g, ' ') ?? '—'}
					</p>
				</div>
				<div>
					<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Next email</p>
					<p class="text-[13px] text-navy/80">
						{dl.nextEmailAt ? new Date(dl.nextEmailAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
					</p>
				</div>
				<div>
					<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Last sent</p>
					<p class="text-[13px] text-navy/80">
						{dl.lastEmailAt ? new Date(dl.lastEmailAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
					</p>
				</div>
				<div>
					<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Last email key</p>
					<p class="text-[13px] text-navy/60 font-mono">{dl.lastEmailKey ?? '—'}</p>
				</div>
				{#if dl.quizResult}
					<div>
						<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Quiz result</p>
						<p class="text-[13px] text-navy/80">{dl.quizResult.replace(/_/g, ' ')}</p>
					</div>
				{/if}
				{#if dl.appStatus}
					<div>
						<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">App status</p>
						<p class="text-[13px] text-navy/80">{dl.appStatus.replace(/_/g, ' ')}</p>
					</div>
				{/if}
				{#if dl.stoppedReason}
					<div>
						<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-0.5">Stop reason</p>
						<p class="text-[13px] text-navy/60">{dl.stoppedReason.replace(/_/g, ' ')}</p>
					</div>
				{/if}
			</div>

			{#if dl.complexityFlags && dl.complexityFlags.length > 0}
				<div class="flex flex-wrap gap-1.5 mb-3">
					{#each dl.complexityFlags as flag}
						<span class="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700">{flag.replace(/_/g, ' ')}</span>
					{/each}
				</div>
			{/if}

			{#if data.dripEmailLogs && data.dripEmailLogs.length > 0}
				<div class="border-t border-navy/[0.06] pt-3 mt-2">
					<p class="text-[10px] text-navy/35 uppercase tracking-wider mb-2">Send log (last {data.dripEmailLogs.length})</p>
					<div class="space-y-1">
						{#each data.dripEmailLogs as log}
							<div class="flex items-center gap-3 text-[11px]">
								<span class="text-navy/35 tabular-nums shrink-0">{new Date(log.sentAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
								<span class="font-mono text-navy/45 shrink-0">{log.emailKey}</span>
								<span class="text-navy/60 truncate">{log.subject}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="rounded-2xl bg-white/60 border border-navy/[0.06] p-12 text-center mb-6">
			<p class="text-navy/40 text-sm">No marketing drip activity for this user.</p>
		</div>
	{/if}
	{:else if activeTab === 'help'}
		<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden">
			{#if data.helpConversations.length === 0}
				<div class="p-12 text-center">
					<p class="text-navy/40 text-sm">No help conversations yet.</p>
				</div>
			{:else}
				<ul class="divide-y divide-navy/[0.06]">
					{#each data.helpConversations as c (c.id)}
						<li class="flex items-center justify-between gap-4 px-5 py-3.5">
							<div class="min-w-0">
								<div class="text-[13px] text-navy font-medium truncate">
									{c.surface}{c.stepKey ? ` / ${c.stepKey}` : ''}
								</div>
								<div class="text-[11px] text-navy/45 mt-0.5">
									{c.turnCount} turn{c.turnCount === 1 ? '' : 's'}
									{#if c.lastMessageAt}
										&middot; {new Date(c.lastMessageAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
									{/if}
									{#if c.hasRedaction}
										&middot; <span class="text-amber-700">Redacted content</span>
									{/if}
								</div>
							</div>
							<a
								href={`/admin/help/conversations/${c.id}`}
								class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border bg-emerald-accent/10 text-emerald-accent border-emerald-accent/30 hover:bg-emerald-accent/20 transition-all cursor-pointer shrink-0"
							>
								View transcript
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else if activeTab === 'files'}
			{#if trust}
				{@const canGenerate = trust.complete}
				<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-5 mb-4 flex flex-col gap-4">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div class="min-w-0">
							<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-1">Generate</p>
							<p class="text-[12px] text-navy/45">
								Create the joint trust and both pour-over wills (.docx), store them for this client, and show them in the list below. Use Preview to read Word files in the browser, or Download to save a copy.
							</p>
						</div>
						<button
							type="button"
							disabled={!canGenerate || generateLoading}
							onclick={() => generateJointTrustDoc()}
							title={canGenerate ? 'Generate and save the joint trust and pour-over wills' : 'Available once the user completes the questionnaire.'}
							class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-all shrink-0
								{canGenerate && !generateLoading
									? 'bg-emerald-accent/10 text-emerald-accent border-emerald-accent/30 hover:bg-emerald-accent/20 cursor-pointer'
									: 'bg-navy/[0.03] text-navy/35 border-navy/10 cursor-not-allowed'}"
						>
							{#if generateLoading}
								<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
								</svg>
								Generating…
							{:else}
								Generate documents
							{/if}
						</button>
					</div>
					{#if generateError}
						<p class="text-[12px] text-red-600">{generateError}</p>
					{/if}
				</div>
				<!-- upload panel -->
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
										{#if isLikelyDocx(f)}
											<button
												type="button"
												onclick={() => openDocxPreview(f)}
												class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-navy/12 bg-white text-navy hover:bg-navy/[0.04] transition-all cursor-pointer"
											>
												<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
													<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
													<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												</svg>
												Preview
											</button>
										{/if}
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
												onclick={() => openDeleteFileModal(f)}
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
	{:else if activeTab === 'notes'}
				<AdminUserNotes notes={data.notes} userName={data.targetUser.name} />
	{/if}
	</div>

	{#if showDocxPreview}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy/25 backdrop-blur-sm"
			onclick={closeDocxPreview}
			role="presentation"
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl shadow-navy/15 outline-none border border-navy/[0.06]"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="docx-preview-title"
				tabindex="-1"
			>
				<div class="flex items-start justify-between gap-3 px-5 py-4 border-b border-navy/[0.06] shrink-0">
					<div class="min-w-0 flex-1 pr-2">
						<h3 id="docx-preview-title" class="text-[15px] font-semibold text-navy truncate">
							{docxPreviewTitle || 'Document preview'}
						</h3>
						<p class="text-[11px] text-navy/45 leading-snug mt-1.5 max-w-xl">
							This preview is approximate; spacing, fonts, and layout may differ from Microsoft Word or the final PDF.
						</p>
					</div>
					<button
						type="button"
						onclick={closeDocxPreview}
						class="shrink-0 w-9 h-9 rounded-lg border border-navy/10 text-navy/50 hover:text-navy hover:bg-navy/[0.04] transition-colors cursor-pointer"
						aria-label="Close preview"
					>
						<svg class="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div class="flex-1 min-h-0 overflow-hidden flex flex-col">
					{#if docxPreviewLoading}
						<div class="flex flex-col items-center justify-center gap-3 py-16 text-navy/45">
							<svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
							</svg>
							<p class="text-[13px]">Loading preview…</p>
						</div>
					{:else if docxPreviewError}
						<div class="p-8 text-center">
							<p class="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">{docxPreviewError}</p>
						</div>
					{/if}
					<div
						class="docx-admin-preview flex-1 min-h-0 overflow-auto px-4 py-4 bg-navy/[0.02] {docxPreviewLoading || docxPreviewError ? 'hidden' : ''}"
						bind:this={docxPreviewEl}
					></div>
				</div>
			</div>
		</div>
	{/if}

	{#if showApproveModal}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/25 backdrop-blur-sm"
			onclick={closeApproveModal}
			role="presentation"
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative max-w-md w-full bg-white rounded-2xl shadow-2xl shadow-navy/15 p-7 outline-none border border-navy/[0.06]"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="approve-docs-title"
				tabindex="-1"
			>
				<h3 id="approve-docs-title" class="text-lg font-semibold text-navy mb-2">
					Approve documents?
				</h3>
				<p class="text-[13px] text-navy/65 leading-relaxed">
					This will mark <span class="font-medium text-navy">{data.targetUser.name}</span>'s
					documents as approved and move them to the Notarization phase. They will see a link on
					their dashboard to book a notarization appointment.
				</p>
				{#if approveError}
					<p class="mt-3 text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
						{approveError}
					</p>
				{/if}
				<div class="mt-6 flex flex-col-reverse sm:flex-row gap-3">
					<button
						type="button"
						onclick={closeApproveModal}
						disabled={approving}
						class="flex-1 py-2.5 rounded-xl text-sm font-medium text-navy bg-navy/6 hover:bg-navy/10 transition-colors cursor-pointer disabled:opacity-60"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmApproveDocuments}
						disabled={approving}
						class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-accent hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
					>
						{#if approving}
							<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
							</svg>
							Approving…
						{:else}
							Approve & move to Notarization
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showFinalizeModal}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/25 backdrop-blur-sm"
			onclick={closeFinalizeModal}
			role="presentation"
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative max-w-md w-full bg-white rounded-2xl shadow-2xl shadow-navy/15 p-7 outline-none border border-navy/[0.06]"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="finalize-case-title"
				tabindex="-1"
			>
				<h3 id="finalize-case-title" class="text-lg font-semibold text-navy mb-2">
					Finalize this case?
				</h3>
				<p class="text-[13px] text-navy/65 leading-relaxed">
					This marks <span class="font-medium text-navy">{data.targetUser.name}</span>'s
					trust as <span class="font-medium text-navy">completed</span> and emails them the
					closing letter with their remaining action items (funding, pour-over wills, homestead
					exemption, and storage). This is the final step in the workflow.
				</p>
				{#if finalizeError}
					<p class="mt-3 text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
						{finalizeError}
					</p>
				{/if}
				<div class="mt-6 flex flex-col-reverse sm:flex-row gap-3">
					<button
						type="button"
						onclick={closeFinalizeModal}
						disabled={finalizing}
						class="flex-1 py-2.5 rounded-xl text-sm font-medium text-navy bg-navy/6 hover:bg-navy/10 transition-colors cursor-pointer disabled:opacity-60"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmFinalizeCase}
						disabled={finalizing}
						class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-cream bg-navy hover:bg-navy-light transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
					>
						{#if finalizing}
							<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
							</svg>
							Finalizing…
						{:else}
							Finalize &amp; send closing email
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showFinalizeSuccess}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/25 backdrop-blur-sm"
			onclick={() => (showFinalizeSuccess = false)}
			role="presentation"
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative max-w-md w-full bg-white rounded-2xl shadow-2xl shadow-navy/15 p-7 outline-none border border-navy/[0.06] text-center"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="finalize-success-title"
				tabindex="-1"
			>
				<div class="mx-auto mb-4 w-12 h-12 rounded-full bg-emerald-accent/12 flex items-center justify-center">
					<svg class="w-6 h-6 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h3 id="finalize-success-title" class="text-lg font-semibold text-navy mb-2">
					Case finalized
				</h3>
				<p class="text-[13px] text-navy/65 leading-relaxed">
					<span class="font-medium text-navy">{data.targetUser.name}</span>'s trust is now marked
					completed, and the closing letter has been emailed to
					<span class="font-medium text-navy">{data.targetUser.email}</span>.
				</p>
				<button
					type="button"
					onclick={() => (showFinalizeSuccess = false)}
					class="mt-6 w-full py-2.5 rounded-xl text-sm font-semibold text-cream bg-navy hover:bg-navy-light transition-colors cursor-pointer"
				>
					Done
				</button>
			</div>
		</div>
	{/if}

	{#if showDeleteFileModal && fileToDelete}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/25 backdrop-blur-sm"
			onclick={closeDeleteFileModal}
			role="presentation"
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative max-w-md w-full bg-white rounded-2xl shadow-2xl shadow-navy/15 p-7 outline-none border border-navy/[0.06]"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="delete-file-title"
				tabindex="-1"
			>
				<h3 id="delete-file-title" class="text-lg font-semibold text-navy mb-2">
					Delete this file?
				</h3>
				<p class="text-[13px] text-navy/65 leading-relaxed">
					This will permanently remove
					<span class="font-medium text-navy">{fileToDelete.label}</span>
					from storage. This cannot be undone.
				</p>
				{#if deleteFileError}
					<p class="mt-3 text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
						{deleteFileError}
					</p>
				{/if}
				<div class="mt-6 flex flex-col-reverse sm:flex-row gap-3">
					<button
						type="button"
						onclick={closeDeleteFileModal}
						disabled={deletingKey !== null}
						class="flex-1 py-2.5 rounded-xl text-sm font-medium text-navy bg-navy/6 hover:bg-navy/10 transition-colors cursor-pointer disabled:opacity-60"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmDeleteFile}
						disabled={deletingKey !== null}
						class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
					>
						{#if deletingKey !== null}
							<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
							Deleting…
						{:else}
							Delete permanently
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}

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
