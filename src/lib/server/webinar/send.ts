import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { consultationBookingUrl } from '$lib/config';
import type { WebinarEmailKind } from '$lib/webinar/due';
import { formatWebinarWhen } from '$lib/webinar/time';
import { claimSend, releaseSend } from './db';
import { webinarEmail } from './emailBody';

type DeliveryWebinar = {
	id: number;
	title: string;
	startsAt: Date;
	durationMinutes: number;
	joinUrl: string;
};

type DeliveryRegistration = {
	id: number;
	email: string;
};

export async function deliverWebinarEmail(
	registration: DeliveryRegistration,
	session: DeliveryWebinar,
	kind: WebinarEmailKind,
): Promise<boolean> {
	if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
		console.warn(`[webinar] Missing RESEND_API_KEY or FROM_EMAIL — skipped ${kind} for registration ${registration.id}`);
		return false;
	}
	const claimed = await claimSend(registration.id, kind);
	if (!claimed) return false;

	const message = webinarEmail({
		kind,
		title: session.title,
		whenLabel: formatWebinarWhen(session.startsAt),
		joinUrl: session.joinUrl,
		consultUrl: consultationBookingUrl,
		uid: `webinar-${session.id}-${registration.id}@muslimlegacyplanning.com`,
		startsAt: session.startsAt,
		durationMinutes: session.durationMinutes,
	});

	try {
		const resend = new Resend(env.RESEND_API_KEY);
		const result = await resend.emails.send({
			from: env.FROM_EMAIL,
			to: registration.email,
			subject: message.subject,
			html: message.html,
			attachments: message.ics ? [{ filename: 'webinar.ics', content: Buffer.from(message.ics, 'utf8') }] : undefined,
		});
		if (result.error) {
			await releaseSend(registration.id, kind);
			console.error(`[webinar] ${kind} failed for registration ${registration.id}:`, result.error);
			return false;
		}
		return true;
	} catch (err) {
		await releaseSend(registration.id, kind);
		console.error(`[webinar] ${kind} failed for registration ${registration.id}:`, err);
		return false;
	}
}
