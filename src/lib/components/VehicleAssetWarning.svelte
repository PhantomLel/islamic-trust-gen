<script lang="ts">
	import { textLooksLikeVehicle, VEHICLE_WARNING_COPY } from '$lib/asset-listing';

	let {
		assetName,
		dismissed = false,
		onkeep,
		onremove,
	}: {
		assetName: string;
		/** True after the user chose “Keep anyway” for this row. */
		dismissed?: boolean;
		onkeep: () => void;
		onremove: () => void;
	} = $props();

	let show = $derived(!dismissed && textLooksLikeVehicle(assetName));
</script>

{#if show}
	<div class="rounded-xl border border-amber-300/70 bg-amber-50 px-3.5 py-3 space-y-2.5" role="alert">
		<p class="text-[12.5px] text-navy/75 leading-relaxed">{VEHICLE_WARNING_COPY}</p>
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				onclick={onremove}
				class="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-navy/12 bg-white text-navy/70
					hover:border-navy/25 hover:text-navy transition-colors cursor-pointer"
			>
				Remove this item
			</button>
			<button
				type="button"
				onclick={onkeep}
				class="px-3 py-1.5 rounded-lg text-[12px] font-medium text-navy/55 hover:text-navy/80 transition-colors cursor-pointer"
			>
				Keep anyway
			</button>
		</div>
	</div>
{/if}
