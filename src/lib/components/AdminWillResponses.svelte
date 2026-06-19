<script lang="ts">
	import {
		willSteps,
		stageMeta,
		stateName,
		resolveWillWasiyyahRecipientName,
		type WillStage,
		type WillResponses,
		type WillResponseValue,
		type ExecutorEntry,
		type GuardianEntry,
		type WillWasiyyahResponse,
	} from '$lib/free-will/config';
	import { getActiveSteps, formatAddress, getNamedHeirs } from '$lib/free-will/logic';
	import { charities as presetCharities } from '$lib/config';

	type WillResponse = { id: string; response: unknown };

	let { responses }: { responses: WillResponse[] } = $props();

	const presetCharityNames = new Map(presetCharities.map((c) => [c.id, c.name]));

	let values = $derived(
		Object.fromEntries((responses ?? []).map((r) => [r.id, r.response as WillResponseValue])) as WillResponses,
	);

	// Only the steps that actually apply to this submission (dependency-aware),
	// grouped by stage so the panel reads like the questionnaire itself.
	let activeSteps = $derived(getActiveSteps(values));

	let stages = $derived(
		(Object.keys(stageMeta) as WillStage[])
			.map((stage) => ({
				stage,
				label: stageMeta[stage].label,
				steps: activeSteps.filter((s) => s.stage === stage),
			}))
			.filter((g) => g.steps.length > 0),
	);

	function isAnswered(id: string): boolean {
		const v = values[id];
		return v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === '');
	}

	function namedHeirs() {
		return getNamedHeirs(values);
	}

	function executors(id: string): ExecutorEntry[] {
		const v = values[id];
		return Array.isArray(v) ? (v as ExecutorEntry[]) : [];
	}

	function guardians(id: string): GuardianEntry[] {
		const v = values[id];
		return Array.isArray(v) ? (v as GuardianEntry[]) : [];
	}

	function wasiyyah(id: string): WillWasiyyahResponse | null {
		const v = values[id];
		if (v && typeof v === 'object' && 'interested' in v) return v as WillWasiyyahResponse;
		return null;
	}

	function yesNo(v: unknown): string {
		if (v === true || v === 'yes') return 'Yes';
		if (v === false || v === 'no') return 'No';
		if (v === 'unsure') return 'Unsure';
		return '—';
	}
</script>

<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden">
	<div class="px-6 py-4 border-b border-navy/[0.06]">
		<h3 class="text-sm font-medium text-navy">Will responses</h3>
	</div>

	{#if stages.length === 0}
		<div class="px-6 py-8 text-center">
			<p class="text-[13px] text-navy/40">No responses recorded yet.</p>
		</div>
	{:else}
		<div class="px-6 py-5 space-y-6">
			{#each stages as group}
				<div>
					<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-3">{group.label}</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
						{#each group.steps as step}
							<div class="flex flex-col gap-1.5 py-1 min-w-0">
								<span class="text-[12px] text-navy/40">{step.question}</span>

								{#if step.type === 'heirs-calculator'}
									{@const heirs = namedHeirs()}
									{#if heirs.length > 0}
										<div class="space-y-1.5">
											{#each heirs as heir}
												<div class="text-[13px] text-navy font-medium flex items-center gap-2 flex-wrap">
													<span>{heir.names.filter(Boolean).join(', ') || heir.label}</span>
													<span class="text-[11px] text-navy/40 font-normal">({heir.label} — {heir.totalShare.display})</span>
												</div>
											{/each}
										</div>
									{:else}
										<span class="text-[13px] text-navy/25">—</span>
									{/if}
								{:else if step.type === 'executors'}
									{@const list = executors(step.id)}
									{#if list.length > 0}
										<div class="space-y-1">
											{#each list as e, idx}
												{#if e.fullName?.trim()}
													<div class="text-[13px] text-navy flex items-baseline gap-1.5">
														<span class="text-navy/30 tabular-nums text-[11px] shrink-0">{idx + 1}.</span>
														<span>
															<span class="font-medium">{e.fullName}</span>
															<span class="text-navy/40"> ({e.relationship}{e.contact ? ` · ${e.contact}` : ''})</span>
														</span>
													</div>
												{/if}
											{/each}
										</div>
									{:else}
										<span class="text-[13px] text-navy/25">—</span>
									{/if}
								{:else if step.type === 'guardians'}
									{@const list = guardians(step.id)}
									{#if list.length > 0}
										<div class="space-y-1">
											{#each list as g, idx}
												{#if g.fullName?.trim()}
													<div class="text-[13px] text-navy flex items-baseline gap-1.5">
														<span class="text-navy/30 tabular-nums text-[11px] shrink-0">{idx + 1}.</span>
														<span>
															<span class="font-medium">{g.fullName}</span>
															<span class="text-navy/40"> ({g.relationship}{g.contact ? ` · ${g.contact}` : ''})</span>
														</span>
													</div>
												{/if}
											{/each}
										</div>
									{:else}
										<span class="text-[13px] text-navy/25">—</span>
									{/if}
								{:else if step.type === 'wasiyyah'}
									{@const w = wasiyyah(step.id)}
									{#if w && w.interested && w.bequests.length > 0}
										<div class="space-y-1">
											{#each w.bequests as b}
												{@const name = resolveWillWasiyyahRecipientName(b, presetCharityNames)}
												<div class="text-[13px] text-navy">
													<span class="font-medium">{name || 'Recipient'}</span>
													{#if b.customEin}<span class="text-navy/35 text-[11px]"> · EIN {b.customEin}</span>{/if}
													<span class="text-navy/40"> — {b.percentage}%</span>
												</div>
											{/each}
										</div>
									{:else if w}
										<span class="text-[13px] text-navy/60">Not interested</span>
									{:else}
										<span class="text-[13px] text-navy/25">—</span>
									{/if}
								{:else if step.type === 'address'}
									{@const addr = formatAddress(values)}
									<span class="text-[13px] text-navy font-medium {addr ? '' : 'text-navy/25'}">{addr || '—'}</span>
								{:else if step.type === 'state'}
									{@const code = typeof values[step.id] === 'string' ? (values[step.id] as string) : ''}
									<span class="text-[13px] text-navy font-medium {code ? '' : 'text-navy/25'}">{code ? stateName(code) : '—'}</span>
								{:else if step.type === 'yes-no' || step.type === 'yes-no-unsure'}
									<span class="text-[13px] text-navy font-medium {isAnswered(step.id) ? '' : 'text-navy/25'}">{yesNo(values[step.id])}</span>
								{:else}
									{@const v = values[step.id]}
									<span class="text-[13px] text-navy font-medium {isAnswered(step.id) ? '' : 'text-navy/25'}">
										{typeof v === 'string' && v.trim() ? v : '—'}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
