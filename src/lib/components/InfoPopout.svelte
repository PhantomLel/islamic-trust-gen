<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open,
		onclose,
		title,
		children,
		dismissLabel = 'Got it',
	}: {
		open: boolean;
		onclose: () => void;
		title: string;
		children: Snippet;
		dismissLabel?: string;
	} = $props();
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/20 backdrop-blur-sm"
		onclick={onclose}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative max-w-md w-full bg-white rounded-2xl shadow-2xl shadow-navy/15 p-7"
			onclick={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				onclick={onclose}
				aria-label="Close"
				class="absolute top-4 right-4 p-1.5 rounded-lg text-navy/30 hover:text-navy/60 hover:bg-navy/6 transition-colors cursor-pointer"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
			<div class="pr-6">
				<div class="w-8 h-8 rounded-full bg-navy/6 flex items-center justify-center mb-4">
					<svg class="w-4 h-4 text-navy/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h3 class="text-base font-semibold text-navy mb-3">{title}</h3>
				<div class="text-[13.5px] text-navy/65 leading-relaxed">
					{@render children()}
				</div>
			</div>
			<button
				type="button"
				onclick={onclose}
				class="mt-6 w-full py-2.5 rounded-xl text-sm font-medium text-navy bg-navy/6 hover:bg-navy/10 transition-colors cursor-pointer"
			>
				{dismissLabel}
			</button>
		</div>
	</div>
{/if}
