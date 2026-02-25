<script lang="ts">
	import { siteName } from '$lib/config';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let firstName = $derived(data.userName?.split(' ')[0] ?? 'there');

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
		window.location.reload();
	}
</script>

<div class="h-screen w-screen overflow-hidden bg-cream font-sans flex flex-col relative">

	<!-- background accent -->
	<div class="absolute inset-0 pointer-events-none"
		style="background:
			radial-gradient(ellipse 80% 60% at 50% 40%, rgba(74,124,111,0.07) 0%, transparent 70%),
			radial-gradient(ellipse 40% 40% at 20% 80%, rgba(74,124,111,0.03) 0%, transparent 60%),
			radial-gradient(ellipse 40% 40% at 80% 80%, rgba(74,124,111,0.03) 0%, transparent 60%);">
	</div>

	<!-- minimal top bar -->
	<nav class="relative z-10 shrink-0 flex items-center justify-between px-8 py-6 max-w-5xl w-full mx-auto">
		<a href="/" class="flex items-center gap-2 text-navy font-semibold text-base tracking-tight">
			<span class="w-2 h-2 rounded-full bg-emerald-accent"></span>
			{siteName}
		</a>
		<button
			onclick={handleLogout}
			class="text-sm text-navy/50 transition-colors hover:text-navy cursor-pointer"
		>
			Log out
		</button>
	</nav>

	<!-- vertically centered content -->
	<div class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16">

		<!-- greeting -->
		<div class="text-center mb-12">
			<div class="flex items-center justify-center gap-4 mb-5">
				<span class="w-8 h-px bg-emerald-accent/60"></span>
				<span class="text-emerald-accent text-[11px] tracking-[0.3em] uppercase font-medium">
					Get Started
				</span>
				<span class="w-8 h-px bg-emerald-accent/60"></span>
			</div>
			<h1 class="text-3xl md:text-4xl font-semibold text-navy tracking-tight mb-3">
				Welcome, {firstName}
			</h1>
			<p class="text-navy/50 text-base font-light max-w-md mx-auto leading-relaxed">
				Choose the type of trust that best fits your estate planning needs.
			</p>
		</div>

		{#if data.trust.joint === null}
			<!-- trust type selection — side by side, centered -->
			<div class="flex flex-col md:flex-row items-stretch justify-center gap-5 w-full max-w-3xl">

				<!-- individual trust -->
				<form method="POST" action="?/select" class="flex-1 max-w-sm w-full mx-auto md:mx-0">
					<input type="hidden" name="joint" value="false" />
					<button
						type="submit"
						class="w-full h-full text-left group rounded-2xl bg-white/80 backdrop-blur-sm
							   border border-navy/[0.07] p-7 md:p-8 flex flex-col
							   transition-all duration-300 cursor-pointer
							   hover:bg-white hover:border-emerald-accent/25
							   hover:shadow-[0_8px_40px_-8px_rgba(74,124,111,0.18)]
							   hover:-translate-y-1"
					>
						<!-- icon -->
						<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-navy/[0.05] to-navy/[0.02]
									flex items-center justify-center mb-5
									group-hover:from-emerald-accent/12 group-hover:to-emerald-accent/5
									transition-all duration-300">
							<svg class="w-5.5 h-5.5 text-navy/35 group-hover:text-emerald-accent transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
							</svg>
						</div>

						<h2 class="text-lg font-semibold text-navy tracking-tight mb-1">Individual Trust</h2>
						<p class="text-navy/40 text-[13px] font-light mb-5 leading-relaxed">
							A single-grantor trust for your personal estate.
						</p>

						<!-- bullet points -->
						<ul class="space-y-3 flex-1">
							<li class="flex items-start gap-2.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60 mt-[7px] shrink-0"></span>
								<span class="text-navy/55 text-[13px] leading-snug">Full control over assets and beneficiaries</span>
							</li>
							<li class="flex items-start gap-2.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60 mt-[7px] shrink-0"></span>
								<span class="text-navy/55 text-[13px] leading-snug">Simplified management with a single trustee</span>
							</li>
							<li class="flex items-start gap-2.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60 mt-[7px] shrink-0"></span>
								<span class="text-navy/55 text-[13px] leading-snug">Ideal for unmarried individuals or separate estates</span>
							</li>
							<li class="flex items-start gap-2.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60 mt-[7px] shrink-0"></span>
								<span class="text-navy/55 text-[13px] leading-snug">Avoids probate and maintains privacy</span>
							</li>
						</ul>

						<!-- CTA footer -->
						<div class="mt-6 pt-4 border-t border-navy/[0.06] flex items-center justify-between">
							<span class="text-sm font-medium text-navy/60 group-hover:text-emerald-accent transition-colors duration-300">Select Individual</span>
							<div class="w-7 h-7 rounded-full bg-navy/[0.04] flex items-center justify-center
										group-hover:bg-emerald-accent group-hover:scale-105 transition-all duration-300">
								<svg class="w-3.5 h-3.5 text-navy/30 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
								</svg>
							</div>
						</div>
					</button>
				</form>

				<!-- joint trust -->
				<form method="POST" action="?/select" class="flex-1 max-w-sm w-full mx-auto md:mx-0">
					<input type="hidden" name="joint" value="true" />
					<button
						type="submit"
						class="w-full h-full text-left group rounded-2xl bg-white/80 backdrop-blur-sm
							   border border-navy/[0.07] p-7 md:p-8 flex flex-col
							   transition-all duration-300 cursor-pointer
							   hover:bg-white hover:border-emerald-accent/25
							   hover:shadow-[0_8px_40px_-8px_rgba(74,124,111,0.18)]
							   hover:-translate-y-1"
					>
						<!-- icon -->
						<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-navy/[0.05] to-navy/[0.02]
									flex items-center justify-center mb-5
									group-hover:from-emerald-accent/12 group-hover:to-emerald-accent/5
									transition-all duration-300">
							<svg class="w-5.5 h-5.5 text-navy/35 group-hover:text-emerald-accent transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
							</svg>
						</div>

						<h2 class="text-lg font-semibold text-navy tracking-tight mb-1">Joint Trust</h2>
						<p class="text-navy/40 text-[13px] font-light mb-5 leading-relaxed">
							A shared trust for you and your spouse.
						</p>

						<!-- bullet points -->
						<ul class="space-y-3 flex-1">
							<li class="flex items-start gap-2.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60 mt-[7px] shrink-0"></span>
								<span class="text-navy/55 text-[13px] leading-snug">Unified estate plan for both spouses</span>
							</li>
							<li class="flex items-start gap-2.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60 mt-[7px] shrink-0"></span>
								<span class="text-navy/55 text-[13px] leading-snug">Seamless transfer of assets between partners</span>
							</li>
							<li class="flex items-start gap-2.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60 mt-[7px] shrink-0"></span>
								<span class="text-navy/55 text-[13px] leading-snug">Shared management with co-trustee provisions</span>
							</li>
							<li class="flex items-start gap-2.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent/60 mt-[7px] shrink-0"></span>
								<span class="text-navy/55 text-[13px] leading-snug">Built-in survivor provisions for continuity</span>
							</li>
						</ul>

						<!-- CTA footer -->
						<div class="mt-6 pt-4 border-t border-navy/[0.06] flex items-center justify-between">
							<span class="text-sm font-medium text-navy/60 group-hover:text-emerald-accent transition-colors duration-300">Select Joint</span>
							<div class="w-7 h-7 rounded-full bg-navy/[0.04] flex items-center justify-center
										group-hover:bg-emerald-accent group-hover:scale-105 transition-all duration-300">
								<svg class="w-3.5 h-3.5 text-navy/30 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
								</svg>
							</div>
						</div>
					</button>
				</form>

			</div>
		{:else}
			<!-- trust type already selected -->
			<div class="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-sm border border-navy/[0.07] p-10 text-center">
				<div class="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-accent/10 flex items-center justify-center">
					<svg class="w-6 h-6 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-navy mb-2">
					{data.trust.joint ? 'Joint' : 'Individual'} Trust Selected
				</h2>
				<p class="text-navy/50 text-sm font-light">
					Your trust has been created. The questionnaire is coming soon.
				</p>
			</div>
		{/if}

	</div>
</div>
