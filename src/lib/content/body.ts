/**
 * Body documents: sanitising, plain-text extraction and server-side HTML rendering.
 *
 * Authors write in TipTap; the stored form is ProseMirror JSON. Nothing the author
 * (or Word, via paste) sends is trusted: `sanitizeDoc` rebuilds the tree from an
 * allow-list so unknown nodes, attributes, classes, inline styles, raw HTML and
 * scripts cannot survive a save. `renderBodyHtml` only ever emits tags from the
 * same allow-list, with every text node escaped.
 *
 * The product name is a `productName` node with no stored string, so a rename
 * never needs a re-edit or re-approval.
 */
import { productName as configuredProductName } from '$lib/config';
import { EMPTY_DOC, type DocJson, type DocMark, type DocNode } from './types';

const MAX_DEPTH = 8;
const MAX_NODES = 5000;

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote']);
const INLINE_TYPES = new Set(['text', 'hardBreak', 'productName']);

export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Only http(s), mailto and site-relative links survive. Everything else (javascript:, data:, …) is dropped. */
export function safeHref(raw: unknown): string | null {
	if (typeof raw !== 'string') return null;
	const href = raw.trim();
	if (!href || href.length > 2048) return null;
	if (/[\u0000-\u001f\u007f\s]/.test(href)) return null;
	if (href.startsWith('/') && !href.startsWith('//')) return href;
	if (href.startsWith('#')) return href;
	try {
		const u = new URL(href);
		if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:') return href;
	} catch {
		/* not absolute */
	}
	return null;
}

function cleanMarks(marks: unknown): DocMark[] | undefined {
	if (!Array.isArray(marks)) return undefined;
	const out: DocMark[] = [];
	for (const m of marks) {
		if (!m || typeof m !== 'object') continue;
		const type = (m as { type?: unknown }).type;
		if (type === 'bold' || type === 'italic') {
			out.push({ type });
		} else if (type === 'link') {
			const href = safeHref((m as { attrs?: { href?: unknown } }).attrs?.href);
			if (href) out.push({ type: 'link', attrs: { href } });
		}
	}
	return out.length ? out : undefined;
}

function cleanNode(node: unknown, depth: number, counter: { n: number }): DocNode | null {
	if (!node || typeof node !== 'object' || depth > MAX_DEPTH) return null;
	if (++counter.n > MAX_NODES) return null;
	const n = node as DocNode;
	const type = n.type;
	if (typeof type !== 'string') return null;

	if (type === 'text') {
		if (typeof n.text !== 'string' || n.text === '') return null;
		const marks = cleanMarks(n.marks);
		return marks ? { type: 'text', text: n.text, marks } : { type: 'text', text: n.text };
	}
	if (type === 'hardBreak') return { type: 'hardBreak' };
	if (type === 'productName') return { type: 'productName' };
	if (!BLOCK_TYPES.has(type)) return null;

	const content: DocNode[] = [];
	if (Array.isArray(n.content)) {
		for (const child of n.content) {
			const c = cleanNode(child, depth + 1, counter);
			if (c) content.push(c);
		}
	}

	if (type === 'heading') {
		// H1 is the page title, rendered by the template. Authors get H2 and H3.
		const raw = Number((n.attrs as { level?: unknown } | undefined)?.level);
		const level = raw === 3 ? 3 : 2;
		return { type: 'heading', attrs: { level }, content };
	}
	return content.length ? { type, content } : { type };
}

/** Rebuild a document from the allow-list. Never throws; garbage in gives an empty document out. */
export function sanitizeDoc(input: unknown): DocJson {
	if (!input || typeof input !== 'object' || (input as DocJson).type !== 'doc') return structuredClone(EMPTY_DOC);
	const counter = { n: 0 };
	const content: DocNode[] = [];
	const raw = (input as DocJson).content;
	if (Array.isArray(raw)) {
		for (const child of raw) {
			// Top-level text is not valid in a doc; wrap it so pasted loose text is kept.
			const c = cleanNode(child, 1, counter);
			if (!c) continue;
			if (INLINE_TYPES.has(c.type)) content.push({ type: 'paragraph', content: [c] });
			else content.push(c);
		}
	}
	return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

/** Parse a stored/posted JSON string into a sanitised document. */
export function parseDoc(json: string | null | undefined): DocJson {
	if (!json) return structuredClone(EMPTY_DOC);
	try {
		return sanitizeDoc(JSON.parse(json));
	} catch {
		return structuredClone(EMPTY_DOC);
	}
}

function renderInline(node: DocNode, name: string): string {
	if (node.type === 'hardBreak') return '<br>';
	if (node.type === 'productName') return escapeHtml(name);
	let html = escapeHtml(node.text ?? '');
	for (const mark of node.marks ?? []) {
		if (mark.type === 'bold') html = `<strong>${html}</strong>`;
		else if (mark.type === 'italic') html = `<em>${html}</em>`;
		else if (mark.type === 'link' && mark.attrs?.href) {
			const href = mark.attrs.href;
			const external = /^https?:/i.test(href);
			html = `<a href="${escapeHtml(href)}"${external ? ' rel="noopener noreferrer"' : ''}>${html}</a>`;
		}
	}
	return html;
}

function renderNode(node: DocNode, name: string): string {
	if (INLINE_TYPES.has(node.type)) return renderInline(node, name);
	const inner = (node.content ?? []).map((c) => renderNode(c, name)).join('');
	switch (node.type) {
		case 'paragraph':
			return inner ? `<p>${inner}</p>` : '';
		case 'heading': {
			const level = (node.attrs?.level as number) === 3 ? 3 : 2;
			return `<h${level}>${inner}</h${level}>`;
		}
		case 'bulletList':
			return `<ul>${inner}</ul>`;
		case 'orderedList':
			return `<ol>${inner}</ol>`;
		case 'listItem':
			return `<li>${inner}</li>`;
		case 'blockquote':
			return `<blockquote>${inner}</blockquote>`;
		default:
			return '';
	}
}

/** Render a body to HTML. The product name is read from config at render time. */
export function renderBodyHtml(doc: unknown, name: string = configuredProductName): string {
	const clean = sanitizeDoc(doc);
	return (clean.content ?? []).map((n) => renderNode(n, name)).join('');
}

function textOf(node: DocNode, name: string, out: string[]): void {
	if (node.type === 'text') out.push(node.text ?? '');
	else if (node.type === 'productName') out.push(name);
	else if (node.type === 'hardBreak') out.push(' ');
	for (const c of node.content ?? []) textOf(c, name, out);
	if (BLOCK_TYPES.has(node.type)) out.push('\n');
}

/** Plain text of a body, with the product-name token expanded. Used for search and word checks. */
export function bodyPlainText(doc: unknown, name: string = configuredProductName): string {
	const clean = sanitizeDoc(doc);
	const out: string[] = [];
	for (const n of clean.content ?? []) textOf(n, name, out);
	return out.join('').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

/**
 * Text that an author typed literally, with the product-name token NOT expanded.
 * This is what the literal-name warning inspects: a `productName` node is fine.
 */
export function bodyLiteralText(doc: unknown): string {
	const clean = sanitizeDoc(doc);
	const out: string[] = [];
	const walk = (node: DocNode) => {
		if (node.type === 'text') out.push(node.text ?? '');
		for (const c of node.content ?? []) walk(c);
		if (BLOCK_TYPES.has(node.type)) out.push('\n');
	};
	for (const n of clean.content ?? []) walk(n);
	return out.join('');
}

const LITERAL_NAME_PATTERNS: { re: RegExp; label: string }[] = [
	{ re: /Muslim Legacy Planning Guided Trust/i, label: 'Muslim Legacy Planning Guided Trust' },
	{ re: /Good\s?Tree/i, label: 'GoodTree / Good Tree' },
];

/**
 * Warn when the product name (or the retired one) is typed out as literal characters.
 * Returns plain-language warnings. Never rewrites the author's words.
 */
export function literalProductNameWarnings(...texts: (string | null | undefined)[]): string[] {
	const joined = texts.filter(Boolean).join('\n');
	const warnings: string[] = [];
	for (const { re, label } of LITERAL_NAME_PATTERNS) {
		if (re.test(joined)) {
			warnings.push(
				`The text contains “${label}” typed out. Use the product-name button instead so a future rename updates this page automatically.`,
			);
		}
	}
	return warnings;
}

/** Whether a body has any visible content. */
export function bodyHasContent(doc: unknown): boolean {
	return bodyPlainText(doc).replace(/\s/g, '').length > 0;
}
