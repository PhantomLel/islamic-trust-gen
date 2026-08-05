import { env } from '$env/dynamic/private';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - the expressions sub-path has no shipped types
import expressionParser from 'docxtemplater/expressions.js';

export type RenderedDocument = {
	buffer: Buffer;
	filename: string;
};

/** Straighten curly quotes inside `{...}` tag bodies for the Angular expression parser. */
export function preprocessDocxXml(xml: string): string {
	return xml.replace(/\{[^{}]+\}/g, (tag) => tag.replace(/[\u2018\u2019]/g, "'"));
}

export function safeFilenameFragment(s: string | null | undefined, fallback: string): string {
	const cleaned = (s ?? '').trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
	return cleaned || fallback;
}

export async function loadTemplateBuffer(templateFilename: string): Promise<Buffer> {
	const response = await fetch(`${env.ORIGIN}/templates/${templateFilename}`);
	if (!response.ok) {
		throw new Error(
			`Failed to load template ${templateFilename}: ${response.status} ${response.statusText}`,
		);
	}
	return Buffer.from(await response.arrayBuffer());
}

export async function renderDocxTemplate(
	templateFilename: string,
	data: Record<string, unknown>,
): Promise<Buffer> {
	const raw = await loadTemplateBuffer(templateFilename);
	const zip = new PizZip(raw);

	const docXmlPath = 'word/document.xml';
	const original = zip.file(docXmlPath)?.asText();
	if (!original) throw new Error(`${templateFilename} is missing word/document.xml`);
	zip.file(docXmlPath, preprocessDocxXml(original));

	const doc = new Docxtemplater(zip, {
		paragraphLoop: true,
		linebreaks: true,
		parser: expressionParser,
		nullGetter: () => '',
	});

	doc.render(data);

	return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export function extractPlainTextFromDocxXml(xml: string): string {
	const body = xml.slice(xml.indexOf('<w:body>'));
	return body
		.replace(/<[^>]+>/g, '')
		.replace(/&apos;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

export function assertNoUnmergedDocxTags(xml: string): void {
	if (/\{[#/:^]?[a-zA-Z]/.test(xml)) {
		throw new Error('Rendered document still contains unmerged docxtemplater tags');
	}
}
