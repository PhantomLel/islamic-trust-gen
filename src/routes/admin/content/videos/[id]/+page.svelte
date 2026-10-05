<script lang="ts">
	import { enhance } from '$app/forms';
	import { JURISDICTIONS, JURISDICTION_LABELS, type ContentJurisdiction } from '$lib/content/types';

	let { data, form } = $props();
	let v = $state({ ...data.video });
	let isTestimonial = $state(data.video.isTestimonial);
	let scheduleLocal = $state('');
	let scheduleIso = $derived(scheduleLocal ? new Date(scheduleLocal).toISOString() : '');
	const label = 'block text-sm font-medium text-navy mb-1';
	const input = 'w-full px-3 py-2 rounded-lg border border-navy/20 bg-white text-sm';
</script>

<a href="/admin/content/videos" class="text-sm text-navy/50 underline underline-offset-2">← Videos</a>
<h1 class="text-2xl tracking-tight mt-1 mb-1">{data.video.title || 'Untitled video'}</h1>
<p class="text-sm text-navy/50 mb-6">Status: <strong>{data.video.status.replace('_', ' ')}</strong></p>

{#if form?.message}<p class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800" role="alert">{form.message}</p>{/if}
{#if form?.publishErrors?.length}
	<div class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800" role="alert">
		<p class="font-medium">This video cannot go live yet:</p>
		<ul class="list-disc pl-5 mt-1">{#each form.publishErrors as e}<li>{e}</li>{/each}</ul>
	</div>
{/if}
{#if form?.slugChangePrompt}
	<p class="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">The address of a published video changed from <code>{form.slugChangePrompt.from}</code> to <code>{form.slugChangePrompt.to}</code>. Tick the redirect box and save again.</p>
{/if}
{#if form?.saved || form?.published || form?.scheduled || form?.submitted || form?.unpublished || form?.featuredChanged}<p class="mb-4 rounded-lg bg-emerald-accent/10 px-4 py-3 text-sm">Done.</p>{/if}

<div class="grid lg:grid-cols-[1fr_20rem] gap-8 items-start">
	<form method="POST" use:enhance class="space-y-5">
		<div><label class={label} for="title">Title</label><input id="title" name="title" class={input} bind:value={v.title} /></div>
		<div>
			<label class={label} for="slug">Page address</label>
			<div class="flex items-center gap-2 text-sm text-navy/55"><span>/videos/</span><input id="slug" name="slug" class={input} bind:value={v.slug} /></div>
			{#if data.video.status === 'published'}<label class="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="confirmRedirect" /> Add a redirect from the old address if I change it</label>{/if}
		</div>
		<div><label class={label} for="youtube">YouTube link or ID</label><input id="youtube" name="youtube" class={input} bind:value={v.youtubeId} /></div>
		<div><label class={label} for="description">Description</label><textarea id="description" name="description" rows="4" class={input} bind:value={v.description}></textarea></div>
		<div><label class={label} for="transcript">Transcript</label><textarea id="transcript" name="transcript" rows="10" class={input} bind:value={v.transcript}></textarea></div>
		<div class="grid sm:grid-cols-3 gap-4">
			<div><label class={label} for="duration">Duration (m:ss)</label><input id="duration" name="duration" class={input} bind:value={v.duration} /></div>
			<div><label class={label} for="uploadedOn">Upload date</label><input id="uploadedOn" type="date" name="uploadedOn" class={input} bind:value={v.uploadedOn} /></div>
			<div>
				<label class={label} for="jurisdiction">Jurisdiction</label>
				<select id="jurisdiction" name="jurisdiction" class={input} bind:value={v.jurisdiction}>
					<option value="">Choose…</option>
					{#each JURISDICTIONS as j}<option value={j}>{JURISDICTION_LABELS[j as ContentJurisdiction]}</option>{/each}
				</select>
			</div>
			<div><label class={label} for="series">Series</label><input id="series" name="series" class={input} bind:value={v.series} /></div>
			<div><label class={label} for="seriesOrder">Order in series</label><input id="seriesOrder" name="seriesOrder" inputmode="numeric" class={input} value={v.seriesOrder ?? ''} /></div>
			<div>
				<label class={label} for="relatedContentPageId">Related answer</label>
				<select id="relatedContentPageId" name="relatedContentPageId" class={input}>
					<option value="">None</option>
					{#each data.pages as p}<option value={p.id} selected={data.video.relatedContentPageId === p.id}>{p.title}{p.status !== 'published' ? ` (${p.status.replace('_', ' ')})` : ''}</option>{/each}
				</select>
			</div>
		</div>
		<div>
			<label class={label} for="metaDescription">Meta description <span class="font-normal text-navy/50">(150–160 characters)</span></label>
			<textarea id="metaDescription" name="metaDescription" rows="3" class={input} bind:value={v.metaDescription}></textarea>
			<p class="text-xs mt-1 {v.metaDescription.length < 150 || v.metaDescription.length > 160 ? 'text-red-700' : 'text-navy/50'}">{v.metaDescription.length} characters</p>
		</div>
		<div>
			<label class={label} for="thumbnailAssetId">Thumbnail (needs alt text)</label>
			<select id="thumbnailAssetId" name="thumbnailAssetId" class={input}>
				<option value="">None</option>
				{#each data.media as m}<option value={m.id} selected={data.video.thumbnailAssetId === m.id}>#{m.id} — {m.altText}</option>{/each}
			</select>
			<p class="text-xs text-navy/50 mt-1">Upload under <a class="underline" href="/admin/content/media">Images</a>. The page never loads YouTube thumbnails.</p>
		</div>

		<fieldset class="rounded-lg border border-navy/10 bg-white p-4 space-y-3">
			<legend class="px-1 text-sm font-medium">Client testimonial / endorsement</legend>
			<label class="flex items-center gap-2 text-sm"><input type="checkbox" name="isTestimonial" bind:checked={isTestimonial} /> This video features a client or other person speaking about our services</label>
			{#if isTestimonial}
				<label class="flex items-center gap-2 text-sm"><input type="checkbox" name="releaseOnFile" checked={data.video.releaseOnFile} /> A signed release is on file</label>
				<label class="flex items-center gap-2 text-sm"><input type="checkbox" name="isEndorsement" checked={data.video.isEndorsement} /> The speaker is endorsing (not only describing an experience)</label>
				<div class="grid sm:grid-cols-2 gap-3">
					<div><label class={label} for="speakerTitle">Speaker name / title</label><input id="speakerTitle" name="speakerTitle" class={input} value={v.speakerTitle} /></div>
					<div><label class={label} for="speakerRelationship">Relationship to the firm</label><input id="speakerRelationship" name="speakerRelationship" class={input} value={v.speakerRelationship} /></div>
				</div>
				<p class="text-xs text-navy/50">A testimonial video cannot be published without a release on file. Endorsements need the speaker’s title and relationship.</p>
			{/if}
		</fieldset>

		<div class="flex flex-wrap items-center gap-3 border-t border-navy/10 pt-5">
			<button formaction="?/save" class="px-5 py-2.5 rounded-lg bg-navy text-cream text-sm">Save draft</button>
			<button formaction="?/submit" class="px-5 py-2.5 rounded-lg border border-navy/25 text-sm">Submit for review</button>
			{#if data.can.publish}<button formaction="?/publish" class="px-5 py-2.5 rounded-lg bg-emerald-accent text-cream text-sm">Publish</button>{:else}<span class="text-xs text-navy/50">Publishing is done by a publisher.</span>{/if}
		</div>
		{#if data.can.schedule}
			<div class="rounded-lg border border-navy/10 bg-white p-4 flex flex-wrap items-end gap-3">
				<div><label class={label} for="scheduleAt">Schedule publication</label><input id="scheduleAt" type="datetime-local" class={input} bind:value={scheduleLocal} /><input type="hidden" name="scheduleAtIso" value={scheduleIso} /></div>
				<button formaction="?/schedule" class="px-4 py-2 rounded-lg border border-navy/25 text-sm">Schedule</button>
			</div>
		{/if}
	</form>

	<aside class="space-y-6 lg:sticky lg:top-6">
		<section class="rounded-xl border border-navy/10 bg-white p-4">
			<h2 class="text-sm font-medium">Before this can go live</h2>
			{#if data.check.errors.length === 0}<p class="text-sm text-emerald-accent mt-2">Everything required is filled in.</p>
			{:else}<ul class="mt-2 list-disc pl-5 text-sm text-red-800 space-y-1">{#each data.check.errors as e}<li>{e}</li>{/each}</ul>{/if}
			{#if data.check.warnings.length}<ul class="mt-3 list-disc pl-5 text-xs text-amber-800 space-y-1">{#each data.check.warnings as w}<li>{w}</li>{/each}</ul>{/if}
			<p class="text-[11px] text-navy/40 mt-3">This reflects the last save.</p>
		</section>
		{#if data.video.status === 'published'}
			<a class="block text-sm underline underline-offset-2" href="/videos/{data.video.slug}" target="_blank">View live page</a>
			{#if data.can.taxonomy}
				<form method="POST" action="?/feature" use:enhance>
					<input type="hidden" name="on" value={data.isFeatured ? '0' : '1'} />
					<button class="w-full px-4 py-2 rounded-lg border border-navy/25 text-sm">{data.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}</button>
				</form>
			{/if}
			{#if data.can.unpublish}
				<form method="POST" action="?/unpublish" use:enhance><button class="w-full px-4 py-2 rounded-lg border border-red-300 text-red-800 text-sm" onclick={(e) => { if (!confirm('Unpublish this video?')) e.preventDefault(); }}>Unpublish</button></form>
			{/if}
		{/if}
	</aside>
</div>
