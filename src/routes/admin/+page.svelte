<script lang="ts">
	import { siteName, allIntakeQuestions } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { defaultPrepFee } from '$lib/config';

	let { data } = $props();

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


	function getProgress(responses: { id: string; response: unknown }[]): number {
		if (allIntakeQuestions.length === 0) return 0;
		const answered = responses.filter((r) => r.response != null && r.response !== '').length;
		return Math.round((answered / allIntakeQuestions.length) * 100);
	}

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

	function startEdit(trustId: number, currentPrice: number | null) {
		editingTrustId = trustId;
		editPrice = String(currentPrice ?? defaultPrepFee);
	}

	function cancelEdit() {
		editingTrustId = null;
		editPrice = '';
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
			<span class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium">Admin</span>
			<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
		</div>
	</nav>

	<div class="max-w-7xl mx-auto px-6 md:px-8 py-10">
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
								{@const progress = getProgress(t.responses)}
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
