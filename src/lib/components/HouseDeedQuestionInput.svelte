<script lang="ts">
	import { UploadDropzone } from '@uploadthing/svelte';
	import { createUploader } from '$lib/uploadthing';

	let {
		trustId,
		userId,
		existingUrl = null,
		deedRetrievalRequested = false,
		saveActionPath = '/dashboard?/saveHouseDeed',
	}: {
		trustId: number;
		userId: string;
		existingUrl?: string | null;
		deedRetrievalRequested?: boolean;
		saveActionPath?: string;
	} = $props();

	// Phase: 'ask' = asking if they own a house, 'upload' = show upload, 'no-house' = user said no
	let ownsHouse = $state<boolean | null>(null);
	let houseDeedUrl = $state<string | null>(null);
	let saving = $state(false);
	let error = $state('');
	let uploadSaved = $state(false);
	let uploadSavedTimeout: ReturnType<typeof setTimeout> | null = null;
	let skipped = $state(false);

	$effect(() => {
		if (!houseDeedUrl && existingUrl) {
			houseDeedUrl = existingUrl;
			ownsHouse = true;
		}
	});

	$effect(() => {
		return () => {
			if (uploadSavedTimeout) clearTimeout(uploadSavedTimeout);
		};
	});

	function showSavedFeedback() {
		uploadSaved = true;
		if (uploadSavedTimeout) clearTimeout(uploadSavedTimeout);
		uploadSavedTimeout = setTimeout(() => {
			uploadSaved = false;
		}, 2200);
	}

	function getHouseDeedFilename(originalName: string): string {
		const extensionMatch = originalName.match(/(\.[^./\\]+)$/);
		const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
		const normalizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
		return `house_deed_${normalizedUserId}_${Date.now()}${extension}`;
	}

	async function persistHouseDeedUrl(url: string) {
		saving = true;
		error = '';

		const formData = new FormData();
		formData.set('trustId', String(trustId));
		formData.set('houseDeedUrl', url);

		const response = await fetch(saveActionPath, {
			method: 'POST',
			body: formData,
		});

		saving = false;
		if (!response.ok) {
			error = 'Could not save your house deed. Please try again.';
			return;
		}

		houseDeedUrl = url;
		showSavedFeedback();
	}

	const uploader = createUploader('houseDeedUploader', {
		config: { mode: 'auto' },
		onBeforeUploadBegin: (files) => {
			return files.map((file) => {
				const renamed = getHouseDeedFilename(file.name);
				return new File([file], renamed, { type: file.type, lastModified: file.lastModified });
			});
		},
		onClientUploadComplete: async (files) => {
			const file = files?.[0];
			const url = file?.ufsUrl ?? file?.url;
			if (!url) {
				error = 'Upload succeeded but no file URL was returned.';
				return;
			}
			await persistHouseDeedUrl(url);
		},
		onUploadError: (uploadError) => {
			error = uploadError.message ?? 'Upload failed. Please try again.';
		},
	});

	const dropzoneAppearance = {
		container:
			'ut-ready:border-navy/12 ut-ready:hover:border-emerald-accent/45 ut-ready:bg-white/70 ut-ready:hover:bg-white ut-uploading:border-emerald-accent/45 ut-uploading:bg-emerald-accent/[0.04] border-2 border-dashed rounded-xl p-7 md:p-8 transition-all shadow-[0_1px_0_rgba(5,26,37,0.02)]',
		label: 'text-navy text-[14px] font-medium tracking-tight',
		allowedContent: 'text-navy/42 text-[11px]',
		button: 'hidden',
		uploadIcon: 'text-emerald-accent/95 h-8 w-8',
	};
</script>

{#if ownsHouse === null}
	<!-- Step 1: Ask if they own a house -->
	<div class="space-y-4">
		<p class="text-base text-navy/70 font-light leading-relaxed">Do you own a house?</p>
		<div class="flex gap-3">
			{#each [{ label: 'Yes', val: true }, { label: 'No', val: false }] as opt}
				<button
					onclick={() => { ownsHouse = opt.val; }}
					class="flex-1 px-5 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer
						bg-white border-navy/10 text-navy/70 hover:border-navy/20"
				>
					{opt.label}
				</button>
			{/each}
		</div>
	</div>

{:else if ownsHouse === false}
	<!-- User doesn't own a house -->
	<div class="rounded-xl border border-navy/10 bg-white/70 p-6 text-center space-y-3">
		<div class="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center mx-auto">
			<svg class="w-6 h-6 text-navy/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<p class="text-navy/60 text-sm">No house deed needed. You can continue to the next step.</p>
		<button
			onclick={() => { ownsHouse = null; }}
			class="text-xs text-emerald-accent hover:text-emerald-accent/80 transition-colors cursor-pointer"
		>
			Change answer
		</button>
	</div>

{:else}
	<!-- User owns a house — show upload -->
	<div class="space-y-4">
		{#if deedRetrievalRequested}
			<div class="flex items-start gap-3 rounded-xl border border-emerald-accent/25 bg-emerald-accent/5 px-4 py-3">
				<svg class="w-5 h-5 text-emerald-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<p class="text-sm font-medium text-navy">Deed retrieval service purchased</p>
					<p class="text-xs text-navy/55 mt-0.5 leading-relaxed">
						You've already paid for our deed retrieval service. We'll handle locating your deed for you.
						You can skip this step, or upload your deed now if you already have it.
					</p>
				</div>
			</div>

			{#if !houseDeedUrl && !skipped}
				<div class="flex gap-3">
					<button
						onclick={() => { skipped = true; }}
						class="flex-1 px-4 py-3 rounded-xl border border-navy/10 text-sm text-navy/60 hover:text-navy hover:border-navy/20 transition-all cursor-pointer text-center"
					>
						Skip — use deed retrieval service
					</button>
				</div>
			{/if}

			{#if skipped && !houseDeedUrl}
				<div class="rounded-xl border border-navy/10 bg-white/70 p-5 text-center space-y-2">
					<p class="text-navy/60 text-sm">We'll retrieve your deed for you. Continue to the next step.</p>
					<button
						onclick={() => { skipped = false; }}
						class="text-xs text-emerald-accent hover:text-emerald-accent/80 transition-colors cursor-pointer"
					>
						Upload it myself instead
					</button>
				</div>
			{/if}
		{/if}

		{#if !skipped}
			<div class="relative">
				<div class="pointer-events-none absolute inset-1 rounded-lg bg-linear-to-b from-emerald-accent/[0.035] to-transparent"></div>
				<UploadDropzone {uploader} appearance={dropzoneAppearance}>
					<svelte:fragment slot="upload-icon">
						<svg
							class="w-8 h-8 text-emerald-accent"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.6"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M8.25 17.25a4.5 4.5 0 01.86-8.917 5.25 5.25 0 0110.252 1.47A3.75 3.75 0 0118 17.25H8.25z"
							/>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75V8.25m0 0l-2.25 2.25M12 8.25l2.25 2.25" />
						</svg>
					</svelte:fragment>
					<svelte:fragment slot="label">
						<span class="text-center">
							<span class="block">Drop your house deed here</span>
							<span class="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-medium bg-navy text-cream hover:bg-navy-light shadow-sm transition-all cursor-pointer">
								Browse files
							</span>
						</span>
					</svelte:fragment>
					<svelte:fragment slot="allowed-content">
						PDF or image accepted, up to 16MB
					</svelte:fragment>
				</UploadDropzone>
			</div>

			{#if saving}
				<p class="text-[12px] text-navy/45">Saving your file...</p>
			{/if}

			{#if uploadSaved}
				<div class="inline-flex items-center gap-1.5 rounded-full border border-emerald-accent/30 bg-emerald-accent/10 px-2.5 py-1 text-[11px] font-medium text-emerald-accent animate-pulse">
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					Uploaded
				</div>
			{/if}

			{#if error}
				<p class="text-[12px] text-red-600">{error}</p>
			{/if}

			{#if houseDeedUrl}
				<div class="flex items-center gap-3">
					<a
						href={houseDeedUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-medium border border-navy/10 text-navy/60 hover:text-navy hover:border-navy/20 transition-all"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
						</svg>
						Download Uploaded Deed
					</a>
				</div>
			{/if}
		{/if}

		<button
			onclick={() => { ownsHouse = null; }}
			class="text-xs text-navy/40 hover:text-navy/60 transition-colors cursor-pointer"
		>
			I don't own a house
		</button>
	</div>
{/if}
