<script lang="ts">
	import EmailCopyLink from '$lib/components/EmailCopyLink.svelte';

	let {
		message = 'Not sure how to fill out this question?',
		label = 'Speak with an imam or attorney',
		email = 'leonard@mcdanielestateplanning.com',
	}: {
		message?: string;
		label?: string;
		email?: string;
	} = $props();

	let mailtoHref = $derived(
		`mailto:${email}?body=${encodeURIComponent(message)}`
	);
</script>

<EmailCopyLink
	{email}
	href={mailtoHref}
	composeLabel={`${label} — compose email`}
/>
