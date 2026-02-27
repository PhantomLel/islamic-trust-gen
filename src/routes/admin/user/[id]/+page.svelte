<script lang="ts">
	import { siteName, questions } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let trust = $derived(data.trusts[0] ?? null);
	let trustProgress = $derived(trust ? getProgress(trust.responses) : 0);

	let copiedEmail = $state(false);
	let editing = $state(false);
	let editResponses = $state<Record<string, string | boolean | null>>({});
	let saving = $state(false);

	async function copyEmail() {
		await navigator.clipboard.writeText(data.targetUser.email);
		copiedEmail = true;
		setTimeout(() => { copiedEmail = false; }, 1500);
	}

	function enterEdit() {
		if (!trust) return;
		editing = true;
		const map: Record<string, string | boolean | null> = {};
		for (const r of trust.responses) {
			map[r.id] = r.response as string | boolean | null;
		}
		editResponses = map;
	}

	function exitEdit() {
		editing = false;
		editResponses = {};
	}

	function setEditValue(questionId: string, value: string | boolean | null) {
		editResponses = { ...editResponses, [questionId]: value };
	}

	async function saveEdit(trustId: number) {
		saving = true;
		const responses = questions.map((q) => ({
			id: q.id,
			response: editResponses[q.id] ?? null,
		}));
		const formData = new FormData();
		formData.set('trustId', String(trustId));
		formData.set('responses', JSON.stringify(responses));
		await fetch('?/save', { method: 'POST', body: formData });
		await invalidateAll();
		saving = false;
		exitEdit();
	}

	function getAnswer(responses: { id: string; response: unknown }[], questionId: string): string {
		const r = responses.find((res) => res.id === questionId);
		if (!r || r.response == null) return '—';
		if (typeof r.response === 'boolean') return r.response ? 'Yes' : 'No';
		return String(r.response);
	}

	function getProgress(responses: { id: string; response: unknown }[]): number {
		if (questions.length === 0) return 0;
		const answered = responses.filter((r) => r.response != null && r.response !== '').length;
		return Math.round((answered / questions.length) * 100);
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
							<span>{trust.complete ? 'Complete' : 'In progress'}</span>
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

					<button onclick={toggleConsultation}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
							   bg-navy/[0.03] border-navy/10 hover:bg-navy/[0.06]
							   {data.targetUser.requestedConsultation ? 'text-navy/50' : 'text-navy/35'}">
						<span class="w-1.5 h-1.5 rounded-full {data.targetUser.requestedConsultation ? 'bg-amber-300' : 'bg-navy/20'}"></span>
						{data.targetUser.requestedConsultation ? 'Consultation requested' : 'No consultation'}
					</button>
				</div>
			</div>
		</div>

		<!-- questionnaire answers -->
		{#if trust}
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
							<button onclick={() => saveEdit(trust.id)} disabled={saving}
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
							{@const answer = getAnswer(trust.responses, q.id)}
							<div class="flex flex-col gap-1.5 py-1">
								<span class="text-[12px] text-navy/40">{q.text}</span>
								{#if editing}
									{#if q.type === 'boolean'}
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
									<span class="text-[13px] text-navy font-medium {answer === '—' ? 'text-navy/25' : ''}">{answer}</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-2xl bg-white/60 border border-navy/[0.06] p-12 text-center">
				<p class="text-navy/40 text-sm">No trust created yet.</p>
			</div>
		{/if}
	</div>
</div>
