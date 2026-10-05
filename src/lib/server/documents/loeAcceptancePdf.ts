import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import type { LoeAgreementData } from '$lib/loe';
import {
	buildAgreementText,
	loeCheckboxItems,
	segmentsToText,
	type Jurisdiction
} from '$lib/loeAgreement';

/**
 * The client's acceptance copy of the Limited-Scope App Engagement (Appendix A F3).
 *
 * It records the agreement text the client accepted, the server timestamp, the
 * checkboxes, and the date the client typed. It is NOT labeled as signed by the
 * Firm: no Firm countersignature exists (blocked by the plan).
 */

export type LoeAcceptancePdfInput = {
	clientName: string;
	clientEmail: string;
	trustId: number;
	jurisdiction: Jurisdiction;
	/** The matter's actual charge, as shown in the agreement the client accepted. */
	flatFeeUsd: number;
	/** Server-side acceptance time. */
	acceptedAt: Date;
	agreement: LoeAgreementData;
	/** Whether the "business owner continuing" variant of the checkbox text was shown. */
	businessOwnerContinuing: boolean;
};

const PAGE = { width: 612, height: 792, margin: 54 };

/** Keep the text inside WinAnsi, which the standard PDF fonts can encode. */
export function toWinAnsiSafe(text: string, font: PDFFont): string {
	let out = '';
	for (const ch of text) {
		try {
			font.encodeText(ch);
			out += ch;
		} catch {
			out += ch === '\u2192' ? '->' : '?';
		}
	}
	return out;
}

/** The plain-text lines of the document, in order, before layout. Exported so tests can assert on content. */
export function loeAcceptanceLines(input: LoeAcceptancePdfInput): { text: string; style: 'title' | 'h' | 'p' | 'li' }[] {
	const agreementText = buildAgreementText({
		jurisdiction: input.jurisdiction,
		flatFeeUsd: input.flatFeeUsd
	});
	const lines: { text: string; style: 'title' | 'h' | 'p' | 'li' }[] = [];
	lines.push({ text: 'Limited-Scope App Engagement', style: 'title' });
	lines.push({ text: agreementText.title, style: 'p' });
	lines.push({ text: 'Copy of the agreement as accepted by the client', style: 'h' });
	lines.push({ text: `Client: ${input.clientName} (${input.clientEmail})`, style: 'p' });
	lines.push({ text: `Matter: Trust #${input.trustId}`, style: 'p' });
	lines.push({ text: `Agreement version: ${input.agreement.version}`, style: 'p' });
	lines.push({ text: `Accepted electronically on: ${input.acceptedAt.toISOString()}`, style: 'p' });
	lines.push({ text: `Client browser timestamp: ${input.agreement.clientTimestamp}`, style: 'p' });
	lines.push({ text: `Date entered by client: ${input.agreement.userEnteredDate}`, style: 'p' });

	lines.push({ text: 'Agreement text', style: 'h' });
	lines.push({ text: agreementText.intro, style: 'p' });
	for (const s of agreementText.sections) {
		lines.push({ text: s.heading, style: 'h' });
		lines.push({ text: s.body, style: 'p' });
	}
	lines.push({ text: agreementText.flatFee.heading, style: 'h' });
	lines.push({ text: agreementText.flatFee.body, style: 'p' });

	if (agreementText.scheduleA) {
		const a = agreementText.scheduleA;
		lines.push({ text: a.title, style: 'h' });
		lines.push({ text: a.intro, style: 'p' });
		lines.push({ text: 'Included', style: 'h' });
		a.included.forEach((t, i) => lines.push({ text: `${i + 1}. ${t}`, style: 'li' }));
		lines.push({ text: 'Not included', style: 'h' });
		lines.push({ text: a.excludedHeading, style: 'p' });
		a.excluded.forEach((t, i) => lines.push({ text: `${i + 1}. ${t}`, style: 'li' }));
		lines.push({ text: a.optionalHeading, style: 'h' });
		lines.push({ text: `${a.optional.service} ${a.optional.fee}`, style: 'p' });
	}
	if (agreementText.californiaClause) {
		const c = agreementText.californiaClause;
		lines.push({ text: `${c.heading} ${c.body}`, style: 'p' });
		lines.push({ text: c.closing, style: 'p' });
	}

	lines.push({ text: 'Confirmations made by the client', style: 'h' });
	for (const item of loeCheckboxItems({ businessOwnerContinuing: input.businessOwnerContinuing })) {
		const checked = input.agreement.checkboxes[item.key] === true;
		lines.push({ text: `[${checked ? 'x' : ' '}] ${segmentsToText(item.segments)}`, style: 'li' });
	}
	lines.push({ text: agreementText.electronicSignature, style: 'p' });
	return lines;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	const out: string[] = [];
	let current = '';
	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
			current = candidate;
		} else {
			if (current) out.push(current);
			current = word;
		}
	}
	if (current) out.push(current);
	return out;
}

export async function renderLoeAcceptancePdf(input: LoeAcceptancePdfInput): Promise<Buffer> {
	const pdf = await PDFDocument.create();
	pdf.setTitle('Limited-Scope App Engagement — client acceptance copy');
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

	let page = pdf.addPage([PAGE.width, PAGE.height]);
	let y = PAGE.height - PAGE.margin;
	const maxWidth = PAGE.width - PAGE.margin * 2;

	for (const line of loeAcceptanceLines(input)) {
		const isTitle = line.style === 'title';
		const isHeading = line.style === 'h';
		const font = isTitle || isHeading ? bold : regular;
		const size = isTitle ? 16 : isHeading ? 11 : 10;
		const indent = line.style === 'li' ? 14 : 0;
		const leading = size + 4;
		if (isHeading || isTitle) y -= 6;
		const wrapped = wrap(toWinAnsiSafe(line.text, font), font, size, maxWidth - indent);
		for (const w of wrapped) {
			if (y - leading < PAGE.margin) {
				page = pdf.addPage([PAGE.width, PAGE.height]);
				y = PAGE.height - PAGE.margin;
			}
			page.drawText(w, { x: PAGE.margin + indent, y: y - size, size, font, color: rgb(0.12, 0.16, 0.2) });
			y -= leading;
		}
		y -= isHeading ? 2 : 4;
	}

	return Buffer.from(await pdf.save());
}
