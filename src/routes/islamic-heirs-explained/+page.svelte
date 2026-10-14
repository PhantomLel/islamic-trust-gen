<script lang="ts">
	import WillGuideLayout from '$lib/components/WillGuideLayout.svelte';
	import { consultationBookingUrl } from '$lib/config';
	import {
		heirExplainerDisclaimer,
		heirExplainerSections,
	} from '$lib/free-will/content/heir-explainer';
</script>

<WillGuideLayout
	title="Who Counts as an Islamic Heir?"
	subtitle="Islamic inheritance follows defined eligibility rules. This short guide explains whom to include in the calculator and why."
>
	{#each heirExplainerSections as section}
		<section id={section.id} class="scroll-mt-24">
			<h2 class="text-xl text-navy tracking-tight mb-3">{section.title}</h2>
			{#each section.paragraphs as paragraph}
				<p class="text-navy/65 text-[15px] leading-relaxed mb-3 last:mb-0">{paragraph}</p>
			{/each}
			{#if section.bullets}
				<ul class="mt-3 space-y-2">
					{#each section.bullets as item}
						<li class="flex items-start gap-2.5 text-navy/65 text-[15px] leading-relaxed">
							<span class="text-emerald-accent shrink-0 mt-1.5 text-[10px]">●</span>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}

	<div class="rounded-2xl border border-navy/10 bg-white/70 p-6 space-y-4">
		<h2 class="text-lg text-navy tracking-tight">Closing reassurance</h2>
		<p class="text-navy/65 text-[15px] leading-relaxed">
			These questions are not intended to judge your family. They are asked because Islamic inheritance uses specific legal and religious categories. Answer as accurately as you can. The calculator will apply the rules, and you can seek individualized guidance when your family situation does not fit neatly into the standard questions.
		</p>
		<a
			href={consultationBookingUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-cream bg-navy transition-all hover:bg-navy-light"
		>
			Book a consultation
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
		</a>
	</div>

	<p class="text-navy/65 text-xs leading-relaxed border-t border-navy/8 pt-6">{heirExplainerDisclaimer}</p>
</WillGuideLayout>
