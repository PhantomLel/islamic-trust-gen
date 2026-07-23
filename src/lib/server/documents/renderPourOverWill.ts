import { env } from '$env/dynamic/private';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - the expressions sub-path has no shipped types
import expressionParser from 'docxtemplater/expressions.js';
import {
	buildPourOverWillContext,
	type PourOverWillContext,
	type PourOverWillRole,
} from './buildPourOverWillContext';

const POUR_OVER_TEMPLATE = 'pour_over_will_texas.docx';

type TrustLike = Parameters<typeof buildPourOverWillContext>[0] & {
	id: number;
	user?: { name?: string | null } | null;
};

export type RenderedDocument = {
	buffer: Buffer;
	filename: string;
};

/**
 * Pre-render fixes for `pour_over_will_texas.docx`:
 *
 * 1. Curly quotes inside `{...}` tags are swapped for straight quotes.
 * 2. Split closing tags (`{/representatives}`, `{/guardians}`) are merged.
 * 3. Placeholder personal-representative copy is wired to `{firstRepresentative}`.
 * 4. One hard-coded male pronoun in the witness block is made gender-aware.
 */
export function preprocessPourOverXml(xml: string): string {
	let out = xml.replace(/\{[^{}]+\}/g, (tag) => tag.replace(/[\u2018\u2019]/g, "'"));

	out = out.replace(
		/\{\/<\/w:t><\/w:r><w:r><w:rPr><w:rtl w:val="0"\/><\/w:rPr><w:t>representatives<\/w:t><\/w:r><w:r><w:rPr><w:rtl w:val="0"\/><\/w:rPr><w:t>\}/g,
		'{/representatives}',
	);
	out = out.replace(
		/\{\/<\/w:t><\/w:r><w:r><w:rPr><w:rtl w:val="0"\/><\/w:rPr><w:t>guardians<\/w:t><\/w:r><w:r><w:rPr><w:rtl w:val="0"\/><\/w:rPr><w:t>\}/g,
		'{/guardians}',
	);

	out = out.replace(/\{#childrenCount &gt; 0\}/g, '{#hasChildren}');
	out = out.replace(/\{\/childrenCount\}/g, '{/hasChildren}');

	out = out.replaceAll('Choice of Personal Representative', '{firstRepresentative}');
	out = out.replace(
		/to be his Last Will and Testament in our presence/g,
		'to be {isFemale ? "her" : "his"} Last Will and Testament in our presence',
	);

	return out;
}

async function loadTemplateBuffer(): Promise<Buffer> {
	const response = await fetch(`${env.ORIGIN}/templates/${POUR_OVER_TEMPLATE}`);
	if (!response.ok) {
		throw new Error(
			`Failed to load pour-over will template ${POUR_OVER_TEMPLATE}: ${response.status} ${response.statusText}`,
		);
	}
	return Buffer.from(await response.arrayBuffer());
}

function safeFilenameFragment(s: string | null | undefined, fallback: string): string {
	const cleaned = (s ?? '').trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
	return cleaned || fallback;
}

function toTemplateData(ctx: PourOverWillContext) {
	return {
		...ctx,
		representatives: ctx.representatives.filter((name) => name.trim().length > 0),
		guardians: ctx.guardians.filter((name) => name.trim().length > 0),
	};
}

async function renderPourOverDocx(data: PourOverWillContext): Promise<Buffer> {
	const raw = await loadTemplateBuffer();
	const zip = new PizZip(raw);

	const docXmlPath = 'word/document.xml';
	const original = zip.file(docXmlPath)?.asText();
	if (!original) throw new Error(`${POUR_OVER_TEMPLATE} is missing word/document.xml`);
	zip.file(docXmlPath, preprocessPourOverXml(original));

	const doc = new Docxtemplater(zip, {
		paragraphLoop: true,
		linebreaks: true,
		parser: expressionParser,
		nullGetter: () => '',
	});

	doc.render(toTemplateData(data));

	return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function renderPourOverWill(
	trust: TrustLike,
	role: PourOverWillRole,
): Promise<RenderedDocument> {
	const data = buildPourOverWillContext(trust, role);
	const buffer = await renderPourOverDocx(data);

	const userPart = safeFilenameFragment(trust.user?.name, 'client');
	const rolePart = role === 'husband' ? 'husband' : 'wife';
	const filename = `pour-over-will-${rolePart}-${userPart}-${trust.id}.docx`;

	return { buffer, filename };
}
