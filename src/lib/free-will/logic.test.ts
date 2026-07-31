import { describe, expect, it } from 'vitest';
import { isFullLegalName } from './validation';
import {
	computeLeadTags,
	getActiveSteps,
	getEmailFlags,
	getStepValidationMessage,
	heirsCalculatorAllResponses,
	isMarriedSpouseExcluded,
	isStepAnswered,
	normalizeWillPersonName,
	type EmailFlag,
} from './logic';
import { willSteps, type WillResponses } from './config';

describe('isFullLegalName (B4)', () => {
	it('rejects a single word', () => {
		expect(isFullLegalName('Sumayya')).toBe(false);
		expect(isFullLegalName('  John  ')).toBe(false);
	});

	it('accepts two or more name parts', () => {
		expect(isFullLegalName('Sumayya Ahmed')).toBe(true);
		expect(isFullLegalName('Mary Jane Watson')).toBe(true);
	});
});

describe('isStepAnswered executors/guardians (B4)', () => {
	const executorsStep = willSteps.find((s) => s.id === 'executors')!;
	const guardiansStep = willSteps.find((s) => s.id === 'guardians')!;

	it('rejects executors with single-word names', () => {
		const responses: WillResponses = {
			executors: [
				{ fullName: 'Sumayya', relationship: 'Sister', contact: '' },
				{ fullName: 'Azzahra Malik', relationship: 'Sister', contact: '' },
				{ fullName: 'Shafiq Rahman', relationship: 'Friend', contact: '' },
			],
		};
		expect(isStepAnswered(executorsStep, responses)).toBe(false);
	});

	it('accepts executors with full legal names', () => {
		const responses: WillResponses = {
			executors: [
				{ fullName: 'Sumayya Ahmed', relationship: 'Sister', contact: '' },
				{ fullName: 'Azzahra Malik', relationship: 'Sister', contact: '' },
				{ fullName: 'Shafiq Rahman', relationship: 'Friend', contact: '' },
			],
		};
		expect(isStepAnswered(executorsStep, responses)).toBe(true);
	});

	it('accepts only the first executor when backups are empty (C1)', () => {
		const responses: WillResponses = {
			executors: [
				{ fullName: 'Sumayya Ahmed', relationship: 'Sister', contact: '' },
				{ fullName: '', relationship: '', contact: '' },
				{ fullName: '', relationship: '', contact: '' },
			],
		};
		expect(isStepAnswered(executorsStep, responses)).toBe(true);
	});

	it('rejects a partially filled backup executor (C1)', () => {
		const responses: WillResponses = {
			executors: [
				{ fullName: 'Sumayya Ahmed', relationship: 'Sister', contact: '' },
				{ fullName: 'Azzahra', relationship: '', contact: '' },
				{ fullName: '', relationship: '', contact: '' },
			],
		};
		expect(isStepAnswered(executorsStep, responses)).toBe(false);
	});

	it('rejects guardians with single-word names', () => {
		const responses: WillResponses = {
			guardians: [
				{ fullName: 'Azzahra', relationship: 'Sister', contact: '' },
				{ fullName: 'Shafiq Rahman', relationship: 'Friend', contact: '' },
			],
		};
		expect(isStepAnswered(guardiansStep, responses)).toBe(false);
	});
});

describe('isMarriedSpouseExcluded (B1)', () => {
	it('is true when intake says married but the calculator excludes the spouse', () => {
		expect(
			isMarriedSpouseExcluded({ 'spouse-present': true }, false),
		).toBe(true);
	});

	it('is false when the spouse is included or the user is not married', () => {
		expect(
			isMarriedSpouseExcluded({ 'spouse-present': true }, true),
		).toBe(false);
		expect(
			isMarriedSpouseExcluded({ 'spouse-present': false }, false),
		).toBe(false);
	});
});

describe('heirsCalculatorAllResponses (B2)', () => {
	it('maps deceased parents and married spouse presence from earlier answers', () => {
		const mapped = heirsCalculatorAllResponses({
			marital_status: 'Married',
			father_alive: false,
			mother_alive: true,
			spouse_name: 'Layla Khan',
			gender: 'Male',
		});
		expect(mapped['father-alive']).toBe(false);
		expect(mapped['mother-alive']).toBe(true);
		expect(mapped['spouse-present']).toBe(true);
	});
});

describe('home_state yes/no flag (B5)', () => {
	const base: WillResponses = {
		own_home: true,
		home_state: true,
		state: 'TX',
	};

	it('adds out_of_state_home to lead tags and email flags', () => {
		expect(computeLeadTags(base)).toContain('out_of_state_home');
		expect(getEmailFlags(base)).toContain('out_of_state_home');
	});

	it('does not flag when the home is in the same state as residence', () => {
		const sameState: WillResponses = { own_home: true, home_state: false, state: 'TX' };
		expect(computeLeadTags(sameState)).not.toContain('out_of_state_home');
		expect(getEmailFlags(sameState)).not.toContain('out_of_state_home' as EmailFlag);
	});
});

describe('assets_skipped (C5)', () => {
	it('hides asset steps when assets were skipped', () => {
		const responses: WillResponses = { assets_skipped: true, state: 'TX' };
		const ids = getActiveSteps(responses).map((s) => s.id);
		expect(ids).not.toContain('own_home');
		expect(ids).not.toContain('asset_range');
		expect(ids).toContain('executors');
	});

	it('suppresses asset-based lead tags when skipped', () => {
		const responses: WillResponses = {
			assets_skipped: true,
			state: 'TX',
			own_home: true,
			retirement_accounts: true,
		};
		expect(computeLeadTags(responses)).not.toContain('homeowner');
		expect(computeLeadTags(responses)).not.toContain('beneficiary_designation_review');
	});
});

describe('wasiyyah validation (C3)', () => {
	const wasiyyahStep = willSteps.find((s) => s.id === 'wasiyyah')!;

	it('accepts custom charity with einDeferred', () => {
		const responses: WillResponses = {
			wasiyyah: {
				interested: true,
				bequests: [
					{
						charityId: 'custom-1',
						customName: 'Local Masjid',
						customEin: '',
						einDeferred: true,
						percentage: 10,
					},
				],
			},
		};
		expect(isStepAnswered(wasiyyahStep, responses)).toBe(true);
	});

	it('rejects custom charity without EIN or deferral', () => {
		const responses: WillResponses = {
			wasiyyah: {
				interested: true,
				bequests: [
					{
						charityId: 'custom-1',
						customName: 'Local Masjid',
						customEin: '',
						percentage: 10,
					},
				],
			},
		};
		expect(isStepAnswered(wasiyyahStep, responses)).toBe(false);
		expect(getStepValidationMessage(wasiyyahStep, responses)).toMatch(/EIN/i);
	});
});

describe('normalizeWillPersonName (C6)', () => {
	it('dedupes repeated name segments', () => {
		expect(normalizeWillPersonName('Ahmad Khan Ahmad Khan')).toBe('Ahmad Khan');
	});
});
