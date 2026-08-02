<script lang="ts">
	import { tick } from 'svelte';
	import type { HelpRenderedResponse } from '$lib/server/db/help.schema';
	import HelpCtaRow from './HelpCtaRow.svelte';

	let {
		surface,
		stepKey = null,
		trustId = null,
		blockedStepKeys = [] as string[],
		embedded = false,
		showDebug = false,
	} = $props<{
		surface: 'help_center' | 'create_trust' | 'funding' | 'dashboard';
		stepKey?: string | null;
		trustId?: number | null;
		blockedStepKeys?: string[];
		/** Inline panel for admin test page — no floating launcher. */
		embedded?: boolean;
		/** Show response kind / entry id for admin debugging. */
		showDebug?: boolean;
	}>();

	type ChatMessage = {
		id: number;
		role: 'user' | 'assistant';
		status: 'done' | 'pending' | 'error';
		text?: string;
		rendered?: HelpRenderedResponse;
		queryId?: number;
	};

	let open = $state(false);
	let question = $state('');
	let sending = $state(false);
	let conversationId = $state<number | null>(null);
	let messages = $state<ChatMessage[]>([]);
	let nextId = 0;
	let scrollEl = $state<HTMLDivElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);

	const stepBlocked = $derived(stepKey ? blockedStepKeys.includes(stepKey) : false);

	// Trust builder (and funding on mobile) have a bottom nav bar — keep the launcher above it.
	const launcherBottomClass = $derived(
		surface === 'create_trust'
			? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]'
			: surface === 'funding'
				? 'bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6'
				: 'bottom-6',
	);
	const panelBottomClass = $derived(
		surface === 'create_trust'
			? 'sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]'
			: surface === 'funding'
				? 'sm:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6'
				: 'sm:bottom-6',
	);

	function scrollToBottom() {
		tick().then(() => {
			if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
		});
	}

	function resetConversation() {
		conversationId = null;
		messages = [
			{
				id: nextId++,
				role: 'assistant',
				status: 'done',
				text: "Hi! Ask me a general question about using Good Tree — signing your documents, funding your trust, or what to do next.",
			},
		];
		scrollToBottom();
	}

	$effect(() => {
		if (embedded) {
			open = true;
			if (messages.length === 0) resetConversation();
		}
	});

	function openPanel() {
		open = true;
		if (messages.length === 0) resetConversation();
		scrollToBottom();
		tick().then(() => textareaEl?.focus());
	}

	function autoGrow() {
		if (!textareaEl) return;
		textareaEl.style.height = 'auto';
		textareaEl.style.height = Math.min(textareaEl.scrollHeight, 120) + 'px';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}

	async function submit() {
		const text = question.trim();
		if (!text || sending) return;

		question = '';
		tick().then(autoGrow);

		messages = [...messages, { id: nextId++, role: 'user', status: 'done', text }];
		const pendingId = nextId++;
		messages = [...messages, { id: pendingId, role: 'assistant', status: 'pending' }];
		scrollToBottom();

		sending = true;
		try {
			const res = await fetch('/api/help/query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					question: text,
					surface,
					stepKey,
					trustId,
					conversationId,
				}),
			});
			if (!res.ok) {
				const errText = await res.text();
				throw new Error(errText || 'Request failed');
			}
			const data = await res.json();
			conversationId = data.conversationId;
			messages = messages.map((m) =>
				m.id === pendingId
					? { ...m, status: 'done', rendered: data.rendered as HelpRenderedResponse, queryId: data.queryId }
					: m,
			);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
			messages = messages.map((m) => (m.id === pendingId ? { ...m, status: 'error', text: msg } : m));
		} finally {
			sending = false;
			scrollToBottom();
		}
	}
</script>

{#if embedded}
	<div
		class="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-navy/10 bg-cream shadow-lg"
		role="region"
		aria-label="Good Tree Help Assistant test chat"
	>
		{@render panelContents(false)}
	</div>
{:else if !open}
	<button
		type="button"
		class="fixed right-6 z-[70] flex items-center gap-2.5 rounded-full bg-navy px-5 py-3.5 text-sm font-medium text-cream shadow-lg shadow-navy/20 transition-all hover:bg-navy-light hover:shadow-xl hover:shadow-navy/25 cursor-pointer {launcherBottomClass}"
		onclick={openPanel}
		aria-haspopup="dialog"
	>
		<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
			/>
		</svg>
		Need help?
	</button>
{:else}
	<div
		class="fixed inset-x-4 bottom-4 top-16 z-[80] flex flex-col overflow-hidden rounded-3xl border border-navy/10 bg-cream shadow-2xl shadow-navy/20 sm:inset-x-auto sm:top-auto sm:right-6 sm:h-[36rem] sm:w-[400px] sm:max-h-[calc(100vh-3rem)] {panelBottomClass}"
		role="dialog"
		aria-modal="true"
		aria-label="Good Tree Help Assistant"
	>
		{@render panelContents(true)}
	</div>
{/if}

{#snippet panelContents(showClose: boolean)}
		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between gap-3 bg-navy px-5 py-4">
			<div class="flex items-center gap-2.5 min-w-0">
				<span class="h-2 w-2 shrink-0 rounded-full bg-emerald-accent"></span>
				<div class="min-w-0">
					<h2 class="truncate text-[15px] font-semibold text-cream">Good Tree Help Assistant</h2>
					<p class="truncate text-[11px] text-cream/50">
						{embedded ? 'Admin test — same pipeline as production' : 'General information, not individualized advice'}
					</p>
				</div>
			</div>
			{#if showClose}
				<button
					type="button"
					class="shrink-0 rounded-full p-1.5 text-cream/60 transition-colors hover:bg-white/10 hover:text-cream cursor-pointer"
					onclick={() => (open = false)}
					aria-label="Close chat"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>

		{#if stepBlocked}
			<div class="shrink-0 border-b border-amber-200/70 bg-amber-50 px-4 py-2.5">
				<p class="text-[12px] leading-snug text-amber-900">
					A consultation is required before continuing this step.
				</p>
			</div>
		{/if}

		<!-- Messages -->
		<div bind:this={scrollEl} class="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
			{#each messages as m (m.id)}
				{#if m.role === 'user'}
					<div class="flex justify-end">
						<div class="max-w-[85%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-[13.5px] leading-relaxed text-cream shadow-sm">
							{m.text}
						</div>
					</div>
				{:else if m.status === 'pending'}
					<div class="flex justify-start">
						<div class="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-navy/10 bg-white px-4 py-3 shadow-sm">
							<span class="typing-dot h-1.5 w-1.5 rounded-full bg-navy/40"></span>
							<span class="typing-dot h-1.5 w-1.5 rounded-full bg-navy/40"></span>
							<span class="typing-dot h-1.5 w-1.5 rounded-full bg-navy/40"></span>
						</div>
					</div>
				{:else if m.status === 'error'}
					<div class="flex justify-start">
						<div class="max-w-[85%] rounded-2xl rounded-bl-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] leading-relaxed text-rose-800 shadow-sm">
							{m.text}
						</div>
					</div>
				{:else if m.text}
					<div class="flex justify-start">
						<div class="max-w-[85%] rounded-2xl rounded-bl-md border border-navy/10 bg-white px-4 py-2.5 text-[13.5px] leading-relaxed text-navy shadow-sm">
							{m.text}
						</div>
					</div>
				{:else if m.rendered}
					<div class="flex justify-start">
						<div class="max-w-[88%] rounded-2xl rounded-bl-md border border-navy/10 bg-white px-4 py-3 shadow-sm">
							{#if showDebug}
								<p class="mb-2 font-mono text-[10px] text-navy/45">
									kind: {m.rendered.kind}
									{#if m.rendered.entryId != null}
										· entry #{m.rendered.entryId}
									{/if}
									{#if m.queryId != null}
										· query #{m.queryId}
									{/if}
								</p>
							{/if}
							<p class="text-[13.5px] leading-relaxed text-navy">{m.rendered.shortAnswer}</p>
							{#if m.rendered.learnMore?.appMeaning || m.rendered.learnMore?.nextStep}
								<details class="mt-2.5 group">
									<summary class="cursor-pointer text-[12px] font-medium text-emerald-accent select-none">
										Learn more
									</summary>
									<div class="mt-2 space-y-1.5 border-t border-navy/[0.06] pt-2">
										{#if m.rendered.learnMore.appMeaning}
											<p class="text-[12.5px] leading-relaxed text-navy/75">{m.rendered.learnMore.appMeaning}</p>
										{/if}
										{#if m.rendered.learnMore.nextStep}
											<p class="text-[12.5px] leading-relaxed text-navy/75">
												<strong class="text-navy">Next step:</strong> {m.rendered.learnMore.nextStep}
											</p>
										{/if}
									</div>
								</details>
							{/if}
							{#if m.rendered.cta && m.queryId}
								<div class="mt-3">
									<HelpCtaRow cta={m.rendered.cta} queryId={m.queryId} />
								</div>
							{/if}
							{#if m.rendered.blockedStep}
								<p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] leading-snug text-amber-900">
									Please book a consultation before continuing this step.
								</p>
							{/if}
							<p class="mt-2.5 border-t border-navy/[0.06] pt-2 text-[10.5px] leading-snug text-navy/40">
								{m.rendered.footer}
							</p>
						</div>
					</div>
				{/if}
			{/each}
		</div>

		<!-- Composer -->
		<div class="shrink-0 border-t border-navy/[0.08] bg-white px-3 py-3">
			<form
				class="flex items-end gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					submit();
				}}
			>
				<textarea
					bind:this={textareaEl}
					bind:value={question}
					oninput={autoGrow}
					onkeydown={handleKeydown}
					rows="1"
					class="max-h-[120px] min-h-[42px] flex-1 resize-none rounded-2xl border border-navy/15 bg-cream px-4 py-2.5 text-[13.5px] text-navy placeholder:text-navy/35 focus:border-emerald-accent/50 focus:outline-none focus:ring-2 focus:ring-emerald-accent/15"
					placeholder="Ask a question..."
					maxlength={2000}
				></textarea>
				<button
					type="submit"
					class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-navy text-cream transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
					disabled={sending || !question.trim()}
					aria-label="Send message"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
					</svg>
				</button>
			</form>
		</div>
{/snippet}

<style>
	.typing-dot {
		animation: typingBounce 1.1s ease-in-out infinite;
	}
	.typing-dot:nth-child(2) {
		animation-delay: 0.15s;
	}
	.typing-dot:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes typingBounce {
		0%,
		60%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		30% {
			transform: translateY(-4px);
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.typing-dot {
			animation: none;
			opacity: 0.7;
		}
	}
</style>
