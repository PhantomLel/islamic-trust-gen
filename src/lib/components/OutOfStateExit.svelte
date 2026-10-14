<script lang="ts">
	/**
	 * Out-of-state exit (spec v3 §3.1). Shown when the selected state is not Texas
	 * or California. The interview does not continue. The exact boundary text is
	 * shown, then the real-property question: Yes goes to consultation booking,
	 * No stays on the educational exit. The optional email is for a referral only:
	 * it is stored as a `referral_request` lead with no drip and no marketing box.
	 */
	import {
		consultationBookingUrl,
		contentLibraryHref,
		outOfStateExitParagraphs,
		outOfStateRealPropertyQuestion,
		videoLibraryHref
	} from '$lib/config';

	let { stateCode, name = '' }: { stateCode: string; name?: string } = $props();

	let ownsProperty = $state<'yes' | 'no' | null>(null);
	let email = $state('');
	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

	async function submit() {
		error = '';
		if (!email.trim() || !email.includes('@')) {
			error = 'Please enter a valid email address.';
			return;
		}
		submitting = true;
		try {
			const res = await fetch('/api/referral-request', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), name, state: stateCode })
			});
			if (!res.ok) {
				error = 'Something went wrong. Please try again.';
				return;
			}
			submitted = true;
		} catch {
			error = 'Something went wrong. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="rounded-xl border border-emerald-accent/25 bg-emerald-accent/5 p-5 mt-3" data-testid="out-of-state-exit">
	{#each outOfStateExitParagraphs as paragraph}
		<p class="text-navy/75 text-sm leading-relaxed mb-3">{paragraph}</p>
	{/each}

	<p class="text-navy text-sm font-medium leading-snug mt-5 mb-3">{outOfStateRealPropertyQuestion}</p>
	<div class="flex flex-col sm:flex-row gap-2 mb-4">
		<button
			type="button"
			onclick={() => (ownsProperty = 'yes')}
			aria-pressed={ownsProperty === 'yes'}
			class="px-5 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all
				{ownsProperty === 'yes' ? 'border-emerald-accent bg-emerald-accent/10 text-navy' : 'border-navy/12 bg-white text-navy/75 hover:border-emerald-accent/40'}"
		>
			Yes
		</button>
		<button
			type="button"
			onclick={() => (ownsProperty = 'no')}
			aria-pressed={ownsProperty === 'no'}
			class="px-5 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all
				{ownsProperty === 'no' ? 'border-emerald-accent bg-emerald-accent/10 text-navy' : 'border-navy/12 bg-white text-navy/75 hover:border-emerald-accent/40'}"
		>
			No
		</button>
	</div>

	{#if ownsProperty === 'yes'}
		<a
			href={consultationBookingUrl}
			target="_blank"
			rel="noopener"
			class="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-cream bg-emerald-accent hover:bg-emerald-light transition-colors"
		>
			Book a consultation
		</a>
	{:else if ownsProperty === 'no'}
		<ul class="flex flex-col gap-2 text-sm">
			<li><a href={contentLibraryHref} class="text-emerald-accent font-medium hover:underline">Educational answers</a></li>
			<li><a href={videoLibraryHref} class="text-emerald-accent font-medium hover:underline">Videos</a></li>
		</ul>
	{/if}

	<div class="mt-5 pt-4 border-t border-emerald-accent/15">
		{#if submitted}
			<p class="text-navy text-sm leading-snug">Thank you. We have your request.</p>
		{:else}
			<label for="referral-email" class="block text-navy/70 text-xs mb-2">Email for an attorney referral (optional)</label>
			<div class="flex flex-col sm:flex-row gap-2">
				<input
					id="referral-email"
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					class="flex-1 px-4 py-2.5 rounded-lg border border-navy/12 bg-white text-navy text-sm outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/65"
				/>
				<button
					type="button"
					onclick={submit}
					disabled={submitting}
					class="px-5 py-2.5 rounded-lg text-sm font-medium text-cream bg-emerald-accent transition-all hover:bg-emerald-light disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
				>
					{submitting ? 'Sending…' : 'Request a referral'}
				</button>
			</div>
			{#if error}
				<p class="text-red-600 text-xs mt-2">{error}</p>
			{/if}
		{/if}
	</div>
</div>
