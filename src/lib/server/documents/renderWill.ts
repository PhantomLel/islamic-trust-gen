import { env } from '$env/dynamic/private';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - the expressions sub-path has no shipped types
import expressionParser from 'docxtemplater/expressions.js';
import { buildWillDocumentContext, type WillDocumentContext } from './buildWillContext';

/**
 * Per-state will templates. The free will is attorney-informed and state
 * specific, so each supported state maps to its own `.docx` under
 * `static/templates`. California is coming soon; only Texas is wired up today.
 */
const STATE_TEMPLATES: Record<string, string> = {
	TX: 'texas_freewill.docx',
	CA: 'california_freewill.docx',
};

type FreeWillLike = {
	id: number;
	responses: { id: string; response: unknown }[] | null;
	user?: { name?: string | null } | null;
};

export type RenderedDocument = {
	buffer: Buffer;
	filename: string;
};

/**
 * Two pre-render fixes applied directly to word/document.xml, mirroring
 * `renderJointTrust`:
 *
 * 1. Curly quotes inside `{...}` expression tags are swapped for straight quotes
 *    (the Angular parser only accepts straight quotes).
 * 2. The Texas template has a stray `l` immediately after the `{/children}`
 *    closing tag (`{children}{/children}l`). Strip it so it doesn't leak into
 *    the rendered document.
 */
function preprocessXml(xml: string): string {
	const tagsFixed = xml.replace(/\{[^{}]+\}/g, (tag) => tag.replace(/[\u2018\u2019]/g, "'"));
	return tagsFixed.replace(/\{\/children\}l/g, '{/children}');
}

function safeFilenameFragment(s: string | null | undefined, fallback: string): string {
	const cleaned = (s ?? '').trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
	return cleaned || fallback;
}

/**
 * Shape the resolved context into the exact object the docx template consumes.
 * The template references `{date}`, `{guardians[0]}` / `{guardians[1]}` (plain
 * strings) and loops executors with `{#executors}{fullName}{/executors}`, so we
 * map the structured context accordingly and drop empty executor/guardian slots.
 */
function toTemplateData(ctx: WillDocumentContext) {
	const executors = ctx.executors
		.filter((e) => e.fullName.trim().length > 0)
		.map((e) => ({ fullName: e.fullName.trim() }));

	const guardians = ctx.guardians.map((g) => g.fullName.trim());

	return {
		...ctx,
		date: ctx.willDate,
		executors,
		guardians,
	};
}

/**
 * Render the free Islamic will for a stored submission. Picks the template for
 * the testator's state, fills it from `buildWillDocumentContext`, and returns
 * the generated `.docx` buffer plus a download-friendly filename.
 */
export async function renderFreeWill(will: FreeWillLike): Promise<RenderedDocument> {
	const data = buildWillDocumentContext({ id: will.id, responses: will.responses });

	const templateFile = STATE_TEMPLATES[data.stateCode];
	if (!templateFile) {
		throw new Error(
			`No will template available for state "${data.stateCode || 'unknown'}" yet.`,
		);
	}

	const response = await fetch(`${env.ORIGIN}/templates/${templateFile}`);
	if (!response.ok) {
		throw new Error(
			`Failed to load will template ${templateFile}: ${response.status} ${response.statusText}`,
		);
	}
	const raw = Buffer.from(await response.arrayBuffer());
	const zip = new PizZip(raw);

	const docXmlPath = 'word/document.xml';
	const original = zip.file(docXmlPath)?.asText();
	if (!original) throw new Error(`${templateFile} is missing word/document.xml`);
	zip.file(docXmlPath, preprocessXml(original));

	const doc = new Docxtemplater(zip, {
		paragraphLoop: true,
		linebreaks: true,
		parser: expressionParser,
		nullGetter: () => '',
	});

	doc.render(toTemplateData(data));

	const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

	const userPart = safeFilenameFragment(data.testatorName || will.user?.name, 'will');
	const filename = `islamic-will-${userPart}-${will.id}.docx`;

	return { buffer, filename };
}
