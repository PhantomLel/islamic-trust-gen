<script lang="ts">
	import { siteName, screeningQuestions } from '$lib/config';
	import { authClient } from '$lib/auth-client';

	let { firstName, trustId, onsubmit: onsubmitProp }: {
		firstName: string;
		trustId: number;
		onsubmit: (eligible: boolean) => void;
	} = $props();

	let screeningAnswers = $state<Record<string, boolean | null>>(
		Object.fromEntries(screeningQuestions.map((q) => [q.id, null]))
	);
	let screeningIndex = $state(0);
	let submitting = $state(false);

	let allAnswered = $derived(screeningQuestions.every((q) => screeningAnswers[q.id] !== null));
	let anyYes = $derived(screeningQuestions.some((q) => screeningAnswers[q.id] === true));
	let currentQ = $derived(screeningQuestions[screeningIndex]);

	function answer(id: string, value: boolean) {
		screeningAnswers = { ...screeningAnswers, [id]: value };
		if (screeningIndex < screeningQuestions.length - 1) {
			screeningIndex++;
		}
	}

	async function submit() {
		submitting = true;
		onsubmitProp(!anyYes);
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}
</script>

<div class="h-screen w-screen overflow-hidden bg-cream font-sans flex flex-col relative">
	<div class="absolute inset-0 pointer-events-none"
		style="background:
			radial-gradient(ellipse 80% 60% at 50% 40%, rgba(74,124,111,0.07) 0%, transparent 70%),
			radial-gradient(ellipse 40% 40% at 20% 80%, rgba(74,124,111,0.03) 0%, transparent 60%);">
	</div>

	<nav class="relative z-10 shrink-0 flex items-center justify-between px-8 py-6 max-w-5xl w-full mx-auto">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<button onclick={handleLogout} class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer">Log out</button>
	</nav>

	<div class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16">
		<div class="text-center mb-10">
			<div class="flex items-center justify-center gap-4 mb-5">
				<span class="w-8 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Before We Begin</span>
				<span class="w-8 h-px bg-emerald-accent/60"></span>
			</div>
			<h1 class="text-3xl md:text-4xl font-semibold text-navy tracking-tight mb-3">Welcome, {firstName}</h1>
			<p class="text-navy/50 text-base font-light max-w-md mx-auto leading-relaxed">
				Please answer a few quick questions so we can determine the best path for your estate plan.
			</p>
		</div>

		<div class="w-full max-w-lg">
			<!-- progress -->
			<div class="flex items-center justify-between mb-2">
				<span class="text-[11px] text-navy/40 tracking-wider uppercase font-medium">Eligibility Check</span>
				<span class="text-[11px] text-navy/35">{screeningIndex + 1} of {screeningQuestions.length}</span>
			</div>
			<div class="w-full h-1 rounded-full bg-navy/[0.06] overflow-hidden mb-10">
				<div class="h-full rounded-full bg-emerald-accent transition-all duration-500 ease-out"
					style="width: {((screeningIndex + 1) / screeningQuestions.length) * 100}%"></div>
			</div>

			<!-- question -->
			<h2 class="text-2xl md:text-3xl font-semibold text-navy tracking-tight leading-snug mb-8">
				{currentQ.text}
			</h2>

			<div class="flex gap-3 mb-8">
				{#each [{ label: 'Yes', value: true }, { label: 'No', value: false }] as opt}
					{@const sel = screeningAnswers[currentQ.id] === opt.value}
					<button onclick={() => answer(currentQ.id, opt.value)}
						class="flex-1 px-5 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer
							   {sel ? 'bg-emerald-accent/8 border-emerald-accent/30 text-navy font-medium' : 'bg-white border-navy/10 text-navy/70 hover:border-navy/20'}">
						{opt.label}
					</button>
				{/each}
			</div>

			<!-- nav -->
			<div class="flex items-center justify-between">
				<button onclick={() => { if (screeningIndex > 0) screeningIndex--; }}
					disabled={screeningIndex === 0}
					class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm text-navy/60
						   transition-all hover:text-navy hover:bg-navy/[0.04]
						   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
					Back
				</button>

				{#if screeningIndex < screeningQuestions.length - 1}
					<button onclick={() => { if (screeningAnswers[currentQ.id] !== null) screeningIndex++; }}
						disabled={screeningAnswers[currentQ.id] === null}
						class="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy
							   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
							   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
						Next
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{:else}
					<button onclick={submit}
						disabled={!allAnswered || submitting}
						class="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy
							   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
							   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
						{submitting ? 'Submitting...' : 'Continue'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
