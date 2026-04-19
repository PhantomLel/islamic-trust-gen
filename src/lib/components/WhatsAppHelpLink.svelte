<script lang="ts">
	let {
		message = 'Not sure how to fill out this question?',
		label = 'Speak with an imam or attorney',
		phone = '+16194906369',
		email = 'leonard@mcdanielestateplanning.com',
	}: {
		message?: string;
		label?: string;
		phone?: string;
		email?: string;
	} = $props();

	let whatsappHref = $derived(
		`https://wa.me/${phone}?text=${encodeURIComponent(message)}`
	);

	let mailtoHref = $derived(
		`mailto:${email}?body=${encodeURIComponent(message)}`
	);

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

	const whatsappLinkClass =
		'inline-flex max-w-full items-start gap-2 text-[13px] font-medium text-emerald-accent/80 hover:text-emerald-accent transition-colors sm:items-center';

	const emailLinkClass =
		'inline-flex w-fit shrink-0 items-center text-navy/65 hover:text-navy transition-colors';
</script>

<div
	class="inline-flex max-w-full flex-wrap items-start gap-x-6 gap-y-3 sm:items-center sm:gap-y-2"
>
	<a
		href={whatsappHref}
		target="_blank"
		rel="noopener noreferrer"
		class={whatsappLinkClass}
	>
		<svg class="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" viewBox="0 0 24 24" fill="currentColor">
			<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
		</svg>
		<span class="min-w-0 text-pretty wrap-break-word">{label}</span>
	</a>

	<div class="flex max-w-full min-w-0 items-center gap-2">
		<a
			href={mailtoHref}
			class="{emailLinkClass} shrink-0 self-center"
			aria-label={`Compose email — ${label}. Opens your email app to ${email}.`}
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
</div>
