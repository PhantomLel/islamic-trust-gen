export const WEBINAR_EMAIL_KINDS = ['confirmation', 'reminder_24h', 'reminder_1h', 'followup'] as const;
export type WebinarEmailKind = (typeof WEBINAR_EMAIL_KINDS)[number];

export type DueRegistration = {
	confirmationSentAt: Date | null;
	reminder24hSentAt: Date | null;
	reminder1hSentAt: Date | null;
	followupSentAt: Date | null;
};

export type DueWebinar = {
	startsAt: Date;
	durationMinutes: number;
};

const HOUR = 60 * 60 * 1000;

/**
 * Which service emails are due at `now`.
 * 24-hour reminder: [start − 24h, start − 1h).
 * 1-hour reminder: [start − 1h, start).
 * Follow-up: at or after start + duration.
 * A kind whose `*_sent_at` is set is never returned.
 */
export function dueEmails(registration: DueRegistration, webinar: DueWebinar, now: Date): WebinarEmailKind[] {
	const start = webinar.startsAt.getTime();
	const end = start + webinar.durationMinutes * 60 * 1000;
	const t = now.getTime();
	const due: WebinarEmailKind[] = [];
	if (!registration.confirmationSentAt) due.push('confirmation');
	if (!registration.reminder24hSentAt && t >= start - 24 * HOUR && t < start - HOUR) due.push('reminder_24h');
	if (!registration.reminder1hSentAt && t >= start - HOUR && t < start) due.push('reminder_1h');
	if (!registration.followupSentAt && t >= end) due.push('followup');
	return due;
}
