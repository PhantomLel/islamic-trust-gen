import { env } from '$env/dynamic/private';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - the expressions sub-path has no shipped types
import expressionParser from 'docxtemplater/expressions.js';
import { buildWillDocumentContext, type WillDocumentContext } from './buildWillContext';

/**
 * Per-state will templates. TX runs on the v2 pipeline (`static/templates/
 * texas_freewill_v2.docx`, built by `scripts/build-will-template.mjs` from
 * Leonard's `Islamic_Will_Template_TX_v2_1.docx` master) with `{{ }}`
 * delimiters and an UPPER_SNAKE_CASE data shape. CA has no v2 master yet and
 * stays on the original v1 template and single-brace delimiters until one is
 * supplied.
 */
type TemplateSpec = { file: string; version: 1 | 2 };

const STATE_TEMPLATES: Record<string, TemplateSpec> = {
	TX: { file: 'texas_freewill_v2.docx', version: 2 },
	CA: { file: 'california_freewill.docx', version: 1 },
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
 * Curly quotes inside template tags break both the Angular parser (v1, `{ }`)
 * and the expressions parser (v2, `{{ }}`) — swap them for straight quotes
 * before rendering. `tagPattern` selects the delimiter style to scan for.
 */
function fixCurlyQuotesInTags(xml: string, tagPattern: RegExp): string {
	return xml.replace(tagPattern, (tag) => tag.replace(/[\u2018\u2019]/g, "'"));
}

/**
 * Pre-render fixes applied directly to word/document.xml for the v1 (single
 * brace) templates, mirroring `renderJointTrust`:
 *
 * 1. Curly quotes inside `{...}` expression tags are swapped for straight quotes.
 * 2. The Texas v1 template has a stray `l` immediately after the `{/children}`
 *    closing tag (`{children}{/children}l`). Strip it so it doesn't leak into
 *    the rendered document.
 */
function preprocessXmlV1(xml: string): string {
	const tagsFixed = fixCurlyQuotesInTags(xml, /\{[^{}]+\}/g);
	return tagsFixed.replace(/\{\/children\}l/g, '{/children}');
}

/** Pre-render fix for the v2 (`{{ }}`) template — curly quotes only. */
function preprocessXmlV2(xml: string): string {
	return fixCurlyQuotesInTags(xml, /\{\{[^{}]+\}\}/g);
}

function safeFilenameFragment(s: string | null | undefined, fallback: string): string {
	const cleaned = (s ?? '')
		.trim()
		.replace(/[^A-Za-z0-9_-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
	return cleaned || fallback;
}

/**
 * Shape the resolved context into the exact object the v1 docx template
 * consumes. The template references `{date}`, `{guardians[0]}` /
 * `{guardians[1]}` (plain strings) and loops executors with
 * `{#executors}{fullName}{/executors}`, so we map the structured context
 * accordingly and drop empty executor slots.
 */
function toTemplateDataV1(ctx: WillDocumentContext) {
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
 * Shape the resolved context into the UPPER_SNAKE_CASE fields the v2 Texas
 * template consumes (see `scripts/build-will-template.mjs` for the tag
 * inventory). Executors with no name are dropped defensively; round 1 always
 * collects exactly 3, but the template loop already supports any count for
 * when ticket C1 makes the 2nd/3rd optional.
 */
function toTemplateDataV2(ctx: WillDocumentContext) {
	return {
		FULL_LEGAL_NAME: ctx.testatorName,
		GENERATION_DATE: ctx.willDate,
		STREET_ADDRESS: ctx.streetAddress,
		CITY: ctx.city,
		ZIP: ctx.zip,
		COUNTY: ctx.county,
		MARITAL_STATUS: ctx.maritalStatus,
		SPOUSE_FULL_LEGAL_NAME: ctx.spouseName,
		CHILDREN_FULL_LEGAL_NAMES_LIST: ctx.children,
		FATHER_NAME_AND_STATUS: ctx.fatherNameAndStatus,
		MOTHER_NAME_AND_STATUS: ctx.motherNameAndStatus,

		EXECUTORS: ctx.executors
			.filter((e) => e.fullName.trim().length > 0)
			.map((e) => ({
				FULL_LEGAL_NAME: e.fullName.trim(),
				RELATIONSHIP: e.relationship.trim(),
			})),

		HAS_WASIYYAH: ctx.hasWasiyyah,
		WASIYYAH: ctx.wasiyyahV2.map((w) => ({
			WASIYYAH_ORG_NAME: w.orgName,
			PCT: w.percent,
			EIN: w.ein,
			NOTES: w.notes,
		})),

		HAS_MINOR_CHILDREN: ctx.hasMinorChildren,
		GUARDIAN_1_FULL_LEGAL_NAME: ctx.guardians[0]?.fullName.trim() ?? '',
		GUARDIAN_1_RELATIONSHIP: ctx.guardians[0]?.relationship.trim() ?? '',
		GUARDIAN_2: ctx.guardian2Present,
		GUARDIAN_2_FULL_LEGAL_NAME: ctx.guardians[1]?.fullName.trim() ?? '',
		GUARDIAN_2_RELATIONSHIP: ctx.guardians[1]?.relationship.trim() ?? '',

		HEIRS: ctx.heirsTableV2.map((h) => ({
			HEIR_FULL_LEGAL_NAME: h.name,
			RELATIONSHIP: h.relationship,
			FRACTION: h.fraction,
			PERCENT: h.percent,
		})),
	};
}

/**
 * Render the free Islamic will for a stored submission. Picks the template
 * (and tag dialect) for the testator's state, fills it from
 * `buildWillDocumentContext`, and returns the generated `.docx` buffer plus a
 * download-friendly filename.
 */
export async function renderFreeWill(will: FreeWillLike): Promise<RenderedDocument> {
	const data = buildWillDocumentContext({ id: will.id, responses: will.responses });

	const spec = STATE_TEMPLATES[data.stateCode];
	if (!spec) {
		throw new Error(
			`No will template available for state "${data.stateCode || 'unknown'}" yet.`,
		);
	}

	const response = await fetch(`${env.ORIGIN}/templates/${spec.file}`);
	if (!response.ok) {
		throw new Error(
			`Failed to load will template ${spec.file}: ${response.status} ${response.statusText}`,
		);
	}
	const raw = Buffer.from(await response.arrayBuffer());
	const zip = new PizZip(raw);

	const docXmlPath = 'word/document.xml';
	const original = zip.file(docXmlPath)?.asText();
	if (!original) throw new Error(`${spec.file} is missing word/document.xml`);

	const isV2 = spec.version === 2;
	zip.file(docXmlPath, isV2 ? preprocessXmlV2(original) : preprocessXmlV1(original));

	const doc = new Docxtemplater(zip, {
		paragraphLoop: true,
		linebreaks: true,
		parser: expressionParser,
		nullGetter: () => '',
		...(isV2 ? { delimiters: { start: '{{', end: '}}' } } : {}),
	});

	doc.render(isV2 ? toTemplateDataV2(data) : toTemplateDataV1(data));

	const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

	const userPart = safeFilenameFragment(data.testatorName || will.user?.name, 'will');
	const filename = `islamic-will-${userPart}-${will.id}.docx`;

	return { buffer, filename };
}
