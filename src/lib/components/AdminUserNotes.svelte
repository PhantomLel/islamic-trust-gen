<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	type Note = {
		id: number;
		body: string;
		authorId: string | null;
		authorName: string | null;
		pinned: boolean;
		createdAt: string;
		updatedAt: string;
	};

	let { notes, userName }: { notes: Note[]; userName: string } = $props();

	let draft = $state('');
	let draftPinned = $state(false);
	let adding = $state(false);
	let addError = $state('');

	let editingId = $state<number | null>(null);
	let editBody = $state('');
	let editError = $state('');
	let savingEdit = $state(false);

	let busyId = $state<number | null>(null);
	let confirmingDeleteId = $state<number | null>(null);

	let textareaEl = $state<HTMLTextAreaElement | null>(null);

	const MAX = 5000;

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function initials(name: string | null): string {
		const n = (name ?? '').trim();
		if (!n) return 'A';
		const parts = n.split(/\s+/);
		return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || 'A';
	}

	async function addNote() {
		const body = draft.trim();
		if (!body || adding) return;
		adding = true;
		addError = '';
		const formData = new FormData();
		formData.set('body', body);
		formData.set('pinned', String(draftPinned));
		const res = await fetch('?/addNote', { method: 'POST', body: formData });
		adding = false;
		if (!res.ok) {
			addError = 'Could not save the note. Please try again.';
			return;
		}
		draft = '';
		draftPinned = false;
		await invalidateAll();
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			addNote();
		}
	}

	function startEdit(note: Note) {
		editingId = note.id;
		editBody = note.body;
		editError = '';
		confirmingDeleteId = null;
	}

	function cancelEdit() {
		editingId = null;
		editBody = '';
		editError = '';
	}

	async function saveEdit(noteId: number) {
		const body = editBody.trim();
		if (!body || savingEdit) return;
		savingEdit = true;
		editError = '';
		const formData = new FormData();
		formData.set('noteId', String(noteId));
		formData.set('body', body);
		const res = await fetch('?/editNote', { method: 'POST', body: formData });
		savingEdit = false;
		if (!res.ok) {
			editError = 'Could not save changes. Please try again.';
			return;
		}
		cancelEdit();
		await invalidateAll();
	}

	async function togglePin(note: Note) {
		busyId = note.id;
		const formData = new FormData();
		formData.set('noteId', String(note.id));
		formData.set('pinned', String(!note.pinned));
		await fetch('?/toggleNotePin', { method: 'POST', body: formData });
		busyId = null;
		await invalidateAll();
	}

	async function deleteNote(noteId: number) {
		busyId = noteId;
		const formData = new FormData();
		formData.set('noteId', String(noteId));
		await fetch('?/deleteNote', { method: 'POST', body: formData });
		busyId = null;
		confirmingDeleteId = null;
		await invalidateAll();
	}
</script>

<div class="space-y-4">
	<!-- composer -->
	<div class="rounded-2xl bg-white/70 backdrop-blur-sm border border-navy/[0.06] p-5">
		<p class="text-[11px] text-navy/35 tracking-wider uppercase font-medium mb-3">Add a note</p>
		<div class="rounded-xl border border-navy/10 bg-white focus-within:border-emerald-accent/40 focus-within:ring-1 focus-within:ring-emerald-accent/20 transition-all">
			<textarea
				bind:this={textareaEl}
				bind:value={draft}
				onkeydown={handleKeydown}
				maxlength={MAX}
				rows="3"
				placeholder={`Write a private note about ${userName}… (visible to admins only)`}
				class="w-full resize-y rounded-t-xl bg-transparent px-3.5 py-3 text-[13px] text-navy leading-relaxed outline-none placeholder:text-navy/30"
			></textarea>
			<div class="flex items-center justify-between gap-3 px-3.5 py-2.5 border-t border-navy/[0.06]">
				<button
					type="button"
					onclick={() => (draftPinned = !draftPinned)}
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer
						{draftPinned
							? 'border-amber-300/70 bg-amber-50 text-amber-700'
							: 'border-navy/10 bg-white text-navy/45 hover:bg-navy/[0.04]'}"
					title="Pinned notes stay at the top"
				>
					<svg class="w-3.5 h-3.5" fill={draftPinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 4h6l-1 7 3 3v2H7v-2l3-3-1-7z M12 16v4" />
					</svg>
					{draftPinned ? 'Pinned' : 'Pin'}
				</button>
				<div class="flex items-center gap-3">
					<span class="text-[11px] text-navy/30 tabular-nums">{draft.length}/{MAX}</span>
					<button
						type="button"
						onclick={addNote}
						disabled={!draft.trim() || adding}
						class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-white bg-emerald-accent hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{#if adding}
							<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
							</svg>
							Saving…
						{:else}
							Add note
						{/if}
					</button>
				</div>
			</div>
		</div>
		{#if addError}
			<p class="mt-2 text-[12px] text-rose-600">{addError}</p>
		{:else}
			<p class="mt-2 text-[11px] text-navy/30">Tip: press ⌘/Ctrl + Enter to save.</p>
		{/if}
	</div>

	<!-- notes list -->
	{#if notes.length === 0}
		<div class="rounded-2xl bg-white/60 border border-navy/[0.06] p-10 text-center">
			<svg class="w-7 h-7 mx-auto text-navy/20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h4m1-12H7a2 2 0 00-2 2v14l4-3h8a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
			</svg>
			<p class="text-navy/40 text-sm">No notes yet.</p>
			<p class="text-navy/35 text-[12px] mt-1">Add the first note about this client above.</p>
		</div>
	{:else}
		<ul class="space-y-3">
			{#each notes as note (note.id)}
				<li
					class="rounded-2xl border bg-white/70 backdrop-blur-sm p-4 transition-colors
						{note.pinned ? 'border-amber-300/50 bg-amber-50/40' : 'border-navy/[0.06]'}"
				>
					<div class="flex items-start gap-3">
						<div class="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-navy/[0.06] text-navy/55 text-[11px] font-semibold flex items-center justify-center">
							{initials(note.authorName)}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="text-[12px] font-medium text-navy/80">{note.authorName ?? 'Admin'}</span>
								{#if note.pinned}
									<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
										<svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 4h6l-1 7 3 3v2H7v-2l3-3-1-7z" /></svg>
										Pinned
									</span>
								{/if}
								<span class="text-[11px] text-navy/35 tabular-nums">{formatDate(note.createdAt)}</span>
								{#if note.updatedAt !== note.createdAt}
									<span class="text-[11px] text-navy/25 italic">· edited</span>
								{/if}
							</div>

							{#if editingId === note.id}
								<div class="mt-2">
									<textarea
										bind:value={editBody}
										maxlength={MAX}
										rows="3"
										class="w-full resize-y rounded-lg border border-navy/10 bg-white px-3 py-2 text-[13px] text-navy leading-relaxed outline-none focus:border-emerald-accent/40 focus:ring-1 focus:ring-emerald-accent/20"
									></textarea>
									{#if editError}
										<p class="mt-1.5 text-[12px] text-rose-600">{editError}</p>
									{/if}
									<div class="mt-2 flex items-center gap-2">
										<button
											type="button"
											onclick={() => saveEdit(note.id)}
											disabled={!editBody.trim() || savingEdit}
											class="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white bg-emerald-accent hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
										>
											{savingEdit ? 'Saving…' : 'Save'}
										</button>
										<button
											type="button"
											onclick={cancelEdit}
											class="px-3 py-1.5 rounded-lg text-[12px] text-navy/50 hover:text-navy hover:bg-navy/[0.04] transition-colors cursor-pointer"
										>
											Cancel
										</button>
									</div>
								</div>
							{:else}
								<p class="mt-1 text-[13px] text-navy/80 leading-relaxed whitespace-pre-wrap break-words">{note.body}</p>

								<div class="mt-2.5 flex items-center gap-1">
									<button
										type="button"
										onclick={() => togglePin(note)}
										disabled={busyId === note.id}
										class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-navy/45 hover:text-navy hover:bg-navy/[0.04] transition-colors cursor-pointer disabled:opacity-40"
									>
										<svg class="w-3.5 h-3.5" fill={note.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 4h6l-1 7 3 3v2H7v-2l3-3-1-7z M12 16v4" /></svg>
										{note.pinned ? 'Unpin' : 'Pin'}
									</button>
									<button
										type="button"
										onclick={() => startEdit(note)}
										class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-navy/45 hover:text-navy hover:bg-navy/[0.04] transition-colors cursor-pointer"
									>
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
										Edit
									</button>
									{#if confirmingDeleteId === note.id}
										<span class="inline-flex items-center gap-1.5 pl-1">
											<button
												type="button"
												onclick={() => deleteNote(note.id)}
												disabled={busyId === note.id}
												class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-40"
											>
												{busyId === note.id ? 'Deleting…' : 'Confirm delete'}
											</button>
											<button
												type="button"
												onclick={() => (confirmingDeleteId = null)}
												class="px-2 py-1 rounded-md text-[11px] text-navy/45 hover:text-navy transition-colors cursor-pointer"
											>
												Cancel
											</button>
										</span>
									{:else}
										<button
											type="button"
											onclick={() => (confirmingDeleteId = note.id)}
											class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-navy/45 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
										>
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
											Delete
										</button>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
