<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		busy = true;
		const res = await authClient.signIn.email(
			{ email, password },
			{
				onSuccess: async (ctx) => {
					// With two-factor enabled the client plugin redirects to /login/two-factor.
					if (!(ctx.data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) await goto('/admin/content', { invalidateAll: true });
				},
			}
		);
		busy = false;
		if (res.error) error = 'That email and password did not work.';
	}
</script>

<svelte:head><title>Staff sign in</title></svelte:head>
<main class="min-h-screen flex items-center justify-center bg-cream px-5">
	<form onsubmit={submit} class="w-full max-w-sm space-y-4 rounded-xl border border-navy/10 bg-white p-6">
		<h1 class="text-xl tracking-tight">Content staff sign in</h1>
		<div>
			<label for="email" class="block text-sm mb-1">Email</label>
			<input id="email" type="email" autocomplete="username" required bind:value={email} class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm" />
		</div>
		<div>
			<label for="password" class="block text-sm mb-1">Password</label>
			<input id="password" type="password" autocomplete="current-password" required bind:value={password} class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm" />
		</div>
		{#if error}<p class="text-sm text-red-700" role="alert">{error}</p>{/if}
		<button disabled={busy} class="w-full px-4 py-2.5 rounded-lg bg-navy text-cream text-sm">{busy ? 'Signing in…' : 'Continue'}</button>
		<p class="text-xs text-navy/50">You will be asked for a verification code from your authenticator app.</p>
	</form>
</main>
