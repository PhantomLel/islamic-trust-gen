<script lang="ts">
	import { consultationBookingUrl, siteName } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let submitted = $state(false);

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}

	async function requestConsultation() {
		// Open booking in a new tab from the click gesture, then keep existing request flow.
		window.open(consultationBookingUrl, '_blank', 'noopener,noreferrer');
		const form = new FormData();
		await fetch('?/requestConsultation', { method: 'POST', body: form });
		await invalidateAll();
		submitted = true;
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
		{#if submitted}
			<div class="text-center max-w-md">
				<div class="w-16 h-16 rounded-full bg-emerald-accent/10 flex items-center justify-center mx-auto mb-6">
					<svg class="w-8 h-8 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 class="text-3xl font-semibold text-navy tracking-tight mb-3">You're on the list</h1>
				<p class="text-navy/50 text-base font-light leading-relaxed mb-8">Book your consultation on the page that was just opened or we will be in touch soon!</p>
				<a href="/" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-cream bg-navy transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10">
					Back to Home
				</a>
			</div>
		{:else}
			<div class="text-center max-w-lg">
				<div class="flex items-center justify-center gap-4 mb-5">
					<span class="w-8 h-px bg-emerald-accent/60"></span>
					<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">Consultation Required</span>
					<span class="w-8 h-px bg-emerald-accent/60"></span>
				</div>

				<h1 class="text-3xl md:text-4xl font-semibold text-navy tracking-tight mb-4">Your estate needs personal attention</h1>
				<p class="text-navy/50 text-base font-light leading-relaxed mb-4">
					Based on your answers, your situation involves complexities that would benefit from working directly with us.
				</p>
				<p class="text-navy/40 text-sm font-light leading-relaxed mb-10">
					This ensures your trust is structured correctly for your unique needs
				</p>

				<button
					onclick={requestConsultation}
					class="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-medium text-cream bg-navy
						   transition-all duration-300 cursor-pointer
						   hover:bg-navy-light hover:shadow-xl hover:shadow-navy/15 hover:-translate-y-0.5"
				>
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
					</svg>
					Schedule a Consultation
				</button>
			</div>
		{/if}
	</div>
</div>
