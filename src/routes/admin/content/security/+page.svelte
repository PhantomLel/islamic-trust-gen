<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import QRCode from 'qrcode';

	let { data } = $props();
	let password = $state('');
	let code = $state('');
	let error = $state('');
	let busy = $state(false);
	let qrDataUrl = $state('');
	let backupCodes = $state<string[]>([]);
	let step: 'idle' | 'scan' | 'done' = $state(data.twoFactorEnabled ? 'done' : 'idle');

	async function startEnroll(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		busy = true;
		const res = await authClient.twoFactor.enable({ password });
		busy = false;
		if (res.error) {
			error = 'Could not start setup. Check your password.';
			return;
		}
		const totpURI = (res.data as { totpURI?: string })?.totpURI;
		const codes = (res.data as { backupCodes?: string[] })?.backupCodes ?? [];
		if (totpURI) qrDataUrl = await QRCode.toDataURL(totpURI, { margin: 1, width: 220 });
		backupCodes = codes;
		step = 'scan';
	}

	async function confirmTotp(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		busy = true;
		const res = await authClient.twoFactor.verifyTotp({ code: code.trim() });
		busy = false;
		if (res.error) {
			error = 'That code did not work. Use the current code from your app.';
			return;
		}
		step = 'done';
		window.location.reload();
	}
</script>

<h1 class="text-2xl tracking-tight mb-2">Security</h1>
<p class="text-sm text-navy/55 mb-8">Content staff must use a verification code from an authenticator app. Sessions end after 12 hours without activity.</p>

{#if data.twoFactorEnabled || step === 'done'}
	<p class="rounded-lg bg-emerald-accent/10 border border-emerald-accent/20 px-4 py-3 text-sm">Two-factor authentication is on for your account.</p>
{:else if step === 'scan'}
	<div class="grid md:grid-cols-2 gap-8 max-w-3xl">
		<div class="rounded-xl border border-navy/10 bg-white p-5">
			<p class="text-sm font-medium mb-3">1. Scan this code</p>
			{#if qrDataUrl}<img src={qrDataUrl} alt="Authenticator QR code" class="mx-auto rounded-lg border border-navy/10" width="220" height="220" />{/if}
			{#if backupCodes.length}
				<p class="text-xs text-navy/50 mt-4">Save these backup codes somewhere safe:</p>
				<ul class="mt-1 font-mono text-xs text-navy/70 space-y-0.5">{#each backupCodes as c}<li>{c}</li>{/each}</ul>
			{/if}
		</div>
		<form onsubmit={confirmTotp} class="rounded-xl border border-navy/10 bg-white p-5 space-y-3">
			<p class="text-sm font-medium">2. Enter the 6-digit code</p>
			<input bind:value={code} inputmode="numeric" autocomplete="one-time-code" required class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm tracking-widest" />
			{#if error}<p class="text-sm text-red-700" role="alert">{error}</p>{/if}
			<button disabled={busy} class="px-4 py-2 rounded-lg bg-navy text-cream text-sm">{busy ? 'Checking…' : 'Turn on two-factor'}</button>
		</form>
	</div>
{:else}
	<form onsubmit={startEnroll} class="max-w-md rounded-xl border border-navy/10 bg-white p-5 space-y-3">
		<p class="text-sm">Confirm your password to generate a QR code for Google Authenticator, 1Password, or a similar app.</p>
		<label for="pw" class="block text-sm">Password</label>
		<input id="pw" type="password" autocomplete="current-password" required bind:value={password} class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm" />
		{#if error}<p class="text-sm text-red-700" role="alert">{error}</p>{/if}
		<button disabled={busy} class="px-4 py-2 rounded-lg bg-navy text-cream text-sm">{busy ? 'Working…' : 'Set up two-factor'}</button>
	</form>
{/if}
