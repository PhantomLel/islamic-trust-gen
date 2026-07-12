/** Schedule offsets and metadata for all three drip sequences. */

export type SequenceName = 'free_will_lead' | 'quiz_lead' | 'app_started';

export type EmailMeta = {
	/** Human-readable key, unique within the sequence. */
	key: string;
	/** Offset in hours from enrollment time (Email 1 of the sequence). */
	offsetHours: number;
	subject: string;
};

/** Free Will Lead — starts at Email 2 (Email 1 = transactional freeWillReady). */
export const FREE_WILL_SCHEDULE: EmailMeta[] = [
	{ key: 'fw_email2', offsetHours: 48,   subject: 'The part most families misunderstand about wills' },
	{ key: 'fw_email3', offsetHours: 120,  subject: 'If you have minor children, read this carefully' },
	{ key: 'fw_email4', offsetHours: 216,  subject: 'Will, trust, or attorney consult - which path fits you?' },
	{ key: 'fw_email5', offsetHours: 336,  subject: 'Do not leave this half-finished' },
];

/** Quiz Lead — Email 1 sent immediately; subsequent emails from time-of-Email-1. */
export const QUIZ_SCHEDULE: EmailMeta[] = [
	{ key: 'quiz_email1', offsetHours: 0,   subject: 'Your Islamic estate planning recommendation' },
	{ key: 'quiz_email2', offsetHours: 48,  subject: 'Why the right estate plan depends on your facts' },
	{ key: 'quiz_email3', offsetHours: 120, subject: 'The biggest mistake is choosing based only on price' },
	{ key: 'quiz_email4', offsetHours: 216, subject: 'What happens if you move forward?' },
	{ key: 'quiz_email5', offsetHours: 336, subject: 'Your quiz result is still waiting' },
];

/**
 * App Started — Email 1 at +2h (intake started) or +4h (bare account).
 * Subsequent offset measured from Email 1 send time.
 */
export const APP_STARTED_SCHEDULE: EmailMeta[] = [
	{ key: 'app_email1', offsetHours: 0,   subject: 'You started your Islamic estate plan - continue here' },
	{ key: 'app_email2', offsetHours: 24,  subject: 'What happens after you finish GoodTree?' },
	{ key: 'app_email3', offsetHours: 72,  subject: 'The plan you almost finished is not protecting anyone yet' },
	{ key: 'app_email4', offsetHours: 168, subject: 'Still deciding? Here is the honest GoodTree vs consult test' },
	{ key: 'app_email5', offsetHours: 288, subject: 'Last reminder for now: finish or get guidance' },
];

export const SCHEDULES: Record<SequenceName, EmailMeta[]> = {
	free_will_lead: FREE_WILL_SCHEDULE,
	quiz_lead: QUIZ_SCHEDULE,
	app_started: APP_STARTED_SCHEDULE,
};

/** How many hours after abandonment the app-started Email 1 fires. */
export const APP_ABANDONMENT_DELAY_INTAKE_HOURS = 2;
export const APP_ABANDONMENT_DELAY_BARE_ACCOUNT_HOURS = 4;
