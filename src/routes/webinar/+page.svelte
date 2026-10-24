<script lang="ts">
	import SiteShell from '$lib/components/content/SiteShell.svelte';
	import { consultationBookingUrl, formatFirmNapLine } from '$lib/config';
	import { usStates } from '$lib/free-will/config';
	import { WEBINAR_DISCLOSURE, WEBINAR_EMPTY, WEBINAR_OPT_IN_LABEL } from '$lib/webinar/copy';

	let { data, form } = $props();

	const input = 'mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm';
</script>

<SiteShell>
	<main class="mx-auto max-w-3xl px-5 pt-10 md:pt-14">
		{#if !data.webinar}
			<h1 class="text-3xl tracking-tight text-navy md:text-4xl">Webinar</h1>
			<p class="mt-4 text-navy/80">{WEBINAR_EMPTY}</p>
			<p class="mt-6">
				<a href={consultationBookingUrl} class="inline-flex min-h-11 items-center rounded-lg bg-emerald-accent px-4 text-sm font-medium text-cream hover:bg-emerald-light">Book a consultation</a>
			</p>
		{:else}
			<h1 class="text-3xl tracking-tight text-navy md:text-4xl">{data.webinar.title}</h1>
			<p class="mt-3 text-navy/70">{data.webinar.whenLabel}</p>
			<p class="mt-6 text-sm leading-relaxed text-navy/80">{WEBINAR_DISCLOSURE}</p>
			<p class="mt-4 text-sm leading-relaxed text-navy/70">{formatFirmNapLine()}</p>

			{#if form?.registered}
				<p class="mt-8 rounded-lg border border-navy/10 bg-white px-4 py-3 text-sm text-navy" role="status">You're registered. The join link is in your email.</p>
			{:else}
				<form method="POST" class="relative mt-8 max-w-lg space-y-4">
					{#if form?.message}
						<p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{form.message}</p>
					{/if}
					<div>
						<label class="text-sm font-medium" for="webinar-name">Name</label>
						<input id="webinar-name" name="name" required autocomplete="name" class={input} />
					</div>
					<div>
						<label class="text-sm font-medium" for="webinar-email">Email</label>
						<input id="webinar-email" name="email" type="email" required autocomplete="email" class={input} />
					</div>
					<div>
						<label class="text-sm font-medium" for="webinar-state">State</label>
						<select id="webinar-state" name="state" required class={input}>
							<option value="">Choose a state</option>
							{#each usStates as state}
								<option value={state.code}>{state.name}</option>
							{/each}
						</select>
					</div>
					<label class="flex items-start gap-3 text-sm leading-relaxed text-navy/80">
						<input name="marketing_consent" type="checkbox" value="yes" class="mt-1" />
						<span>{WEBINAR_OPT_IN_LABEL}</span>
					</label>
					<div class="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
						<label for="mlp_hp">Leave blank</label>
						<input id="mlp_hp" name="mlp_hp" type="text" tabindex="-1" autocomplete="off" />
					</div>
					<button class="inline-flex min-h-11 items-center rounded-lg bg-navy px-5 text-sm font-medium text-cream">Register</button>
				</form>
			{/if}
		{/if}
	</main>
</SiteShell>
