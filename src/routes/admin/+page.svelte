<script lang="ts">
	import { siteName, productName } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { defaultPrepFee } from '$lib/config';
	import { getIntakeQuestionnaireProgress } from '$lib/question-response-helpers';
	import { stateName } from '$lib/free-will/config';
	import AdminWillResponses from '$lib/components/AdminWillResponses.svelte';

	let { data } = $props();

	type View = 'trusts' | 'wills' | 'drip' | 'utm';
	let view = $state<View>('trusts');
	type DripSubView = 'sends' | 'leads';
	let dripSubView = $state<DripSubView>('sends');

	let editingTrustId = $state<number | null>(null);
	let editPrice = $state('');

	// Filters & sorting
	type StatusFilter = 'all' | 'started' | 'awaiting-payment' | 'awaiting-answers' | 'review' | 'notarization-pending' | 'notarization-scheduled' | 'completed';
	type TypeFilter = 'all' | 'individual' | 'joint' | 'unset';
	type EligibilityFilter = 'all' | 'eligible' | 'ineligible' | 'unscreened';
	type SortKey = 'updated' | 'created' | 'business' | 'type';
	type SortDir = 'asc' | 'desc';

	let statusFilter = $state<StatusFilter>('all');
	let typeFilter = $state<TypeFilter>('all');
	let eligibilityFilter = $state<EligibilityFilter>('all');
	let sortKey = $state<SortKey>('updated');
	let sortDir = $state<SortDir>('desc');

	const statusOptions: { value: StatusFilter; label: string }[] = [
		{ value: 'all', label: 'All statuses' },
		{ value: 'started', label: 'Started' },
		{ value: 'awaiting-payment', label: 'Awaiting Payment' },
		{ value: 'awaiting-answers', label: 'Awaiting Answers' },
		{ value: 'review', label: 'Requires Review' },
		{ value: 'notarization-pending', label: 'Notarization Pending' },
		{ value: 'notarization-scheduled', label: 'Notarization Scheduled' },
		{ value: 'completed', label: 'Completed' },
	];

	const typeOptions: { value: TypeFilter; label: string }[] = [
		{ value: 'all', label: 'All types' },
		{ value: 'individual', label: 'Individual' },
		{ value: 'joint', label: 'Joint' },
		{ value: 'unset', label: 'Unset' },
	];

	const eligibilityOptions: { value: EligibilityFilter; label: string }[] = [
		{ value: 'all', label: 'All eligibility' },
		{ value: 'eligible', label: 'Eligible' },
		{ value: 'ineligible', label: 'Ineligible' },
		{ value: 'unscreened', label: 'Unscreened' },
	];

	const sortOptions: { value: SortKey; label: string }[] = [
		{ value: 'updated', label: 'Last updated' },
		{ value: 'created', label: 'Created' },
		{ value: 'business', label: 'Business' },
		{ value: 'type', label: 'Type' },
	];

	const filteredTrusts = $derived.by(() => {
		const filtered = data.trusts.filter((t) => {
			if (statusFilter !== 'all' && t.status !== statusFilter) return false;
			if (typeFilter !== 'all') {
				if (typeFilter === 'individual' && t.joint !== false) return false;
				if (typeFilter === 'joint' && t.joint !== true) return false;
				if (typeFilter === 'unset' && t.joint !== null) return false;
			}
			if (eligibilityFilter !== 'all') {
				if (eligibilityFilter === 'eligible' && t.isEligible !== true) return false;
				if (eligibilityFilter === 'ineligible' && t.isEligible !== false) return false;
				if (eligibilityFilter === 'unscreened' && t.isEligible !== null) return false;
			}
			return true;
		});

		const dirMult = sortDir === 'asc' ? 1 : -1;
		const compareNullable = (a: unknown, b: unknown): number => {
			// null/undefined sort last regardless of direction
			const aNull = a === null || a === undefined;
			const bNull = b === null || b === undefined;
			if (aNull && bNull) return 0;
			if (aNull) return 1;
			if (bNull) return -1;
			if (typeof a === 'number' && typeof b === 'number') return (a - b) * dirMult;
			if (typeof a === 'boolean' && typeof b === 'boolean') return (Number(a) - Number(b)) * dirMult;
			return String(a).localeCompare(String(b)) * dirMult;
		};

		return [...filtered].sort((a, b) => {
			switch (sortKey) {
				case 'updated':
					return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dirMult;
				case 'created':
					return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dirMult;
				case 'business':
					return compareNullable(a.businessOwnership, b.businessOwnership);
				case 'type':
					return compareNullable(a.joint, b.joint);
			}
		});
	});

	function resetFilters() {
		statusFilter = 'all';
		typeFilter = 'all';
		eligibilityFilter = 'all';
		sortKey = 'updated';
		sortDir = 'desc';
	}

	const hasActiveFilters = $derived(
		statusFilter !== 'all' || typeFilter !== 'all' || eligibilityFilter !== 'all',
	);




	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatDateTime(iso: string): string {
		return new Date(iso).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}

	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

	function timeAgo(iso: string): string {
		const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
		const steps: [Intl.RelativeTimeFormatUnit, number][] = [
			['year', 31536000],
			['month', 2592000],
			['week', 604800],
			['day', 86400],
			['hour', 3600],
			['minute', 60],
			['second', 1],
		];
		for (const [unit, unitSec] of steps) {
			if (Math.abs(diffSeconds) >= unitSec || unit === 'second') {
				return rtf.format(Math.trunc(diffSeconds / unitSec), unit);
			}
		}
		return rtf.format(0, 'second');
	}

	// ── Notes hover popover ───────────────────────────────────────
	type RecentNote = { body: string; authorName: string | null; createdAt: string; pinned: boolean };
	let notesPopover = $state<{
		notes: RecentNote[];
		total: number;
		name: string;
		x: number;
		y: number;
	} | null>(null);

	function showNotesPopover(event: MouseEvent | FocusEvent, user: { name: string; noteCount: number; recentNotes: RecentNote[] }) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		notesPopover = {
			notes: user.recentNotes,
			total: user.noteCount,
			name: user.name,
			x: rect.left,
			y: rect.bottom + 8,
		};
	}

	function hideNotesPopover() {
		notesPopover = null;
	}

	/** Visual hint: warmer = more recently updated */
	function recencyDotClass(iso: string): string {
		const hours = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
		if (hours <= 24) return 'bg-emerald-accent';
		if (hours <= 24 * 7) return 'bg-amber-400';
		return 'bg-navy/25';
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}

	function statusLabel(status: string): string {
		const map: Record<string, string> = {
			'started': 'Started',
			'awaiting-payment': 'Awaiting Payment',
			'awaiting-answers': 'Awaiting Answers',
			'review': 'Requires Review',
			'notarization-pending': 'Notarization Pending',
			'notarization-scheduled': 'Notarization Scheduled',
			'completed': 'Completed',
		};
		return map[status] ?? status;
	}

	function statusColor(status: string): string {
		const map: Record<string, string> = {
			'started': 'bg-navy/10 text-navy/60',
			'awaiting-payment': 'bg-amber-50 text-amber-700',
			'awaiting-answers': 'bg-blue-50 text-blue-700',
			'review': 'bg-purple-50 text-purple-700',
			'notarization-pending': 'bg-orange-50 text-orange-700',
			'notarization-scheduled': 'bg-sky-50 text-sky-700',
			'completed': 'bg-emerald-50 text-emerald-700',
		};
		return map[status] ?? 'bg-navy/10 text-navy/60';
	}

	function planLabel(plan: string | null): string {
		if (!plan) return '-';
		return plan === 'full' ? 'Full' : 'Discounted';
	}

	function dripSequenceLabel(seq: string | null | undefined): string {
		if (!seq) return '—';
		const map: Record<string, string> = {
			free_will_lead: 'Free Will',
			quiz_lead: 'Quiz',
			app_started: 'App Started',
		};
		return map[seq] ?? seq.replace(/_/g, ' ');
	}

	function dripStatusLabel(status: string | null | undefined): string {
		if (!status) return '—';
		return status.replace(/_/g, ' ');
	}

	function dripStatusColor(status: string | null | undefined): string {
		switch (status) {
			case 'active':
				return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
			case 'completed':
				return 'bg-navy/[0.04] text-navy/55 border-navy/10';
			case 'stopped_paid':
				return 'bg-sky-50 text-sky-700 border-sky-200/70';
			case 'stopped_consult':
			case 'stopped_manual':
				return 'bg-amber-50 text-amber-700 border-amber-200/70';
			case 'unsubscribed':
				return 'bg-rose-50 text-rose-700 border-rose-200/70';
			default:
				return 'bg-navy/[0.04] text-navy/45 border-navy/10';
		}
	}

	function startEdit(trustId: number, currentPrice: number | null) {
		editingTrustId = trustId;
		editPrice = String(currentPrice ?? defaultPrepFee);
	}

	function cancelEdit() {
		editingTrustId = null;
		editPrice = '';
	}

	// ── Free Wills view ───────────────────────────────────────────
	type WillStatusFilter = 'all' | 'complete' | 'draft';
	type WillSortKey = 'created' | 'updated' | 'state';

	let willStatusFilter = $state<WillStatusFilter>('all');
	let willStateFilter = $state<string>('all');
	let willSortKey = $state<WillSortKey>('created');
	let willSortDir = $state<SortDir>('desc');
	let expandedWillId = $state<number | null>(null);

	const willStatusOptions: { value: WillStatusFilter; label: string }[] = [
		{ value: 'all', label: 'All statuses' },
		{ value: 'complete', label: 'Complete' },
		{ value: 'draft', label: 'Draft' },
	];

	const willStateOptions = $derived.by(() => {
		const codes = [...new Set(data.wills.map((w) => w.state).filter((s): s is string => !!s))].sort();
		return [{ value: 'all', label: 'All states' }, ...codes.map((c) => ({ value: c, label: stateName(c) }))];
	});

	const willSortOptions: { value: WillSortKey; label: string }[] = [
		{ value: 'created', label: 'Created' },
		{ value: 'updated', label: 'Last updated' },
		{ value: 'state', label: 'State' },
	];

	const filteredWills = $derived.by(() => {
		const filtered = data.wills.filter((w) => {
			if (willStatusFilter === 'complete' && !w.complete) return false;
			if (willStatusFilter === 'draft' && w.complete) return false;
			if (willStateFilter !== 'all' && w.state !== willStateFilter) return false;
			return true;
		});

		const dirMult = willSortDir === 'asc' ? 1 : -1;
		return [...filtered].sort((a, b) => {
			switch (willSortKey) {
				case 'created':
					return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dirMult;
				case 'updated':
					return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dirMult;
				case 'state':
					return String(a.state ?? '').localeCompare(String(b.state ?? '')) * dirMult;
			}
		});
	});

	const hasActiveWillFilters = $derived(willStatusFilter !== 'all' || willStateFilter !== 'all');

	function resetWillFilters() {
		willStatusFilter = 'all';
		willStateFilter = 'all';
		willSortKey = 'created';
		willSortDir = 'desc';
	}

	function toggleWill(id: number) {
		expandedWillId = expandedWillId === id ? null : id;
	}

	const PLAN_LABELS: Record<string, string> = {
		'goodtree-trust': productName,
		'legacy-plan': 'Legacy Plan',
		'family-waqf': 'Family Waqf',
	};

	function recommendedPlanLabel(plan: string | null): string {
		if (!plan) return 'None';
		return PLAN_LABELS[plan] ?? plan;
	}

	function humanizeTag(tag: string): string {
		return tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<div class="min-h-screen w-screen bg-cream font-sans">
	<!-- top bar -->
	<nav class="flex items-center justify-between px-6 md:px-8 py-5 border-b border-navy/[0.06] max-w-7xl mx-auto">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<div class="flex items-center gap-5">
			<a href="/admin/content" class="text-sm text-navy/50 transition-colors hover:text-navy">Content</a>
			<a href="/admin/help" class="text-sm text-navy/50 transition-colors hover:text-navy">Help Assistant</a>
			<a href="/admin/email-preview" class="text-sm text-navy/50 transition-colors hover:text-navy">Email preview</a>
			<span class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium">Admin</span>
			<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
		</div>
	</nav>

	<div class="max-w-7xl mx-auto px-6 md:px-8 py-10">
		<!-- view toggle -->
		<div class="mb-6 inline-flex items-center gap-1 p-1 rounded-xl bg-navy/[0.04] border border-navy/[0.06]">
			<button
				type="button"
				onclick={() => (view = 'trusts')}
				class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2
					{view === 'trusts' ? 'bg-white text-navy shadow-sm' : 'text-navy/45 hover:text-navy/70'}"
			>
				Trusts
				<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-navy/[0.06] text-[10px] text-navy/55 tabular-nums">
					{data.trusts.length}
				</span>
			</button>
			<button
				type="button"
				onclick={() => (view = 'wills')}
				class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2
					{view === 'wills' ? 'bg-white text-navy shadow-sm' : 'text-navy/45 hover:text-navy/70'}"
			>
				Free Wills
				<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-navy/[0.06] text-[10px] text-navy/55 tabular-nums">
					{data.wills.length}
				</span>
			</button>
			<button
				type="button"
				onclick={() => (view = 'drip')}
				class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2
					{view === 'drip' ? 'bg-white text-navy shadow-sm' : 'text-navy/45 hover:text-navy/70'}"
			>
				Marketing Drip
				<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-navy/[0.06] text-[10px] text-navy/55 tabular-nums">
					{data.dripLeads.length}
				</span>
			</button>
			<button
				type="button"
				onclick={() => (view = 'utm')}
				class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2
					{view === 'utm' ? 'bg-white text-navy shadow-sm' : 'text-navy/45 hover:text-navy/70'}"
			>
				UTM Tracking
				<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-navy/[0.06] text-[10px] text-navy/55 tabular-nums">
					{data.utmCampaigns.length}
				</span>
			</button>
		</div>

	{#if view === 'trusts'}
		<div class="mb-6">
			<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Trusts</h1>
			<p class="text-navy/45 text-sm">
				{filteredTrusts.length} of {data.trusts.length}{hasActiveFilters ? ' (filtered)' : ''}
			</p>
		</div>

		{#if data.trusts.length > 0}
			<div class="mb-4 flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Status</span>
					<select
						bind:value={statusFilter}
						class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
					>
						{#each statusOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Type</span>
					<select
						bind:value={typeFilter}
						class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
					>
						{#each typeOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Eligibility</span>
					<select
						bind:value={eligibilityFilter}
						class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
					>
						{#each eligibilityOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</label>

				<div class="ml-auto flex items-end gap-2">
					<label class="flex flex-col gap-1">
						<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Sort by</span>
						<select
							bind:value={sortKey}
							class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
						>
							{#each sortOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</label>

					<button
						type="button"
						onclick={() => (sortDir = sortDir === 'asc' ? 'desc' : 'asc')}
						title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
						class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy hover:border-emerald-accent cursor-pointer tabular-nums"
					>
						{sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
					</button>

					{#if hasActiveFilters || sortKey !== 'updated' || sortDir !== 'desc'}
						<button
							type="button"
							onclick={resetFilters}
							class="px-3 py-1.5 rounded-md text-sm text-navy/60 hover:text-navy cursor-pointer"
						>
							Reset
						</button>
					{/if}
				</div>
			</div>
		{/if}

		{#if data.trusts.length === 0}
			<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
				<p class="text-navy/40 text-sm">No trusts yet.</p>
			</div>
		{:else if filteredTrusts.length === 0}
			<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
				<p class="text-navy/40 text-sm">No trusts match the selected filters.</p>
			</div>
		{:else}
			<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
				<div class="overflow-x-auto">
					<table class="w-full text-sm text-left">
						<thead>
							<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
								<th class="px-4 py-3 font-medium">User</th>
								<th class="px-4 py-3 font-medium">Last updated</th>
								<th class="px-4 py-3 font-medium">Status</th>
								<th class="px-4 py-3 font-medium">Type</th>
								<th class="px-4 py-3 font-medium">Plan</th>
								<th class="px-4 py-3 font-medium">Eligible</th>
								<th class="px-4 py-3 font-medium">Business</th>
								<th class="px-4 py-3 font-medium">Progress</th>
								<th class="px-4 py-3 font-medium">Price</th>
								<th class="px-4 py-3 font-medium">Created</th>
								<th class="px-4 py-3 font-medium"></th>
							</tr>
						</thead>
						<tbody>
							{#each filteredTrusts as t}
								{@const progress = getIntakeQuestionnaireProgress(t.responses, { hasPaid: t.selectedPlan !== null })}
								{@const quotedPrice = t.customPrice ?? defaultPrepFee}
								{@const displayPrice = t.paidAmount ?? quotedPrice}
								{@const isCustom = t.paidAmount === null && t.customPrice !== null && t.customPrice !== defaultPrepFee}
								{@const hasPaid = t.selectedPlan !== null}
								<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
									<!-- User -->
									<td class="px-4 py-3">
										<div class="flex items-center gap-1.5">
											<span class="font-medium text-navy">{t.user.name}</span>
									{#if t.user.noteCount > 0}
											<span
												role="button"
												tabindex="0"
												aria-label="{t.user.noteCount} admin note{t.user.noteCount === 1 ? '' : 's'} — hover to preview"
												class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70 cursor-default focus:outline-none focus:ring-1 focus:ring-amber-300"
												onmouseenter={(e) => showNotesPopover(e, t.user)}
												onmouseleave={hideNotesPopover}
												onfocus={(e) => showNotesPopover(e, t.user)}
												onblur={hideNotesPopover}
											>
												<svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h4m1-12H7a2 2 0 00-2 2v14l4-3h8a2 2 0 002-2V6a2 2 0 00-2-2h-2" /></svg>
												{t.user.noteCount}
											</span>
										{/if}
										</div>
										<div class="text-[11px] text-navy/40 break-all">{t.user.email}</div>
									</td>

									<!-- Last updated -->
									<td class="px-4 py-3 text-[12px] whitespace-nowrap">
										<div class="flex items-start gap-2">
											<span
												class="mt-1.5 w-2 h-2 rounded-full shrink-0 {recencyDotClass(t.updatedAt)}"
												aria-hidden="true"
											></span>
											<div class="min-w-0">
												<div class="text-navy/60 tabular-nums">{formatDateTime(t.updatedAt)}</div>
												<div class="text-[11px] text-navy/40">{timeAgo(t.updatedAt)}</div>
											</div>
										</div>
									</td>

									<!-- Status -->
									<td class="px-4 py-3">
										<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium {statusColor(t.status)}">
											{statusLabel(t.status)}
										</span>
									</td>

									<!-- Type -->
									<td class="px-4 py-3 text-navy/60">
										{t.joint === null ? '-' : t.joint ? 'Joint' : 'Individual'}
									</td>

									<!-- Plan -->
									<td class="px-4 py-3 text-navy/60">
										{planLabel(t.selectedPlan)}
									</td>

									<!-- Eligible -->
									<td class="px-4 py-3">
										{#if t.isEligible === true}
											<span class="inline-block w-2 h-2 rounded-full bg-emerald-accent" title="Eligible"></span>
										{:else if t.isEligible === false}
											<span class="inline-block w-2 h-2 rounded-full bg-rose-400" title="Ineligible"></span>
										{:else}
											<span class="inline-block w-2 h-2 rounded-full bg-navy/20" title="Not screened"></span>
										{/if}
									</td>

									<!-- Business (screening) — chip styling matches admin user eligibility screening panel -->
									<td class="px-4 py-3">
										{#if t.businessOwnership === true}
											<span
												class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tabular-nums bg-amber-50 text-amber-800 border border-amber-200/80"
											>
												Yes
											</span>
										{:else if t.businessOwnership === false}
											<span
												class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tabular-nums bg-emerald-accent/8 text-navy/75 border border-emerald-accent/25"
											>
												No
											</span>
										{:else}
											<span
												class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tabular-nums bg-navy/[0.06] text-navy/45 border border-navy/10"
												title="No screening data for this trust"
											>
												—
											</span>
										{/if}
									</td>

									<!-- Progress -->
									<td class="px-4 py-3">
										{#if t.complete}
											<div class="flex items-center gap-2">
												<span
													class="inline-block w-2 h-2 rounded-full shrink-0 bg-emerald-accent"
													aria-hidden="true"
												></span>
												<span class="text-[11px] text-navy/60">Completed</span>
											</div>
										{:else}
											<div class="flex items-center gap-2">
												<div class="w-16 h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
													<div
														class="h-full rounded-full {progress === 100 ? 'bg-emerald-accent' : progress > 0 ? 'bg-amber-400' : 'bg-navy/10'}"
														style="width: {progress}%"
													></div>
												</div>
												<span class="text-[11px] text-navy/40 tabular-nums">{progress}%</span>
											</div>
										{/if}
									</td>

									<!-- Price -->
									<td class="px-4 py-3">
										{#if editingTrustId === t.id}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<span onclick={(e: MouseEvent) => e.stopPropagation()} class="contents">
												<form
													method="POST"
													action="?/updatePrice"
													use:enhance={() => {
														return async ({ result }) => {
															if (result.type === 'success') {
																cancelEdit();
																await invalidateAll();
															}
														};
													}}
												>
													<input type="hidden" name="trustId" value={t.id} />
													<div class="flex items-center gap-1">
														<span class="text-navy/50">$</span>
														<input
															type="number"
															name="price"
															bind:value={editPrice}
															min="0"
															class="w-16 px-1.5 py-0.5 rounded border border-navy/20 text-[12px] text-navy bg-white focus:outline-none focus:border-emerald-accent"
														/>
														<button type="submit" class="px-1.5 py-0.5 rounded bg-emerald-accent text-white text-[10px] font-medium cursor-pointer">Save</button>
														<button type="button" onclick={() => cancelEdit()} class="px-1.5 py-0.5 rounded bg-navy/10 text-navy/50 text-[10px] cursor-pointer">Cancel</button>
													</div>
												</form>
											</span>
										{:else}
											<span class="text-navy tabular-nums" class:text-emerald-700={isCustom} class:font-medium={isCustom}>
												${displayPrice}
											</span>
											{#if t.paidAmount !== null}
												<span class="ml-1 text-[10px] text-navy/40">paid</span>
											{/if}
											{#if !hasPaid}
												<button
													type="button"
													onclick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); startEdit(t.id, t.customPrice); }}
													class="ml-1 text-[10px] text-emerald-accent hover:text-emerald-accent/80 cursor-pointer underline"
												>edit</button>
											{/if}
										{/if}
									</td>

									<!-- Created -->
									<td class="px-4 py-3 text-navy/50 text-[12px] whitespace-nowrap">
										{formatDate(t.createdAt)}
									</td>

									<!-- Link -->
									<td class="px-4 py-3">
										<a href="/admin/user/{t.user.id}" class="text-emerald-accent hover:text-emerald-accent/80 text-[12px] font-medium">
											View
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{:else if view === 'wills'}
		<!-- ─── FREE WILLS ─── -->
		<div class="mb-6">
			<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Free Wills</h1>
			<p class="text-navy/45 text-sm">
				{filteredWills.length} of {data.wills.length}{hasActiveWillFilters ? ' (filtered)' : ''}
			</p>
		</div>

		{#if data.wills.length > 0}
			<div class="mb-4 flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Status</span>
					<select
						bind:value={willStatusFilter}
						class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
					>
						{#each willStatusOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">State</span>
					<select
						bind:value={willStateFilter}
						class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
					>
						{#each willStateOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</label>

				<div class="ml-auto flex items-end gap-2">
					<label class="flex flex-col gap-1">
						<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Sort by</span>
						<select
							bind:value={willSortKey}
							class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
						>
							{#each willSortOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</label>

					<button
						type="button"
						onclick={() => (willSortDir = willSortDir === 'asc' ? 'desc' : 'asc')}
						title={willSortDir === 'asc' ? 'Ascending' : 'Descending'}
						class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy hover:border-emerald-accent cursor-pointer tabular-nums"
					>
						{willSortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
					</button>

					{#if hasActiveWillFilters || willSortKey !== 'created' || willSortDir !== 'desc'}
						<button
							type="button"
							onclick={resetWillFilters}
							class="px-3 py-1.5 rounded-md text-sm text-navy/60 hover:text-navy cursor-pointer"
						>
							Reset
						</button>
					{/if}
				</div>
			</div>
		{/if}

		{#if data.wills.length === 0}
			<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
				<p class="text-navy/40 text-sm">No free wills yet.</p>
			</div>
		{:else if filteredWills.length === 0}
			<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center">
				<p class="text-navy/40 text-sm">No free wills match the selected filters.</p>
			</div>
		{:else}
			<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
				<div class="overflow-x-auto">
					<table class="w-full text-sm text-left">
						<thead>
							<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
								<th class="px-4 py-3 font-medium">User</th>
								<th class="px-4 py-3 font-medium">State</th>
								<th class="px-4 py-3 font-medium">Mode</th>
								<th class="px-4 py-3 font-medium">Status</th>
								<th class="px-4 py-3 font-medium">Recommended</th>
								<th class="px-4 py-3 font-medium">Tags</th>
								<th class="px-4 py-3 font-medium">Files</th>
								<th class="px-4 py-3 font-medium">Created</th>
								<th class="px-4 py-3 font-medium"></th>
							</tr>
						</thead>
						<tbody>
							{#each filteredWills as w}
								{@const isOpen = expandedWillId === w.id}
								<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
									<!-- User -->
									<td class="px-4 py-3">
										<div class="flex items-center gap-1.5">
											<span class="font-medium text-navy">{w.name ?? 'Unnamed'}</span>
											{#if !w.user}
												<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70" title="No account yet — pending email claim">
													Pending
												</span>
											{/if}
										</div>
										<div class="text-[11px] text-navy/40 break-all">{w.user?.email ?? w.claimEmail ?? '—'}</div>
									</td>

									<!-- State -->
									<td class="px-4 py-3 text-navy/60 whitespace-nowrap">
										{w.state ? stateName(w.state) : '—'}
									</td>

									<!-- Mode -->
									<td class="px-4 py-3">
										{#if w.legalMode === 'attorney'}
											<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700">Attorney</span>
										{:else if w.legalMode === 'self-help'}
											<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-navy/10 text-navy/60">Self-help</span>
										{:else}
											<span class="text-navy/40">—</span>
										{/if}
									</td>

									<!-- Status -->
									<td class="px-4 py-3">
										{#if w.complete}
											<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">Complete</span>
										{:else}
											<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">Draft</span>
										{/if}
									</td>

									<!-- Recommended plan -->
									<td class="px-4 py-3 text-navy/60 whitespace-nowrap">
										{recommendedPlanLabel(w.recommendedPlan)}
									</td>

									<!-- Tags -->
									<td class="px-4 py-3">
										{#if w.tags.length > 0}
											<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-navy/[0.06] text-[10px] text-navy/55 tabular-nums" title={w.tags.map(humanizeTag).join(', ')}>
												{w.tags.length}
											</span>
										{:else}
											<span class="text-navy/30 text-[12px]">—</span>
										{/if}
									</td>

									<!-- Files -->
									<td class="px-4 py-3">
										{#if w.generatedFiles.length > 0}
											<span class="text-[12px] text-navy/60 tabular-nums">{w.generatedFiles.length}</span>
										{:else}
											<span class="text-navy/30 text-[12px]">—</span>
										{/if}
									</td>

									<!-- Created -->
									<td class="px-4 py-3 text-navy/50 text-[12px] whitespace-nowrap">
										{formatDate(w.createdAt)}
									</td>

									<!-- Actions -->
									<td class="px-4 py-3 whitespace-nowrap">
										<div class="flex items-center gap-3">
											{#if w.trustUserId}
												<a href="/admin/user/{w.trustUserId}" class="text-navy/50 hover:text-navy text-[12px] font-medium inline-flex items-center gap-1" title="This user also has a trust">
													<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
													Trust
												</a>
											{/if}
											<button
												type="button"
												onclick={() => toggleWill(w.id)}
												class="text-emerald-accent hover:text-emerald-accent/80 text-[12px] font-medium inline-flex items-center gap-1 cursor-pointer"
											>
												{isOpen ? 'Hide' : 'View'}
												<svg class="w-3.5 h-3.5 transition-transform {isOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
											</button>
										</div>
									</td>
								</tr>

								{#if isOpen}
									<tr class="border-b border-navy/[0.04] bg-navy/[0.015]">
										<td colspan="9" class="px-4 py-5">
											<div class="space-y-5">
												<!-- summary chips -->
												<div class="flex flex-wrap items-center gap-2">
													<span class="text-[11px] text-navy/40">
														Updated {formatDateTime(w.updatedAt)} · {timeAgo(w.updatedAt)}
													</span>
													{#if w.reviewReminders}
														<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-emerald-accent/8 text-navy/70 border border-emerald-accent/25">Review reminders</span>
													{/if}
												</div>

												<!-- lead tags -->
												{#if w.tags.length > 0}
													<div>
														<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-2">Lead tags</p>
														<div class="flex flex-wrap gap-1.5">
															{#each w.tags as tag}
																<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
																	{humanizeTag(tag)}
																</span>
															{/each}
														</div>
													</div>
												{/if}

												<!-- generated files -->
												{#if w.generatedFiles.length > 0}
													<div>
														<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-2">Generated documents</p>
														<ul class="space-y-2">
															{#each w.generatedFiles as f}
																<li class="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-navy/[0.07] bg-white/60">
																	<div class="min-w-0">
																		<p class="text-[13px] text-navy truncate">{f.filename}</p>
																		<p class="text-[11px] text-navy/40 mt-0.5">{f.kind}</p>
																	</div>
																	<a
																		href={f.url}
																		download
																		target="_blank"
																		rel="noopener noreferrer"
																		class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border bg-emerald-accent/10 text-emerald-accent border-emerald-accent/30 hover:bg-emerald-accent/20 transition-colors"
																	>
																		<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
																		Download
																	</a>
																</li>
															{/each}
														</ul>
													</div>
												{/if}

												<!-- responses -->
												<AdminWillResponses responses={w.responses} />

												{#if w.trustUserId}
													<a
														href="/admin/user/{w.trustUserId}"
														class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium border border-navy/10 text-navy/60 hover:text-navy hover:border-navy/20 transition-all"
													>
														<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
														Open this user's trust
													</a>
												{/if}
											</div>
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{:else if view === 'drip'}
		<div class="mb-6">
			<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Marketing Drip</h1>
			<p class="text-navy/45 text-sm">
				Who received which drip email, and who is enrolled. Empty send log usually means nothing has been sent yet (or the marketing tables are not migrated).
			</p>
		</div>

		<div class="mb-5 inline-flex items-center gap-1 p-1 rounded-xl bg-navy/[0.04] border border-navy/[0.06]">
			<button
				type="button"
				onclick={() => (dripSubView = 'sends')}
				class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2
					{dripSubView === 'sends' ? 'bg-white text-navy shadow-sm' : 'text-navy/45 hover:text-navy/70'}"
			>
				Send log
				<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-navy/[0.06] text-[10px] text-navy/55 tabular-nums">
					{data.dripSends.length}
				</span>
			</button>
			<button
				type="button"
				onclick={() => (dripSubView = 'leads')}
				class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2
					{dripSubView === 'leads' ? 'bg-white text-navy shadow-sm' : 'text-navy/45 hover:text-navy/70'}"
			>
				Enrolled leads
				<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-navy/[0.06] text-[10px] text-navy/55 tabular-nums">
					{data.dripLeads.length}
				</span>
			</button>
		</div>

		{#if dripSubView === 'sends'}
			{#if data.dripSends.length === 0}
				<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center space-y-2">
					<p class="text-navy/50 text-sm font-medium">No drip emails have been logged yet.</p>
					<p class="text-navy/35 text-xs max-w-md mx-auto leading-relaxed">
						Sends appear here after quiz Email 1 or the cron job delivers a scheduled message. Test sends from Email preview are not logged.
					</p>
				</div>
			{:else}
				<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead>
								<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
									<th class="px-4 py-3 font-medium">Sent</th>
									<th class="px-4 py-3 font-medium">Recipient</th>
									<th class="px-4 py-3 font-medium">Email</th>
									<th class="px-4 py-3 font-medium">Sequence</th>
									<th class="px-4 py-3 font-medium">Subject</th>
									<th class="px-4 py-3 font-medium"></th>
								</tr>
							</thead>
							<tbody>
								{#each data.dripSends as s}
									<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
										<td class="px-4 py-3 text-[12px] whitespace-nowrap">
											<div class="text-navy/70 tabular-nums">{formatDateTime(s.sentAt)}</div>
											<div class="text-[11px] text-navy/40">{timeAgo(s.sentAt)}</div>
										</td>
										<td class="px-4 py-3">
											{#if s.firstName}
												<div class="font-medium text-navy">{s.firstName}</div>
											{/if}
											<div class="text-[11px] text-navy/40 break-all">{s.email}</div>
										</td>
										<td class="px-4 py-3">
											<span class="font-mono text-[12px] text-navy/70">{s.emailKey}</span>
										</td>
										<td class="px-4 py-3">
											<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border {dripStatusColor(s.sequenceStatus)}">
												{dripSequenceLabel(s.sequence)}
											</span>
										</td>
										<td class="px-4 py-3 text-[12px] text-navy/60 max-w-[280px] truncate" title={s.subject}>
											{s.subject}
										</td>
										<td class="px-4 py-3">
											{#if s.userId}
												<a href="/admin/user/{s.userId}" class="text-emerald-accent hover:text-emerald-accent/80 text-[12px] font-medium">View</a>
											{:else}
												<span class="text-[11px] text-navy/25">—</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		{:else}
			{#if data.dripLeads.length === 0}
				<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center space-y-2">
					<p class="text-navy/50 text-sm font-medium">No drip leads enrolled yet.</p>
					<p class="text-navy/35 text-xs max-w-md mx-auto leading-relaxed">
						Leads appear when someone finishes a free will, submits the quiz email form, or abandons the app unpaid.
					</p>
				</div>
			{:else}
				<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead>
								<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
									<th class="px-4 py-3 font-medium">Person</th>
									<th class="px-4 py-3 font-medium">Sequence</th>
									<th class="px-4 py-3 font-medium">Status</th>
									<th class="px-4 py-3 font-medium">Last sent</th>
									<th class="px-4 py-3 font-medium">Next</th>
									<th class="px-4 py-3 font-medium"></th>
								</tr>
							</thead>
							<tbody>
								{#each data.dripLeads as l}
									<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
										<td class="px-4 py-3">
											<div class="flex items-center gap-1.5">
												{#if l.firstName}
													<span class="font-medium text-navy">{l.firstName}</span>
												{/if}
												{#if l.leadType === 'waitlist'}
													<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200/70">
														Waitlist{l.state ? ` \u00b7 ${stateName(l.state) || l.state}` : ''}
													</span>
												{/if}
											</div>
											<div class="text-[11px] text-navy/40 break-all">{l.email}</div>
											{#if l.leadType === 'waitlist' && (l.utmSource || l.lastStep)}
												<div class="text-[10px] text-navy/30 mt-0.5">
													{[l.utmSource ? `utm: ${l.utmSource}` : null, l.lastStep ? `step: ${l.lastStep}` : null].filter(Boolean).join(' · ')}
												</div>
											{/if}
										</td>
										<td class="px-4 py-3 text-[12px] text-navy/65">
											{dripSequenceLabel(l.currentSequence)}
										</td>
										<td class="px-4 py-3">
											<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border {dripStatusColor(l.sequenceStatus)}">
												{dripStatusLabel(l.sequenceStatus)}
											</span>
										</td>
										<td class="px-4 py-3 text-[12px]">
											{#if l.lastEmailKey}
												<div class="font-mono text-navy/65">{l.lastEmailKey}</div>
												{#if l.lastEmailAt}
													<div class="text-[11px] text-navy/35">{timeAgo(l.lastEmailAt)}</div>
												{/if}
											{:else}
												<span class="text-navy/30">None yet</span>
											{/if}
										</td>
										<td class="px-4 py-3 text-[12px] text-navy/55 whitespace-nowrap">
											{#if l.sequenceStatus === 'active' && l.nextEmailAt}
												{formatDateTime(l.nextEmailAt)}
												<div class="text-[11px] text-navy/35">{timeAgo(l.nextEmailAt)}</div>
											{:else}
												—
											{/if}
										</td>
										<td class="px-4 py-3">
											{#if l.userId}
												<a href="/admin/user/{l.userId}" class="text-emerald-accent hover:text-emerald-accent/80 text-[12px] font-medium">View</a>
											{:else}
												<span class="text-[11px] text-navy/25">—</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		{/if}
	{:else if view === 'utm'}
		<div class="mb-6">
			<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">UTM Tracking</h1>
			<p class="text-navy/45 text-sm">Campaign performance and conversion metrics</p>
		</div>

		<!-- Summary stats -->
		<div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="rounded-xl bg-white/70 border border-navy/[0.06] p-5">
				<p class="text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-2">Total Campaigns</p>
				<p class="text-3xl font-semibold text-navy tabular-nums">{data.utmCampaigns.length}</p>
			</div>
			<div class="rounded-xl bg-white/70 border border-navy/[0.06] p-5">
				<p class="text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-2">Total Landings</p>
				<p class="text-3xl font-semibold text-navy tabular-nums">
					{data.utmCampaigns.reduce((sum, c) => sum + c.landings, 0)}
				</p>
			</div>
			<div class="rounded-xl bg-white/70 border border-navy/[0.06] p-5">
				<p class="text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-2">Total Completions</p>
				<p class="text-3xl font-semibold text-navy tabular-nums">
					{data.utmCampaigns.reduce((sum, c) => sum + c.completions, 0)}
				</p>
			</div>
		</div>

		<!-- Campaign conversion table -->
		{#if data.utmCampaigns.length === 0}
			<div class="rounded-xl bg-white/60 border border-navy/[0.06] p-12 text-center space-y-2">
				<p class="text-navy/50 text-sm font-medium">No UTM tracking data yet.</p>
				<p class="text-navy/35 text-xs max-w-md mx-auto leading-relaxed">
					Events appear when users arrive with UTM parameters or complete their will.
				</p>
			</div>
		{:else}
			<div class="mb-6">
				<h2 class="text-lg font-semibold text-navy tracking-tight mb-3">Campaign Performance</h2>
				<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead>
								<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
									<th class="px-4 py-3 font-medium">Campaign</th>
									<th class="px-4 py-3 font-medium">Source</th>
									<th class="px-4 py-3 font-medium">Medium</th>
									<th class="px-4 py-3 font-medium text-right">Landings</th>
									<th class="px-4 py-3 font-medium text-right">Completions</th>
									<th class="px-4 py-3 font-medium text-right">Conversion %</th>
								</tr>
							</thead>
							<tbody>
								{#each data.utmCampaigns as campaign}
									{@const conversionRate = campaign.landings > 0 ? ((campaign.completions / campaign.landings) * 100).toFixed(1) : '0.0'}
									<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
										<td class="px-4 py-3 font-medium text-navy">{campaign.campaign}</td>
										<td class="px-4 py-3 text-navy/65">{campaign.source ?? '—'}</td>
										<td class="px-4 py-3 text-navy/65">{campaign.medium ?? '—'}</td>
										<td class="px-4 py-3 text-right tabular-nums text-navy/65">{campaign.landings}</td>
										<td class="px-4 py-3 text-right tabular-nums">
											<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-accent/10 text-emerald-accent border border-emerald-accent/20">
												{campaign.completions}
											</span>
										</td>
										<td class="px-4 py-3 text-right tabular-nums font-medium text-navy">{conversionRate}%</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- Recent events table -->
			<div>
				<h2 class="text-lg font-semibold text-navy tracking-tight mb-3">Recent Events</h2>
				<div class="rounded-xl border border-navy/[0.06] overflow-hidden bg-white/70">
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead>
								<tr class="border-b border-navy/[0.06] text-[11px] uppercase tracking-wider text-navy/40">
									<th class="px-4 py-3 font-medium">Time</th>
									<th class="px-4 py-3 font-medium">Event</th>
									<th class="px-4 py-3 font-medium">Campaign</th>
									<th class="px-4 py-3 font-medium">Source</th>
									<th class="px-4 py-3 font-medium">Medium</th>
									<th class="px-4 py-3 font-medium">Email</th>
								</tr>
							</thead>
							<tbody>
								{#each data.utmRecentEvents as event}
									<tr class="border-b border-navy/[0.04] hover:bg-navy/[0.02] transition-colors">
										<td class="px-4 py-3 text-[12px] text-navy/55 whitespace-nowrap">
											{timeAgo(event.createdAt)}
										</td>
										<td class="px-4 py-3">
											{#if event.eventType === 'landing'}
												<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/70">
													Landing
												</span>
											{:else}
												<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-accent/10 text-emerald-accent border border-emerald-accent/20">
													Completion
												</span>
											{/if}
										</td>
										<td class="px-4 py-3 text-navy/65 text-[12px]">{event.utmCampaign ?? '—'}</td>
										<td class="px-4 py-3 text-navy/65 text-[12px]">{event.utmSource ?? '—'}</td>
										<td class="px-4 py-3 text-navy/65 text-[12px]">{event.utmMedium ?? '—'}</td>
										<td class="px-4 py-3 text-navy/40 text-[11px] break-all">{event.email ?? '—'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}
	{/if}
	</div>

	{#if notesPopover}
		<div
			class="fixed z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-navy/[0.08] bg-white shadow-xl shadow-navy/10 p-3.5 pointer-events-none"
			style="left: {notesPopover.x}px; top: {notesPopover.y}px;"
			role="tooltip"
		>
			<div class="flex items-center justify-between gap-2 mb-2.5">
				<span class="text-[11px] font-medium text-navy/45 tracking-wide uppercase">Recent notes · {notesPopover.name}</span>
				{#if notesPopover.total > notesPopover.notes.length}
					<span class="text-[10px] text-navy/35 shrink-0">+{notesPopover.total - notesPopover.notes.length} more</span>
				{/if}
			</div>
			<ul class="space-y-2.5">
				{#each notesPopover.notes as note}
					<li class="border-b border-navy/[0.05] last:border-0 pb-2.5 last:pb-0">
						<p class="text-[12px] text-navy/80 leading-relaxed line-clamp-2 whitespace-pre-wrap">{note.body}</p>
						<div class="flex items-center gap-1.5 mt-1 text-[10px] text-navy/35">
							{#if note.pinned}
								<svg class="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 4h6l-1 7 3 3v2H7v-2l3-3-1-7z" /></svg>
							{/if}
							<span>{note.authorName ?? 'Admin'}</span>
							<span class="text-navy/20">·</span>
							<span>{timeAgo(note.createdAt)}</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
