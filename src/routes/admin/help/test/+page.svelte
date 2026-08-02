<script lang="ts">
	import HelpPanel from '$lib/components/help/HelpPanel.svelte';
	import { HELP_STEP_KEY_GROUPS } from '$lib/help/stepKeys';
	import type { HelpSurface } from '$lib/server/db/help.schema';

	const surfaces: { value: HelpSurface; label: string }[] = [
		{ value: 'help_center', label: 'Help center' },
		{ value: 'create_trust', label: 'Create trust' },
		{ value: 'funding', label: 'Funding' },
		{ value: 'dashboard', label: 'Dashboard' },
	];

	let surface = $state<HelpSurface>('help_center');
	let stepKey = $state('');
	let sessionKey = $state(0);

	function newConversation() {
		sessionKey += 1;
	}
</script>

<div class="mb-6">
	<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Test chatbot</h1>
	<p class="text-navy/45 text-sm max-w-2xl">
		Send questions through the same API and pipeline users get in the app. Debug metadata (response kind, matched entry) is shown on each reply.
	</p>
</div>

<div class="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
	<section class="rounded-xl border border-navy/[0.06] bg-white/70 p-5 h-fit space-y-4">
		<h2 class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">Context</h2>

		<label class="block">
			<span class="text-sm font-medium text-navy">Surface</span>
			<select
				bind:value={surface}
				class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
			>
				{#each surfaces as s (s.value)}
					<option value={s.value}>{s.label}</option>
				{/each}
			</select>
		</label>

		<label class="block">
			<span class="text-sm font-medium text-navy">Step key</span>
			<p class="text-[12px] text-navy/45 mt-0.5">Optional — simulates a specific app step.</p>
			<select
				bind:value={stepKey}
				class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent cursor-pointer"
			>
				<option value="">None</option>
				{#each HELP_STEP_KEY_GROUPS as group (group.label)}
					<optgroup label={group.label}>
						{#each group.keys as key (key)}
							<option value={key}>{key}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</label>

		<button
			type="button"
			onclick={newConversation}
			class="w-full rounded-lg border border-navy/15 bg-white px-4 py-2 text-sm text-navy hover:border-emerald-accent transition-colors cursor-pointer"
		>
			New conversation
		</button>

		<p class="text-[12px] text-navy/45 leading-relaxed">
			Test conversations are saved like real ones and appear under the Conversations tab.
		</p>
	</section>

	<section>
		{#key sessionKey}
			<HelpPanel
				embedded
				showDebug
				{surface}
				stepKey={stepKey.trim() || null}
			/>
		{/key}
	</section>
</div>
