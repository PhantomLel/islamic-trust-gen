<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import type { SubmitFunction } from '@sveltejs/kit';
	let { data } = $props();

	function statusColor(status: string | null | undefined): string {
		const map: Record<string, string> = {
			approved: 'bg-emerald-50 text-emerald-700',
			needs_revision: 'bg-amber-50 text-amber-700',
			disabled: 'bg-navy/10 text-navy/50',
		};
		return map[status ?? ''] ?? 'bg-navy/10 text-navy/50';
	}

	let toast = $state<{ text: string; kind: 'success' | 'error' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function showToast(text: string, kind: 'success' | 'error' = 'success') {
		toast = { text, kind };
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 3500);
	}

	function withToast(successText: string): SubmitFunction {
		return () => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'failure') {
					showToast((result.data as { message?: string } | undefined)?.message ?? 'Something went wrong', 'error');
				} else if (result.type === 'success') {
					showToast(successText);
				} else if (result.type === 'error') {
					showToast('Something went wrong', 'error');
				}
			};
		};
	}
</script>

{#if toast}
	<div
		class="fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg
			{toast.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}"
		role="status"
		transition:fly={{ y: 12, duration: 200 }}
	>
		{#if toast.kind === 'success'}
			<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		{:else}
			<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.14A1 1 0 003 19.5h18a1 1 0 00.89-1.5L13.71 3.86a1 1 0 00-1.72 0z" />
			</svg>
		{/if}
		{toast.text}
		<button
			type="button"
			class="ml-1 shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
			onclick={() => (toast = null)}
			aria-label="Dismiss"
		>
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
{/if}

<a href="/admin/help" class="text-sm text-navy/50 hover:text-navy inline-flex items-center gap-1">← Back to entries</a>

<div class="mt-4 mb-8 flex items-center gap-3">
	<h1 class="text-2xl font-semibold text-navy tracking-tight font-mono">Entry #{data.entryId}</h1>
	<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium {statusColor(data.entry.governance?.status)}">
		{data.entry.governance?.status ?? 'unknown'}
	</span>
</div>

<div class="max-w-3xl space-y-6">
	<section class="rounded-xl border border-navy/[0.06] bg-white/70 p-5">
		<h2 class="text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-4">User-facing fields</h2>
		<form method="POST" action="?/saveFields" use:enhance={withToast('Draft saved')} class="space-y-4">
			<label class="block">
				<span class="text-sm font-medium text-navy">Question</span>
				<textarea
					name="question"
					class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
					rows="2">{data.entry.question ?? ''}</textarea
				>
			</label>
			<label class="block">
				<span class="text-sm font-medium text-navy">Short answer</span>
				<textarea
					name="userFacingAnswer"
					class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
					rows="4">{data.entry.userFacingAnswer ?? ''}</textarea
				>
			</label>
			<label class="block">
				<span class="text-sm font-medium text-navy">Also answers</span>
				<p class="text-[12px] text-navy/45 mt-0.5">Alternate phrasings, comma-separated.</p>
				<input
					name="alsoAnswers"
					class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
					value={data.entry.internal?.alsoAnswers?.join(', ') ?? ''}
				/>
			</label>
			<label class="block">
				<span class="text-sm font-medium text-navy">Category</span>
				<input
					name="category"
					class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
					value={data.entry.category ?? ''}
				/>
			</label>
			<label class="block">
				<span class="text-sm font-medium text-navy">App meaning</span>
				<textarea
					name="goodTreeAppMeaning"
					class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
					rows="3">{data.entry.goodTreeAppMeaning ?? ''}</textarea
				>
			</label>
			<label class="block">
				<span class="text-sm font-medium text-navy">Next step</span>
				<textarea
					name="userNextStep"
					class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
					rows="2">{data.entry.userNextStep ?? ''}</textarea
				>
			</label>
			<button
				class="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors cursor-pointer"
				type="submit"
			>
				Save draft
			</button>
		</form>
	</section>

	<section class="flex flex-wrap gap-3 items-center">
		<form method="POST" action="?/approve" use:enhance={withToast('Entry approved')}>
			<button class="rounded-lg bg-emerald-accent px-4 py-2 text-sm font-medium text-white hover:bg-emerald-accent/90 transition-colors cursor-pointer" type="submit">
				Approve
			</button>
		</form>
		<form method="POST" action="?/setStatus" use:enhance={withToast('Marked as needs revision')}>
			<input type="hidden" name="status" value="needs_revision" />
			<button class="rounded-lg border border-navy/15 bg-white px-4 py-2 text-sm text-navy hover:border-emerald-accent cursor-pointer" type="submit">
				Mark needs revision
			</button>
		</form>
		<form method="POST" action="?/setStatus" use:enhance={withToast('Entry disabled')}>
			<input type="hidden" name="status" value="disabled" />
			<button class="rounded-lg border border-navy/15 bg-white px-4 py-2 text-sm text-navy hover:border-emerald-accent cursor-pointer" type="submit">
				Disable
			</button>
		</form>
		<form
			method="POST"
			action="?/delete"
			use:enhance={({ cancel }) => {
				if (!confirm('Delete this entry permanently? This cannot be undone.')) cancel();
			}}
			class="ml-auto"
		>
			<button
				type="submit"
				class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
			>
				Delete entry
			</button>
		</form>
	</section>

	{#if data.gates.length}
		<section>
			<h2 class="text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-3">Publication gates</h2>
			<ul class="space-y-2">
				{#each data.gates as gate (gate.id)}
					<li class="rounded-xl border border-navy/[0.06] bg-white/70 p-4 text-sm">
						<div class="flex items-center gap-2">
							<span class="inline-block w-2 h-2 rounded-full {gate.satisfied ? 'bg-emerald-accent' : 'bg-amber-400'}"></span>
							<p class="text-navy">{gate.gateType} — {gate.satisfied ? 'satisfied' : 'required'}</p>
						</div>
						{#if !gate.satisfied}
							<form method="POST" action="?/satisfyGate" use:enhance={withToast('Gate satisfied')} class="mt-3 flex gap-2">
								<input type="hidden" name="gateType" value={gate.gateType} />
								<input
									name="note"
									class="flex-1 rounded-md border border-navy/15 px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-accent"
									placeholder="Evidence note"
								/>
								<button class="rounded-md bg-navy px-3 py-1.5 text-sm text-white hover:bg-navy-light transition-colors cursor-pointer" type="submit">
									Satisfy
								</button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.entry.internal}
		<section class="rounded-xl border border-navy/[0.06] bg-navy/[0.03] p-5">
			<h2 class="text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-3">Internal metadata (admin only)</h2>
			<p class="text-sm text-navy/70">Classification: <span class="text-navy">{data.entry.internal.classificationBase}</span></p>
			<p class="text-sm text-navy/70">Stability: <span class="text-navy">{data.entry.internal.stabilityCode}</span></p>
			{#if data.entry.internal.escalateIfRaw}
				<p class="mt-2 whitespace-pre-wrap text-sm text-navy/70 leading-relaxed">{data.entry.internal.escalateIfRaw}</p>
			{/if}
		</section>
	{/if}

	<section>
		<h2 class="text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-3">Version history</h2>
		{#if data.entry.versions.length === 0}
			<p class="text-navy/40 text-sm">No prior versions.</p>
		{:else}
			<ul class="space-y-2 text-sm">
				{#each data.entry.versions.slice(0, 10) as v (v.id)}
					<li class="rounded-lg border border-navy/[0.06] bg-white/70 px-4 py-2.5 text-navy/70">
						<span class="tabular-nums">{v.createdAt?.toISOString?.()}</span> — {v.changeReason}
						<span class="text-navy/40">({v.approvalState})</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
