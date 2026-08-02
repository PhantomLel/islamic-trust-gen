<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<a href="/admin/help" class="text-sm text-navy/50 hover:text-navy inline-flex items-center gap-1">← Back to entries</a>

<div class="mt-4 mb-8">
	<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">New knowledge base entry</h1>
	<p class="text-navy/45 text-sm">
		Add a question and answer for the Help Assistant. New entries start as <em>needs revision</em> until you approve them.
	</p>
</div>

{#if form?.message}
	<p class="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{form.message}</p>
{/if}

<form method="POST" use:enhance class="max-w-3xl space-y-6">
	<section class="rounded-xl border border-navy/[0.06] bg-white/70 p-5 space-y-4">
		<label class="block">
			<span class="text-sm font-medium text-navy">Question <span class="text-rose-500">*</span></span>
			<textarea
				name="question"
				required
				class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
				rows="2"
				placeholder="What users might ask…"
			></textarea>
		</label>

		<label class="block">
			<span class="text-sm font-medium text-navy">Answer <span class="text-rose-500">*</span></span>
			<textarea
				name="userFacingAnswer"
				required
				class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
				rows="4"
				placeholder="Approved short answer the bot will show…"
			></textarea>
		</label>

		<label class="block">
			<span class="text-sm font-medium text-navy">Also answers</span>
			<p class="text-[12px] text-navy/45 mt-0.5">Alternate phrasings, comma-separated — helps the bot match similar questions.</p>
			<input
				name="alsoAnswers"
				class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
				placeholder="e.g. What is a living trust?, Do I need a trust?"
			/>
		</label>

		<label class="block">
			<span class="text-sm font-medium text-navy">Category</span>
			<input
				name="category"
				class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
				placeholder="e.g. Getting Started"
			/>
		</label>

		<label class="block">
			<span class="text-sm font-medium text-navy">App meaning</span>
			<textarea
				name="goodTreeAppMeaning"
				class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
				rows="2"
				placeholder="Optional — what this means inside Good Tree…"
			></textarea>
		</label>

		<label class="block">
			<span class="text-sm font-medium text-navy">Next step</span>
			<textarea
				name="userNextStep"
				class="mt-1.5 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-accent"
				rows="2"
				placeholder="Optional — suggested action for the user…"
			></textarea>
		</label>
	</section>

	<div class="flex flex-wrap gap-3">
		<button
			type="submit"
			class="rounded-lg bg-emerald-accent px-4 py-2 text-sm font-medium text-white hover:bg-emerald-accent/90 transition-colors cursor-pointer"
		>
			Create entry
		</button>
		<a
			href="/admin/help"
			class="rounded-lg border border-navy/15 bg-white px-4 py-2 text-sm text-navy hover:border-emerald-accent transition-colors"
		>
			Cancel
		</a>
	</div>
</form>
