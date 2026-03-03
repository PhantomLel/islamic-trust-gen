<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		isQuestionResponseAnswered,
		questions,
		type ChildResponse,
		type QuestionResponseValue
	} from '$lib/config';

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

	function getRawResponse(responses: TrustResponse[], questionId: string): unknown {
		const response = responses.find((res) => res.id === questionId);
		return response?.response ?? null;
	}

	function getAnswer(responses: TrustResponse[], questionId: string): string {
		const raw = getRawResponse(responses, questionId);
		if (raw == null) return '—';
		if (Array.isArray(raw)) {
			const children = normalizeChildren(raw);
			return children.length > 0 ? `${children.length} child(ren)` : '—';
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
						{:else}
							<span class="text-[13px] text-navy font-medium {answer === '—' ? 'text-navy/25' : ''}">{answer}</span>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
