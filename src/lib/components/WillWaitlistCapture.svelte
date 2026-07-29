<script lang="ts">
	/**
	 * Out-of-state email capture (ticket A1). Shown inline on the shared
	 * state-step component whenever a visitor selects a state the free-will
	 * generator can't produce documents for yet. Used on the residence `state`
	 * step only (B5 replaced `home_state` with a yes/no question).
	 */
	import { getFirstTouchUtm } from '$lib/utm';

	let {
		stateCode,
		stateLabel,
		stepId,
		name = ''
	}: {
		stateCode: string;
		stateLabel: string;
		stepId: string;
		name?: string;
	} = $props();

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
			const utm = getFirstTouchUtm();
			const res = await fetch('/api/will-waitlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: email.trim(),
					name,
					state: stateCode,
					utmSource: utm.utmSource,
					utmMedium: utm.utmMedium,
					utmCampaign: utm.utmCampaign,
					lastStep: stepId
				})
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

<div class="rounded-xl border border-emerald-accent/25 bg-emerald-accent/5 p-5 mt-3">
	{#if submitted}
		<div class="flex items-start gap-3">
			<span class="w-8 h-8 rounded-full bg-emerald-accent/15 flex items-center justify-center shrink-0 mt-0.5">
				<svg class="w-4 h-4 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</span>
			<div>
				<p class="text-navy text-sm font-medium leading-snug">You're on the list.</p>
				<p class="text-navy/55 text-xs leading-relaxed mt-1">
					We'll email you the moment we launch in {stateLabel}, along with a free guide to Islamic estate planning in the meantime.
				</p>
			</div>
		</div>
	{:else}
		<p class="text-navy/75 text-sm leading-relaxed mb-3">
			We're not in {stateLabel} yet. Leave your email and we'll tell you the moment we launch there — and send you a free guide to Islamic estate planning in the meantime.
		</p>
		<div class="flex flex-col sm:flex-row gap-2">
			<input
				type="email"
				bind:value={email}
				placeholder="you@example.com"
				class="flex-1 px-4 py-2.5 rounded-lg border border-navy/12 bg-white text-navy text-sm outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
			/>
			<button
				type="button"
				onclick={submit}
				disabled={submitting}
				class="px-5 py-2.5 rounded-lg text-sm font-medium text-cream bg-emerald-accent transition-all duration-200 hover:bg-emerald-light disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
			>
				{submitting ? 'Saving…' : 'Notify me'}
			</button>
		</div>
		{#if error}
			<p class="text-red-600 text-xs mt-2">{error}</p>
		{/if}
	{/if}
</div>
