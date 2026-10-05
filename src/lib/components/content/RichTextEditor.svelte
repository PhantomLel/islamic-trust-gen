<script lang="ts">
	import { onMount } from 'svelte';
	import { productName } from '$lib/config';
	import type { DocJson } from '$lib/content/types';

	/**
	 * TipTap editor (spec v3 §7). Allowed: H2/H3, bold, italic, link, bullet list, ordered
	 * list, blockquote, and the product-name token. No raw HTML, script, iframe or style
	 * attributes: the schema has no such nodes, pasted classes/styles are stripped, and the
	 * server rebuilds the document from an allow-list again on save.
	 *
	 * `name` is the hidden form field that carries the JSON; `onchange` fires (debounced
	 * by the parent) so autosave can pick the change up.
	 */
	let {
		name = 'body',
		initial,
		onchange,
	}: { name?: string; initial: DocJson; onchange?: () => void } = $props();

	let element: HTMLDivElement | undefined = $state();
	let json = $state(JSON.stringify(initial));
	let editor: import('@tiptap/core').Editor | null = null;
	let active = $state({ h2: false, h3: false, bold: false, italic: false, link: false, bullet: false, ordered: false, quote: false });

	function refresh() {
		if (!editor) return;
		active = {
			h2: editor.isActive('heading', { level: 2 }),
			h3: editor.isActive('heading', { level: 3 }),
			bold: editor.isActive('bold'),
			italic: editor.isActive('italic'),
			link: editor.isActive('link'),
			bullet: editor.isActive('bulletList'),
			ordered: editor.isActive('orderedList'),
			quote: editor.isActive('blockquote'),
		};
	}

	/** Word pastes carry classes, inline styles and mso markup. Drop them before parsing. */
	function cleanPasted(html: string): string {
		return html
			.replace(/<!--[\s\S]*?-->/g, '')
			.replace(/<\/?o:p[^>]*>/gi, '')
			.replace(/\s(class|style|lang|id)="[^"]*"/gi, '')
			.replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '');
	}

	onMount(() => {
		let destroyed = false;
		(async () => {
			const [{ Editor, Node, mergeAttributes }, { default: StarterKit }] = await Promise.all([
				import('@tiptap/core'),
				import('@tiptap/starter-kit'),
			]);
			if (destroyed || !element) return;

			// A token with no stored string: the renderer substitutes the configured product name.
			const ProductName = Node.create({
				name: 'productName',
				group: 'inline',
				inline: true,
				atom: true,
				selectable: true,
				parseHTML: () => [{ tag: 'span[data-product-name]' }],
				renderHTML: ({ HTMLAttributes }) => [
					'span',
					mergeAttributes(HTMLAttributes, { 'data-product-name': '', class: 'rounded bg-emerald-accent/12 px-1 text-emerald-accent' }),
					productName,
				],
				addCommands() {
					return {
						insertProductName:
							() =>
							({ commands }: { commands: { insertContent: (c: unknown) => boolean } }) =>
								commands.insertContent({ type: 'productName' }),
					} as never;
				},
			});

			editor = new Editor({
				element,
				content: initial,
				extensions: [
					StarterKit.configure({
						heading: { levels: [2, 3] },
						strike: false,
						code: false,
						codeBlock: false,
						horizontalRule: false,
						underline: false,
						link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: 'noopener noreferrer' } },
					}),
					ProductName,
				],
				editorProps: {
					attributes: { class: 'prose-editor min-h-72 px-4 py-3 focus:outline-none', 'aria-label': 'Page body' },
					transformPastedHTML: cleanPasted,
				},
				onUpdate: ({ editor: e }) => {
					json = JSON.stringify(e.getJSON());
					refresh();
					onchange?.();
				},
				onSelectionUpdate: refresh,
			});
			json = JSON.stringify(editor.getJSON());
		})();
		return () => {
			destroyed = true;
			editor?.destroy();
		};
	});

	function run(fn: (e: import('@tiptap/core').Editor) => void) {
		if (editor) {
			fn(editor);
			editor.commands.focus();
			refresh();
		}
	}

	function setLink() {
		if (!editor) return;
		const prev = editor.getAttributes('link').href as string | undefined;
		const url = window.prompt('Link address (https://…, mailto:… or /path)', prev ?? 'https://');
		if (url === null) return;
		if (url.trim() === '') {
			editor.chain().focus().unsetLink().run();
		} else {
			editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
		}
		refresh();
	}

	const btn = 'px-2.5 py-1 rounded border text-xs cursor-pointer';
	const on = 'border-navy bg-navy text-cream';
	const off = 'border-navy/20 bg-white text-navy/75';
</script>

<div class="rounded-lg border border-navy/20 bg-white">
	<div class="flex flex-wrap gap-1.5 border-b border-navy/10 p-2" role="toolbar" aria-label="Formatting">
		<button type="button" class="{btn} {active.h2 ? on : off}" onclick={() => run((e) => e.chain().toggleHeading({ level: 2 }).run())}>Heading 2</button>
		<button type="button" class="{btn} {active.h3 ? on : off}" onclick={() => run((e) => e.chain().toggleHeading({ level: 3 }).run())}>Heading 3</button>
		<button type="button" class="{btn} {active.bold ? on : off}" onclick={() => run((e) => e.chain().toggleBold().run())}><strong>Bold</strong></button>
		<button type="button" class="{btn} {active.italic ? on : off}" onclick={() => run((e) => e.chain().toggleItalic().run())}><em>Italic</em></button>
		<button type="button" class="{btn} {active.link ? on : off}" onclick={setLink}>Link</button>
		<button type="button" class="{btn} {active.bullet ? on : off}" onclick={() => run((e) => e.chain().toggleBulletList().run())}>Bullets</button>
		<button type="button" class="{btn} {active.ordered ? on : off}" onclick={() => run((e) => e.chain().toggleOrderedList().run())}>Numbered</button>
		<button type="button" class="{btn} {active.quote ? on : off}" onclick={() => run((e) => e.chain().toggleBlockquote().run())}>Quote</button>
		<button type="button" class="{btn} {off}" onclick={() => run((e) => (e.commands as unknown as { insertProductName: () => boolean }).insertProductName())} title="Inserts the product name from configuration">Product name</button>
	</div>
	<div bind:this={element}></div>
	<noscript><p class="p-3 text-sm text-red-700">The editor needs JavaScript.</p></noscript>
</div>
<input type="hidden" {name} value={json} />

<style>
	:global(.prose-editor p) {
		margin: 0 0 0.9rem;
	}
	:global(.prose-editor h2) {
		font-size: 1.4rem;
		font-weight: 500;
		margin: 1.4rem 0 0.6rem;
	}
	:global(.prose-editor h3) {
		font-size: 1.15rem;
		font-weight: 500;
		margin: 1.1rem 0 0.5rem;
	}
	:global(.prose-editor ul) {
		list-style: disc;
		margin: 0 0 0.9rem 1.4rem;
	}
	:global(.prose-editor ol) {
		list-style: decimal;
		margin: 0 0 0.9rem 1.4rem;
	}
	:global(.prose-editor blockquote) {
		border-left: 3px solid rgba(74, 124, 111, 0.5);
		padding-left: 1rem;
		margin: 1rem 0;
		color: rgba(31, 45, 61, 0.7);
	}
	:global(.prose-editor a) {
		color: #4a7c6f;
		text-decoration: underline;
	}
</style>
