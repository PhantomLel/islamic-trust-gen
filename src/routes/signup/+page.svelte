<script lang="ts">
	import { authClient } from '$lib/auth-client';

	let name = $state('');
	let email = $state('');
	let magicLinkSent = $state(false);
	let loading = $state(false);
	let error = $state('');

	async function handleMagicLink() {
		if (!email || !name.trim()) return;
		loading = true;
		error = '';

		const { error: err } = await authClient.signIn.magicLink({ email, name: name.trim(), callbackURL: '/create-trust' });

		loading = false;
		if (err) {
			error = err.message ?? 'Something went wrong. Please try again.';
		} else {
			magicLinkSent = true;
		}
	}

	async function handleGoogle() {
		await authClient.signIn.social({ provider: 'google', callbackURL: '/create-trust' });
	}
</script>

<div class="h-screen w-screen overflow-hidden bg-cream font-sans flex items-center justify-center relative">

	<div class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(ellipse 60% 50% at 50% 55%, rgba(74,124,111,0.06) 0%, transparent 70%);">
	</div>

	<div class="relative w-full max-w-sm px-6">

		<!-- back link -->
		<a href="/" class="inline-flex items-center gap-1.5 text-navy/40 text-sm mb-10 transition-colors hover:text-navy/70">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Back
		</a>

		<!-- header -->
		<div class="mb-10">
			<h1 class="text-2xl font-semibold text-navy tracking-tight">Create an account</h1>
			<p class="text-navy/45 text-sm mt-1.5">Sign up to get started creating your trust</p>
		</div>

		{#if magicLinkSent}
			<!-- success state -->
			<div class="rounded-xl bg-emerald-accent/8 border border-emerald-accent/15 p-6 text-center">
				<div class="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-accent/15 flex items-center justify-center">
					<svg class="w-5 h-5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
				<p class="text-navy font-medium text-sm">Check your email</p>
				<p class="text-navy/50 text-xs mt-1">We sent a sign-in link to <strong class="text-navy/70">{email}</strong></p>
				<button
					onclick={() => { magicLinkSent = false; email = ''; name = ''; }}
					class="mt-4 text-xs text-emerald-accent hover:text-emerald-light transition-colors cursor-pointer"
				>
					Use a different email
				</button>
			</div>
		{:else}
			<!-- magic link form -->
			<form onsubmit={e => { e.preventDefault(); handleMagicLink(); }} class="space-y-3">
				<label class="block">
					<span class="text-navy/60 text-xs font-medium tracking-wide uppercase">Full Name</span>
					<input
						type="text"
						bind:value={name}
						placeholder="Your full name"
						required
						class="mt-1.5 w-full px-4 py-3 rounded-lg bg-white border border-navy/10 text-navy text-sm
							   placeholder:text-navy/30 outline-none transition-all
							   focus:border-navy/30 focus:ring-2 focus:ring-navy/5"
					/>
				</label>

				<label class="block">
					<span class="text-navy/60 text-xs font-medium tracking-wide uppercase">Email</span>
					<input
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						required
						class="mt-1.5 w-full px-4 py-3 rounded-lg bg-white border border-navy/10 text-navy text-sm
							   placeholder:text-navy/30 outline-none transition-all
							   focus:border-navy/30 focus:ring-2 focus:ring-navy/5"
					/>
				</label>

				{#if error}
					<p class="text-red-600 text-xs">{error}</p>
				{/if}

				<button
					type="submit"
					disabled={loading || !email || !name.trim()}
					class="w-full py-3 rounded-lg bg-navy text-cream text-sm font-medium tracking-wide
						   transition-all duration-200 hover:bg-navy-light hover:shadow-lg hover:shadow-navy/10
						   disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
				>
					{loading ? 'Sending...' : 'Continue with Email'}
				</button>
			</form>

			<!-- divider -->
			<div class="flex items-center gap-4 my-6">
				<div class="flex-1 h-px bg-navy/8"></div>
				<span class="text-navy/30 text-xs">or</span>
				<div class="flex-1 h-px bg-navy/8"></div>
			</div>

			<!-- google -->
			<button
				onclick={handleGoogle}
				class="w-full py-3 rounded-lg bg-white border border-navy/10 text-navy text-sm font-medium
					   transition-all duration-200 hover:border-navy/20 hover:shadow-md hover:shadow-navy/5
					   flex items-center justify-center gap-3 cursor-pointer"
			>
				<svg class="w-4.5 h-4.5" viewBox="0 0 24 24">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				Continue with Google
			</button>

			<!-- login link -->
			<p class="text-center text-navy/40 text-xs mt-6">
				Already have an account? <a href="/login" class="text-emerald-accent hover:text-emerald-light transition-colors">Sign in</a>
			</p>
		{/if}
	</div>
</div>
