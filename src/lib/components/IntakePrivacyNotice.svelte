<script lang="ts">
	/**
	 * Spec v3 §4.2 intake privacy notice. Shown where substantive information is
	 * first collected: the first family, asset, or heir question of the free will,
	 * and the trust screening / interview. The text is the spec's, verbatim, from
	 * `intakePrivacyNotice` in `$lib/config`.
	 *
	 * PUBLISH CONDITION: the notice states that we do not send interview data to
	 * advertising platforms. `docs/tracking-inventory.md` records that no
	 * advertising tag exists in this repository. Confirm the Vercel, Clio, Calendly
	 * and ad-account items in that document before shipping.
	 */
	import { intakePrivacyNotice } from '$lib/config';

	let { class: className = '' }: { class?: string } = $props();
</script>

<aside
	class="rounded-xl border border-navy/10 bg-white/60 px-4 py-3 {className}"
	aria-label="Privacy notice"
	data-testid="intake-privacy-notice"
>
	<p class="text-navy/60 text-xs leading-relaxed">{intakePrivacyNotice}</p>
</aside>
