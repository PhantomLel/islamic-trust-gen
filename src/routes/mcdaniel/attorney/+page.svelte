<script lang="ts">
	import { attorneyName, consultationBookingUrl, mlpOrigin, productNameMidSentence } from '$lib/config';

	const facts = [
		{ label: 'Texas', value: 'Admitted 2021' },
		{ label: 'California', value: 'Admitted 2023' },
		{ label: 'Founder', value: 'McDaniel Estate Planning, PLLC' },
		{ label: 'Law school', value: 'University of Houston Law Center' }
	];
</script>

<main class="max-w-6xl mx-auto px-6 lg:px-10 pt-32 md:pt-40 pb-16 md:pb-24 grid lg:grid-cols-[0.8fr_1.4fr] gap-12 lg:gap-24 items-start">
	<aside class="lg:sticky lg:top-28">
		<figure class="relative aspect-4/5 overflow-hidden bg-[#1F2D3D]">
			<img
				src="/pfp.jpg"
				alt="{attorneyName}, founding attorney of McDaniel Estate Planning"
				class="w-full h-full object-cover"
				width="800"
				height="1000"
			/>
		</figure>
		<dl class="mt-8 space-y-4">
			{#each facts as f}
				<div class="border-t border-[#1F2D3D]/12 pt-3">
					<dt class="text-[11px] tracking-[0.18em] uppercase text-[#9A7B45]">{f.label}</dt>
					<dd class="mt-1 text-[14.5px] text-[#1F2D3D]/80">{f.value}</dd>
				</div>
			{/each}
		</dl>
	</aside>

	<article>
		<p class="text-[11px] tracking-[0.3em] uppercase text-[#9A7B45] mb-5">Attorney profile</p>
		<h1 class="mep-serif text-[2.4rem] md:text-[3.2rem] leading-[1.1] tracking-tight mb-10">
			{attorneyName}, JD
		</h1>

		<div class="space-y-5 text-[16px] leading-relaxed text-[#1F2D3D]/78 max-w-[60ch]">
			<p>
				Leonard McDaniel is an estate planning attorney and the founder of McDaniel Estate Planning, PLLC. He is
				licensed in Texas and California and is a graduate of the University of Houston Law Center. He embraced Islam
				in 2014 while studying history at UCLA, where he graduated magna cum laude.
			</p>
			<p>
				Leonard has focused on estate planning for Muslim families since 2022, when he began working at Yaser Ali
				Law, an Islamic estate planning firm. He continues to study Islamic inheritance law privately.
			</p>
			<p>
				He built {productNameMidSentence()} so that more families could put an attorney-supervised plan in place
				that reflects Islamic inheritance and is structured under the law of the state where they live.
			</p>
			<p>Leonard serves without compensation as secretary of the board of Jabal Foundation.</p>
		</div>

		<div class="mt-12 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-[14.5px]">
			<a
				href={consultationBookingUrl}
				target="_blank"
				rel="noopener"
				class="inline-flex justify-center items-center bg-[#1F2D3D] text-[#FCFBF8] px-8 py-4 hover:bg-[#2B3D52] transition-colors"
			>
				Book a Legal Consultation
			</a>
			<a href={mlpOrigin} class="text-[#1F2D3D]/75 hover:text-[#1F2D3D] border-b border-[#9A7B45]/50 pb-0.5 self-start sm:self-auto">
				Visit Muslim Legacy Planning
			</a>
		</div>
	</article>
</main>
