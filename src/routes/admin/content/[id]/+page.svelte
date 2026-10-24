<script lang="ts">
	import { enhance } from '$app/forms';
	import { onDestroy } from 'svelte';
	import RichTextEditor from '$lib/components/content/RichTextEditor.svelte';
	import { CTA_LABELS, JURISDICTIONS, JURISDICTION_LABELS, type ContentJurisdiction, type CtaKey } from '$lib/content/types';
	import { countWords } from '$lib/content/rules';
	import { DEFAULT_JURISDICTION_CAVEAT } from '$lib/content/caveat';

	let { data, form } = $props();

	let formEl: HTMLFormElement | undefined = $state();
	let title = $state(data.page.title);
	let slug = $state(data.page.slug);
	let summary = $state(data.page.answerSummary);
	let meta = $state(data.page.metaDescription);
	let jurisdiction = $state<string>(data.page.jurisdiction ?? '');
	let faqs = $state(data.faqs.length ? data.faqs.map((f) => ({ ...f })) : []);
	let related = $state<(number | '')[]>([...data.relatedIds, ...Array(Math.max(0, data.maxRelated - data.relatedIds.length)).fill('')]);
	let scheduleLocal = $state('');
	let scheduleIso = $derived(scheduleLocal ? new Date(scheduleLocal).toISOString() : '');
	let saveNote = $state('');

	const words = $derived(countWords(summary));
	const stateScoped = $derived(jurisdiction === 'TX' || jurisdiction === 'CA');
	const showCaveat = $derived(jurisdiction === 'TX' || jurisdiction === 'CA' || jurisdiction === 'BOTH');

	// Autosave: debounce edits, post the same fields to the autosave endpoint.
	let timer: ReturnType<typeof setTimeout> | undefined;
	function queueAutosave() {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			if (!formEl) return;
			saveNote = 'Saving…';
			try {
				const res = await fetch(`/admin/content/${data.page.id}/autosave`, { method: 'POST', body: new FormData(formEl) });
				const j = await res.json();
				saveNote = j.ok ? `Draft saved ${new Date(j.at).toLocaleTimeString()}` : j.needsSave ? 'Address changed: use Save to confirm the redirect.' : 'Could not autosave.';
			} catch {
				saveNote = 'Could not autosave.';
			}
		}, 4000);
	}
	onDestroy(() => clearTimeout(timer));

	const label = 'block text-sm font-medium text-navy mb-1';
	const input = 'w-full px-3 py-2 rounded-lg border border-navy/20 bg-white text-sm';
</script>

<div class="flex flex-wrap items-center justify-between gap-3 mb-6">
	<div>
		<a href="/admin/content" class="text-sm text-navy/50 underline underline-offset-2">← Answers</a>
		<h1 class="text-2xl tracking-tight mt-1">{data.page.title || 'Untitled answer'}</h1>
		<p class="text-sm text-navy/50 mt-1">Status: <strong>{data.page.status.replace('_', ' ')}</strong>
			{#if data.page.scheduledPublishAt} · goes live {new Date(data.page.scheduledPublishAt).toLocaleString()}{/if}</p>
	</div>
	<a href="/admin/content/{data.page.id}/preview" target="_blank" class="px-4 py-2 rounded-lg border border-navy/25 text-sm">Preview</a>
</div>

{#if form?.message}<p class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800" role="alert">{form.message}</p>{/if}
{#if form?.publishErrors?.length}
	<div class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800" role="alert">
		<p class="font-medium">This page cannot go live yet:</p>
		<ul class="list-disc pl-5 mt-1">{#each form.publishErrors as e}<li>{e}</li>{/each}</ul>
	</div>
{/if}
{#if form?.saved}<p class="mb-4 rounded-lg bg-emerald-accent/10 px-4 py-3 text-sm">Saved.</p>{/if}
{#if form?.published}<p class="mb-4 rounded-lg bg-emerald-accent/10 px-4 py-3 text-sm">Published.</p>{/if}
{#if form?.scheduled}<p class="mb-4 rounded-lg bg-emerald-accent/10 px-4 py-3 text-sm">Scheduled.</p>{/if}
{#if form?.submitted}<p class="mb-4 rounded-lg bg-emerald-accent/10 px-4 py-3 text-sm">Submitted for review.</p>{/if}
{#if form?.unpublished}<p class="mb-4 rounded-lg bg-emerald-accent/10 px-4 py-3 text-sm">Unpublished. The address now returns “not found” and the page is out of the sitemap.</p>{/if}
{#if form?.reverted}<p class="mb-4 rounded-lg bg-emerald-accent/10 px-4 py-3 text-sm">Reverted to the earlier version.</p>{/if}

{#if form?.slugChangePrompt}
	<div class="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm" role="alert">
		<p>You changed the address of a published page from <code>/answers/{form.slugChangePrompt.from}</code> to <code>/answers/{form.slugChangePrompt.to}</code>.</p>
		<p class="mt-1">Tick “Add a redirect from the old address” below and save again, so links to the old address keep working.</p>
	</div>
{/if}

<div class="grid lg:grid-cols-[1fr_20rem] gap-8 items-start">
	<form method="POST" bind:this={formEl} use:enhance oninput={queueAutosave} class="space-y-6">
		<div>
			<label class={label} for="title">Question (title)</label>
			<input id="title" name="title" class={input} bind:value={title} />
			{#if title && !title.trim().endsWith('?')}<p class="text-xs text-amber-700 mt-1">Title should end with a question mark.</p>{/if}
		</div>

		<div>
			<label class={label} for="slug">Page address</label>
			<div class="flex items-center gap-2 text-sm text-navy/55"><span>/answers/</span><input id="slug" name="slug" class={input} bind:value={slug} /></div>
			{#if data.page.status === 'published'}
				<label class="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="confirmRedirect" /> Add a redirect from the old address if I change it</label>
			{/if}
		</div>

		<div>
			<label class={label} for="answerSummary">Answer summary <span class="font-normal text-navy/50">(40–60 words)</span></label>
			<textarea id="answerSummary" name="answerSummary" rows="4" class={input} bind:value={summary}></textarea>
			<p class="text-xs mt-1 {words < 40 || words > 60 ? 'text-red-700' : 'text-navy/50'}">{words} words{words < 40 || words > 60 ? ' — Answer summary must be 40 to 60 words' : ''}</p>
		</div>

		<div>
			<span class={label}>Body</span>
			<RichTextEditor initial={data.page.body} onchange={queueAutosave} />
			<p class="text-xs text-navy/50 mt-1">The page title is the only H1. Use Heading 2 and 3 in the body. Use the “Product name” button rather than typing the product name.</p>
		</div>

		<div>
			<label class={label} for="metaDescription">Meta description <span class="font-normal text-navy/50">(150–160 characters)</span></label>
			<textarea id="metaDescription" name="metaDescription" rows="3" class={input} bind:value={meta}></textarea>
			<p class="text-xs mt-1 {meta.length < 150 || meta.length > 160 ? 'text-red-700' : 'text-navy/50'}">{meta.length} characters{meta.length < 150 || meta.length > 160 ? ' — Meta description must be 150 to 160 characters' : ''}</p>
		</div>

		<div class="grid sm:grid-cols-2 gap-4">
			<div>
				<label class={label} for="jurisdiction">Jurisdiction</label>
				<select id="jurisdiction" name="jurisdiction" class={input} bind:value={jurisdiction}>
					<option value="">Choose…</option>
					{#each JURISDICTIONS as j}<option value={j}>{JURISDICTION_LABELS[j as ContentJurisdiction]}</option>{/each}
				</select>
			</div>
			<div>
				<label class={label} for="categoryId">Category</label>
				<select id="categoryId" name="categoryId" class={input}>
					<option value="">Choose…</option>
					{#each data.categories as c}<option value={c.id} selected={data.page.categoryId === c.id}>{c.name}</option>{/each}
				</select>
				{#if data.categories.length === 0}<p class="text-xs text-amber-700 mt-1">No categories exist yet. A publisher adds them under Categories.</p>{/if}
			</div>
			<div>
				<label class={label} for="lastReviewedOn">Last reviewed</label>
				<input id="lastReviewedOn" type="date" name="lastReviewedOn" class={input} value={data.page.lastReviewedOn ?? ''} />
			</div>
			<div>
				<label class={label} for="ctaKey">Call to action</label>
				<select id="ctaKey" name="ctaKey" class={input}>
					<option value="">Choose…</option>
					{#each Object.entries(CTA_LABELS) as [k, v]}
						<option value={k} selected={data.page.ctaKey === k} disabled={(k === 'free_will' && !stateScoped) || (k === 'webinar' && !data.webinarOpen)}>{v}</option>
					{/each}
				</select>
			</div>
		</div>

		{#if showCaveat}
			<div>
				<label class={label} for="caveatOverride">Jurisdiction caveat (optional override)</label>
				<textarea id="caveatOverride" name="caveatOverride" rows="3" class={input} placeholder={DEFAULT_JURISDICTION_CAVEAT} value={data.page.caveatOverride}></textarea>
				<p class="text-xs text-navy/50 mt-1">Leave empty to show the standard Texas caveat.</p>
			</div>
		{:else}
			<input type="hidden" name="caveatOverride" value="" />
		{/if}

		<div>
			<label class={label} for="socialImageId">Social image <span class="font-normal text-navy/50">(optional; needs alt text)</span></label>
			<select id="socialImageId" name="socialImageId" class={input}>
				<option value="">None</option>
				{#each data.media as m}<option value={m.id} selected={data.page.socialImageId === m.id}>#{m.id} — {m.altText}</option>{/each}
			</select>
			<p class="text-xs text-navy/50 mt-1">Upload images under <a class="underline" href="/admin/content/media">Images</a>.</p>
		</div>

		<fieldset>
			<legend class={label}>FAQ</legend>
			{#each faqs as f, i}
				<div class="mb-3 rounded-lg border border-navy/10 bg-white p-3 space-y-2">
					<input name="faqQuestion" class={input} placeholder="Question" bind:value={f.question} />
					<textarea name="faqAnswer" rows="3" class={input} placeholder="Answer" bind:value={f.answer}></textarea>
					<button type="button" class="text-xs text-red-700 underline" onclick={() => { faqs.splice(i, 1); queueAutosave(); }}>Remove</button>
				</div>
			{/each}
			<button type="button" class="text-sm underline underline-offset-2" onclick={() => faqs.push({ question: '', answer: '' })}>Add FAQ item</button>
		</fieldset>

		<fieldset>
			<legend class={label}>Related questions <span class="font-normal text-navy/50">(up to {data.maxRelated})</span></legend>
			<div class="grid sm:grid-cols-2 gap-2">
				{#each related as _, i}
					<select name="relatedId" class={input} bind:value={related[i]}>
						<option value="">—</option>
						{#each data.otherPages as p}<option value={p.id}>{p.title}{p.status !== 'published' ? ` (${p.status.replace('_', ' ')})` : ''}</option>{/each}
					</select>
				{/each}
			</div>
		</fieldset>

		<div class="flex flex-wrap items-center gap-3 border-t border-navy/10 pt-5">
			<button formaction="?/save" class="px-5 py-2.5 rounded-lg bg-navy text-cream text-sm">Save draft</button>
			<button formaction="?/submit" class="px-5 py-2.5 rounded-lg border border-navy/25 text-sm">Submit for review</button>
			{#if data.can.publish}
				<button formaction="?/publish" class="px-5 py-2.5 rounded-lg bg-emerald-accent text-cream text-sm">Publish</button>
			{:else}
				<span class="text-xs text-navy/50">Publishing is done by a publisher.</span>
			{/if}
			<span class="text-xs text-navy/45" aria-live="polite">{saveNote}</span>
		</div>

		{#if data.can.schedule}
			<div class="rounded-lg border border-navy/10 bg-white p-4 flex flex-wrap items-end gap-3">
				<div>
					<label class={label} for="scheduleAt">Schedule publication</label>
					<input id="scheduleAt" type="datetime-local" class={input} bind:value={scheduleLocal} />
					<input type="hidden" name="scheduleAtIso" value={scheduleIso} />
				</div>
				<button formaction="?/schedule" class="px-4 py-2 rounded-lg border border-navy/25 text-sm">Schedule</button>
			</div>
		{/if}
	</form>

	<aside class="space-y-6 lg:sticky lg:top-6">
		<section class="rounded-xl border border-navy/10 bg-white p-4" aria-labelledby="check-heading">
			<h2 id="check-heading" class="text-sm font-medium">Before this can go live</h2>
			{#if data.check.errors.length === 0}
				<p class="text-sm text-emerald-accent mt-2">Everything required is filled in.</p>
			{:else}
				<ul class="mt-2 list-disc pl-5 text-sm text-red-800 space-y-1">{#each data.check.errors as e}<li>{e}</li>{/each}</ul>
			{/if}
			{#if data.check.warnings.length}
				<p class="text-xs font-medium text-amber-800 mt-3">Warnings</p>
				<ul class="list-disc pl-5 text-xs text-amber-800 space-y-1">{#each data.check.warnings as w}<li>{w}</li>{/each}</ul>
			{/if}
			<p class="text-[11px] text-navy/40 mt-3">This reflects the last save.</p>
		</section>

		{#if data.page.status === 'published' && data.can.unpublish}
			<form method="POST" action="?/unpublish" use:enhance>
				<button class="w-full px-4 py-2 rounded-lg border border-red-300 text-red-800 text-sm" onclick={(e) => { if (!confirm('Unpublish this page? Its address will return “not found”.')) e.preventDefault(); }}>Unpublish</button>
			</form>
		{/if}
		{#if data.page.scheduledPublishAt && data.can.schedule}
			<form method="POST" action="?/cancelSchedule" use:enhance><button class="w-full px-4 py-2 rounded-lg border border-navy/25 text-sm">Cancel scheduled publication</button></form>
		{/if}

		{#if data.page.status === 'published'}
			<a class="block text-sm underline underline-offset-2" href="/answers/{data.page.slug}" target="_blank">View live page</a>
		{/if}

		<section class="rounded-xl border border-navy/10 bg-white p-4">
			<h2 class="text-sm font-medium">Earlier versions</h2>
			<ul class="mt-2 space-y-2 text-xs">
				{#each data.revisions as r}
					<li class="flex items-center justify-between gap-2">
						<span>{new Date(r.createdAt).toLocaleString()}</span>
						<form method="POST" action="?/revert" use:enhance>
							<input type="hidden" name="revisionId" value={r.id} />
							<button class="underline" onclick={(e) => { if (!confirm('Restore this version?')) e.preventDefault(); }}>Restore</button>
						</form>
					</li>
				{:else}<li class="text-navy/45">None yet.</li>{/each}
			</ul>
		</section>
	</aside>
</div>
