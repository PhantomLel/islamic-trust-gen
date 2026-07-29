import { describe, it, expect } from 'vitest';
import { ACKNOWLEDGMENT_VERSION, isAcknowledgmentComplete, type AcknowledgmentData } from './acknowledgment';
import type { WillResponses } from './config';

const marriedTexas: WillResponses = { marital_status: 'Married', state: 'TX' };
const marriedCalifornia: WillResponses = { marital_status: 'Married', state: 'CA' };
const singleTexas: WillResponses = { marital_status: 'Single', state: 'TX' };

function ack(overrides: Partial<AcknowledgmentData['checkboxes']>): AcknowledgmentData {
	return {
		version: ACKNOWLEDGMENT_VERSION,
		clientTimestamp: new Date().toISOString(),
		checkboxes: { selfHelp: true, communityProperty: false, ...overrides },
	};
}

describe('isAcknowledgmentComplete (A6 gate)', () => {
	it('is false with no acknowledgment data at all', () => {
		expect(isAcknowledgmentComplete(marriedTexas, null)).toBe(false);
		expect(isAcknowledgmentComplete(marriedTexas, undefined)).toBe(false);
	});

	it('is false when the self-help disclaimer is unchecked, regardless of state', () => {
		expect(isAcknowledgmentComplete(singleTexas, ack({ selfHelp: false }))).toBe(false);
	});

	it('is true for a non-married user with only the self-help box checked', () => {
		expect(isAcknowledgmentComplete(singleTexas, ack({}))).toBe(true);
	});

	it('is true for a married non-Texas user (e.g. California) without the community-property box', () => {
		expect(isAcknowledgmentComplete(marriedCalifornia, ack({ communityProperty: false }))).toBe(true);
	});

	it('is false for a married Texas user until the community-property box is also checked', () => {
		expect(isAcknowledgmentComplete(marriedTexas, ack({ communityProperty: false }))).toBe(false);
		expect(isAcknowledgmentComplete(marriedTexas, ack({ communityProperty: true }))).toBe(true);
	});

	it('rejects a stored acknowledgment from a stale/mismatched version', () => {
		const stale = ack({ communityProperty: true });
		stale.version = '0.9';
		expect(isAcknowledgmentComplete(marriedTexas, stale)).toBe(false);
	});
});
