<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();

	const textSettings = $derived([
		['consult_booking_url', data.settings.consultBookingUrl, 'Consult booking URL'],
		['support_email', data.settings.supportEmail, 'Support email'],
		['general_support_contact_label', data.settings.generalSupportContactLabel, 'Support contact label'],
		['consult_cta_label', data.settings.consultCtaLabel, 'Consult CTA label'],
		['urgent_cta_label', data.settings.urgentCtaLabel, 'Urgent CTA label'],
		['office_phone_if_used', data.settings.officePhoneIfUsed ?? '', 'Office phone (optional)'],
	] as const);
</script>

<div class="mb-6">
	<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Help settings</h1>
	<p class="text-navy/45 text-sm">Consult destinations, support labels, and escalation contacts.</p>
</div>

<div class="max-w-2xl space-y-3">
	{#each textSettings as [key, val, label] (key)}
		<div class="rounded-xl border border-navy/[0.06] bg-white/70 p-4">
			<form method="POST" use:enhance class="flex flex-wrap items-end gap-3">
				<input type="hidden" name="key" value={key} />
				<label class="flex-1 min-w-[220px] flex flex-col gap-1">
					<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">
						{label} <span class="normal-case font-mono text-navy/30">· {key}</span>
					</span>
					<input
						name="value"
						class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent"
						value={val}
					/>
				</label>
				<button
					class="px-3 py-1.5 rounded-md bg-navy text-sm font-medium text-white hover:bg-navy-light transition-colors cursor-pointer"
					type="submit"
				>
					Save
				</button>
			</form>
		</div>
	{/each}

	<div class="rounded-xl border border-navy/[0.06] bg-white/70 p-4">
		<form method="POST" use:enhance class="flex flex-wrap items-end gap-3">
			<input type="hidden" name="key" value="urgent_escalation_email_list" />
			<label class="flex-1 min-w-[220px] flex flex-col gap-1">
				<span class="text-[11px] uppercase tracking-wider text-navy/40 font-medium">
					Urgent escalation emails <span class="normal-case font-mono text-navy/30">· comma-separated</span>
				</span>
				<input
					name="value"
					class="px-3 py-1.5 rounded-md border border-navy/15 bg-white text-sm text-navy focus:outline-none focus:border-emerald-accent"
					value={data.settings.urgentEscalationEmailList.join(', ')}
				/>
			</label>
			<button
				class="px-3 py-1.5 rounded-md bg-navy text-sm font-medium text-white hover:bg-navy-light transition-colors cursor-pointer"
				type="submit"
			>
				Save
			</button>
		</form>
	</div>
</div>
