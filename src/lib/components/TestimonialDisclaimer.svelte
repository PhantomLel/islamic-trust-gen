<script lang="ts">
	import { testimonialDisclaimer } from '$lib/config';

	/**
	 * Spec v3 §2.8. Always rendered as visible text next to the testimonial it
	 * qualifies (never behind a click, tooltip or description field). Reused by
	 * testimonial videos on the content platform.
	 */
	let { class: className = '' }: { class?: string } = $props();
</script>

<p data-testid="testimonial-disclaimer" class={className || 'text-xs leading-relaxed text-navy/65'}>
	{testimonialDisclaimer}
</p>
