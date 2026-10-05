import { describe, expect, it } from 'vitest';
import {
	assertCan,
	can,
	contentSessionIdleExpired,
	contentSessionPathAllowed,
	isContentStaffRole,
} from './permissions';

describe('content permissions', () => {
	it('lets an author draft and submit but not publish, unpublish or schedule', () => {
		for (const a of ['view', 'draft', 'submit'] as const) expect(can('content_author', a)).toBe(true);
		for (const a of ['publish', 'unpublish', 'schedule', 'manage_taxonomy'] as const) {
			expect(can('content_author', a)).toBe(false);
			expect(() => assertCan('content_author', a)).toThrow();
		}
	});

	it('lets a publisher and an admin publish', () => {
		for (const role of ['content_publisher', 'admin']) {
			for (const a of ['publish', 'unpublish', 'schedule'] as const) expect(can(role, a)).toBe(true);
		}
	});

	it('does not give clients, anonymous users or authors client-matter access', () => {
		expect(can('client', 'view')).toBe(false);
		expect(can(null, 'draft')).toBe(false);
		expect(can('content_author', 'manage_team')).toBe(false);
		expect(can('content_publisher', 'manage_team')).toBe(false);
	});

	it('reads comma-separated role strings', () => {
		expect(can('client,content_publisher', 'publish')).toBe(true);
	});
});

describe('content session rules', () => {
	const now = Date.UTC(2026, 9, 2, 12, 0, 0);
	it('expires content staff after 12 idle hours and nobody else', () => {
		expect(contentSessionIdleExpired('content_author', now - 11 * 3600_000, now)).toBe(false);
		expect(contentSessionIdleExpired('content_author', now - 13 * 3600_000, now)).toBe(true);
		expect(contentSessionIdleExpired('content_publisher', now - 13 * 3600_000, now)).toBe(true);
		expect(contentSessionIdleExpired('admin', now - 100 * 3600_000, now)).toBe(false);
		expect(contentSessionIdleExpired('client', now - 100 * 3600_000, now)).toBe(false);
		expect(isContentStaffRole('content_author')).toBe(true);
	});

	it('only starts content-staff sessions through password sign-in or the second factor', () => {
		expect(contentSessionPathAllowed('/sign-in/email')).toBe(true);
		expect(contentSessionPathAllowed('/two-factor/verify-totp')).toBe(true);
		expect(contentSessionPathAllowed('/magic-link/verify')).toBe(false);
		expect(contentSessionPathAllowed('/callback/google')).toBe(false);
		expect(contentSessionPathAllowed(undefined)).toBe(false);
	});
});
