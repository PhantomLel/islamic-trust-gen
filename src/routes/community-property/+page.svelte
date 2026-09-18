<script lang="ts">
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import { consultationBookingUrl, firmPhone, firmPhoneTel, siteName } from '$lib/config';

	/**
	 * Printed QR codes point at this URL permanently, so the page is the fixed part
	 * and this list is the loose part — reorder, retitle, or re-source freely.
	 */
	const chapters = [
		{
			short: 'Reason 1',
			title: 'Reason 1 Islamic wills fail',
			src: 'https://xpxx9c4eks.ufs.sh/f/xrmNhsKgUH10YSXEhRqaCoHhXWLJqzQF3fwuGrBsV1nUKYg6',
		},
		{
			short: 'Reason 2',
			title: 'Reason 2 Islamic wills fail',
			src: 'https://xpxx9c4eks.ufs.sh/f/xrmNhsKgUH10l5UBmDioJthKxFW6vunG9Mm43Ig5PbXTNzcq',
		},
		{
			short: 'The Solution',
			title: 'The Solution: Islamic Trust',
			src: 'https://xpxx9c4eks.ufs.sh/f/xrmNhsKgUH10hqaE0r9TmeRCGMxDXauWj73LgnZt1bJ8Ed6S',
		},
	];

	let active = $state(0);
	let watched = $state(chapters.map(() => false));
	/** Autoplay only once the viewer has chosen a chapter — never on first paint. */
	let autoplay = $state(false);
	let failed = $state(false);

	const current = $derived(chapters[active]);
	const isLast = $derived(active === chapters.length - 1);
	const reachedEnd = $derived(watched[chapters.length - 1]);

	function go(index: number) {
		if (index < 0 || index >= chapters.length || index === active) return;
		autoplay = true;
		failed = false;
		active = index;
	}

	function handleEnded() {
		watched[active] = true;
		if (!isLast) return;
		const el = document.getElementById('actions');
		if (!el) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		requestAnimationFrame(() => {
			el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
		});
	}

	/** Rail segment state: filled when watched, faint while playing, empty ahead. */
	function railStyle(i: number): string {
		if (watched[i]) return 'transform: scaleX(1); opacity: 1';
		if (i === active) return 'transform: scaleX(1); opacity: 0.3';
		return 'transform: scaleX(0); opacity: 0';
	}
</script>

<svelte:head>
	<title>Why Islamic Wills Fail — {siteName}</title>
	<meta
		name="description"
		content="Two reasons Islamic wills fail, and the trust-based solution — three short videos from McDaniel Estate Planning."
	/>
</svelte:head>

<div class="relative min-h-[100dvh] bg-cream font-sans text-navy overflow-x-hidden">
	<div
		class="absolute inset-x-0 top-0 h-[60vh] pointer-events-none"
		style="background: radial-gradient(ellipse 75% 100% at 15% 0%, rgba(74,124,111,0.09) 0%, transparent 65%);"
		aria-hidden="true"
	></div>

	<header class="sticky top-0 z-30 border-b border-navy/[0.06] bg-cream/90 backdrop-blur-md">
		<div class="max-w-5xl mx-auto px-5 md:px-8 flex items-center justify-between gap-3 py-3.5 md:py-4">
			<a href="/" class="flex items-center gap-2.5 group min-w-0">
				<span class="w-2 h-2 rounded-full bg-emerald-accent shrink-0"></span>
				<span
					class="truncate text-[13px] md:text-[15px] font-semibold tracking-tight text-navy/85 group-hover:text-navy transition-colors"
					style="font-family: 'Playfair Display', Georgia, serif;">{siteName}</span
				>
			</a>
			<div class="flex items-center gap-4 md:gap-5 shrink-0">
				<a
					href="tel:{firmPhoneTel}"
					class="whitespace-nowrap text-[12.5px] md:text-[13.5px] tabular-nums text-navy/55 hover:text-navy border-b border-emerald-accent/40 hover:border-emerald-accent pb-0.5 transition-colors"
					>{firmPhone}</a
				>
				<a
					href={consultationBookingUrl}
					target="_blank"
					rel="noopener"
					class="hidden sm:inline-flex items-center rounded-lg bg-navy px-4 py-2.5 text-[13px] font-medium text-cream hover:bg-navy-light transition-colors active:scale-[0.98] whitespace-nowrap"
					>Book a consultation</a
				>
			</div>
		</div>
	</header>

	<div class="relative max-w-5xl mx-auto px-5 md:px-8">

		<!-- ── Chapter title ──────────────────────────────────────────────── -->
		<div class="pt-6 md:pt-10 pb-6 md:pb-8">
			{#key active}
				<div class="stage-in flex items-center gap-3.5 md:gap-4">
					<span class="w-7 md:w-9 h-px bg-emerald-accent shrink-0"></span>
					<h1
						class="text-[1.85rem] leading-[1.12] md:text-[2.9rem] md:leading-[1.08] tracking-tight text-navy"
					>
						{current.title}
					</h1>
				</div>
			{/key}
		</div>

		<!-- ── Progress ───────────────────────────────────────────────────── -->
		<section aria-label="Video chapters">
			<div class="grid grid-cols-3 gap-2.5 md:gap-4">
				{#each chapters as chapter, i (chapter.src)}
					<button
						type="button"
						onclick={() => go(i)}
						aria-current={i === active ? 'step' : undefined}
						class="group text-left cursor-pointer pb-1"
					>
						<span class="block h-[3px] rounded-full bg-navy/[0.09] overflow-hidden">
							<span
								class="block h-full w-full rounded-full bg-emerald-accent origin-left transition-all duration-700 ease-out"
								style={railStyle(i)}
							></span>
						</span>
						<span
							class="block mt-2.5 text-[12px] md:text-[13px] transition-colors {i === active
								? 'text-navy font-medium'
								: 'text-navy/40 group-hover:text-navy/70'}">{chapter.short}</span
						>
					</button>
				{/each}
			</div>

			<!-- ── Stage ──────────────────────────────────────────────────── -->
			<div
				class="mt-5 md:mt-6 rounded-2xl md:rounded-[1.75rem] bg-navy p-2 md:p-3 border border-navy/60 shadow-[0_28px_60px_-32px_rgba(30,42,58,0.55),inset_0_1px_0_rgba(250,246,240,0.09)]"
			>
				{#key active}
					<div class="stage-in">
						<VideoPlayer
							src={current.src}
							{autoplay}
							onended={handleEnded}
							onerror={() => (failed = true)}
						/>
					</div>
				{/key}
			</div>

			{#if failed}
				<div class="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3.5">
					<p class="text-[13px] font-medium text-amber-900/85 mb-1">
						This video won&rsquo;t play on your device
					</p>
					<p class="text-[12.5px] leading-relaxed text-amber-900/70">
						Try a different browser, or call
						<a href="tel:{firmPhoneTel}" class="underline underline-offset-2 hover:text-amber-900"
							>{firmPhone}</a
						> and we will walk you through it directly.
					</p>
				</div>
			{/if}

			<!-- ── Controls ───────────────────────────────────────────────── -->
			<div class="mt-5 md:mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
				<button
					type="button"
					onclick={() => go(active - 1)}
					disabled={active === 0}
					class="justify-self-start inline-flex items-center gap-2 text-[13.5px] text-navy/55 hover:text-navy disabled:opacity-0 disabled:pointer-events-none transition-colors cursor-pointer active:translate-y-px"
				>
					<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M14 8H3M7 3.5 2.5 8 7 12.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					Back
				</button>

				<span class="text-[11.5px] tabular-nums text-navy/30 tracking-wider"
					>{active + 1} / {chapters.length}</span
				>

				{#if !isLast}
					<button
						type="button"
						onclick={() => go(active + 1)}
						class="justify-self-end inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-[13.5px] font-medium text-cream hover:bg-navy-light transition-colors cursor-pointer active:scale-[0.98] {watched[
							active
						]
							? 'is-ready'
							: ''}"
					>
						{watched[active] ? 'Continue' : 'Next'}
						<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</button>
				{:else}
					<span></span>
				{/if}
			</div>
		</section>

		<!-- ── Actions ────────────────────────────────────────────────────── -->
		<section
			id="actions"
			class="mt-6 md:mt-7 scroll-mt-24 border-t border-navy/[0.07] pt-6 md:pt-7 pb-14 md:pb-20"
		>
			<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
				<a
					href={consultationBookingUrl}
					target="_blank"
					rel="noopener"
					class="inline-flex justify-center items-center rounded-xl bg-navy px-8 py-4 text-[14.5px] font-medium text-cream hover:bg-navy-light transition-colors active:scale-[0.98] shadow-[0_16px_32px_-20px_rgba(30,42,58,0.6)] {reachedEnd
						? 'is-ready'
						: ''}"
				>
					Book a consultation
				</a>
				<a
					href="/"
					class="group inline-flex justify-center items-center gap-2 rounded-xl border border-navy/12 px-8 py-4 text-[14.5px] text-navy/75 hover:text-navy hover:border-navy/25 transition-colors active:scale-[0.98]"
				>
					{siteName}
					<svg
						class="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</a>
			</div>
		</section>
	</div>
</div>

<style>
	@keyframes stageIn {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.994);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.stage-in {
		animation: stageIn 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
		will-change: opacity, transform;
	}

	/* Quiet ring on the forward action once the current chapter has finished. */
	@keyframes readyRing {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(74, 124, 111, 0);
		}
		50% {
			box-shadow: 0 0 0 5px rgba(74, 124, 111, 0.15);
		}
	}

	.is-ready {
		animation: readyRing 2.6s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.stage-in,
		.is-ready {
			animation: none !important;
		}
	}
</style>
