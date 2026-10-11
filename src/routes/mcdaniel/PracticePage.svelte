<script lang="ts">
	import { consultationBookingUrl } from '$lib/config';

	type Block = { type: 'h2' | 'p'; text: string };

	let {
		title,
		summary,
		blocks
	}: {
		title: string;
		summary: string;
		blocks: Block[];
	} = $props();
</script>

<main class="px-6 lg:px-10 pt-32 md:pt-40 pb-24 md:pb-32">
	<article class="max-w-3xl mx-auto">
		<h1 class="mep-serif text-[2.4rem] md:text-[3.2rem] leading-[1.1] tracking-tight">{title}</h1>
		<p class="mt-8 text-[1.15rem] md:text-[1.25rem] leading-relaxed text-[#1F2D3D] bg-white border-l-2 border-[#9A7B45] px-5 py-5">
			{summary}
		</p>
		<div class="mt-10 space-y-5 text-[16px] leading-relaxed text-[#1F2D3D]/78">
			{#each blocks as block}
				{#if block.type === 'h2'}
					<h2 class="mep-serif text-[1.55rem] leading-snug text-[#1F2D3D] pt-6">{block.text}</h2>
				{:else}
					<p>{block.text}</p>
				{/if}
			{/each}
		</div>
		<a
			href={consultationBookingUrl}
			target="_blank"
			rel="noopener"
			class="inline-flex justify-center items-center mt-12 bg-[#1F2D3D] text-[#FCFBF8] text-[14.5px] tracking-[0.03em] px-8 py-4 hover:bg-[#2B3D52] active:translate-y-px transition-all duration-300"
		>
			Book a consultation
		</a>
	</article>
</main>
