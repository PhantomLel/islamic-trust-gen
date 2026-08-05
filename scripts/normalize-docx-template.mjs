#!/usr/bin/env node
/**
 * Normalizes a .docx template for docxtemplater by merging split XML runs.
 *
 * Usage: node scripts/normalize-docx-template.mjs static/templates/foo.docx
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templateArg = process.argv[2];
if (!templateArg) {
	console.error('Usage: node scripts/normalize-docx-template.mjs <path-to.docx>');
	process.exit(1);
}

const TEMPLATE_PATH = resolve(process.cwd(), templateArg);
const DOC_XML_PATH = 'word/document.xml';

function escapeXml(text) {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractRuns(pXml) {
	const runs = [];
	const runRegex = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;
	for (const match of pXml.matchAll(runRegex)) {
		const inner = match[1];
		const textMatch = inner.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/);
		runs.push({
			full: match[0],
			inner,
			text: textMatch ? textMatch[1] : '',
			rPr: inner.match(/<w:rPr[\s\S]*?<\/w:rPr>/)?.[0] ?? '',
		});
	}
	return runs;
}

function mergeRuns(runs) {
	const text = runs.map((r) => r.text).join('');
	const rPr = runs.find((r) => r.rPr)?.rPr ?? '';
	const spaceAttr = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : '';
	return `<w:r>${rPr}<w:t${spaceAttr}>${escapeXml(text)}</w:t></w:r>`;
}

function mergeSplitTagsInParagraph(pXml) {
	const openP = pXml.indexOf('<w:p');
	if (openP === -1) return pXml;
	const closeP = pXml.lastIndexOf('</w:p>');
	if (closeP === -1) return pXml;

	const prefix = pXml.slice(0, openP);
	const body = pXml.slice(openP, closeP + 6);
	const suffix = pXml.slice(closeP + 6);

	const pOpenEnd = body.indexOf('>') + 1;
	const pCloseStart = body.lastIndexOf('</w:p>');
	const pOpen = body.slice(0, pOpenEnd);
	const pInner = body.slice(pOpenEnd, pCloseStart);
	const pClose = body.slice(pCloseStart);

	const runs = extractRuns(pInner);
	if (runs.length === 0) return pXml;

	const fullText = runs.map((r) => r.text).join('');
	if (!fullText.includes('{') && !fullText.includes('(#')) return pXml;

	const merged = [];
	let buffer = [];
	let bufferText = '';

	function flushBuffer() {
		if (buffer.length === 0) return;
		merged.push(buffer.length === 1 ? buffer[0].full : mergeRuns(buffer));
		buffer = [];
		bufferText = '';
	}

	for (const run of runs) {
		buffer.push(run);
		bufferText += run.text;

		const opens = (bufferText.match(/\{/g) ?? []).length;
		const closes = (bufferText.match(/\}/g) ?? []).length;
		if (opens > closes) continue;
		flushBuffer();
	}
	flushBuffer();

	const nonRunParts = pInner.replace(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g, '');
	const rebuiltInner = nonRunParts + merged.join('');
	let rebuilt = prefix + pOpen + rebuiltInner + pClose + suffix;

	rebuilt = rebuilt.replace(/\{[^{}]+\}/g, (tag) => tag.replace(/[\u2018\u2019]/g, "'"));

	return rebuilt;
}

function normalizeXml(xml) {
	return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (pXml) => mergeSplitTagsInParagraph(pXml));
}

function assertTagsWhole(xml) {
	const wtContents = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]);
	const splitRuns = wtContents.filter((t) => {
		if (!t.includes('{') && !t.includes('}')) return false;
		const opens = (t.match(/\{/g) ?? []).length;
		const closes = (t.match(/\}/g) ?? []).length;
		return opens !== closes;
	});
	if (splitRuns.length > 0) {
		throw new Error(
			`[normalize-docx-template] ${splitRuns.length} split tag run(s) remain in ${TEMPLATE_PATH}, e.g. ${JSON.stringify(splitRuns.slice(0, 5))}`,
		);
	}
}

function main() {
	const raw = readFileSync(TEMPLATE_PATH);
	const zip = new PizZip(raw);
	const original = zip.file(DOC_XML_PATH)?.asText();
	if (!original) throw new Error(`Missing ${DOC_XML_PATH} in ${TEMPLATE_PATH}`);

	const normalized = normalizeXml(original);
	assertTagsWhole(normalized);

	zip.file(DOC_XML_PATH, normalized);
	writeFileSync(TEMPLATE_PATH, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
	console.log(`[normalize-docx-template] Normalized ${TEMPLATE_PATH}`);
}

main();
