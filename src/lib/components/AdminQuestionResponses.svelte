<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		questions,
		charities,
		type ChildResponse,
		type HeirResponse,
		type CharityResponse,
		type HeirsCalculatorResponse,
		type QuestionResponseValue
	} from '$lib/config';
	import { isQuestionResponseAnswered } from '$lib/question-response-helpers';

	type TrustResponse = { id: string; response: unknown };
	type TrustDetails = {
		id: number;
		complete: boolean;
		responses: TrustResponse[];
	};

	let { trust }: { trust: TrustDetails } = $props();

	let editing = $state(false);
	let editResponses = $state<Record<string, QuestionResponseValue>>({});
	let saving = $state(false);

	let trustProgress = $derived(getProgress(trust.responses));

	function enterEdit() {
		editing = true;
		const map: Record<string, QuestionResponseValue> = {};
		for (const response of trust.responses) {
			map[response.id] = response.response as QuestionResponseValue;
		}
		editResponses = map;
	}

	function exitEdit() {
		editing = false;
		editResponses = {};
	}

	function setEditValue(questionId: string, value: QuestionResponseValue) {
		editResponses = { ...editResponses, [questionId]: value };
	}

	function normalizeChildren(value: unknown): ChildResponse[] {
		if (!Array.isArray(value)) return [];
		return value
			.filter((child) => !!child && typeof child === 'object')
			.map((child) => {
				const entry = child as Partial<ChildResponse>;
				return {
					firstName: typeof entry.firstName === 'string' ? entry.firstName : '',
					lastName: typeof entry.lastName === 'string' ? entry.lastName : '',
					dob: typeof entry.dob === 'string' ? entry.dob : ''
				};
			});
	}

	function getEditChildren(questionId: string): ChildResponse[] {
		return normalizeChildren(editResponses[questionId]);
	}

	function normalizeHeirs(value: unknown): HeirResponse[] {
		if (!Array.isArray(value)) return [];
		return value
			.filter((heir) => !!heir && typeof heir === 'object')
			.map((heir) => {
				const entry = heir as Partial<HeirResponse>;
				return {
					firstName: typeof entry.firstName === 'string' ? entry.firstName : '',
					lastName: typeof entry.lastName === 'string' ? entry.lastName : ''
				};
			});
	}

	function getEditHeirs(questionId: string): HeirResponse[] {
		return normalizeHeirs(editResponses[questionId]);
	}

	function updateEditChild(questionId: string, index: number, field: keyof ChildResponse, value: string) {
		const next = getEditChildren(questionId);
		next[index] = {
			...next[index],
			[field]: value
		};
		setEditValue(questionId, next);
	}

	function addEditChild(questionId: string) {
		setEditValue(questionId, [
			...getEditChildren(questionId),
			{ firstName: '', lastName: '', dob: '' }
		]);
	}

	function removeEditChild(questionId: string, index: number) {
		const next = getEditChildren(questionId).filter((_, i) => i !== index);
		setEditValue(questionId, next.length > 0 ? next : null);
	}

	function updateEditHeir(questionId: string, index: number, field: keyof HeirResponse, value: string) {
		const next = getEditHeirs(questionId);
		next[index] = {
			...next[index],
			[field]: value
		};
		setEditValue(questionId, next);
	}

	function addEditHeir(questionId: string) {
		setEditValue(questionId, [...getEditHeirs(questionId), { firstName: '', lastName: '' }]);
	}

	function removeEditHeir(questionId: string, index: number) {
		const next = getEditHeirs(questionId).filter((_, i) => i !== index);
		setEditValue(questionId, next.length > 0 ? next : null);
	}

	function normalizeCharities(value: unknown): CharityResponse[] {
		if (!Array.isArray(value)) return [];
		return value
			.filter((charity) => !!charity && typeof charity === 'object')
			.map((charity) => {
				const entry = charity as Partial<CharityResponse>;
				return {
					charityId: typeof entry.charityId === 'string' ? entry.charityId : '',
					percentage: typeof entry.percentage === 'number' ? entry.percentage : 0
				};
			});
	}

	function getEditCharities(questionId: string): CharityResponse[] {
		return normalizeCharities(editResponses[questionId]);
	}

	function isEditCharitySelected(questionId: string, charityId: string): boolean {
		return getEditCharities(questionId).some((c) => c.charityId === charityId);
	}

	function toggleEditCharity(questionId: string, charityId: string) {
		const current = getEditCharities(questionId);
		const exists = current.some((c) => c.charityId === charityId);
		
		if (exists) {
			const next = current.filter((c) => c.charityId !== charityId);
			setEditValue(questionId, next.length > 0 ? next : null);
		} else {
			setEditValue(questionId, [...current, { charityId, percentage: 0 }]);
		}
	}

	function updateEditCharityPercentage(questionId: string, charityId: string, percentage: number) {
		const current = getEditCharities(questionId);
		const next = current.map((c) => 
			c.charityId === charityId ? { ...c, percentage } : c
		);
		setEditValue(questionId, next);
	}

	function getEditCharityTotalPercentage(questionId: string): number {
		return getEditCharities(questionId).reduce((sum, c) => sum + (c.percentage || 0), 0);
	}

	function normalizeHeirsCalculator(value: unknown): HeirsCalculatorResponse | null {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
		if (!('verified' in value)) return null;
		return value as HeirsCalculatorResponse;
	}

	function getRawResponse(responses: TrustResponse[], questionId: string): unknown {
		const response = responses.find((res) => res.id === questionId);
		return response?.response ?? null;
	}

	function getAnswer(responses: TrustResponse[], questionId: string): string {
		const raw = getRawResponse(responses, questionId);
		if (raw == null) return '—';
		if (Array.isArray(raw)) {
			if (raw.length === 0) return '—';
			const first = raw[0];
			if (first && typeof first === 'object' && 'firstName' in first) {
				const children = normalizeChildren(raw);
				return children.length > 0 ? `${children.length} child(ren)` : '—';
			}
			if (first && typeof first === 'object' && 'charityId' in first) {
				const charitiesData = normalizeCharities(raw);
				return charitiesData.length > 0 ? `${charitiesData.length} charity(ies)` : '—';
			}
			return '—';
		}
		if (raw && typeof raw === 'object' && 'verified' in raw) {
			const hc = raw as HeirsCalculatorResponse;
			if (!hc.verified) return 'Not completed';
			return `${hc.namedHeirs.length} heir(s) — ${hc.namedHeirs.map(h => h.names.join(', ')).join('; ')}`;
		}
		if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
		return String(raw);
	}

	function getProgress(responses: TrustResponse[]): number {
		if (questions.length === 0) return 0;
		const answered = responses.filter((r) => isQuestionResponseAnswered(r.response)).length;
		return Math.round((answered / questions.length) * 100);
	}

	function formatDob(dob: string): string {
		const [year, month, day] = dob.split('-').map(Number);
		if (!year || !month || !day) return dob;
		return new Date(year, month - 1, day).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getChildDisplayName(child: ChildResponse): string {
		const fullName = `${child.firstName} ${child.lastName}`.trim();
		return fullName || 'Unnamed child';
	}

	async function saveEdit() {
		saving = true;
		const responses = questions.map((q) => ({
			id: q.id,
			response: editResponses[q.id] ?? null
		}));
		const formData = new FormData();
		formData.set('trustId', String(trust.id));
		formData.set('responses', JSON.stringify(responses));
		await fetch('?/save', { method: 'POST', body: formData });
		await invalidateAll();
		saving = false;
		exitEdit();
	}
</script>

<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden">
	<div class="px-6 py-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h2 class="text-sm font-medium text-navy">Intake Responses</h2>
			<div class="flex items-center gap-2">
				<div class="w-20 h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
					<div class="h-full rounded-full transition-all duration-500
								{trust.complete ? 'bg-emerald-accent' : trustProgress > 0 ? 'bg-amber-400' : 'bg-navy/10'}"
						style="width: {trustProgress}%"></div>
				</div>
				<span class="text-[11px] text-navy/40">{trustProgress}%</span>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if editing}
				<button onclick={exitEdit}
					class="text-[12px] text-navy/40 hover:text-navy transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-navy/[0.04]">
					Cancel
				</button>
				<button onclick={saveEdit} disabled={saving}
					class="text-[12px] text-white bg-emerald-accent hover:bg-emerald-accent/90 transition-colors cursor-pointer px-4 py-1.5 rounded-lg disabled:opacity-50">
					{saving ? 'Saving...' : 'Save'}
				</button>
			{:else}
				<button onclick={enterEdit}
					class="text-[12px] text-navy/40 hover:text-navy transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-navy/[0.04] flex items-center gap-1.5">
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
					Edit
				</button>
			{/if}
		</div>
	</div>

	<div class="border-t border-navy/[0.06] px-6 py-5">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
			{#each questions as q}
				{@const raw = getRawResponse(trust.responses, q.id)}
				{@const answer = getAnswer(trust.responses, q.id)}
				<div class="flex flex-col gap-1.5 py-1 min-w-0">
					<span class="text-[12px] text-navy/40">{q.text}</span>
					{#if editing}
						{#if q.type === 'children'}
							{@const children = getEditChildren(q.id)}
							<div class="space-y-2">
								{#if children.length === 0}
									<div class="rounded-md border border-dashed border-navy/15 bg-white/60 px-3 py-2 text-[12px] text-navy/40">
										No children added.
									</div>
								{/if}
								{#each children as child, idx}
									<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,155px)_auto] gap-2 items-center rounded-md border border-navy/10 bg-white p-2">
										<input
											type="text"
											value={child.firstName}
											oninput={(e) => updateEditChild(q.id, idx, 'firstName', e.currentTarget.value)}
											placeholder="First name"
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
										/>
										<input
											type="text"
											value={child.lastName}
											oninput={(e) => updateEditChild(q.id, idx, 'lastName', e.currentTarget.value)}
											placeholder="Last name"
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
										/>
										<input
											type="date"
											value={child.dob}
											oninput={(e) => updateEditChild(q.id, idx, 'dob', e.currentTarget.value)}
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40 sm:col-span-1 xl:col-span-1"
										/>
										<button
											onclick={() => removeEditChild(q.id, idx)}
											class="h-[31px] px-2.5 rounded-md border border-navy/10 text-[11px] text-navy/50 hover:text-navy hover:border-navy/20 transition-colors cursor-pointer justify-self-start sm:col-span-2 xl:col-span-1 xl:justify-self-auto"
										>
											Remove
										</button>
									</div>
								{/each}
								<button
									onclick={() => addEditChild(q.id)}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border border-emerald-accent/25 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-all cursor-pointer"
								>
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									Add Child
								</button>
							</div>
						{:else if q.type === 'heir'}
							{@const heirs = getEditHeirs(q.id)}
							<div class="space-y-2">
								{#if heirs.length === 0}
									<div class="rounded-md border border-dashed border-navy/15 bg-white/60 px-3 py-2 text-[12px] text-navy/40">
										No heirs added.
									</div>
								{/if}
								{#each heirs as heir, idx}
									<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center rounded-md border border-navy/10 bg-white p-2">
										<input
											type="text"
											value={heir.firstName}
											oninput={(e) => updateEditHeir(q.id, idx, 'firstName', e.currentTarget.value)}
											placeholder="First name"
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
										/>
										<input
											type="text"
											value={heir.lastName}
											oninput={(e) => updateEditHeir(q.id, idx, 'lastName', e.currentTarget.value)}
											placeholder="Last name"
											class="px-2.5 py-1.5 rounded-md text-[12px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40"
										/>
										<button
											onclick={() => removeEditHeir(q.id, idx)}
											class="h-[31px] px-2.5 rounded-md border border-navy/10 text-[11px] text-navy/50 hover:text-navy hover:border-navy/20 transition-colors cursor-pointer justify-self-start sm:col-span-2 xl:col-span-1 xl:justify-self-auto"
										>
											Remove
										</button>
									</div>
								{/each}
								<button
									onclick={() => addEditHeir(q.id)}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border border-emerald-accent/25 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-all cursor-pointer"
								>
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									Add Heir
								</button>
							</div>
						{:else if q.type === 'charities'}
							{@const editChars = getEditCharities(q.id)}
							<div class="space-y-2">
								{#each charities as charity}
									{@const selected = isEditCharitySelected(q.id, charity.id)}
									{@const charityData = editChars.find((c) => c.charityId === charity.id)}
									{@const percentage = charityData?.percentage ?? 0}
									
									<div class="rounded-md border transition-all
										{selected ? 'border-emerald-accent/30 bg-emerald-accent/5' : 'border-navy/10 bg-white'} p-2.5">
										<div class="flex items-center gap-3">
											<button
												type="button"
												onclick={() => toggleEditCharity(q.id, charity.id)}
												class="flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 transition-colors cursor-pointer
													{selected ? 'border-emerald-accent bg-emerald-accent' : 'border-navy/20 bg-white hover:border-navy/30'}"
											>
												{#if selected}
													<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
														<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
													</svg>
												{/if}
											</button>
											
											<div class="flex-1 min-w-0 flex items-center gap-2">
												<div class="text-[12px] font-medium text-navy truncate">{charity.name}</div>
												{#if selected}
													<input
														type="number"
														min="0"
														max="100"
														step="0.1"
														value={percentage}
														oninput={(e) => {
															const val = parseFloat(e.currentTarget.value);
															if (!isNaN(val)) updateEditCharityPercentage(q.id, charity.id, val);
														}}
														class="w-16 px-2 py-1 rounded-md border border-navy/10 text-[11px] text-navy outline-none transition-all focus:border-emerald-accent/40"
														placeholder="0"
													/>
													<span class="text-[11px] text-navy/50">%</span>
												{/if}
											</div>
										</div>
									</div>
								{/each}
								
								{#if editChars.length > 0}
									{@const totalEditPercentage = getEditCharityTotalPercentage(q.id)}
									{@const exceedsEditLimit = totalEditPercentage > 100}
									
									<div class="mt-2 pt-2 border-t border-navy/10">
										<div class="flex items-center justify-between px-2 py-1.5 rounded-md bg-navy/5">
											<span class="text-[11px] font-medium text-navy">Total Allocated:</span>
											<span class="text-[11px] font-semibold {exceedsEditLimit ? 'text-red-500' : 'text-emerald-accent'}">
												{totalEditPercentage.toFixed(1)}%
											</span>
										</div>
										{#if exceedsEditLimit}
											<div class="flex items-start gap-1.5 mt-1.5 px-2 py-1.5 rounded-md bg-red-50 border border-red-200">
												<svg class="w-3 h-3 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
												</svg>
												<p class="text-[11px] text-red-600 leading-relaxed">
													Total percentage cannot exceed 100%.
												</p>
											</div>
										{/if}
									</div>
								{/if}
							</div>
					{:else if q.type === 'heirs-calculator'}
						{@const hc = normalizeHeirsCalculator(editResponses[q.id])}
						{#if hc?.verified && hc.namedHeirs.length > 0}
							<div class="space-y-1">
								{#each hc.namedHeirs as heir}
									<div class="text-[12px] text-navy flex items-center gap-2">
										<span class="font-medium">{heir.names.join(', ')}</span>
										<span class="text-navy/40">({heir.label} — {heir.totalShare.display})</span>
									</div>
								{/each}
							</div>
							<p class="text-[11px] text-navy/35 mt-1.5">Edit through the trust questionnaire.</p>
						{:else}
							<p class="text-[12px] text-navy/40">Not completed. Edit through the trust questionnaire.</p>
						{/if}
					{:else if q.type === 'boolean'}
						<div class="flex gap-2">
							{#each [{ label: 'Yes', value: true }, { label: 'No', value: false }] as opt}
									{@const sel = editResponses[q.id] === opt.value}
									<button onclick={() => setEditValue(q.id, opt.value)}
										class="px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
												{sel ? 'bg-emerald-accent/10 border-emerald-accent/30 text-navy font-medium' : 'bg-white border-navy/10 text-navy/50 hover:border-navy/20'}">
										{opt.label}
									</button>
								{/each}
							</div>
						{:else if q.type === 'select' && q.options}
							<div class="flex flex-wrap gap-2">
								{#each q.options as option}
									{@const sel = editResponses[q.id] === option}
									<button onclick={() => setEditValue(q.id, option)}
										class="px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
												{sel ? 'bg-emerald-accent/10 border-emerald-accent/30 text-navy font-medium' : 'bg-white border-navy/10 text-navy/50 hover:border-navy/20'}">
										{option}
									</button>
								{/each}
							</div>
						{:else if q.type === 'date'}
							<input type="date" value={editResponses[q.id] ?? ''}
								oninput={(e) => setEditValue(q.id, e.currentTarget.value || null)}
								class="px-3 py-1.5 rounded-lg text-[13px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40 w-full max-w-[200px]" />
						{:else}
							<input type={q.type === 'tel' ? 'tel' : 'text'} value={editResponses[q.id] ?? ''}
								oninput={(e) => setEditValue(q.id, e.currentTarget.value || null)}
								placeholder="—"
								class="px-3 py-1.5 rounded-lg text-[13px] text-navy border border-navy/10 bg-white outline-none focus:border-emerald-accent/40 w-full max-w-[280px] placeholder:text-navy/20" />
						{/if}
					{:else}
						{#if q.type === 'children'}
							{@const children = normalizeChildren(raw)}
							{#if children.length > 0}
								<div class="space-y-1.5">
									{#each children as child}
										<div class="text-[13px] text-navy font-medium">
											{getChildDisplayName(child)}
											<span class="text-navy/35 font-normal"> — {child.dob ? formatDob(child.dob) : 'No DOB provided'}</span>
										</div>
									{/each}
								</div>
							{:else}
								<span class="text-[13px] text-navy/25">—</span>
							{/if}
						{:else if q.type === 'heir'}
							{@const heirs = normalizeHeirs(raw)}
							{#if heirs.length > 0}
								<div class="space-y-1.5">
									{#each heirs as heir}
										<div class="text-[13px] text-navy font-medium">
											{`${heir.firstName} ${heir.lastName}`.trim() || 'Unnamed heir'}
										</div>
									{/each}
								</div>
							{:else}
								<span class="text-[13px] text-navy/25">—</span>
							{/if}
						{:else if q.type === 'charities'}
							{@const charitiesData = normalizeCharities(raw)}
							{#if charitiesData.length > 0}
								{@const totalViewPercentage = charitiesData.reduce((sum, c) => sum + (c.percentage || 0), 0)}
								<div class="space-y-1.5">
									{#each charitiesData as charityData}
										{@const charity = charities.find((c) => c.id === charityData.charityId)}
										{#if charity}
											<div class="text-[13px] text-navy font-medium">
												{charity.name}
												<span class="text-navy/35 font-normal"> — {charityData.percentage}%</span>
											</div>
										{/if}
									{/each}
									<div class="mt-2 pt-2 border-t border-navy/10">
										<div class="text-[11px] text-navy/50">
											Total: <span class="font-semibold {totalViewPercentage > 100 ? 'text-red-500' : 'text-emerald-accent'}">{totalViewPercentage.toFixed(1)}%</span>
										</div>
									</div>
								</div>
							{:else}
								<span class="text-[13px] text-navy/25">—</span>
							{/if}
					{:else if q.type === 'heirs-calculator'}
						{@const hc = normalizeHeirsCalculator(raw)}
						{#if hc?.verified && hc.namedHeirs.length > 0}
							<div class="space-y-1.5">
								{#each hc.namedHeirs as heir}
									<div class="text-[13px] text-navy font-medium flex items-center gap-2">
										<span>{heir.names.join(', ')}</span>
										<span class="text-[11px] text-navy/40 font-normal">({heir.label} — {heir.totalShare.display})</span>
									</div>
								{/each}
								{#if hc.awlApplied || hc.raddApplied}
									<div class="flex gap-1.5 mt-1">
										{#if hc.awlApplied}<span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700">ʿAwl</span>{/if}
										{#if hc.raddApplied}<span class="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">Radd</span>{/if}
									</div>
								{/if}
							</div>
						{:else}
							<span class="text-[13px] text-navy/25">—</span>
						{/if}
					{:else}
						<span class="text-[13px] text-navy font-medium {answer === '—' ? 'text-navy/25' : ''}">{answer}</span>
					{/if}
				{/if}
			</div>
		{/each}
		</div>
	</div>
</div>
