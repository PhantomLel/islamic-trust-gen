<script lang="ts">
	import type { ExecutorEntry } from '$lib/free-will/config';

	let {
		value,
		onresponse,
	}: {
		value: ExecutorEntry[] | null;
		onresponse: (val: ExecutorEntry[]) => void;
	} = $props();

	function getExecutors(): ExecutorEntry[] {
		if (Array.isArray(value) && value.length === 3) {
			return value;
		}
		// Always initialize with exactly 3 executors
		return [
			{ fullName: '', relationship: '', contact: '' },
			{ fullName: '', relationship: '', contact: '' },
			{ fullName: '', relationship: '', contact: '' },
		];
	}

	function update(index: number, patch: Partial<ExecutorEntry>) {
		onresponse(getExecutors().map((e, i) => (i === index ? { ...e, ...patch } : e)));
	}

	let executors = $derived(getExecutors());

	const ordinals = ['1st', '2nd', '3rd'];
</script>

<div class="space-y-6">
	<div class="rounded-2xl bg-white border border-navy/10 p-6 space-y-3">
		<p class="text-[14px] text-navy/70 leading-relaxed">
			Your personal representatives (also called executors) are responsible for carrying out your wishes after your death. You must name three individuals in order of preference. Only one will serve at a time — if the first is unable or unwilling, the second steps in, and so on.
		</p>
		<p class="text-[14px] text-navy/50 leading-relaxed">
			Choose people who are trustworthy, organized, and willing to take on this responsibility. It is a good idea to ask them before naming them here.
		</p>
	</div>

	<div class="space-y-3">
		{#each executors as executor, i}
			<div class="rounded-2xl border border-navy/8 bg-white p-4">
				<div class="flex items-center justify-between mb-3">
					<span class="text-[11px] font-semibold text-navy/35 tracking-wider uppercase">{ordinals[i]} Personal Representative</span>
				</div>
				<div class="flex items-end gap-2">
					<div class="flex-1 min-w-0">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Full name</label>
						<input
							type="text"
							placeholder="Full legal name"
							value={executor.fullName}
							oninput={(e) => update(i, { fullName: (e.target as HTMLInputElement).value })}
							class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-[11px] font-medium text-navy/40 tracking-wider uppercase mb-1.5">Relationship</label>
						<input
							type="text"
							placeholder="e.g. Brother, close friend"
							value={executor.relationship}
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
						value={executor.contact ?? ''}
						oninput={(e) => update(i, { contact: (e.target as HTMLInputElement).value })}
						class="w-full rounded-xl border border-navy/8 bg-navy/2 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/10 transition-all"
					/>
				</div>
			</div>
		{/each}
	</div>
</div>
