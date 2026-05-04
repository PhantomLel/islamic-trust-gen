import fs from 'node:fs';
import path from 'node:path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - the expressions sub-path has no shipped types
import expressionParser from 'docxtemplater/expressions.js';
import { buildJointTrustContext } from './buildContext';

const TEMPLATE_PATH = path.resolve('src/lib/templates/joint_template.docx');

/**
 * Two pre-render fixes applied directly to word/document.xml:
 *
 * 1. The template uses curly quotes inside expression sections like
 *    `{#mode === \u2018single-age\u2019}`. The Angular parser only accepts straight quotes,
 *    so we swap them inside `{...}` tag bodies only.
 * 2. `{:table xxx}` is paid `docxtemplater-table-module` syntax. Until that's wired
 *    up we rewrite each one to a plain scalar `{xxxText}` and let buildContext supply
 *    a formatted text fallback.
 */
function preprocessXml(xml: string): string {
	const tagsFixed = xml.replace(/\{[^{}]+\}/g, (tag) =>
		tag.replace(/[\u2018\u2019]/g, "'"),
	);
	return tagsFixed.replace(/\{:table\s+(\w+)\s*\}/g, '{$1Text}');
}

type TrustLike = Parameters<typeof buildJointTrustContext>[0] & {
	id: number;
	user?: { name?: string | null } | null;
};

export type RenderedDocument = {
	buffer: Buffer;
	filename: string;
};

function safeFilenameFragment(s: string | null | undefined, fallback: string): string {
	const cleaned = (s ?? '').trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
	return cleaned || fallback;
}

export function renderJointTrust(trust: TrustLike): RenderedDocument {
	const data = buildJointTrustContext(trust);

	const raw = fs.readFileSync(TEMPLATE_PATH);
	const zip = new PizZip(raw);

	const docXmlPath = 'word/document.xml';
	const original = zip.file(docXmlPath)?.asText();
	if (!original) throw new Error('joint_template.docx is missing word/document.xml');
	zip.file(docXmlPath, preprocessXml(original));

	const doc = new Docxtemplater(zip, {
		paragraphLoop: true,
		linebreaks: true,
		parser: expressionParser,
		nullGetter: () => '',
	});

	doc.render(data);

	const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

	const userPart = safeFilenameFragment(trust.user?.name, 'client');
	const filename = `joint-trust-${userPart}-${trust.id}.docx`;

	return { buffer, filename };
}
