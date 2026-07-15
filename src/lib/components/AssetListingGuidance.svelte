<script lang="ts">
	import InfoPopout from './InfoPopout.svelte';
	import { DO_LIST_ASSETS, DO_NOT_LIST_ASSETS } from '$lib/asset-listing';

	let {
		variant,
	}: {
		/** heba = mutual gift list; assets = ownership designation list */
		variant: 'heba' | 'assets';
	} = $props();

	let helpOpen = $state(false);
	let laterOpen = $state(false);
</script>

<div class="space-y-4">
	<!-- Major assets only card -->
	<div class="rounded-2xl border border-navy/8 bg-navy/2 px-4 py-3.5 space-y-2">
		<p class="text-[13.5px] text-navy/70 leading-relaxed">
			You do not need to list everything you own. Focus on assets your trustee would need to know about:
			your home, major accounts, retirement accounts, business interests, real estate, and high-value personal items.
		</p>
		<p class="text-[13.5px] text-navy font-semibold leading-relaxed">
			Do not list cars or ordinary household items.
		</p>
	</div>

	<!-- Do / Do not list -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
		<div class="rounded-2xl border border-navy/8 bg-white px-4 py-3">
			<div class="text-[11px] font-medium text-emerald-700/70 tracking-wider uppercase mb-2">Do list</div>
			<ul class="space-y-1">
				{#each DO_LIST_ASSETS as item}
					<li class="text-[12.5px] text-navy/65 leading-snug flex gap-2">
						<span class="text-emerald-600/50 shrink-0">·</span>
						<span>{item}</span>
					</li>
				{/each}
			</ul>
		</div>
		<div class="rounded-2xl border border-navy/8 bg-white px-4 py-3">
			<div class="text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-2">Do not list</div>
			<ul class="space-y-1">
				{#each DO_NOT_LIST_ASSETS as item}
					<li class="text-[12.5px] text-navy/55 leading-snug flex gap-2">
						<span class="text-navy/25 shrink-0">·</span>
						<span>{item}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<!-- Path-specific copy (shared rules live above — avoid repeating them) -->
	<div class="text-[13.5px] text-navy/60 leading-relaxed space-y-2">
		{#if variant === 'heba'}
			<p>
				Because you chose the mutual gift (heba), you do not need to designate which spouse Islamically owns each asset.
				Just list your major assets so your trustee has a clear roadmap later.
			</p>
		{:else}
			<p>
				For each major asset, indicate which spouse Islamically owns it, or whether it should be treated as 50/50.
				Generally, this is based on whose income, savings, gift, or inheritance acquired the asset.
			</p>
			<p>
				If you do not list a community property asset, the trust will treat it as 50/50 for Islamic distribution purposes.
				This is a practical default, not a religious ruling about who really owns the asset.
			</p>
		{/if}
		<p>
			Cars should generally use your state’s vehicle transfer-on-death process. Clothing, furniture, appliances,
			dishes, and everyday household items are handled under the trust’s household property rules.
		</p>
	</div>

	<!-- Help link -->
	<button
		type="button"
		onclick={() => (helpOpen = true)}
		class="text-[13px] font-medium text-navy/75 underline decoration-navy/25 hover:decoration-navy/60 hover:text-navy transition-colors cursor-pointer"
	>
		How does this asset list work in my trust?
	</button>

	<!-- Funding clarification -->
	<p class="text-[12.5px] text-navy/55 leading-relaxed rounded-xl border border-amber-200/60 bg-amber-50/50 px-3.5 py-2.5">
		<span class="font-medium text-navy/70">Important:</span>
		This list helps identify and allocate assets, but some assets require separate funding steps before the trust controls them.
		Follow the funding instructions after signing.
	</p>

	<!-- Later-acquired assets accordion -->
	<div class="rounded-2xl border border-navy/8 bg-white overflow-hidden">
		<button
			type="button"
			onclick={() => (laterOpen = !laterOpen)}
			aria-expanded={laterOpen}
			class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer hover:bg-navy/2 transition-colors"
		>
			<span class="text-[13px] font-medium text-navy/80">What if I buy or sell something later?</span>
			<svg
				class="w-4 h-4 text-navy/35 shrink-0 transition-transform duration-200 {laterOpen ? 'rotate-180' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
		{#if laterOpen}
			<div class="px-4 pb-4 text-[13px] text-navy/60 leading-relaxed space-y-2 border-t border-navy/6 pt-3">
				<p>
					Your asset list can be updated after signing. If you sell a listed asset, cross it out on your printed schedule,
					initial it, and date the change. If you buy a new major asset, write it into the extra space, initial it, and date the addition.
				</p>
				<p>This is one reason we leave extra space in the final trust schedule.</p>
				<p>
					For assets that require formal transfer steps, such as real estate, bank accounts, investment accounts, or beneficiary designations,
					updating the list may not be enough by itself. You may also need to complete the required deed, account, beneficiary, or institution-specific paperwork.
				</p>
			</div>
		{/if}
	</div>
</div>

<InfoPopout open={helpOpen} onclose={() => (helpOpen = false)} title="How does this asset list work in my trust?">
	{#if variant === 'heba'}
		<p>
			This list is a roadmap for your trustee. It helps your trustee know what major assets exist and how to handle them after death.
		</p>
		<p class="mt-3">
			Listing an asset is not always enough to fund the trust. Some assets may also require a deed, beneficiary designation,
			bank form, account update, or other transfer step.
		</p>
		<p class="mt-3">
			After signing, keep this list updated. If you sell a major asset, cross it out, initial it, and date the change.
			If you buy a new major asset, write it in, initial it, and date the addition.
		</p>
		<p class="mt-3">
			List major assets only. Do not list cars. Do not list ordinary household items like clothing, furniture, appliances,
			dishes, or everyday personal items. You may list high-value personal items like fine jewelry, art, collectibles,
			or other items your trustee should specifically know about.
		</p>
	{:else}
		<p>
			This list is a roadmap for your trustee. It tells your trustee which major assets should be treated as belonging to
			Husband, Wife, or both spouses for Islamic distribution purposes.
		</p>
		<p class="mt-3">
			Listing an asset is not always enough to fund the trust. Some assets may also require a deed, beneficiary designation,
			bank form, account update, or other transfer step.
		</p>
		<p class="mt-3">
			After signing, keep this list updated. If you sell a major asset, cross it out, initial it, and date the change.
			If you buy a new major asset, write it in, initial it, and date the addition.
		</p>
		<p class="mt-3">
			List major assets only. Do not list cars. Do not list ordinary household items like clothing, furniture, appliances,
			dishes, or everyday personal items. You may list high-value personal items like fine jewelry, art, collectibles,
			or other items your trustee should specifically know about.
		</p>
		<p class="mt-3">
			If you do not list a community property asset, the trust will treat it as 50/50 for Islamic distribution purposes.
		</p>
	{/if}
</InfoPopout>
