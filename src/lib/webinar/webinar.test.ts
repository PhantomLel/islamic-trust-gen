import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { firmLegalServiceId, formatFirmNapLine, consultationBookingUrl } from '$lib/config';
import { sitemapRoutes } from '$lib/seo';
import { jsonLdScript } from '$lib/seo';
import { WEBINAR_DISCLOSURE, WEBINAR_EMPTY, WEBINAR_OPT_IN_LABEL } from '$lib/webinar/copy';
import { dueEmails, type DueRegistration } from '$lib/webinar/due';
import { webinarEventJsonLd } from '$lib/webinar/eventJsonLd';
import { buildWebinarIcs } from '$lib/webinar/ics';
import { isZoomJoinUrl } from '$lib/webinar/joinUrl';
import { toPublicWebinar } from '$lib/webinar/public';
import { registerForWebinar, type RegistrationStore } from '$lib/webinar/register';
import { chicagoWallToUtc } from '$lib/webinar/time';
import { webinarEmail } from '$lib/server/webinar/emailBody';
import { demoSeedRefusal } from '../../../scripts/demo-seed-guard.mjs';
import Page from '../../routes/webinar/+page.svelte';

const JOIN = 'https://us02web.zoom.us/j/99911122233?pwd=secret';
const START = new Date('2026-11-19T23:00:00.000Z');
const HOUR = 60 * 60 * 1000;

const blank = (): DueRegistration => ({
	confirmationSentAt: null,
	reminder24hSentAt: null,
	reminder1hSentAt: null,
	followupSentAt: null,
});

function at(offsetMs: number): Date {
	return new Date(START.getTime() + offsetMs);
}

describe('dueEmails', () => {
	const webinar = { startsAt: START, durationMinutes: 60 };

	it('returns each kind only inside its window', () => {
		expect(dueEmails(blank(), webinar, at(-24 * HOUR - 1))).toEqual(['confirmation']);
		expect(dueEmails(blank(), webinar, at(-24 * HOUR))).toEqual(['confirmation', 'reminder_24h']);
		expect(dueEmails(blank(), webinar, at(-HOUR - 1))).toEqual(['confirmation', 'reminder_24h']);
		expect(dueEmails(blank(), webinar, at(-HOUR))).toEqual(['confirmation', 'reminder_1h']);
		expect(dueEmails(blank(), webinar, at(-1))).toEqual(['confirmation', 'reminder_1h']);
		expect(dueEmails(blank(), webinar, START)).toEqual(['confirmation']);
		expect(dueEmails(blank(), webinar, at(60 * 60 * 1000 - 1))).toEqual(['confirmation']);
		expect(dueEmails(blank(), webinar, at(60 * 60 * 1000))).toEqual(['confirmation', 'followup']);
	});

	it('never repeats a kind whose sent timestamp is set', () => {
		const sent = new Date('2026-11-01T00:00:00.000Z');
		expect(
			dueEmails(
				{
					confirmationSentAt: sent,
					reminder24hSentAt: sent,
					reminder1hSentAt: sent,
					followupSentAt: sent,
				},
				webinar,
				at(2 * HOUR),
			),
		).toEqual([]);
		expect(dueEmails({ ...blank(), reminder24hSentAt: sent }, webinar, at(-2 * HOUR))).toEqual(['confirmation']);
	});
});

describe('ics', () => {
	it('contains DTSTART, DTEND and URL', () => {
		const ics = buildWebinarIcs({
			uid: 'webinar-1@example.com',
			title: 'November session',
			startsAt: START,
			durationMinutes: 60,
			joinUrl: JOIN,
		});
		expect(ics).toContain('DTSTART:20261119T230000Z');
		expect(ics).toContain('DTEND:20261120T000000Z');
		expect(ics).toContain(`URL:${JOIN}`);
	});
});

describe('isZoomJoinUrl', () => {
	it('accepts https zoom.us join paths and rejects every other URL', () => {
		for (const url of [
			'https://zoom.us/j/123456789',
			'https://us02web.zoom.us/j/123456789?pwd=abc',
			'https://zoom.us/w/123',
			'https://zoom.us/s/123',
			'https://www.zoom.us/my/leonard',
			'https://zoom.us/wc/123/join',
		]) {
			expect(isZoomJoinUrl(url), url).toBe(true);
		}
		for (const url of [
			'http://zoom.us/j/123',
			'https://zoom.com/j/123',
			'https://zoomgov.com/j/123',
			'https://us02web.zoomgov.com/j/123',
			'https://bit.ly/abc',
			'https://notzoom.us/j/123',
			'https://zoom.us.evil.com/j/123',
			'https://evilzoom.us/j/123',
			'https://zoom.us/join/123',
			'https://zoom.us/j',
			'https://user:pass@zoom.us/j/123',
			'',
		]) {
			expect(isZoomJoinUrl(url), url).toBe(false);
		}
	});
});

function memoryStore(): RegistrationStore & { rows: { email: string; row: unknown }[] } {
	const rows: { email: string; row: unknown }[] = [];
	return {
		rows,
		async findByEmail(_id, email) {
			const found = rows.find((r) => r.email === email);
			return found ? { id: 1 } : null;
		},
		async insert(_id, row) {
			rows.push({ email: row.email, row });
			return rows.length;
		},
	};
}

const valid = {
	name: 'Amina Farooq',
	email: 'Amina@Example.com',
	state: 'tx',
	marketingConsent: false,
	honeypot: '',
	attributionCode: 'yt-khutbah',
};

describe('registerForWebinar', () => {
	it('rejects a duplicate email, stores consent only when ticked, blocks the honeypot, and saves the code', async () => {
		const store = memoryStore();
		const first = await registerForWebinar(store, 4, valid);
		expect(first.ok).toBe(true);
		if (!first.ok) return;
		expect(first.row.email).toBe('amina@example.com');
		expect(first.row.marketingConsent).toBe(false);
		expect(first.row.marketingConsentAt).toBeNull();
		expect(first.row.attributionCode).toBe('yt-khutbah');

		const again = await registerForWebinar(store, 4, valid);
		expect(again).toEqual({ ok: false, reason: 'duplicate' });
		expect(store.rows).toHaveLength(1);

		const opted = await registerForWebinar(memoryStore(), 4, { ...valid, email: 'other@example.com', marketingConsent: true });
		expect(opted.ok).toBe(true);
		if (opted.ok) {
			expect(opted.row.marketingConsent).toBe(true);
			expect(opted.row.marketingConsentAt).toBeInstanceOf(Date);
		}

		const honeypot = memoryStore();
		const blocked = await registerForWebinar(honeypot, 4, { ...valid, honeypot: 'https://spam.example' });
		expect(blocked).toEqual({ ok: false, reason: 'honeypot' });
		expect(honeypot.rows).toHaveLength(0);
	});
});

describe('public page', () => {
	it('never contains join_url', () => {
		const view = toPublicWebinar({ id: 1, title: 'November session', startsAt: START, joinUrl: JOIN } as never);
		expect(JSON.stringify(view)).not.toContain(JOIN);
		expect(JSON.stringify(view)).not.toContain('zoom.us');

		const ld = webinarEventJsonLd({
			title: 'November session',
			startsAt: START,
			durationMinutes: 60,
			pageUrl: 'https://www.muslimlegacyplanning.com/webinar',
		});
		const script = jsonLdScript(ld);
		expect(script).toContain('OnlineEventAttendanceMode');
		expect(script).toContain('VirtualLocation');
		expect(script).toContain(firmLegalServiceId);
		expect(script).not.toContain(JOIN);
		expect(script).not.toContain('zoom.us');
		expect((ld.location as { url: string }).url).toBe('https://www.muslimlegacyplanning.com/webinar');

		const open = render(Page, {
			props: {
				data: { webinar: { ...view, joinUrl: JOIN } },
				form: null,
			},
		} as never);
		expect(open.body).toContain('November session');
		expect(open.body).toContain(WEBINAR_DISCLOSURE);
		expect(open.body).toContain(formatFirmNapLine());
		expect(open.body).toContain(WEBINAR_OPT_IN_LABEL);
		expect(open.body).not.toContain(JOIN);
		expect(open.body).not.toContain('zoom.us');
		expect(open.body).not.toContain('join_url');

		const closed = render(Page, { props: { data: { webinar: null }, form: null } } as never);
		expect(closed.body).toContain(WEBINAR_EMPTY);
		expect(closed.body).toContain(consultationBookingUrl);
		expect(closed.body).not.toContain(JOIN);
	});
});

describe('webinar email', () => {
	const base = {
		title: 'November session',
		whenLabel: 'Thursday, November 19, 2026, 5:00 PM CST',
		joinUrl: JOIN,
		consultUrl: consultationBookingUrl,
		uid: 'webinar-1@example.com',
		startsAt: START,
		durationMinutes: 60,
	};

	it('puts the join link on confirmation and the consultation link on the follow-up', () => {
		const confirmation = webinarEmail({ ...base, kind: 'confirmation' });
		expect(confirmation.html).toContain(JOIN);
		expect(confirmation.html).toContain(formatFirmNapLine());
		expect(confirmation.html).not.toMatch(/unsubscribe/i);
		expect(confirmation.ics).toContain('DTSTART');
		const followup = webinarEmail({ ...base, kind: 'followup' });
		expect(followup.html).toContain(consultationBookingUrl);
		expect(followup.html).not.toContain(JOIN);
		expect(followup.html).not.toMatch(/unsubscribe/i);
		expect(followup.ics).toBeUndefined();
	});
});

describe('Central Time', () => {
	it('stores a Chicago wall time as UTC', () => {
		expect(chicagoWallToUtc('2026-11-19T18:00')?.toISOString()).toBe('2026-11-20T00:00:00.000Z');
		expect(chicagoWallToUtc('2026-07-15T18:00')?.toISOString()).toBe('2026-07-15T23:00:00.000Z');
		expect(chicagoWallToUtc('2026-03-08T02:30')).toBeNull();
	});
});

describe('sitemap', () => {
	it('lists the webinar page on MLP', () => {
		expect(sitemapRoutes).toContainEqual({ site: 'mlp', path: '/webinar' });
	});
});

describe('demoSeedRefusal', () => {
	it('requires the opt-in flag and refuses the production host', () => {
		expect(demoSeedRefusal({})).toMatch(/DEMO_SEED_ALLOWED/);
		expect(demoSeedRefusal({ DEMO_SEED_ALLOWED: 'true' })).toMatch(/PROD_DATABASE_HOST/);
		expect(
			demoSeedRefusal({
				DEMO_SEED_ALLOWED: 'true',
				PROD_DATABASE_HOST: 'ep-prod.us-east-2.aws.neon.tech',
				DATABASE_URL: 'postgres://u:p@ep-prod-pooler.us-east-2.aws.neon.tech/app',
			}),
		).toMatch(/production database/);
		expect(
			demoSeedRefusal({
				DEMO_SEED_ALLOWED: 'true',
				PROD_DATABASE_HOST: 'ep-prod.us-east-2.aws.neon.tech',
				DATABASE_URL: 'postgres://u:p@ep-staging.us-east-2.aws.neon.tech/app',
			}),
		).toBeNull();
	});
});
