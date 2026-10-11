import { describe, expect, it } from 'vitest';
import {
	FLOW_NOTICE_VERSION,
	flowPhaseOrder,
	isNoticeComplete,
	maritalStatusOptions,
	nextPhaseAfterStateAnswer,
	resolvesToNotHandled,
	shouldShowWarningAfterState,
	type FlowPhase,
} from './flow';
import type { WillResponses } from './config';
import { isEstateFullyDistributed } from './logic';
import type { HeirsCalculatorResponse } from '$lib/config';

describe('flow phase order', () => {
	it('places notice before the state question', () => {
		const order = flowPhaseOrder({} as WillResponses, true);
		expect(order.indexOf('notice')).toBeLessThan(order.indexOf('questions'));
		const steps = order.filter((p) => p === 'questions');
		expect(steps.length).toBe(1);
	});

	it('shows the warning screen right after an in-state answer', () => {
		expect(shouldShowWarningAfterState({ state: 'TX' })).toBe(true);
		expect(nextPhaseAfterStateAnswer({ state: 'TX' })).toBe('warning');
		expect(nextPhaseAfterStateAnswer({ state: 'NY' })).not.toBe('warning');
	});

	it('cannot advance past notice without acknowledgment', () => {
		expect(isNoticeComplete(null)).toBe(false);
		expect(isNoticeComplete({ version: 'wrong', acceptedAt: new Date().toISOString() })).toBe(false);
		expect(
			isNoticeComplete({ version: FLOW_NOTICE_VERSION, acceptedAt: new Date().toISOString() }),
		).toBe(true);
	});
});

describe('not_handled routing', () => {
	it('routes separated marital status to not_handled', () => {
		expect(
			resolvesToNotHandled({ marital_status: 'Married, separated but not divorced', state: 'TX' }),
		).toBe(true);
	});

	it('routes CA registered domestic partnership to not_handled', () => {
		expect(
			resolvesToNotHandled({ marital_status: 'Registered domestic partnership', state: 'CA' }),
		).toBe(true);
	});

	it('does not offer domestic partnership in Texas', () => {
		expect(maritalStatusOptions('TX')).not.toContain('Registered domestic partnership');
		expect(maritalStatusOptions('CA')).toContain('Registered domestic partnership');
	});

	it('routes wife-only undistributed estate to not_handled', () => {
		const heirs = {
			verified: true,
			dhawulArhamNeeded: false,
			namedHeirs: [{ totalShare: { decimal: 0.25, numerator: 1, denominator: 4, display: '1/4' } }],
		} as unknown as HeirsCalculatorResponse;
		expect(isEstateFullyDistributed(heirs)).toBe(false);
		expect(resolvesToNotHandled({ state: 'TX', heirs })).toBe(true);
	});
});

describe('isEstateFullyDistributed', () => {
	it('is false when only a wife survives the husband', () => {
		const heirs = {
			dhawulArhamNeeded: false,
			namedHeirs: [
				{
					totalShare: { decimal: 0.25, numerator: 1, denominator: 4, display: '1/4' },
				},
			],
		} as HeirsCalculatorResponse;
		expect(isEstateFullyDistributed(heirs)).toBe(false);
	});

	it('is true when wife and son share the estate', () => {
		const heirs = {
			dhawulArhamNeeded: false,
			namedHeirs: [
				{ totalShare: { decimal: 0.125, numerator: 1, denominator: 8, display: '1/8' } },
				{ totalShare: { decimal: 0.875, numerator: 7, denominator: 8, display: '7/8' } },
			],
		} as HeirsCalculatorResponse;
		expect(isEstateFullyDistributed(heirs)).toBe(true);
	});
});
