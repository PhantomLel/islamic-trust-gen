<script lang="ts">
	import { tick } from 'svelte';
	import { renderAsync } from 'docx-preview';
	import { consultationBookingUrl, notarizationBookingUrl, siteName } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import HouseDeedUploadCard from '$lib/components/HouseDeedUploadCard.svelte';

	let { data } = $props();

	let firstName = $derived(data.userName?.split(' ')[0] ?? 'there');
	let t = $derived(data.trust);
	let paid = $derived(data.paid);

	/** Ordered lifecycle; `done` is derived only from `t.status` (see TrustStatus in schema). */
	const TRUST_STATUS_PIPELINE = [
		{ status: 'started', label: 'Pre-payment questionnaire' },
		{ status: 'awaiting-payment', label: 'Payment' },
		{ status: 'awaiting-answers', label: 'Trust details' },
		{ status: 'review', label: 'Under review' },
		{ status: 'notarization-pending', label: 'Schedule notarization' },
		{ status: 'notarization-scheduled', label: 'Notarization scheduled' },
		{ status: 'completed', label: 'Documents delivered' },
	] as const;

	let trustStatusIndex = $derived(
		TRUST_STATUS_PIPELINE.findIndex((s) => s.status === t.status)
	);
	let statusIdx = $derived(trustStatusIndex === -1 ? 0 : trustStatusIndex);

	let steps = $derived(
		TRUST_STATUS_PIPELINE.map((step, i) => ({
			label: step.label,
			done: i < statusIdx || t.status === 'completed',
		}))
	);

	let currentStepIndex = $derived(steps.findIndex((s) => !s.done));
	let overallPct = $derived(steps.filter((s) => s.done).length / steps.length * 100);
	let doneCount = $derived(steps.filter((s) => s.done).length);
	let statusLabel = $derived(
		t.status === 'completed' ? 'Completed' :
		t.status === 'notarization-scheduled' ? 'Notarization scheduled' :
		t.status === 'notarization-pending' ? 'Notarization pending' :
		t.intakeUnderReview ? 'Under review' :
		t.status === 'awaiting-answers' && !t.complete ? 'Trust details in progress' :
		t.status === 'awaiting-payment' && paid ? 'Payment received, continue your questionnaire' :
		t.awaitingPayment ? 'Awaiting payment' :
		t.status === 'started' && t.joint !== null ? 'Intake in progress' :
		t.isEligible !== null ? 'Select trust type' :
		'Getting started'
	);

	// action items
	let actions = $derived(
		[
			t.awaitingPayment && {
				label: 'Complete payment',
				href: `/create-trust/${t.id}/payment`,
				desc: 'Pay the preparation fee to unlock trust and property questions',
			},
			!t.complete &&
			!t.intakeUnderReview &&
			(t.status === 'started' || t.status === 'awaiting-answers') &&
			t.joint !== null && {
				label: 'Continue questionnaire',
				href: `/create-trust/${t.id}`,
				desc: `${t.questionnaireProgress}% done`,
				progress: t.questionnaireProgress,
			},
			!t.complete && t.joint === null && t.isEligible === true && {
				label: 'Select Trust Type',
				href: `/create-trust/${t.id}`,
				desc: 'Choose individual or joint',
			},
			t.approved && t.status !== 'notarization-scheduled' && t.status !== 'completed' && {
				label: 'Schedule Notarization',
				href: t.notarizationLinkUrl ?? notarizationBookingUrl,
				desc: 'Book an appointment to notarize your documents',
				external: true,
			},
		].filter(Boolean) as { label: string; href: string; desc: string; external?: boolean; progress?: number }[]
	);

	const KIND_LABELS: Record<string, string> = {
		'trust-document': 'Trust Document',
		'pour-over-will-husband': 'Pour Over Will – Husband',
		'pour-over-will-wife': 'Pour Over Will – Wife',
		'joint-trust': 'Joint Trust',
		'certification-of-trust': 'Certification of Trust',
		'other': 'Other',
	};

	function kindLabel(kind: string): string {
		return KIND_LABELS[kind] ?? kind;
	}

	type DashboardDoc = { name: string; label: string; url: string };

	/** All files shown to the user: admin-uploaded user files + generated files + legacy file_urls */
	let allDocuments = $derived<DashboardDoc[]>([
		...t.userFiles.map((f) => ({ name: f.filename, label: kindLabel(f.kind), url: f.url })),
		...t.generatedFiles.map((f) => ({ name: f.filename, label: kindLabel(f.kind), url: f.url })),
		...t.fileUrls.map((url, i) => ({ name: `Document ${i + 1}`, label: 'Document', url })),
	]);

	let showDocxPreview = $state(false);
	let docxPreviewEl = $state<HTMLDivElement | null>(null);
	let docxPreviewTitle = $state('');
	let docxPreviewLoading = $state(false);
	let docxPreviewError = $state('');

	function isLikelyDocx(doc: DashboardDoc): boolean {
		if (/\.docx$/i.test(doc.name.trim())) return true;
		try {
			return /\.docx$/i.test(new URL(doc.url).pathname);
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

	async function openDocxPreview(doc: DashboardDoc) {
		docxPreviewTitle = doc.name;
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
			const res = await fetch(`/api/trust/${t.id}/file?url=${encodeURIComponent(doc.url)}`);
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

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	type Notarization = {
		monthShort: string;
		day: string;
		weekday: string;
		fullDate: string;
		timeRange: string;
		timeZone: string;
		relative: string;
	};

	function buildNotarizationView(startIso: string, endIso: string | null): Notarization {
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

	let notarization = $derived<Notarization | null>(
		t.status === 'notarization-scheduled' && t.notarizationStartTime
			? buildNotarizationView(t.notarizationStartTime, t.notarizationEndTime)
			: null
	);

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}
</script>

<div class="min-h-screen w-screen bg-cream font-sans relative">
	<div class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(74,124,111,0.05) 0%, transparent 70%);">
	</div>

	<!-- nav -->
	<nav class="relative z-10 flex items-center justify-between px-6 md:px-8 py-5 border-b border-navy/[0.06] max-w-5xl mx-auto">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
	</nav>

	<div class="relative z-10 max-w-5xl mx-auto px-6 md:px-8 py-10">
		<!-- greeting -->
		<div class="mb-10">
			<h1 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight mb-1">Welcome back, {firstName}</h1>
			<p class="text-navy/40 text-sm font-light">Here's the current status of your trust.</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- ─── LEFT COLUMN ─── -->
			<div class="lg:col-span-2 space-y-6">

				<!-- status card -->
				<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6">
					<div class="flex items-start justify-between gap-4 mb-1">
						<div>
							<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-2">Current Status</p>
							<h2 class="text-lg font-semibold text-navy tracking-tight">{statusLabel}</h2>
						</div>
						<div class="flex items-center gap-2 shrink-0 mt-1">
							<span class="text-[11px] text-navy/35">{t.joint === null ? '' : t.joint ? 'Joint' : 'Individual'}</span>
							{#if t.joint !== null}
								<span class="text-navy/15">&middot;</span>
							{/if}
							<span class="text-[11px] text-navy/35">Created {formatDate(t.createdAt)}</span>
						</div>
					</div>
					<div class="mt-4 flex items-center gap-3">
						<div class="flex-1 h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
							<div class="h-full rounded-full bg-emerald-accent transition-all duration-700 ease-out" style="width: {overallPct}%"></div>
						</div>
						<span class="text-[11px] text-navy/35 shrink-0">{doneCount}/{steps.length}</span>
					</div>
				</div>

				{#if t.status === 'completed'}
					<div class="rounded-2xl border border-emerald-accent/20 bg-white/70 backdrop-blur-sm p-6 md:p-7 shadow-sm">
						<div class="flex flex-col sm:flex-row sm:items-start gap-4">
							<div class="shrink-0 w-11 h-11 rounded-xl bg-emerald-accent/10 flex items-center justify-center">
								<svg class="w-5 h-5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="min-w-0 space-y-3">
								<p class="text-[11px] text-emerald-accent/90 tracking-wider uppercase font-medium">Congratulations</p>
								<p class="text-[15px] md:text-base text-navy leading-relaxed font-medium">
									Your trust is complete. Your documents have been notarized, and your home has been deeded into your trust and recorded with the county.
								</p>
								<p class="text-[13px] text-navy/55 leading-relaxed">
									We've emailed you a closing letter with your remaining action items — funding your trust, signing your pour-over wills, protecting your homestead exemption, and safely storing your documents. Please read it closely and keep it handy until every step is complete.
								</p>
							</div>
						</div>
					</div>
				{/if}

				{#if notarization}
					<div class="rounded-2xl border border-emerald-accent/20 bg-white/70 backdrop-blur-sm p-6 md:p-7 shadow-sm">
						<div class="flex flex-col sm:flex-row sm:items-stretch gap-5">
							<!-- calendar block -->
							<div class="shrink-0 w-20 sm:w-24 rounded-xl border border-emerald-accent/30 bg-white overflow-hidden text-center shadow-sm">
								<div class="bg-emerald-accent text-white text-[10px] tracking-[0.18em] uppercase font-semibold py-1.5">
									{notarization.monthShort}
								</div>
								<div class="py-2.5">
									<div class="text-[32px] leading-none font-semibold text-navy tabular-nums">{notarization.day}</div>
									<div class="text-[10px] text-navy/45 mt-1.5 tracking-wider uppercase">{notarization.weekday.slice(0, 3)}</div>
								</div>
							</div>

							<div class="min-w-0 flex-1 flex flex-col">
								<div class="flex flex-wrap items-center gap-2 mb-2">
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-emerald-accent/12 text-emerald-accent border border-emerald-accent/30">
										<svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
										Notarization scheduled
									</span>
									{#if notarization.relative}
										<span class="text-[11px] text-navy/45">{notarization.relative}</span>
									{/if}
								</div>
								<p class="text-[17px] md:text-[18px] font-semibold text-navy tracking-tight leading-snug">
									{notarization.weekday}, {notarization.fullDate}
								</p>
								<p class="text-[13px] text-navy/55 mt-1">
									<span class="font-medium text-navy/75">{notarization.timeRange}</span>
									<span class="text-navy/40"> · {notarization.timeZone}</span>
								</p>
								<p class="text-[12px] text-navy/45 leading-relaxed mt-3">
									Calendly will email you a confirmation with the meeting link and a reminder before the appointment. 
							</div>
						</div>
					</div>
				{/if}

				{#if t.intakeUnderReview}
					<div class="rounded-2xl border border-emerald-accent/15 from-white/90 to-emerald-accent/[0.04] backdrop-blur-sm p-6 md:p-7 shadow-sm">
						<div class="flex flex-col sm:flex-row sm:items-start gap-4">
							<div class="shrink-0 w-11 h-11 rounded-xl bg-emerald-accent/10 flex items-center justify-center">
								<svg class="w-5 h-5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="min-w-0 space-y-3">
								<p class="text-[11px] text-emerald-accent/90 tracking-wider uppercase font-medium">Under review</p>
								<p class="text-[15px] md:text-base text-navy leading-relaxed font-medium">
									Give us a few days for our legal team to draft and review your documents.
								</p>
								<p class="text-[13px] text-navy/55 leading-relaxed">
									Once your documents are ready, we will notify you with how to notarize them using our online notarization.
								</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- action items -->
				{#if actions.length > 0}
					<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6">
						<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-4">Action Required</p>
						<div class="space-y-3">
							{#each actions as action}
								<a href={action.href}
									target={action.external ? '_blank' : undefined}
									rel={action.external ? 'noopener noreferrer' : undefined}
									class="flex items-center justify-between px-4 py-3.5 rounded-xl border border-navy/[0.07] bg-white/50
										   hover:bg-white hover:border-emerald-accent/20 hover:shadow-sm transition-all group">
									<div class="flex-1 min-w-0">
										<span class="text-sm font-medium text-navy group-hover:text-emerald-accent transition-colors">{action.label}</span>
										<p class="text-[11px] text-navy/35 mt-0.5">{action.desc}</p>
										{#if action.progress != null}
											<div class="mt-2.5 flex items-center gap-2.5">
												<div class="flex-1 h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
													<div class="h-full rounded-full bg-emerald-accent transition-all duration-500" style="width: {action.progress}%"></div>
												</div>
												<span class="text-[10px] text-navy/30 shrink-0">{action.progress}%</span>
											</div>
										{/if}
									</div>
									<svg class="w-4 h-4 text-navy/20 group-hover:text-emerald-accent transition-colors shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				{#if t.hasHouse}
					<HouseDeedUploadCard
						trustId={t.id}
						userId={data.userId}
						existingUrl={t.houseDeedUrl}
						title="Upload Your House Deed"
					/>
				{/if}

				<!-- document list (read-only) -->
				{#if allDocuments.length > 0}
					<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6">
						<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-4">Your Documents</p>
						<div class="space-y-2">
							{#each allDocuments as doc}
								<div
									class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-navy/[0.07] bg-white/50
										   hover:bg-white hover:border-emerald-accent/20 transition-all"
								>
									<div class="flex items-center gap-3 min-w-0 flex-1">
										<svg class="w-4 h-4 text-navy/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
										</svg>
										<div class="min-w-0">
											<p class="text-sm text-navy truncate">{doc.name}</p>
											<p class="text-[11px] text-navy/40 mt-0.5">{doc.label}</p>
										</div>
									</div>
									<div class="flex items-center gap-2 shrink-0">
										{#if isLikelyDocx(doc)}
											<button
												type="button"
												onclick={() => openDocxPreview(doc)}
												class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-navy/12 bg-white text-navy hover:bg-navy/[0.04] transition-colors cursor-pointer"
											>
												<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
													<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
													<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												</svg>
												Preview
											</button>
										{/if}
										<a
											href={doc.url}
											download
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border bg-emerald-accent/10 text-emerald-accent border-emerald-accent/30 hover:bg-emerald-accent/20 transition-colors cursor-pointer"
										>
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
											</svg>
											Download
										</a>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

			</div>

			<!-- ─── RIGHT COLUMN ─── -->
			<div class="space-y-6">

				<!-- timeline -->
				<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6">
					<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-5">Progress</p>
					<div class="space-y-0">
						{#each steps as step, i}
							{@const isCurrent = i === currentStepIndex}
							<div class="flex gap-3.5">
								<!-- line + dot -->
								<div class="flex flex-col items-center">
									<div class="w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center
												{step.done ? 'border-emerald-accent bg-emerald-accent' : isCurrent ? 'border-emerald-accent bg-white' : 'border-navy/15 bg-white'}">
										{#if step.done}
											<svg class="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
										{/if}
									</div>
									{#if i < steps.length - 1}
										<div class="w-px flex-1 min-h-[28px] {step.done ? 'bg-emerald-accent/40' : 'bg-navy/10'}"></div>
									{/if}
								</div>
								<!-- label -->
								<div class="pb-5">
									<span class="text-[13px] {step.done ? 'text-navy font-medium' : isCurrent ? 'text-navy' : 'text-navy/35'}">
										{step.label}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- consultation -->
				<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6">
					<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-3">Consultation</p>
					{#if data.requestedConsultation}
						<p class="text-[13px] text-navy/50 leading-relaxed mb-4">
							Your consultation request has been received. A member of our team will be in touch shortly.
						</p>
					{:else}
						<p class="text-[13px] text-navy/50 leading-relaxed mb-4">If you need assistance with your trust, please contact us.</p>
					{/if}
					<a href={consultationBookingUrl} target="_blank" rel="noopener noreferrer"
						class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-medium
							   border border-navy/10 text-navy/50 hover:text-navy hover:border-navy/20 transition-all">
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
						Book Consultation
					</a>
				</div>

				<!-- notarization -->
				{#if t.approved && t.status !== 'completed'}
					<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-6">
						<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-3">Notarization</p>
						{#if notarization}
							<div class="flex items-center gap-3">
								<div class="shrink-0 w-12 rounded-lg border border-emerald-accent/30 bg-white overflow-hidden text-center">
									<div class="bg-emerald-accent text-white text-[8px] tracking-[0.18em] uppercase font-semibold py-1">
										{notarization.monthShort}
									</div>
									<div class="py-1">
										<div class="text-[18px] leading-none font-semibold text-navy tabular-nums">{notarization.day}</div>
									</div>
								</div>
								<div class="min-w-0">
									<p class="text-[13px] font-medium text-navy truncate">{notarization.weekday}</p>
									<p class="text-[12px] text-navy/55 truncate">{notarization.timeRange}</p>
									{#if notarization.relative}
										<p class="text-[10px] text-emerald-accent mt-0.5 tracking-wider uppercase font-medium">{notarization.relative}</p>
									{/if}
								</div>
							</div>
						{:else}
							<p class="text-[13px] text-navy/50 leading-relaxed mb-4">
								Your trust has been approved. Schedule a notarization appointment to finalize your documents.
							</p>
							<a href={t.notarizationLinkUrl ?? notarizationBookingUrl} target="_blank" rel="noopener noreferrer"
								class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-medium
									   bg-navy text-cream hover:bg-navy-light transition-all">
								<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
								Schedule Notarization
							</a>
						{/if}
					</div>
				{/if}

			</div>
		</div>
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
				aria-labelledby="dashboard-docx-preview-title"
				tabindex="-1"
			>
				<div class="flex items-start justify-between gap-3 px-5 py-4 border-b border-navy/[0.06] shrink-0">
					<div class="min-w-0 flex-1 pr-2">
						<h3 id="dashboard-docx-preview-title" class="text-[15px] font-semibold text-navy truncate">
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
						class="docx-dashboard-preview flex-1 min-h-0 overflow-auto px-4 py-4 bg-navy/[0.02] {docxPreviewLoading || docxPreviewError ? 'hidden' : ''}"
						bind:this={docxPreviewEl}
					></div>
				</div>
			</div>
		</div>
	{/if}
</div>
