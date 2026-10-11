<script lang="ts">
	import { productNameShort, productNameShortCapitalized } from '$lib/config';
	import PracticePage from '../PracticePage.svelte';
</script>

<PracticePage
	title="Legacy Plan"
	summary="The Legacy Plan is a full-service Islamic estate plan designed with your attorney and built around Islamic inheritance and the law of Texas or California. Plans start at $3,500."
	blocks={[
		{
			type: 'p',
			text: "What's included: a revocable living trust designed for your family; pour-over wills; financial and healthcare powers of attorney and directives; preparation and recording of the deed to your home; a dedicated session on how your marital property is treated, including heba; and a printed binder of your documents."
		},
		{
			type: 'p',
			text: 'How it works: We begin with a consultation. We then design the plan with you — your heirs, your assets, and how marital property should be treated — draft your documents, review them with you, coordinate signing, and give you written guidance on funding your trust.'
		},
		{ type: 'h2', text: `How is the Legacy Plan different from ${productNameShort}?` },
		{
			type: 'p',
			text: `${productNameShortCapitalized()} is completed online through a guided interview and suits married couples with straightforward estates. The Legacy Plan is designed with your attorney and suits families with more to plan for, such as retirement accounts, more than one property, a blended family, or a business.`
		}
	]}
/>
