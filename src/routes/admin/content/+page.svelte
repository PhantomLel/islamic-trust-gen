<script lang="ts">
	let { data } = $props();

	const STATUS_LABEL: Record<string, string> = {
		draft: 'Draft',
		in_review: 'In review',
		published: 'Published',
		unpublished: 'Unpublished',
	};
</script>

<div class="flex flex-wrap items-center justify-between gap-3 mb-6">
	<h1 class="text-2xl tracking-tight">Answers</h1>
	<form method="POST" action="?/create"><button class="px-4 py-2 rounded-lg bg-navy text-cream text-sm">New answer</button></form>
</div>

<p class="mb-6 rounded-lg border border-navy/10 bg-white px-4 py-3 text-sm text-navy/65">
	This list covers answer pages only. The homepage, plans, trust, free-will and calculator pages stay in code and cannot be
	edited or unpublished here.
</p>

{#if data.reviewDue.length}
	<section class="mb-8 rounded-xl border border-amber-300/60 bg-amber-50/80 p-5" data-testid="review-due">
		<h2 class="text-base font-medium">Due for review ({data.reviewDue.length})</h2>
		<p class="text-sm text-navy/60 mt-1">Last reviewed more than six months ago.</p>
		<ul class="mt-3 space-y-1 text-sm">
			{#each data.reviewDue as p}
				<li><a class="underline underline-offset-2" href="/admin/content/{p.id}">{p.title || p.slug}</a> <span class="text-navy/45">· last reviewed {p.lastReviewedOn ?? 'never'}</span></li>
			{/each}
		</ul>
	</section>
{/if}

<form method="GET" class="mb-4 flex flex-wrap gap-2 text-sm">
	<input name="q" value={data.q} placeholder="Search titles" class="px-3 py-2 rounded-lg border border-navy/15 bg-white" />
	<select name="status" class="px-3 py-2 rounded-lg border border-navy/15 bg-white">
		<option value="">Any status</option>
		{#each Object.entries(STATUS_LABEL) as [k, v]}<option value={k} selected={data.status === k}>{v}</option>{/each}
	</select>
	<button class="px-4 py-2 rounded-lg border border-navy/20">Filter</button>
</form>

<div class="overflow-x-auto rounded-xl border border-navy/10 bg-white">
	<table class="w-full text-sm">
		<thead class="text-left text-xs uppercase tracking-wider text-navy/45">
			<tr><th class="px-4 py-3">Question</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">State</th><th class="px-4 py-3">Category</th><th class="px-4 py-3">Last reviewed</th><th class="px-4 py-3">Updated</th></tr>
		</thead>
		<tbody class="divide-y divide-navy/8">
			{#each data.pages as p}
				<tr>
					<td class="px-4 py-3"><a class="text-emerald-accent underline underline-offset-2" href="/admin/content/{p.id}">{p.title || '(untitled)'}</a><div class="text-xs text-navy/40">/answers/{p.slug}</div></td>
					<td class="px-4 py-3">{STATUS_LABEL[p.status]}{#if p.scheduledPublishAt}<div class="text-xs text-navy/45">goes live {new Date(p.scheduledPublishAt).toLocaleString()}</div>{/if}</td>
					<td class="px-4 py-3">{p.jurisdiction ?? '—'}</td>
					<td class="px-4 py-3">{p.categoryName ?? '—'}</td>
					<td class="px-4 py-3">{p.lastReviewedOn ?? '—'}</td>
					<td class="px-4 py-3 text-navy/55">{new Date(p.updatedAt).toLocaleDateString()}</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="px-4 py-8 text-center text-navy/45">No answers yet.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
