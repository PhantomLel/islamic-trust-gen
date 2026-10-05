import type PizZip from 'pizzip';
import { DRAFT_MARKER } from '$lib/free-will/draft';

/**
 * Stamps `DRAFT — NOT FOR SIGNATURE` into the generated .docx itself (spec v3
 * §3.3), not into CSS: every section gets a header carrying the marker for the
 * default, first-page, and even-page header slots, so no page can render
 * without it. Existing header parts are kept and the marker is prepended to
 * them; sections with no header of a given type get a reference to a new
 * header part that holds only the marker.
 *
 * Paid trust documents generated after attorney approval do not go through this.
 */

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const HEADER_CONTENT_TYPE =
	'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml';
const HEADER_REL_TYPE =
	'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header';
const NEW_HEADER_PART = 'word/headerDraft1.xml';
const NEW_HEADER_REL_ID = 'rIdDraftHeader1';

const HEADER_TYPES = ['default', 'first', 'even'] as const;

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function markerParagraph(): string {
	return (
		`<w:p><w:pPr><w:jc w:val="center"/></w:pPr>` +
		`<w:r><w:rPr><w:b/><w:color w:val="C00000"/><w:sz w:val="28"/></w:rPr>` +
		`<w:t xml:space="preserve">${escapeXml(DRAFT_MARKER)}</w:t></w:r></w:p>`
	);
}

function newHeaderXml(): string {
	return (
		`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
		`<w:hdr xmlns:w="${W_NS}" xmlns:r="${R_NS}">${markerParagraph()}</w:hdr>`
	);
}

/** Resolve `r:id` → target part path using word/_rels/document.xml.rels. */
function relationshipTargets(relsXml: string): Map<string, string> {
	const map = new Map<string, string>();
	for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)) {
		const tag = m[0];
		const id = /\bId="([^"]+)"/.exec(tag)?.[1];
		const target = /\bTarget="([^"]+)"/.exec(tag)?.[1];
		if (id && target) map.set(id, target);
	}
	return map;
}

function toPartPath(target: string): string {
	const clean = target.replace(/^\//, '');
	return clean.startsWith('word/') ? clean : `word/${clean}`;
}

export function applyDraftWatermark(zip: PizZip): void {
	const docPath = 'word/document.xml';
	const relsPath = 'word/_rels/document.xml.rels';
	const ctPath = '[Content_Types].xml';

	let docXml = zip.file(docPath)?.asText();
	let relsXml = zip.file(relsPath)?.asText();
	let ctXml = zip.file(ctPath)?.asText();
	if (!docXml || !relsXml || !ctXml) {
		throw new Error('Cannot apply draft watermark: docx is missing a core part');
	}

	const targets = relationshipTargets(relsXml);
	const stamped = new Set<string>();
	let usedNewHeader = false;

	docXml = docXml.replace(/<w:sectPr\b[^>]*>[\s\S]*?<\/w:sectPr>/g, (sect) => {
		const open = /^<w:sectPr\b[^>]*>/.exec(sect)![0];
		let extraRefs = '';

		for (const type of HEADER_TYPES) {
			const refRe = new RegExp(`<w:headerReference\\b[^>]*w:type="${type}"[^>]*/?>`);
			const ref = refRe.exec(sect)?.[0];
			if (ref) {
				const rid = /r:id="([^"]+)"/.exec(ref)?.[1];
				const target = rid ? targets.get(rid) : undefined;
				if (target) {
					const part = toPartPath(target);
					if (!stamped.has(part)) {
						const hdr = zip.file(part)?.asText();
						if (hdr) {
							zip.file(part, hdr.replace(/(<w:hdr\b[^>]*>)/, `$1${markerParagraph()}`));
							stamped.add(part);
						}
					}
				}
			} else {
				extraRefs += `<w:headerReference w:type="${type}" r:id="${NEW_HEADER_REL_ID}"/>`;
				usedNewHeader = true;
			}
		}

		return extraRefs ? sect.replace(open, `${open}${extraRefs}`) : sect;
	});

	if (usedNewHeader) {
		zip.file(NEW_HEADER_PART, newHeaderXml());
		relsXml = relsXml.replace(
			'</Relationships>',
			`<Relationship Id="${NEW_HEADER_REL_ID}" Type="${HEADER_REL_TYPE}" Target="headerDraft1.xml"/></Relationships>`,
		);
		ctXml = ctXml.replace(
			'</Types>',
			`<Override PartName="/${NEW_HEADER_PART}" ContentType="${HEADER_CONTENT_TYPE}"/></Types>`,
		);
		zip.file(relsPath, relsXml);
		zip.file(ctPath, ctXml);
	}

	// Ensure the root element declares the r: namespace used by the new references.
	if (usedNewHeader && !/xmlns:r="/.test(docXml.slice(0, 4000))) {
		docXml = docXml.replace(/<w:document\b/, `<w:document xmlns:r="${R_NS}"`);
	}

	zip.file(docPath, docXml);
}

/** Every header part referenced from the document, with its text — used by tests to prove the marker is in the file. */
export function headerTextsReferencedBySections(zip: PizZip): string[] {
	const docXml = zip.file('word/document.xml')?.asText() ?? '';
	const relsXml = zip.file('word/_rels/document.xml.rels')?.asText() ?? '';
	const targets = relationshipTargets(relsXml);
	const out: string[] = [];
	for (const sect of docXml.match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/g) ?? []) {
		for (const ref of sect.match(/<w:headerReference\b[^>]*\/?>/g) ?? []) {
			const rid = /r:id="([^"]+)"/.exec(ref)?.[1];
			const target = rid ? targets.get(rid) : undefined;
			const xml = target ? zip.file(toPartPath(target))?.asText() : undefined;
			out.push((xml ?? '').replace(/<[^>]+>/g, ''));
		}
	}
	return out;
}
