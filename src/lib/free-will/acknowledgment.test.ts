import { describe, it, expect } from 'vitest';
import { FLOW_NOTICE_VERSION } from './flow';
import { isAcknowledgmentComplete, type AcknowledgmentData } from './acknowledgment';
import type { WillResponses } from './config';

const emptyResponses: WillResponses = {};

describe('isAcknowledgmentComplete (B6.1 notice)', () => {
	it('is false with no acknowledgment data', () => {
		expect(isAcknowledgmentComplete(emptyResponses, null)).toBe(false);
		expect(isAcknowledgmentComplete(emptyResponses, undefined)).toBe(false);
	});

	it('is true when the B6.1 notice version and timestamp are stored', () => {
		const data: AcknowledgmentData = {
			version: FLOW_NOTICE_VERSION,
			acceptedAt: new Date().toISOString(),
		};
		expect(isAcknowledgmentComplete(emptyResponses, data)).toBe(true);
	});

	it('rejects a stale or mismatched version', () => {
		const data: AcknowledgmentData = {
			version: 'fw-notice-old',
			acceptedAt: new Date().toISOString(),
		};
		expect(isAcknowledgmentComplete(emptyResponses, data)).toBe(false);
	});
});
