<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Unsubscribe — Muslim Legacy Planning</title>
</svelte:head>

<div class="min-h-dvh bg-cream font-sans flex items-center justify-center px-6 py-20">
	<div class="w-full max-w-md text-center">

		<!-- Brand mark -->
		<div class="flex items-center justify-center gap-2 mb-10">
			<span class="w-2.5 h-2.5 rounded-full bg-emerald-accent inline-block"></span>
			<span class="text-navy text-base font-medium" style="font-family:'Playfair Display',Georgia,serif;">Muslim Legacy Planning</span>
		</div>

		{#if !data.valid}
			<!-- Invalid token -->
			<div class="rounded-2xl border border-navy/10 bg-white/70 p-10">
				<div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
					<svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
				<h1 class="text-navy text-xl font-medium mb-2 tracking-tight">Invalid link</h1>
				<p class="text-navy/65 text-sm leading-relaxed">This unsubscribe link is invalid or has already been used. If you believe this is an error, reply to any of our emails and we will remove you manually.</p>
			</div>

		{:else if form?.done || data.alreadyUnsubscribed}
			<!-- Success -->
			<div class="rounded-2xl border border-emerald-accent/20 bg-emerald-accent/6 p-10">
				<div class="w-12 h-12 rounded-full bg-emerald-accent/15 flex items-center justify-center mx-auto mb-4">
					<svg class="w-5 h-5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 class="text-navy text-xl font-medium mb-2 tracking-tight">You have been unsubscribed</h1>
				<p class="text-navy/65 text-sm leading-relaxed mb-6">
					{data.alreadyUnsubscribed && !form?.done ? 'You were already removed from our marketing list.' : `${data.email} has been removed from our marketing emails.`}
					You will not receive further marketing emails from Muslim Legacy Planning.
				</p>
				<p class="text-navy/65 text-xs leading-relaxed">Transactional emails (such as document delivery or account notices) are not affected by this request. If you have questions, please reply to any email from us.</p>
			</div>

		{:else}
			<!-- Confirm form -->
			<div class="rounded-2xl border border-navy/10 bg-white/70 p-10">
				<div class="w-12 h-12 rounded-full bg-navy/6 flex items-center justify-center mx-auto mb-4">
					<svg class="w-5 h-5 text-navy/65" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
				<h1 class="text-navy text-xl font-medium mb-2 tracking-tight">Unsubscribe from marketing emails?</h1>
				<p class="text-navy/65 text-sm leading-relaxed mb-6">
					This will remove <strong class="text-navy font-medium">{data.email}</strong> from all Muslim Legacy Planning marketing emails. Transactional notices (document delivery, account updates) are not affected.
				</p>
				<form method="POST" action="?/unsubscribe" use:enhance>
					<input type="hidden" name="token" value={data.token} />
					<button
						type="submit"
						class="w-full px-6 py-3 rounded-lg bg-navy text-cream text-sm font-medium transition-all duration-200 hover:bg-navy-light cursor-pointer"
					>
						Confirm unsubscribe
					</button>
				</form>
				<a href="/" class="block mt-4 text-navy/65 text-xs hover:text-navy/65 transition-colors">Never mind — take me back</a>
			</div>
		{/if}

	</div>
</div>
