<script lang="ts">
	import { UploadDropzone } from '@uploadthing/svelte';
	import { createUploader } from '$lib/uploadthing';

	let {
		trustId,
		existingUrl = null,
		saveActionPath = '/dashboard?/saveHouseDeed',
		title = 'Upload Your House Deed',
	} = $props<{
		trustId: number;
		existingUrl?: string | null;
		saveActionPath?: string;
		title?: string;
	}>();

	let houseDeedUrl = $state<string | null>(null);
	let saving = $state(false);
	let error = $state('');
	let uploadSaved = $state(false);
	let uploadSavedTimeout: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (!houseDeedUrl && existingUrl) houseDeedUrl = existingUrl;
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
		button:
			'mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-medium bg-navy text-cream hover:bg-navy-light shadow-sm transition-all cursor-pointer',
		uploadIcon: 'text-emerald-accent/95 h-8 w-8',
	};
</script>

<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/6 p-6">
	<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-4">{title}</p>

	<div class="mb-4 relative">
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
				Drop your house deed here
			</svelte:fragment>
			<svelte:fragment slot="allowed-content">
				PDF or image accepted, up to 16MB
			</svelte:fragment>
			<svelte:fragment slot="button-content">
				Browse files
			</svelte:fragment>
		</UploadDropzone>
	</div>

	{#if saving}
		<p class="text-[12px] text-navy/45">Saving your file...</p>
	{/if}

	{#if uploadSaved}
		<div class="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-accent/30 bg-emerald-accent/10 px-2.5 py-1 text-[11px] font-medium text-emerald-accent animate-pulse">
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
		<a
			href={houseDeedUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-medium border border-navy/10 text-navy/60 hover:text-navy hover:border-navy/20 transition-all"
		>
			Download Existing Deed
		</a>
	{/if}
</div>
