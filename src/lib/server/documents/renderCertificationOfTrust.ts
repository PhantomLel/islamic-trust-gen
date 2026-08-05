import PizZip from 'pizzip';
import { buildSigningDocumentsContext } from './buildSigningDocumentsContext';
import { formatTrustTitleForm } from './trustDocumentConstants';
import {
	assertNoUnmergedDocxTags,
	extractPlainTextFromDocxXml,
	type RenderedDocument,
	renderDocxTemplate,
	safeFilenameFragment,
} from './renderDocx';

const TEMPLATE = 'certification_of_trust.docx';

/** SSN must never appear in client output — Section 7 is completed at signing. */
const SSN_PATTERNS = [/\b\d{3}-\d{2}-\d{4}\b/, /\b\d{9}\b/];

type TrustLike = Parameters<typeof buildSigningDocumentsContext>[0] & {
	id: number;
	user?: { name?: string | null } | null;
};

export function validateCertificationOutput(
	xml: string,
	ctx: ReturnType<typeof buildSigningDocumentsContext>,
): string {
	assertNoUnmergedDocxTags(xml);
	const text = extractPlainTextFromDocxXml(xml);

	for (const pattern of SSN_PATTERNS) {
		if (pattern.test(text)) {
			throw new Error('Certification of Trust must not contain a Social Security Number');
		}
	}

	const expectedTitleForm = formatTrustTitleForm(
		ctx.husbandFullName,
		ctx.wifeFullName,
		ctx.trustName,
	);
	if (!text.includes(expectedTitleForm)) {
		throw new Error('Certification Section 8 title form does not match Article One §A');
	}

	if (text.includes('executed on {') || text.includes('execution_date')) {
		throw new Error('Certification still contains an execution_date placeholder');
	}

	return text;
}

export async function renderCertificationOfTrust(trust: TrustLike): Promise<RenderedDocument> {
	const data = buildSigningDocumentsContext(trust);
	const buffer = await renderDocxTemplate(TEMPLATE, data);

	const zip = new PizZip(buffer);
	const xml = zip.file('word/document.xml')!.asText();
	validateCertificationOutput(xml, data);

	const userPart = safeFilenameFragment(trust.user?.name, 'client');
	const filename = `certification-of-trust-${userPart}-${trust.id}.docx`;

	return { buffer, filename };
}
