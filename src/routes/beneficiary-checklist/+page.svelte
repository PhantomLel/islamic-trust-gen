<script lang="ts">
	import WillGuideLayout from '$lib/components/WillGuideLayout.svelte';
	import { consultationBookingUrl } from '$lib/config';
	import {
		beneficiaryChecklistDisclaimer,
		beneficiaryChecklistIntro,
		beneficiaryChecklistSteps,
		beneficiaryIslamicWarning,
		beneficiaryWillScope,
	} from '$lib/free-will/content/beneficiary-checklist';
</script>

<svelte:head>
	<title>Review Your Beneficiary Designations | Muslim Legacy Planning</title>
	<meta
		name="description"
		content="A checklist to review retirement, insurance, and payable-on-death beneficiary forms so they support your Islamic estate plan."
	/>
</svelte:head>

<WillGuideLayout
	title="Review Your Beneficiary Designations"
	subtitle={beneficiaryChecklistIntro.lede}
>
	<div class="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-6">
		<h2 class="text-lg text-navy tracking-tight mb-2">{beneficiaryChecklistIntro.warningTitle}</h2>
		<p class="text-navy/65 text-[15px] leading-relaxed mb-4">{beneficiaryChecklistIntro.warningBody}</p>
		<p class="text-[13px] font-medium text-navy/55 mb-2">This commonly includes:</p>
		<ul class="space-y-2">
			{#each beneficiaryChecklistIntro.commonAssets as item}
				<li class="flex items-start gap-2.5 text-navy/65 text-sm leading-relaxed">
					<span class="text-amber-600 shrink-0 mt-1">●</span>
					<span>{item}</span>
				</li>
			{/each}
		</ul>
	</div>

	<div>
		<h2 class="text-xl text-navy tracking-tight mb-5">Your beneficiary checklist</h2>
		<div class="space-y-6">
			{#each beneficiaryChecklistSteps as step}
				<div class="rounded-2xl border border-navy/10 bg-white/70 p-5 md:p-6">
					<div class="flex items-start gap-4">
						<span class="w-8 h-8 rounded-full bg-emerald-accent/10 text-emerald-accent text-sm font-semibold flex items-center justify-center shrink-0 tabular-nums">
							{step.number}
						</span>
						<div class="flex-1 min-w-0">
							<h3 class="text-navy font-medium text-[15px] leading-snug mb-2">{step.title}</h3>
							{#each step.paragraphs as paragraph}
								<p class="text-navy/60 text-sm leading-relaxed mb-2 last:mb-0">{paragraph}</p>
							{/each}
							{#if step.bullets}
								<ul class="mt-2 space-y-1.5">
									{#each step.bullets as item}
										<li class="flex items-start gap-2 text-navy/60 text-sm leading-relaxed">
											<span class="text-emerald-accent/70 shrink-0">–</span>
											<span>{item}</span>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="rounded-2xl border border-navy/10 bg-navy/[0.03] p-6">
		<h2 class="text-lg text-navy tracking-tight mb-3">{beneficiaryIslamicWarning.title}</h2>
		{#each beneficiaryIslamicWarning.paragraphs as paragraph}
			<p class="text-navy/65 text-[15px] leading-relaxed mb-3 last:mb-0">{paragraph}</p>
		{/each}
	</div>

	<div class="rounded-2xl border border-navy/10 bg-white/70 p-6">
		<h2 class="text-lg text-navy tracking-tight mb-3">{beneficiaryWillScope.title}</h2>
		{#each beneficiaryWillScope.paragraphs as paragraph}
			<p class="text-navy/65 text-[15px] leading-relaxed">{paragraph}</p>
		{/each}
	</div>

	<div class="rounded-2xl bg-navy overflow-hidden">
		<div class="p-7 space-y-5">
			<h2 class="text-cream text-xl tracking-tight">Recommended next step</h2>
			<p class="text-cream/60 text-sm leading-relaxed">
				For a simple estate, review every beneficiary form and keep confirmation copies with your will. If you own a home, have retirement accounts, want to avoid probate, or want the Islamic shares implemented more completely, consider a living trust coordinated with your beneficiary designations.
			</p>
			<div class="flex flex-col sm:flex-row gap-3">
				<a
					href="/trust"
					class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-navy bg-cream transition-all hover:bg-white"
				>
					Explore the GoodTree Trust App
				</a>
				<a
					href={consultationBookingUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-cream border border-cream/25 transition-all hover:bg-cream/10"
				>
					Book an estate-planning consultation
				</a>
			</div>
		</div>
	</div>

	<p class="text-navy/40 text-xs leading-relaxed border-t border-navy/8 pt-6">{beneficiaryChecklistDisclaimer}</p>
</WillGuideLayout>
