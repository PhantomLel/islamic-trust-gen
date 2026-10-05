<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<h1 class="text-2xl tracking-tight mb-6">Content team</h1>
<p class="text-sm text-navy/55 mb-6 max-w-xl">Authors draft and submit answers. Publishers can publish, schedule, and manage categories. These accounts sign in at <a class="underline" href="/login/staff">/login/staff</a> with a password and verification code — not magic link or Google.</p>

{#if form?.message}<p class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800" role="alert">{form.message}</p>{/if}
{#if form?.created}<p class="mb-4 rounded-lg bg-emerald-accent/10 px-4 py-3 text-sm">Account created. Share the password securely; they will set up two-factor on first login.</p>{/if}

<form method="POST" action="?/create" use:enhance class="rounded-xl border border-navy/10 bg-white p-4 mb-8 grid sm:grid-cols-2 gap-3 max-w-2xl">
	<div class="sm:col-span-2"><label for="name" class="block text-sm mb-1">Name</label><input id="name" name="name" class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm" /></div>
	<div><label for="email" class="block text-sm mb-1">Email</label><input id="email" name="email" type="email" required class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm" /></div>
	<div><label for="password" class="block text-sm mb-1">Temporary password</label><input id="password" name="password" type="password" required minlength="12" class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm" /></div>
	<div class="sm:col-span-2">
		<label for="role" class="block text-sm mb-1">Role</label>
		<select id="role" name="role" required class="w-full px-3 py-2 rounded-lg border border-navy/20 text-sm">
			<option value="content_author">Content author</option>
			<option value="content_publisher">Content publisher</option>
		</select>
	</div>
	<div class="sm:col-span-2"><button class="px-4 py-2 rounded-lg bg-navy text-cream text-sm">Create account</button></div>
</form>

<ul class="space-y-2 max-w-2xl">
	{#each data.staff as u}
		<li class="rounded-lg border border-navy/10 bg-white px-4 py-3 text-sm flex justify-between gap-4">
			<span>{u.name || u.email}</span>
			<span class="text-navy/45">{u.role}</span>
		</li>
	{:else}
		<li class="text-sm text-navy/50">No content staff accounts yet.</li>
	{/each}
</ul>
