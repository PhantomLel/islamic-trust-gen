<script lang="ts">
	let {
		email,
		href = `mailto:${email}`,
		composeLabel = 'Compose email',
	}: {
		email: string;
		href?: string;
		composeLabel?: string;
	} = $props();

	let copiedEmail = $state(false);
	let copyResetId = 0;

	async function copyEmailAddress() {
		try {
			await navigator.clipboard.writeText(email);
			copiedEmail = true;
			copyResetId += 1;
			const id = copyResetId;
			setTimeout(() => {
				if (id === copyResetId) copiedEmail = false;
			}, 2000);
		} catch {
			// Clipboard may be unavailable; address remains selectable.
		}
	}

	const emailLinkClass =
		'inline-flex w-fit shrink-0 items-center text-navy/65 hover:text-navy transition-colors';
</script>

<div class="flex max-w-full min-w-0 items-center gap-2">
	<a
		{href}
		class="{emailLinkClass} shrink-0 self-center"
		aria-label="{composeLabel}. Opens your email app to {email}."
	>
		<svg
			class="w-4 h-4"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
			<polyline points="22,6 12,13 2,6" />
		</svg>
	</a>
	<span
		class="min-w-0 flex-1 select-all break-all text-[12px] leading-snug text-navy/55"
		title="Select and copy, or use the copy button"
	>
		{email}
	</span>
	<button
		type="button"
		onclick={copyEmailAddress}
		class="inline-flex shrink-0 cursor-pointer items-center gap-1 self-center rounded text-navy/35 transition-colors hover:text-navy/70"
		aria-label={copiedEmail ? 'Copied' : `Copy ${email}`}
	>
		{#if copiedEmail}
			<svg
				class="h-3.5 w-3.5 text-emerald-accent"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2.5"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
			<span class="text-[11px] font-medium text-emerald-accent">Copied</span>
		{:else}
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<rect x="9" y="9" width="13" height="13" rx="2" />
				<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
			</svg>
			<span class="text-[11px] font-medium">Copy</span>
		{/if}
	</button>
</div>
