import { describe, expect, it } from 'vitest';
import { FREE_WILL_RETENTION_LINE } from './flow';
import {
	FREE_WILL_RETENTION_DAYS,
	FREE_WILL_RETENTION_MS,
	freeWillPurgeAfter,
	isFreeWillDraftExpired,
	nextDraftSavedAt,
} from './retention';

const DAY = 24 * 60 * 60 * 1000;

describe('free will retention', () => {
	it('stamps a save 30 days out', () => {
		const from = new Date('2026-01-01T00:00:00.000Z');
		expect(freeWillPurgeAfter(from).toISOString()).toBe('2026-01-31T00:00:00.000Z');
		expect(FREE_WILL_RETENTION_MS).toBe(FREE_WILL_RETENTION_DAYS * DAY);
	});

	it('expires a browser draft at 30 days and keeps a newer one', () => {
		const saved = '2026-01-01T00:00:00.000Z';
		const savedMs = Date.parse(saved);
		expect(isFreeWillDraftExpired(saved, savedMs + FREE_WILL_RETENTION_MS - 1)).toBe(false);
		expect(isFreeWillDraftExpired(saved, savedMs + FREE_WILL_RETENTION_MS)).toBe(true);
		expect(isFreeWillDraftExpired(null, savedMs)).toBe(false);
		expect(isFreeWillDraftExpired('not-a-date', savedMs)).toBe(false);
	});

	it('does not move the clock when the draft body is unchanged', () => {
		const now = new Date('2026-02-01T00:00:00.000Z');
		expect(nextDraftSavedAt('{"a":1}', '{"a":1}', '2026-01-01T00:00:00.000Z', now)).toBe(
			'2026-01-01T00:00:00.000Z',
		);
		expect(nextDraftSavedAt('{"a":1}', '{"a":2}', '2026-01-01T00:00:00.000Z', now)).toBe(
			now.toISOString(),
		);
		expect(nextDraftSavedAt('{"a":1}', '{"a":1}', null, now)).toBe(now.toISOString());
	});

	it('states the same 30-day period in the visitor notice', () => {
		expect(FREE_WILL_RETENTION_LINE).toContain(`${FREE_WILL_RETENTION_DAYS} days`);
	});
});
