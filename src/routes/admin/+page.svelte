<script lang="ts">
	import { siteName, questions } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let expandedTrust = $state<number | null>(null);
	let copiedEmail = $state<string | null>(null);
	let editingTrust = $state<number | null>(null);
	let editResponses = $state<Record<string, string | boolean | null>>({});
	let saving = $state(false);

	async function copyEmail(e: Event, email: string) {
		e.stopPropagation();
		await navigator.clipboard.writeText(email);
		copiedEmail = email;
		setTimeout(() => { copiedEmail = null; }, 1500);
	}

	function toggle(id: number) {
		expandedTrust = expandedTrust === id ? null : id;
		if (expandedTrust !== id) exitEdit();
	}

	function enterEdit(t: typeof data.trusts[0]) {
		editingTrust = t.id;
		const map: Record<string, string | boolean | null> = {};
		for (const r of t.responses) {
			map[r.id] = r.response as string | boolean | null;
		}
		editResponses = map;
	}

	function exitEdit() {
		editingTrust = null;
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
		<!-- header -->
		<div class="mb-10">
			<h1 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight mb-2">Trusts</h1>
			<p class="text-navy/45 text-sm font-light">{data.trusts.length} total trust{data.trusts.length !== 1 ? 's' : ''}</p>
		</div>

		{#if data.trusts.length === 0}
			<div class="rounded-2xl bg-white/60 border border-navy/[0.06] p-12 text-center">
				<p class="text-navy/40 text-sm">No trusts created yet.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.trusts as t}
					{@const progress = getProgress(t.responses)}
					{@const isOpen = expandedTrust === t.id}

					<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] overflow-hidden transition-all duration-200
								{isOpen ? 'shadow-lg shadow-navy/[0.04]' : ''}">

						<!-- row header -->
						<div
							onclick={() => toggle(t.id)}
							class="group w-full flex items-center gap-4 px-6 py-5 text-left cursor-pointer hover:bg-navy/[0.02] transition-colors"
							role="button"
							tabindex="0"
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(t.id); }}
						>
							<!-- status dot -->
							<div class="w-2.5 h-2.5 rounded-full shrink-0 {t.complete ? 'bg-emerald-accent' : progress > 0 ? 'bg-amber-400' : 'bg-navy/15'}"></div>

							<!-- user info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-navy truncate">{t.user.name}</span>
									<span class="text-[11px] text-navy/30">&middot;</span>
									<span class="text-[12px] text-navy/40 truncate">{t.user.email}</span>
									<button
										onclick={(e) => copyEmail(e, t.user.email)}
										class="opacity-0 group-hover:opacity-100 transition-opacity text-navy/25 hover:text-navy/60 cursor-pointer shrink-0"
										title="Copy email"
									>
										{#if copiedEmail === t.user.email}
											<svg class="w-3.5 h-3.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
										{:else}
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
										{/if}
									</button>
								</div>
								<div class="flex items-center gap-3 mt-1">
									<span class="text-[11px] text-navy/35">
										{t.joint === null ? 'Not selected' : t.joint ? 'Joint' : 'Individual'}
									</span>
									<span class="text-[11px] text-navy/20">&middot;</span>
									<span class="text-[11px] text-navy/35">Created {formatDate(t.createdAt)}</span>
								</div>
							</div>

							<!-- progress -->
							<div class="hidden sm:flex items-center gap-3 shrink-0">
								<div class="w-24 h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
									<div class="h-full rounded-full transition-all duration-500
												{t.complete ? 'bg-emerald-accent' : progress > 0 ? 'bg-amber-400' : 'bg-navy/10'}"
										style="width: {progress}%"></div>
								</div>
								<span class="text-[11px] text-navy/40 w-8 text-right">{progress}%</span>
							</div>

							<!-- chevron -->
							<svg class="w-4 h-4 text-navy/25 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
								fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</div>

						<!-- expanded detail -->
						{#if isOpen}
							{@const isEditing = editingTrust === t.id}
							<div class="border-t border-navy/[0.06] px-6 py-6">
								<!-- toolbar -->
								<div class="flex items-center justify-between mb-5">
									{#if isEditing}
										<span class="text-[11px] text-emerald-accent tracking-wider uppercase font-medium">Editing</span>
										<div class="flex items-center gap-2">
											<button onclick={() => exitEdit()}
												class="text-[12px] text-navy/40 hover:text-navy transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-navy/[0.04]">
												Cancel
											</button>
											<button onclick={() => saveEdit(t.id)} disabled={saving}
												class="text-[12px] text-white bg-emerald-accent hover:bg-emerald-accent/90 transition-colors cursor-pointer px-4 py-1.5 rounded-lg disabled:opacity-50">
												{saving ? 'Saving...' : 'Save'}
											</button>
										</div>
									{:else}
										<div></div>
										<button onclick={() => enterEdit(t)}
											class="text-[12px] text-navy/40 hover:text-navy transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-navy/[0.04] flex items-center gap-1.5">
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
											Edit Mode
										</button>
									{/if}
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
									{#each questions as q}
										{@const answer = getAnswer(t.responses, q.id)}
										<div class="flex flex-col gap-1.5 py-1">
											<span class="text-[12px] text-navy/40">{q.text}</span>
											{#if isEditing}
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

								<!-- meta -->
								<div class="mt-6 pt-4 border-t border-navy/[0.06] flex flex-wrap items-center gap-x-6 gap-y-2">
									<span class="text-[11px] text-navy/30">Trust ID: {t.id}</span>
									<span class="text-[11px] text-navy/30">User ID: {t.user.id}</span>
									<span class="text-[11px] text-navy/30">Updated: {formatDate(t.updatedAt)}</span>
									<span class="text-[11px] text-navy/30">
										Status: {t.complete ? 'Complete' : 'In progress'}
									</span>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
