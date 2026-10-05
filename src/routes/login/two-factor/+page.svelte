<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let code = $state('');
	let error = $state('');
	let busy = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		busy = true;
		const res = await authClient.twoFactor.verifyTotp({ code: code.trim() });
		busy = false;
		if (res.error) {
			error = 'That code did not work. Try the current code from your app.';
			return;
		}
		await goto('/admin/content', { invalidateAll: true });
	}
</script>

<svelte:head><title>Verification code</title></svelte:head>
<main class="min-h-screen flex items-center justify-center bg-cream px-5">
	<form onsubmit={submit} class="w-full max-w-sm space-y-4 rounded-xl border border-navy/10 bg-white p-6">
		<h1 class="text-xl tracking-tight">Verification code</h1>
		<div>
			<label for="code" class="block text-sm mb-1">6-digit code from your authenticator app</label>
			<input id="code" inputmode="numeric" autocomplete="one-time-code" required bind:value={code} class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm tracking-widest" />
		</div>
		{#if error}<p class="text-sm text-red-700" role="alert">{error}</p>{/if}
		<button disabled={busy} class="w-full px-4 py-2.5 rounded-lg bg-navy text-cream text-sm">{busy ? 'Checking…' : 'Verify'}</button>
	</form>
</main>
