<script lang="ts">
	import { tick } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { usStates } from '$lib/free-will/config';
	import type { ShippingAddress } from '$lib/server/db/schema';

	let {
		trustId,
		existingAddress = null,
		saveActionPath = '/dashboard?/saveShippingAddress',
		id = 'shipping-address',
	} = $props<{
		trustId: number;
		existingAddress?: ShippingAddress | null;
		saveActionPath?: string;
		id?: string;
	}>();

	let savedAddress = $state<ShippingAddress | null>(existingAddress);
	let editing = $state(existingAddress === null);
	let street = $state(existingAddress?.street ?? '');
	let unit = $state(existingAddress?.unit ?? '');
	let city = $state(existingAddress?.city ?? '');
	let state = $state(existingAddress?.state ?? '');
	let zip = $state(existingAddress?.zip ?? '');

	let saving = $state(false);
	let error = $state('');
	let saved = $state(false);
	let highlighted = $state(false);
	let streetInput = $state<HTMLInputElement | null>(null);
	let highlightTimeout: ReturnType<typeof setTimeout> | undefined;

	export function highlight() {
		highlighted = true;
		clearTimeout(highlightTimeout);
		highlightTimeout = setTimeout(() => {
			highlighted = false;
		}, 2000);
		if (editing) {
			tick().then(() => streetInput?.focus({ preventScroll: true }));
		}
	}

	let isValid = $derived(
		street.trim().length > 0 &&
			city.trim().length > 0 &&
			state.trim().length > 0 &&
			/^\d{5}(-\d{4})?$/.test(zip.trim())
	);

	function startEdit() {
		saved = false;
		editing = true;
	}

	function cancelEdit() {
		street = savedAddress?.street ?? '';
		unit = savedAddress?.unit ?? '';
		city = savedAddress?.city ?? '';
		state = savedAddress?.state ?? '';
		zip = savedAddress?.zip ?? '';
		error = '';
		editing = false;
	}

	async function save() {
		if (!isValid) {
			error = 'Please fill in a valid street, city, state, and ZIP code.';
			return;
		}
		error = '';
		saving = true;

		const normalized: ShippingAddress = {
			street: street.trim(),
			unit: unit.trim() || null,
			city: city.trim(),
			state: state.trim(),
			zip: zip.trim(),
		};

		const formData = new FormData();
		formData.set('trustId', String(trustId));
		formData.set('shippingAddress', JSON.stringify(normalized));

		const response = await fetch(saveActionPath, {
			method: 'POST',
			body: formData,
		});

		saving = false;
		if (!response.ok) {
			error = 'Could not save your address. Please try again.';
			return;
		}

		savedAddress = normalized;
		editing = false;
		saved = true;
		await invalidateAll();
	}
</script>

<div
	{id}
	class="rounded-2xl bg-white/70 backdrop-blur-sm border p-6 scroll-mt-24 transition-all duration-300
		{highlighted ? 'border-emerald-accent/40 ring-2 ring-emerald-accent/25 shadow-md' : 'border-navy/[0.06]'}"
>
	<div class="flex items-center justify-between mb-1">
		<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium">Legacy Binder Shipping Address</p>
		{#if !editing}
			<button
				type="button"
				onclick={startEdit}
				class="text-[11px] font-medium text-navy/45 hover:text-emerald-accent transition-colors cursor-pointer"
			>
				Edit
			</button>
		{/if}
	</div>
	<p class="text-[13px] text-navy/55 leading-relaxed mb-4">
		We'll mail you a printed legacy binder with all of your documents and instructions in one place. Let us know where to send it.
	</p>

	{#if editing}
		<div class="flex flex-col gap-3">
			<input
				type="text"
				autocomplete="address-line1"
				bind:this={streetInput}
				bind:value={street}
				placeholder="Street address"
				class="w-full px-4 py-3 rounded-xl border border-navy/12 bg-white text-navy text-[14px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
			/>
			<input
				type="text"
				autocomplete="address-line2"
				bind:value={unit}
				placeholder="Apt, suite, unit (optional)"
				class="w-full px-4 py-3 rounded-xl border border-navy/12 bg-white text-navy text-[14px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
			/>
			<div class="grid grid-cols-2 sm:grid-cols-[1fr_140px_120px] gap-3">
				<input
					type="text"
					autocomplete="address-level2"
					bind:value={city}
					placeholder="City"
					class="w-full px-4 py-3 rounded-xl border border-navy/12 bg-white text-navy text-[14px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
				/>
				<select
					bind:value={state}
					class="w-full px-4 py-3 rounded-xl border border-navy/12 bg-white text-navy text-[14px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15"
				>
					<option value="" disabled>State</option>
					{#each usStates as s}
						<option value={s.code}>{s.name}</option>
					{/each}
				</select>
				<input
					type="text"
					inputmode="numeric"
					autocomplete="postal-code"
					bind:value={zip}
					placeholder="ZIP"
					class="w-full px-4 py-3 rounded-xl border border-navy/12 bg-white text-navy text-[14px] outline-none transition-all focus:border-emerald-accent/60 focus:ring-2 focus:ring-emerald-accent/15 placeholder:text-navy/30"
				/>
			</div>

			{#if error}
				<p class="text-[12px] text-red-600">{error}</p>
			{/if}

			<div class="flex items-center gap-3 mt-1">
				<button
					type="button"
					onclick={save}
					disabled={saving || !isValid}
					class="px-4 py-2.5 rounded-xl bg-navy text-cream text-[13px] font-medium hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
				>
					{saving ? 'Saving…' : 'Save address'}
				</button>
				{#if savedAddress}
					<button
						type="button"
						onclick={cancelEdit}
						class="text-[13px] text-navy/45 hover:text-navy transition-colors cursor-pointer"
					>
						Cancel
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="flex items-start justify-between gap-4 px-4 py-3.5 rounded-xl border border-navy/[0.07] bg-white/50">
			<div class="text-[13px] text-navy/75 leading-relaxed">
				<p>{savedAddress?.street}{savedAddress?.unit ? `, ${savedAddress.unit}` : ''}</p>
				<p>{savedAddress?.city}, {savedAddress?.state} {savedAddress?.zip}</p>
			</div>
			{#if saved}
				<span class="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-accent/30 bg-emerald-accent/10 px-2.5 py-1 text-[11px] font-medium text-emerald-accent">
					<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					Saved
				</span>
			{/if}
		</div>
	{/if}
</div>
