import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getBooleanSetting: vi.fn(),
	savePendingFreeWill: vi.fn(),
	saveFreeWillForUser: vi.fn(),
	render: vi.fn(),
	saveGeneratedWillFile: vi.fn(),
}));

vi.mock('$lib/server/db', () => ({
	db: {},
}));

vi.mock('$lib/server/settings', () => ({
	getBooleanSetting: (...args: unknown[]) => mocks.getBooleanSetting(...args),
	FREE_WILL_ENABLED_KEY: 'free_will_enabled',
}));

vi.mock('$lib/server/freeWill', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/freeWill')>();
	return {
		...actual,
		savePendingFreeWill: (...args: unknown[]) => mocks.savePendingFreeWill(...args),
		saveFreeWillForUser: (...args: unknown[]) => mocks.saveFreeWillForUser(...args),
		claimPendingFreeWills: vi.fn(),
		getLatestFreeWill: vi.fn(),
	};
});

vi.mock('$lib/server/documents/willPdf/render', () => ({
	render: (...args: unknown[]) => mocks.render(...args),
}));

vi.mock('$lib/server/documents/storage', () => ({
	saveGeneratedWillFile: (...args: unknown[]) => mocks.saveGeneratedWillFile(...args),
}));

vi.mock('$env/dynamic/private', () => ({
	env: { DATABASE_URL: 'postgresql://test' },
}));

vi.mock('$lib/server/drip/enroll', () => ({
	enrollLead: vi.fn(),
}));

import { actions, load } from './+page.server';
import { FLOW_NOTICE_VERSION } from '$lib/free-will/flow';

const validNotice = JSON.stringify({
	version: FLOW_NOTICE_VERSION,
	acceptedAt: new Date().toISOString(),
});

function separatedResponses() {
	return JSON.stringify([
		{ id: 'state', response: 'TX' },
		{ id: 'marital_status', response: 'Married, separated but not divorced' },
	]);
}

describe('free will save actions', () => {
	beforeEach(() => {
		mocks.getBooleanSetting.mockResolvedValue(true);
		mocks.savePendingFreeWill.mockResolvedValue({ id: 99 });
		mocks.render.mockResolvedValue({ buffer: Buffer.from('%PDF'), filename: 'will.pdf' });
		mocks.saveGeneratedWillFile.mockResolvedValue({ url: 'https://example.com/will.pdf', filename: 'will.pdf' });
	});

	it('returns 503 when free_will_enabled is false', async () => {
		mocks.getBooleanSetting.mockResolvedValue(false);
		const form = new FormData();
		form.set('responses', separatedResponses());
		form.set('tags', '[]');
		form.set('acknowledgmentData', validNotice);
		form.set('name', 'Ahmad Khan');
		form.set('email', 'ahmad@example.com');

		await expect(
			actions.savePending({ request: new Request('http://x', { method: 'POST', body: form }), cookies: { get: () => undefined } } as never),
		).rejects.toMatchObject({ status: 503 });
	});

	it('returns 400 without a B6.1 notice record', async () => {
		const form = new FormData();
		form.set('responses', separatedResponses());
		form.set('tags', '[]');
		form.set('name', 'Ahmad Khan');
		form.set('email', 'ahmad@example.com');

		await expect(
			actions.savePending({ request: new Request('http://x', { method: 'POST', body: form }), cookies: { get: () => undefined } } as never),
		).rejects.toMatchObject({ status: 400 });
	});

	it('returns 400 for not-handled marital status', async () => {
		const form = new FormData();
		form.set('responses', separatedResponses());
		form.set('tags', '[]');
		form.set('acknowledgmentData', validNotice);
		form.set('name', 'Ahmad Khan');
		form.set('email', 'ahmad@example.com');

		await expect(
			actions.savePending({ request: new Request('http://x', { method: 'POST', body: form }), cookies: { get: () => undefined } } as never),
		).rejects.toMatchObject({ status: 400 });
	});
});

describe('load', () => {
	it('exposes freeWillEnabled from settings', async () => {
		mocks.getBooleanSetting.mockResolvedValue(false);
		const result = await load({ locals: { user: null }, cookies: { get: () => undefined } } as never);
		expect(result.freeWillEnabled).toBe(false);
	});
});
