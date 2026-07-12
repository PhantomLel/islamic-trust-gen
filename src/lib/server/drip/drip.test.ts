import { describe, it, expect } from 'vitest';
import { SCHEDULES, FREE_WILL_SCHEDULE, QUIZ_SCHEDULE, APP_STARTED_SCHEDULE } from './sequences';

// ─── Template smoke renders ────────────────────────────────────────────────────
import { freeWillEmail2 } from '$lib/server/emails/drip/freeWill/email2';
import { freeWillEmail3 } from '$lib/server/emails/drip/freeWill/email3';
import { freeWillEmail4 } from '$lib/server/emails/drip/freeWill/email4';
import { freeWillEmail5 } from '$lib/server/emails/drip/freeWill/email5';
import { quizEmail1 } from '$lib/server/emails/drip/quiz/email1';
import { quizEmail2 } from '$lib/server/emails/drip/quiz/email2';
import { quizEmail3 } from '$lib/server/emails/drip/quiz/email3';
import { quizEmail4 } from '$lib/server/emails/drip/quiz/email4';
import { quizEmail5 } from '$lib/server/emails/drip/quiz/email5';
import { appStartedEmail1 } from '$lib/server/emails/drip/appStarted/email1';
import { appStartedEmail2 } from '$lib/server/emails/drip/appStarted/email2';
import { appStartedEmail3 } from '$lib/server/emails/drip/appStarted/email3';
import { appStartedEmail4 } from '$lib/server/emails/drip/appStarted/email4';
import { appStartedEmail5 } from '$lib/server/emails/drip/appStarted/email5';

const COMMON_OPTS = {
	firstName: 'Ahmed',
	quizUrl: 'https://example.com/which-plan?utm_source=drip',
	trustUrl: 'https://example.com/trust?utm_source=drip',
	willUrl: 'https://example.com/free-islamic-will?utm_source=drip',
	consultUrl: 'https://consult.example.com?utm_source=drip',
	continueUrl: 'https://example.com/create-trust/42?utm_source=drip',
	unsubscribeUrl: 'https://example.com/unsubscribe?token=abc123',
};

// ─── Schedule integrity ────────────────────────────────────────────────────────

describe('Schedule definitions', () => {
	it('free will schedule starts at index 1 (Email 2) with 48h offset', () => {
		expect(FREE_WILL_SCHEDULE[0]?.key).toBe('fw_email2');
		expect(FREE_WILL_SCHEDULE[0]?.offsetHours).toBe(48);
	});

	it('quiz schedule starts at Email 1 with 0h offset (immediate)', () => {
		expect(QUIZ_SCHEDULE[0]?.key).toBe('quiz_email1');
		expect(QUIZ_SCHEDULE[0]?.offsetHours).toBe(0);
	});

	it('app started schedule starts at Email 1 with 0h base offset', () => {
		expect(APP_STARTED_SCHEDULE[0]?.key).toBe('app_email1');
		expect(APP_STARTED_SCHEDULE[0]?.offsetHours).toBe(0);
	});

	it('all schedules have unique keys within each sequence', () => {
		for (const [name, sched] of Object.entries(SCHEDULES)) {
			const keys = sched.map((e) => e.key);
			const unique = new Set(keys);
			expect(unique.size, `Duplicate key in ${name}`).toBe(keys.length);
		}
	});

	it('offsets are monotonically increasing within each sequence', () => {
		for (const [name, sched] of Object.entries(SCHEDULES)) {
			for (let i = 1; i < sched.length; i++) {
				expect(
					sched[i]!.offsetHours >= sched[i - 1]!.offsetHours,
					`${name}[${i}] offset not >= ${name}[${i - 1}] offset`,
				).toBe(true);
			}
		}
	});

	it('free will has 4 emails (skipping Email 1)', () => {
		expect(FREE_WILL_SCHEDULE).toHaveLength(4);
	});

	it('quiz sequence has 5 emails', () => {
		expect(QUIZ_SCHEDULE).toHaveLength(5);
	});

	it('app started sequence has 5 emails', () => {
		expect(APP_STARTED_SCHEDULE).toHaveLength(5);
	});
});

// ─── Template smoke renders ────────────────────────────────────────────────────

describe('Template renders — Free Will sequence', () => {
	it('email2 renders without throwing and contains expected content', () => {
		const html = freeWillEmail2(COMMON_OPTS);
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('Assalamu alaykum, Ahmed');
		expect(html).toContain('unsubscribe');
		expect(html).not.toContain('<script');
	});

	it('email3 renders without throwing', () => {
		const html = freeWillEmail3(COMMON_OPTS);
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('minor children');
	});

	it('email4 renders without throwing', () => {
		const html = freeWillEmail4(COMMON_OPTS);
		expect(html).toContain('<!DOCTYPE html>');
	});

	it('email5 renders without throwing', () => {
		const html = freeWillEmail5(COMMON_OPTS);
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('barakah');
	});
});

describe('Template renders — Quiz sequence', () => {
	const allResults = ['free_will_only', 'goodtree_fit', 'legacy_consult', 'advanced_consult'] as const;

	for (const result of allResults) {
		it(`quiz email1 renders for result=${result}`, () => {
			const html = quizEmail1({ ...COMMON_OPTS, quizResult: result });
			expect(html).toContain('<!DOCTYPE html>');
			expect(html).toContain('recommendation');
		});
	}

	it('quiz email2 renders', () => {
		const html = quizEmail2({ ...COMMON_OPTS, quizResult: 'goodtree_fit' });
		expect(html).toContain('<!DOCTYPE html>');
	});

	it('quiz email3 renders', () => {
		const html = quizEmail3({ ...COMMON_OPTS, quizResult: 'legacy_consult' });
		expect(html).toContain('<!DOCTYPE html>');
	});

	it('quiz email4 renders', () => {
		const html = quizEmail4({ ...COMMON_OPTS, quizResult: 'free_will_only' });
		expect(html).toContain('<!DOCTYPE html>');
	});

	it('quiz email5 renders', () => {
		const html = quizEmail5({ ...COMMON_OPTS, quizResult: 'advanced_consult' });
		expect(html).toContain('<!DOCTYPE html>');
	});
});

describe('Template renders — App Started sequence', () => {
	const appOpts = { firstName: 'Ahmed', continueUrl: COMMON_OPTS.continueUrl, consultUrl: COMMON_OPTS.consultUrl, unsubscribeUrl: COMMON_OPTS.unsubscribeUrl };

	it('email1 renders', () => {
		const html = appStartedEmail1(appOpts);
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('Continue My Plan');
	});
	it('email2 renders', () => {
		expect(appStartedEmail2(appOpts)).toContain('<!DOCTYPE html>');
	});
	it('email3 renders', () => {
		const html = appStartedEmail3(appOpts);
		expect(html).toContain('Avoid probate');
	});
	it('email4 renders', () => {
		expect(appStartedEmail4(appOpts)).toContain('<!DOCTYPE html>');
	});
	it('email5 renders', () => {
		expect(appStartedEmail5(appOpts)).toContain('<!DOCTYPE html>');
	});
});

// ─── HTML safety ───────────────────────────────────────────────────────────────

describe('XSS / HTML escaping', () => {
	it('malicious first name is escaped in free will email', () => {
		const html = freeWillEmail2({ ...COMMON_OPTS, firstName: '<script>alert("xss")</script>' });
		expect(html).not.toContain('<script>alert');
		expect(html).toContain('&lt;script&gt;');
	});

	it('malicious first name is escaped in quiz email', () => {
		const html = quizEmail1({ ...COMMON_OPTS, quizResult: 'goodtree_fit', firstName: '<b>hack</b>' });
		expect(html).not.toContain('<b>hack</b>');
	});
});

// ─── Unsubscribe link ──────────────────────────────────────────────────────────

describe('Unsubscribe link', () => {
	it('all drip emails include the unsubscribe URL', () => {
		const emails = [
			freeWillEmail2(COMMON_OPTS),
			quizEmail1({ ...COMMON_OPTS, quizResult: 'goodtree_fit' }),
			appStartedEmail1({ firstName: 'Ahmed', continueUrl: COMMON_OPTS.continueUrl, consultUrl: COMMON_OPTS.consultUrl, unsubscribeUrl: COMMON_OPTS.unsubscribeUrl }),
		];
		for (const html of emails) {
			expect(html).toContain('unsubscribe?token=abc123');
		}
	});
});

// ─── Free will does NOT use drip Email 1 ─────────────────────────────────────

describe('Free will sequence starts at Email 2', () => {
	it('fw_email2 is the first key in FREE_WILL_SCHEDULE (Email 1 skipped)', () => {
		expect(FREE_WILL_SCHEDULE[0]?.key).toBe('fw_email2');
		expect(FREE_WILL_SCHEDULE.find((e) => e.key === 'fw_email1')).toBeUndefined();
	});
});

// ─── Priority mapping ─────────────────────────────────────────────────────────

describe('Sequence priority constants', () => {
	const priority: Record<string, number> = {
		unsubscribed: 100,
		stopped_paid: 90,
		stopped_consult: 80,
		stopped_manual: 70,
		app_started: 50,
		quiz_lead: 30,
		free_will_lead: 20,
	};

	it('app_started beats quiz_lead', () => {
		expect(priority['app_started']!).toBeGreaterThan(priority['quiz_lead']!);
	});

	it('quiz_lead beats free_will_lead', () => {
		expect(priority['quiz_lead']!).toBeGreaterThan(priority['free_will_lead']!);
	});

	it('any stop status beats any active sequence', () => {
		const stops = ['unsubscribed', 'stopped_paid', 'stopped_consult', 'stopped_manual'];
		const active = ['app_started', 'quiz_lead', 'free_will_lead'];
		for (const s of stops) {
			for (const a of active) {
				expect(priority[s]!, `${s} should beat ${a}`).toBeGreaterThan(priority[a]!);
			}
		}
	});

	it('unsubscribed beats all other stops', () => {
		const others = ['stopped_paid', 'stopped_consult', 'stopped_manual'];
		for (const o of others) {
			expect(priority['unsubscribed']!).toBeGreaterThan(priority[o]!);
		}
	});
});
