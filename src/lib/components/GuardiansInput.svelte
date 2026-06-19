<script lang="ts">
	import type { GuardianEntry } from '$lib/free-will/config';

	let {
		value,
		onresponse,
	}: {
		value: GuardianEntry[] | null;
		onresponse: (val: GuardianEntry[]) => void;
	} = $props();

	function getGuardians(): GuardianEntry[] {
		if (Array.isArray(value) && value.length === 2) {
			return value;
		}
		// Always initialize with exactly 2 guardians
		return [
			{ fullName: '', relationship: '', contact: '' },
			{ fullName: '', relationship: '', contact: '' },
		];
	}

	function update(index: number, patch: Partial<GuardianEntry>) {
		onresponse(getGuardians().map((g, i) => (i === index ? { ...g, ...patch } : g)));
	}

	let guardians = $derived(getGuardians());

	const ordinals = ['1st', '2nd'];
</script>

<div class="space-y-6">
	<div class="rounded-2xl bg-white border border-navy/10 p-6 space-y-3">
		<p class="text-[14px] text-navy/70 leading-relaxed">
			Guardians are responsible for raising your minor children if both parents pass away. You must name two individuals in order of preference. Only one will serve at a time — if the first is unable or unwilling, the second steps in.
		</p>
		<p class="text-[14px] text-navy/50 leading-relaxed">
			Choose people who share your values, are willing and able to care for your children, and understand their responsibilities. It is a good idea to ask them before naming them here.
		</p>
	</div>

	<div class="space-y-3">
		{#each guardians as guardian, i}
			<div class="rounded-2xl border border-navy/8 bg-white p-4">
				<div class="flex items-center justify-between mb-3">
					<span class="text-[11px] font-semibold text-navy/35 tracking-wider uppercase">{ordinals[i]} Guardian</span>
				</div>
				<div class="flex items-end gap-2">
					<div class="flex-1 min-w-0">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Full name</label>
						<input
							type="text"
							placeholder="Full legal name"
							value={guardian.fullName}
							oninput={(e) => update(i, { fullName: (e.target as HTMLInputElement).value })}
							class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Relationship</label>
						<input
							type="text"
							placeholder="e.g. Sister, close friend"
							value={guardian.relationship}
							oninput={(e) => update(i, { relationship: (e.target as HTMLInputElement).value })}
							class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
						/>
					</div>
				</div>
				<div class="mt-2.5">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Phone or email <span class="normal-case text-navy/30 font-normal">(optional)</span></label>
					<input
						type="text"
						placeholder="For your records only"
						value={guardian.contact ?? ''}
						oninput={(e) => update(i, { contact: (e.target as HTMLInputElement).value })}
						class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
					/>
				</div>
			</div>
		{/each}
	</div>
</div>
