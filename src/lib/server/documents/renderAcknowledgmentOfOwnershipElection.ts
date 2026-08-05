import PizZip from 'pizzip';
import {
	buildSigningDocumentsContext,
	type SigningDocumentsContext,
} from './buildSigningDocumentsContext';
import {
	assertNoUnmergedDocxTags,
	extractPlainTextFromDocxXml,
	type RenderedDocument,
	renderDocxTemplate,
	safeFilenameFragment,
} from './renderDocx';

const TEMPLATE = 'acknowledgment_of_islamic_ownership_election.docx';

const SECTION_ONE_HEBA =
	'We have elected the Mutual Heba method under Article Three, Section C-1 of our Trust.';
const SECTION_ONE_ASSET =
	'We have elected the Asset Allocation Declaration method under Article Three, Section C-2 of our Trust, as set out in Schedule A.';
const SECTION_TWO_HEBA =
	'Under Islamic law, each of us makes a heba — a lifetime gift — of one-half of our interest in all community property to the other.';
const SECTION_TWO_ASSET =
	'Each of us has declared what we believe we Islamically own, as recorded in Schedule A.';

const DRAFTING_NOTE_MARKERS = [
	'DRAFT TEMPLATE',
	'ATTORNEY REVIEW REQUIRED',
	'generated 2026-07-18 from the firm',
];

type TrustLike = Parameters<typeof buildSigningDocumentsContext>[0] & {
	id: number;
	user?: { name?: string | null } | null;
};

/** Hard failure when both or mismatched Article Three election variants appear. */
export function assertOwnershipElectionSections(text: string, isHeba: boolean): void {
	const hasHebaS1 = text.includes(SECTION_ONE_HEBA);
	const hasAssetS1 = text.includes(SECTION_ONE_ASSET);
	const hasHebaS2 = text.includes(SECTION_TWO_HEBA);
	const hasAssetS2 = text.includes(SECTION_TWO_ASSET);

	if (hasHebaS1 && hasAssetS1) {
		throw new Error('Acknowledgment Section 1 emitted both C-1 and C-2 variants');
	}
	if (hasHebaS2 && hasAssetS2) {
		throw new Error('Acknowledgment Section 2 emitted both C-1 and C-2 variants');
	}
	if (hasHebaS1 !== hasHebaS2) {
		throw new Error('Acknowledgment Sections 1 and 2 have mismatched election variants');
	}
	if (hasAssetS1 !== hasAssetS2) {
		throw new Error('Acknowledgment Sections 1 and 2 have mismatched election variants');
	}

	if (isHeba) {
		if (!hasHebaS1 || !hasHebaS2) {
			throw new Error('Acknowledgment missing expected C-1 (heba) content for heba election');
		}
		if (hasAssetS1 || hasAssetS2) {
			throw new Error('Acknowledgment emitted C-2 content for heba election');
		}
	} else {
		if (!hasAssetS1 || !hasAssetS2) {
			throw new Error(
				'Acknowledgment missing expected C-2 (asset allocation) content for assets election',
			);
		}
		if (hasHebaS1 || hasHebaS2) {
			throw new Error('Acknowledgment emitted C-1 content for asset allocation election');
		}
	}
}

export function validateAcknowledgmentOutput(xml: string, ctx: SigningDocumentsContext): string {
	assertNoUnmergedDocxTags(xml);
	const text = extractPlainTextFromDocxXml(xml);
	assertOwnershipElectionSections(text, ctx.isHeba);

	for (const marker of DRAFTING_NOTE_MARKERS) {
		if (text.includes(marker)) {
			throw new Error(`Acknowledgment output contains drafting note: ${marker}`);
		}
	}

	return text;
}

export async function renderAcknowledgmentOfOwnershipElection(
	trust: TrustLike,
): Promise<RenderedDocument> {
	const data = buildSigningDocumentsContext(trust);
	const buffer = await renderDocxTemplate(TEMPLATE, data);

	const zip = new PizZip(buffer);
	const xml = zip.file('word/document.xml')!.asText();
	validateAcknowledgmentOutput(xml, data);

	const userPart = safeFilenameFragment(trust.user?.name, 'client');
	const filename = `acknowledgment-islamic-ownership-election-${userPart}-${trust.id}.docx`;

	return { buffer, filename };
}
