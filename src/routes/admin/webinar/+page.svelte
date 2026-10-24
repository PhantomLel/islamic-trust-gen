<script lang="ts">
	let { data, form } = $props();
	const input = 'mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm';
</script>

<div class="min-h-screen bg-cream font-sans text-navy">
	<nav class="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
		<a href="/admin" class="text-sm text-navy/60 hover:text-navy">Admin</a>
		<span class="text-[11px] font-medium uppercase tracking-wider text-emerald-accent">Webinar</span>
	</nav>
	<main class="mx-auto max-w-3xl px-6 pb-16">
		<div class="flex items-center justify-between gap-3">
			<h1 class="text-2xl tracking-tight">Next webinar</h1>
			{#if data.webinar}<a href="/admin/webinar?new=1" class="text-sm text-navy/60 hover:text-navy">New webinar</a>{/if}
		</div>
		<p class="mt-2 text-sm text-navy/60">Date and time are Central Time. Only one webinar can be open. The join link is emailed to registrants and is not shown on the public page.</p>

		{#if form?.saved}
			<p class="mt-4 rounded-lg border border-navy/10 bg-white px-4 py-3 text-sm" role="status">Saved.</p>
		{/if}
		{#if form?.message}
			<p class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{form.message}</p>
		{/if}

		<form method="POST" class="mt-6 space-y-4 rounded-xl border border-navy/10 bg-white p-5">
			{#if data.webinar}<input type="hidden" name="id" value={data.webinar.id} />{/if}
			<div>
				<label class="text-sm font-medium" for="title">Title</label>
				<input id="title" name="title" required maxlength="200" value={data.webinar?.title ?? ''} class={input} />
			</div>
			<div>
				<label class="text-sm font-medium" for="startsLocal">Date and time (Central Time)</label>
				<input id="startsLocal" name="startsLocal" type="datetime-local" required value={data.webinar?.startsLocal ?? ''} class={input} />
			</div>
			<div>
				<label class="text-sm font-medium" for="durationMinutes">Duration (minutes)</label>
				<input id="durationMinutes" name="durationMinutes" type="number" min="1" max="1440" required value={data.webinar?.durationMinutes ?? 60} class={input} />
			</div>
			<div>
				<label class="text-sm font-medium" for="joinUrl">Zoom join link</label>
				<input id="joinUrl" name="joinUrl" type="url" required value={data.webinar?.joinUrl ?? ''} placeholder="https://us02web.zoom.us/j/…" class={input} />
			</div>
			<div>
				<label class="text-sm font-medium" for="status">Status</label>
				<select id="status" name="status" class={input}>
					{#each data.statuses as status}
						<option value={status} selected={data.webinar?.status === status}>{status}</option>
					{/each}
				</select>
			</div>
			<button class="inline-flex min-h-11 items-center rounded-lg bg-navy px-4 text-sm text-cream">Save</button>
		</form>

		<section class="mt-10">
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-lg tracking-tight">Registrants</h2>
				{#if data.webinar}
					<a href="/admin/webinar/export" class="text-sm text-emerald-accent hover:underline">Download CSV</a>
				{/if}
			</div>
			{#if data.registrants.length === 0}
				<p class="mt-3 text-sm text-navy/55">No one has registered yet.</p>
			{:else}
				<div class="mt-3 overflow-x-auto rounded-xl border border-navy/10 bg-white">
					<table class="w-full text-left text-sm">
						<thead class="border-b border-navy/10 text-navy/50">
							<tr>
								<th class="px-3 py-2 font-medium">Name</th>
								<th class="px-3 py-2 font-medium">Email</th>
								<th class="px-3 py-2 font-medium">State</th>
								<th class="px-3 py-2 font-medium">Opt-in</th>
								<th class="px-3 py-2 font-medium">Code</th>
							</tr>
						</thead>
						<tbody>
							{#each data.registrants as person}
								<tr class="border-b border-navy/5 last:border-0">
									<td class="px-3 py-2">{person.name}</td>
									<td class="px-3 py-2">{person.email}</td>
									<td class="px-3 py-2">{person.state}</td>
									<td class="px-3 py-2">{person.marketingConsent ? 'Yes' : 'No'}</td>
									<td class="px-3 py-2">{person.attributionCode ?? ''}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	</main>
</div>
