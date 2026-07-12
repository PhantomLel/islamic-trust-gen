<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data, form } = $props();

	let selectedKey = $state(data.selectedKey);
	let firstName = $state(data.firstName);
	let quizResult = $state(data.quizResult);
	let toEmail = $state(data.adminEmail);
	let sending = $state(false);

	$effect(() => {
		selectedKey = data.selectedKey;
		firstName = data.firstName;
		quizResult = data.quizResult;
	});

	function applyPreview() {
		const params = new URLSearchParams();
		params.set('key', selectedKey);
		if (firstName.trim()) params.set('name', firstName.trim());
		params.set('quizResult', quizResult);
		goto(`/admin/email-preview?${params.toString()}`, { replaceState: true, noScroll: true });
	}

	const isQuiz = $derived(selectedKey.startsWith('quiz_'));
</script>

<svelte:head>
	<title>Email preview — Admin</title>
</svelte:head>

<div class="min-h-dvh bg-cream font-sans">
	<nav class="flex items-center justify-between px-6 md:px-8 py-5 border-b border-navy/[0.06] max-w-7xl mx-auto">
		<a href="/admin" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			Admin
		</a>
		<div class="flex items-center gap-4">
			<a href="/admin" class="text-sm text-navy/50 hover:text-navy transition-colors">← Back to trusts</a>
		</div>
	</nav>

	<div class="max-w-7xl mx-auto px-6 md:px-8 py-8">
		<div class="mb-6">
			<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Drip email preview</h1>
			<p class="text-navy/45 text-sm">Browse every marketing drip template in the browser, or send a test copy to your inbox.</p>
		</div>

		{#if form?.sent}
			<div class="mb-5 rounded-xl border border-emerald-accent/25 bg-emerald-accent/8 px-4 py-3 text-sm text-navy/75">
				Sent <strong class="font-medium text-navy">{form.emailKey}</strong> to <strong class="font-medium text-navy">{form.to}</strong>. Check your inbox (and spam).
			</div>
		{:else if form?.message}
			<div class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{form.message}
			</div>
		{/if}

		<div class="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
			<!-- Controls -->
			<aside class="rounded-2xl border border-navy/[0.08] bg-white/70 p-5 space-y-5 sticky top-6">
				<div>
					<label class="block text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-1.5" for="email-key">Template</label>
					<select
						id="email-key"
						bind:value={selectedKey}
						onchange={applyPreview}
						class="w-full px-3 py-2.5 rounded-lg border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
					>
						{#each data.emails as email}
							<option value={email.key}>{email.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-1.5" for="first-name">First name</label>
					<input
						id="first-name"
						type="text"
						bind:value={firstName}
						onblur={applyPreview}
						class="w-full px-3 py-2.5 rounded-lg border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent"
					/>
				</div>

				{#if isQuiz}
					<div>
						<label class="block text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-1.5" for="quiz-result">Quiz result</label>
						<select
							id="quiz-result"
							bind:value={quizResult}
							onchange={applyPreview}
							class="w-full px-3 py-2.5 rounded-lg border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
						>
							{#each data.quizResults as r}
								<option value={r}>{r.replace(/_/g, ' ')}</option>
							{/each}
						</select>
					</div>
				{/if}

				<div class="border-t border-navy/[0.06] pt-4 space-y-2">
					<p class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Subject</p>
					<p class="text-sm text-navy/80 leading-snug">{data.subject}</p>
					<p class="text-[11px] text-navy/40 font-mono">{data.selectedKey} · {data.sequence}</p>
				</div>

				<form
					method="POST"
					action="?/sendTest"
					class="border-t border-navy/[0.06] pt-4 space-y-3"
					use:enhance={() => {
						sending = true;
						return async ({ update }) => {
							await update();
							sending = false;
						};
					}}
				>
					<input type="hidden" name="emailKey" value={selectedKey} />
					<input type="hidden" name="firstName" value={firstName} />
					<input type="hidden" name="quizResult" value={quizResult} />

					<div>
						<label class="block text-[11px] uppercase tracking-wider text-navy/40 font-medium mb-1.5" for="to-email">Send test to</label>
						<input
							id="to-email"
							type="email"
							name="to"
							bind:value={toEmail}
							class="w-full px-3 py-2.5 rounded-lg border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent"
						/>
					</div>

					<button
						type="submit"
						disabled={!data.canSend || sending}
						class="w-full px-4 py-2.5 rounded-lg bg-navy text-cream text-sm font-medium transition-all hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
					>
						{sending ? 'Sending…' : 'Send test email'}
					</button>

					{#if !data.canSend}
						<p class="text-[11px] text-amber-700 leading-relaxed">Set <code class="font-mono">RESEND_API_KEY</code> and <code class="font-mono">FROM_EMAIL</code> in <code class="font-mono">.env</code> to enable sending.</p>
					{:else}
						<p class="text-[11px] text-navy/40 leading-relaxed">Test sends use a <code class="font-mono">[TEST]</code> subject prefix and are not logged to marketing drip history.</p>
					{/if}
				</form>
			</aside>

			<!-- Live preview -->
			<div class="rounded-2xl border border-navy/[0.08] bg-white overflow-hidden shadow-sm">
				<div class="px-4 py-2.5 border-b border-navy/[0.06] bg-navy/[0.02] flex items-center justify-between gap-3">
					<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Browser preview</span>
					<a
						href={page.url.href}
						class="text-[11px] text-navy/40 hover:text-navy/70 transition-colors"
						title="Current URL includes your selected options"
					>
						{data.selectedKey}
					</a>
				</div>
				<iframe
					title="Email preview"
					srcdoc={data.html}
					class="w-full border-0 bg-[#f5f0eb]"
					style="height: min(85vh, 1100px);"
				></iframe>
			</div>
		</div>
	</div>
</div>
