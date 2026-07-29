#!/usr/bin/env node
/**
 * Converts Leonard's master Texas free-will document
 * (`static/templates/source/Islamic_Will_Template_TX_v2_1.docx`) into the
 * docxtemplater-ready `static/templates/texas_freewill_v2.docx` consumed by
 * `src/lib/server/documents/renderWill.ts`.
 *
 * The master already uses whole, single-run `{{UPPER_SNAKE}}` field
 * placeholders (verified by hand against the v2.1 revision), so this script
 * only needs to:
 *
 *   1. Leave every plain field placeholder untouched.
 *   2. Turn the three numbered executor paragraphs into one paragraph that
 *      loops over `{{#EXECUTORS}}...{{/EXECUTORS}}` (docxtemplater's
 *      paragraphLoop repeats the paragraph, including its list numbering,
 *      once per executor).
 *   3. Turn the wasiyyah and Islamic Inheritance Schedule table data rows
 *      into `{{#WASIYYAH}}...{{/WASIYYAH}}` / `{{#HEIRS}}...{{/HEIRS}}` row
 *      loops, and gate the whole wasiyyah table behind
 *      `{{#HAS_WASIYYAH}}...{{/HAS_WASIYYAH}}` with an inverted-section
 *      fallback sentence when the user made no wasiyyah gifts.
 *   4. Gate the minor-children/guardian section behind
 *      `{{#HAS_MINOR_CHILDREN}}...{{/HAS_MINOR_CHILDREN}}` and the second
 *      guardian sentence behind `{{#GUARDIAN_2}}...{{/GUARDIAN_2}}`.
 *   5. Replace the two `{{(deceased) if applicable}}` generator-logic notes
 *      with real `{{FATHER_NAME_AND_STATUS}}` / `{{MOTHER_NAME_AND_STATUS}}`
 *      fields (resolved server-side to e.g. "Ahmad Khan (deceased)").
 *   6. Delete the three `{{Render ... }}` / `{{omit block if none}}`
 *      instruction notes — they describe generator logic and must never
 *      print in a client's document (this is what ticket B3 exists to fix).
 *
 * Every transform below matches an exact, verbatim slice of the master's
 * `word/document.xml` and throws if that slice isn't found exactly once, so
 * a future revision of the master can't silently drift out of sync with this
 * script. After all transforms run, a final guard scans the whole document
 * for any surviving `{{...}}` tag and fails the build if it isn't a known,
 * field-shaped tag (real fields are `UPPER_SNAKE_CASE`; leaked instruction
 * notes read like English sentences and are rejected by the same check).
 *
 * Run with: node scripts/build-will-template.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE_PATH = join(
	ROOT,
	'static/templates/source/Islamic_Will_Template_TX_v2_1.docx',
);
const OUTPUT_PATH = join(ROOT, 'static/templates/texas_freewill_v2.docx');
const DOC_XML_PATH = 'word/document.xml';

// ── XML build helpers ────────────────────────────────────────────────────

function escapeXml(text) {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FONT_RFONTS =
	'<w:rFonts w:ascii="Georgia" w:cs="Georgia" w:eastAsia="Georgia" w:hAnsi="Georgia"/>';
/** Bold, brand-brown run — the master's styling for merge-field text. */
const FIELD_RPR = `<w:rPr>${FONT_RFONTS}<w:b/><w:bCs/><w:color w:val="8B3A0F"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>`;
/** Regular body-text run. */
const BODY_RPR = `<w:rPr>${FONT_RFONTS}<w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>`;

function run(text, { bold = false } = {}) {
	const rPr = bold ? FIELD_RPR : BODY_RPR;
	return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

/**
 * A paragraph whose only content is a loop/section delimiter tag. When the
 * opening and closing tags of a docxtemplater section are each alone in
 * their own paragraph, `paragraphLoop: true` removes both delimiter
 * paragraphs from the rendered output and repeats (or drops) everything
 * between them — this is how a boolean-gated table or multi-paragraph block
 * is hidden without leaving a blank line behind.
 */
function tagParagraph(tag) {
	return `<w:p><w:pPr><w:spacing w:after="0" w:before="0"/></w:pPr>${run(tag)}</w:p>`;
}

function replaceOnce(xml, oldStr, newStr, label) {
	const occurrences = xml.split(oldStr).length - 1;
	if (occurrences !== 1) {
		throw new Error(
			`[build-will-template] Expected exactly 1 occurrence of "${label}", found ${occurrences}. ` +
				`The master template has likely changed — re-verify this anchor against the new XML.`,
		);
	}
	return xml.replace(oldStr, newStr);
}

function insertBefore(xml, anchorStr, insertion, label) {
	return replaceOnce(xml, anchorStr, insertion + anchorStr, `insert-before:${label}`);
}

function insertAfter(xml, anchorStr, insertion, label) {
	return replaceOnce(xml, anchorStr, anchorStr + insertion, `insert-after:${label}`);
}

// ── Transform 1: parents line — collapse the two "{{(deceased) if applicable}}"
//    generator notes into real FATHER_NAME_AND_STATUS / MOTHER_NAME_AND_STATUS
//    fields. Rebuilt as a fresh paragraph rather than patched in place. ──────

const PARENTS_PARAGRAPH_OLD =
	'<w:p><w:pPr><w:spacing w:after="160" w:line="276"/></w:pPr>' +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">My parents are: </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{FATHER_FULL_LEGAL_NAME}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve"> </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{(deceased) if applicable}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve"> and </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{MOTHER_FULL_LEGAL_NAME}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve"> </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{(deceased) if applicable}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">.</w:t></w:r>` +
	'</w:p>';

const PARENTS_PARAGRAPH_NEW =
	'<w:p><w:pPr><w:spacing w:after="160" w:line="276"/></w:pPr>' +
	run('My parents are: ') +
	run('{{FATHER_NAME_AND_STATUS}}', { bold: true }) +
	run(' and ') +
	run('{{MOTHER_NAME_AND_STATUS}}', { bold: true }) +
	run('.') +
	'</w:p>';

// ── Transform 2: three numbered executor paragraphs → one looped paragraph ──

const EXECUTORS_BLOCK_OLD =
	'<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr><w:spacing w:after="110" w:line="276"/></w:pPr>' +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{EXECUTOR_1_FULL_LEGAL_NAME}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">, my </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{EXECUTOR_1_RELATIONSHIP}}</w:t></w:r>` +
	'</w:p>' +
	'<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr><w:spacing w:after="110" w:line="276"/></w:pPr>' +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{EXECUTOR_2_FULL_LEGAL_NAME}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">, my </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{EXECUTOR_2_RELATIONSHIP}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">  </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{omit block if none}}</w:t></w:r>` +
	'</w:p>' +
	'<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr><w:spacing w:after="110" w:line="276"/></w:pPr>' +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{EXECUTOR_3_FULL_LEGAL_NAME}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">, my </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{EXECUTOR_3_RELATIONSHIP}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">  </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{omit block if none}}</w:t></w:r>` +
	'</w:p>';

// The loop's opening and closing tags must each be alone in their own
// paragraph for docxtemplater's paragraphLoop to repeat the *paragraph in
// between* (including its numPr, so Word's list numbering keeps working).
// Putting both tags inside one paragraph — the more "obvious" approach —
// only repeats the inline text between them and leaves the surrounding
// paragraph and its list numbering untouched, which is not what we want.
const EXECUTORS_BLOCK_NEW =
	tagParagraph('{{#EXECUTORS}}') +
	'<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr><w:spacing w:after="110" w:line="276"/></w:pPr>' +
	run('{{FULL_LEGAL_NAME}}', { bold: true }) +
	run(', my ') +
	run('{{RELATIONSHIP}}', { bold: true }) +
	'</w:p>' +
	tagParagraph('{{/EXECUTORS}}');

// ── Transform 3: wasiyyah table — gate + row loop ───────────────────────────

const WASIYYAH_TABLE_HEADER =
	'<w:tbl><w:tblPr><w:tblW w:type="dxa" w:w="9360"/><w:tblBorders><w:top w:val="single" w:color="auto" w:sz="4"/><w:left w:val="single" w:color="auto" w:sz="4"/><w:bottom w:val="single" w:color="auto" w:sz="4"/><w:right w:val="single" w:color="auto" w:sz="4"/><w:insideH w:val="single" w:color="auto" w:sz="4"/><w:insideV w:val="single" w:color="auto" w:sz="4"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3500"/><w:gridCol w:w="1600"/><w:gridCol w:w="2130"/><w:gridCol w:w="2130"/></w:tblGrid>';

const WASIYYAH_ORG_NAME_CELL_TEXT = '<w:t xml:space="preserve">{{WASIYYAH_ORG_NAME}}</w:t>';
const WASIYYAH_NOTES_CELL_TEXT = '<w:t xml:space="preserve">{{NOTES}}</w:t>';

const WASIYYAH_INSTRUCTION_PARAGRAPH_OLD =
	'<w:p><w:pPr><w:spacing w:after="160" w:before="120"/></w:pPr>' +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{Render one row per recipient. Render no empty rows. If the user chose no wasiyyah, render the sentence \u201CI make no wasiyyah gifts under this Will.\u201D instead of the table.}}</w:t></w:r>` +
	'</w:p>';

const WASIYYAH_FALLBACK_PARAGRAPH_NEW =
	'<w:p><w:pPr><w:spacing w:after="160" w:before="120"/></w:pPr>' +
	run('{{^HAS_WASIYYAH}}I make no wasiyyah gifts under this Will.{{/HAS_WASIYYAH}}') +
	'</w:p>';

// ── Transform 4: Islamic Inheritance Schedule (Appendix A) — row loop ──────

const HEIR_NAME_CELL_TEXT = '<w:t xml:space="preserve">{{HEIR_FULL_LEGAL_NAME}}</w:t>';
const HEIR_PERCENT_CELL_TEXT = '<w:t xml:space="preserve">{{PERCENT}}</w:t>';

const HEIRS_INSTRUCTION_PARAGRAPH_OLD =
	'<w:p><w:pPr><w:spacing w:after="160" w:before="120"/></w:pPr>' +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{Render one row per heir from the confirmed calculation. Never render empty rows. Percentages must sum to 100% after wasiyyah; fractions shown as calculated (e.g., 1/8, 7/12, 7/24).}}</w:t></w:r>` +
	'</w:p>';

// ── Transform 5: minor children / guardian section ─────────────────────────

const MINOR_CHILDREN_HEADING =
	'<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:after="140" w:before="280"/></w:pPr>' +
	`<w:r><w:rPr>${FONT_RFONTS}<w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve">8. Minor Children and Guardian Nomination</w:t></w:r>` +
	'</w:p>';

const GUARDIAN_PARAGRAPH_OLD =
	'<w:p><w:pPr><w:spacing w:after="160" w:line="276"/></w:pPr>' +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">If I am the surviving parent or if a court determines that a guardian is needed for any minor child of mine, I nominate </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{GUARDIAN_1_FULL_LEGAL_NAME}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">, my </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{GUARDIAN_1_RELATIONSHIP}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">, as guardian of the person of my minor child or children. If that person cannot serve, I nominate </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{GUARDIAN_2_FULL_LEGAL_NAME}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">, my </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{GUARDIAN_2_RELATIONSHIP}}</w:t></w:r>` +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">. </w:t></w:r>` +
	`<w:r>${FIELD_RPR}<w:t xml:space="preserve">{{Render section only if user reported minor children; omit second sentence if no second guardian.}}</w:t></w:r>` +
	'</w:p>';

const GUARDIAN_PARAGRAPH_NEW =
	'<w:p><w:pPr><w:spacing w:after="160" w:line="276"/></w:pPr>' +
	run('If I am the surviving parent or if a court determines that a guardian is needed for any minor child of mine, I nominate ') +
	run('{{GUARDIAN_1_FULL_LEGAL_NAME}}', { bold: true }) +
	run(', my ') +
	run('{{GUARDIAN_1_RELATIONSHIP}}', { bold: true }) +
	run(', as guardian of the person of my minor child or children. ') +
	run('{{#GUARDIAN_2}}If that person cannot serve, I nominate ') +
	run('{{GUARDIAN_2_FULL_LEGAL_NAME}}', { bold: true }) +
	run(', my ') +
	run('{{GUARDIAN_2_RELATIONSHIP}}', { bold: true }) +
	run('.{{/GUARDIAN_2}}') +
	'</w:p>';

const RAISE_AS_MUSLIMS_PARAGRAPH =
	'<w:p><w:pPr><w:spacing w:after="160" w:line="276"/></w:pPr>' +
	`<w:r>${BODY_RPR}<w:t xml:space="preserve">I request that any guardian raise my children as Muslims, maintain their connection to the Muslim community, preserve family relationships, and consider Islamic education, Arabic/Qur&apos;an education, and halal food and lifestyle needs.</w:t></w:r>` +
	'</w:p>';

// ── Run all transforms ───────────────────────────────────────────────────

function transform(xml) {
	xml = replaceOnce(xml, PARENTS_PARAGRAPH_OLD, PARENTS_PARAGRAPH_NEW, 'parents-line');

	xml = replaceOnce(xml, EXECUTORS_BLOCK_OLD, EXECUTORS_BLOCK_NEW, 'executors-block');

	// Wasiyyah: gate the table with HAS_WASIYYAH, loop the data row with
	// WASIYYAH, then replace the leaked instruction note with the inverted
	// fallback sentence.
	xml = insertBefore(xml, WASIYYAH_TABLE_HEADER, tagParagraph('{{#HAS_WASIYYAH}}'), 'wasiyyah-table-open');
	xml = replaceOnce(
		xml,
		WASIYYAH_ORG_NAME_CELL_TEXT,
		'<w:t xml:space="preserve">{{#WASIYYAH}}{{WASIYYAH_ORG_NAME}}</w:t>',
		'wasiyyah-row-loop-open',
	);
	xml = replaceOnce(
		xml,
		WASIYYAH_NOTES_CELL_TEXT,
		'<w:t xml:space="preserve">{{NOTES}}{{/WASIYYAH}}</w:t>',
		'wasiyyah-row-loop-close',
	);
	// The table's closing </w:tbl> is unique enough right after the row loop
	// close was inserted immediately before it via the NOTES cell edit; anchor
	// on the literal wasiyyah instruction paragraph instead, which always
	// follows the table directly in the master.
	xml = insertBefore(
		xml,
		WASIYYAH_INSTRUCTION_PARAGRAPH_OLD,
		tagParagraph('{{/HAS_WASIYYAH}}'),
		'wasiyyah-table-close',
	);
	xml = replaceOnce(
		xml,
		WASIYYAH_INSTRUCTION_PARAGRAPH_OLD,
		WASIYYAH_FALLBACK_PARAGRAPH_NEW,
		'wasiyyah-instruction-note',
	);

	// Islamic Inheritance Schedule: loop the data row, delete the instruction note.
	xml = replaceOnce(
		xml,
		HEIR_NAME_CELL_TEXT,
		'<w:t xml:space="preserve">{{#HEIRS}}{{HEIR_FULL_LEGAL_NAME}}</w:t>',
		'heirs-row-loop-open',
	);
	xml = replaceOnce(
		xml,
		HEIR_PERCENT_CELL_TEXT,
		'<w:t xml:space="preserve">{{PERCENT}}{{/HEIRS}}</w:t>',
		'heirs-row-loop-close',
	);
	xml = replaceOnce(xml, HEIRS_INSTRUCTION_PARAGRAPH_OLD, '', 'heirs-instruction-note');

	// Minor children / guardians: gate the whole section, conditionalize the
	// second guardian sentence, drop the trailing instruction note.
	xml = insertBefore(xml, MINOR_CHILDREN_HEADING, tagParagraph('{{#HAS_MINOR_CHILDREN}}'), 'minor-children-open');
	xml = replaceOnce(xml, GUARDIAN_PARAGRAPH_OLD, GUARDIAN_PARAGRAPH_NEW, 'guardian-paragraph');
	xml = insertAfter(
		xml,
		RAISE_AS_MUSLIMS_PARAGRAPH,
		tagParagraph('{{/HAS_MINOR_CHILDREN}}'),
		'minor-children-close',
	);

	// Defense in depth: curly quotes inside {{ }} tags break the expression
	// parser (matches the fix already applied at render time for the v1
	// template in renderWill.ts).
	xml = xml.replace(/\{\{[^{}]+\}\}/g, (tag) => tag.replace(/[\u2018\u2019]/g, "'"));

	return xml;
}

// ── Guard: no unconverted instruction notes may survive ─────────────────────

/** Real field/section tags are UPPER_SNAKE_CASE, optionally prefixed with #, /, or ^. Instruction notes read like English sentences and fail this check. */
const ALLOWED_TAG_PATTERN = /^[#/^]?[A-Z][A-Z0-9_]*$/;

function assertNoLeakedInstructions(xml) {
	const tags = [...xml.matchAll(/\{\{([^{}]+)\}\}/g)].map((m) => m[1]);
	const offenders = tags.filter((tag) => !ALLOWED_TAG_PATTERN.test(tag));
	if (offenders.length > 0) {
		throw new Error(
			'[build-will-template] Found unconverted instruction note(s) or malformed tag(s) still in the document:\n' +
				offenders.map((t) => `  - {{${t}}}`).join('\n') +
				'\nThese must never print in a client document (ticket B3). Update the conversion script to handle them.',
		);
	}
	return tags;
}

// ── Entry point ──────────────────────────────────────────────────────────

function main() {
	if (!existsSync(SOURCE_PATH)) {
		throw new Error(`[build-will-template] Master template not found at ${SOURCE_PATH}`);
	}

	const raw = readFileSync(SOURCE_PATH);
	const zip = new PizZip(raw);

	const original = zip.file(DOC_XML_PATH)?.asText();
	if (!original) {
		throw new Error(`[build-will-template] ${SOURCE_PATH} is missing ${DOC_XML_PATH}`);
	}

	const converted = transform(original);
	const survivingTags = assertNoLeakedInstructions(converted);

	zip.file(DOC_XML_PATH, converted);
	const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
	writeFileSync(OUTPUT_PATH, buffer);

	console.log(`[build-will-template] Wrote ${OUTPUT_PATH}`);
	console.log(`[build-will-template] ${survivingTags.length} field/section tags remain, e.g.:`);
	console.log(
		[...new Set(survivingTags)]
			.slice(0, 12)
			.map((t) => `  {{${t}}}`)
			.join('\n'),
	);
}

main();
