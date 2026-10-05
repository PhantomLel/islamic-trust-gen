import { Resend } from 'resend';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { trust, user } from '$lib/server/db/schema';
import type { LoeAgreementData } from '$lib/loe';
import { defaultPrepFee, siteName } from '$lib/config';
import { normalizeJurisdiction } from '$lib/loeAgreement';
import { renderLoeAcceptancePdf } from './loeAcceptancePdf';
import { saveGeneratedFile } from './storage';

export const LOE_ACCEPTANCE_KIND = 'loe-acceptance-copy';

/**
 * On acceptance: render the client's acceptance copy, store it on the matter via the
 * existing document storage, and email it to the client (Appendix A F3). Never throws,
 * so a PDF or mail failure cannot block the client from continuing.
 */
export async function sendLoeAcceptanceCopy(opts: {
	trustId: number;
	userId: string;
	acceptedAt: Date;
	agreement: LoeAgreementData;
	businessOwnerContinuing: boolean;
}): Promise<void> {
	try {
		const row = await db.query.trust.findFirst({
			where: eq(trust.id, opts.trustId),
			columns: { customPrice: true, jurisdiction: true },
		});
		const client = await db.query.user.findFirst({
			where: eq(user.id, opts.userId),
			columns: { name: true, email: true },
		});
		if (!row || !client) return;

		const buffer = await renderLoeAcceptancePdf({
			clientName: client.name,
			clientEmail: client.email,
			trustId: opts.trustId,
			jurisdiction: normalizeJurisdiction(row.jurisdiction),
			flatFeeUsd: row.customPrice ?? defaultPrepFee,
			acceptedAt: opts.acceptedAt,
			agreement: opts.agreement,
			businessOwnerContinuing: opts.businessOwnerContinuing,
		});
		const filename = `engagement-agreement-acceptance-trust-${opts.trustId}.pdf`;

		await saveGeneratedFile({
			trustId: opts.trustId,
			kind: LOE_ACCEPTANCE_KIND,
			buffer,
			filename,
			mime: 'application/pdf',
		});

		if (env.RESEND_API_KEY && env.FROM_EMAIL && client.email) {
			const resend = new Resend(env.RESEND_API_KEY);
			await resend.emails.send({
				from: env.FROM_EMAIL,
				to: client.email,
				subject: `Your copy of the engagement agreement — ${siteName}`,
				html: `<p>Attached is a copy of the engagement agreement you accepted on ${opts.acceptedAt.toISOString()}, including the checkboxes you confirmed and the date you entered.</p>`,
				attachments: [{ filename, content: buffer }],
			});
		}
	} catch (err) {
		console.error('[loe-acceptance] Failed to create or send acceptance copy', err);
	}
}
