import { describe, expect, it } from 'vitest';
import {
	computeFundingProgress,
	getNextUp,
	isFundingAccessible,
	isMilestoneApplicable,
	shouldShowConsult,
	shouldWarnScheduleAMissing,
	statusRank,
} from './logic';
import type { ListedAsset } from './assets';
import { getMilestoneContent } from './content';
import type { FindYourStuffFlags, MilestoneRow } from './logic';
import { TrustStatus } from '$lib/server/db/schema';

const baseFlags: FindYourStuffFlags = {
	ownsHome: null,
	hasBankAccounts: null,
	hasBrokerage: null,
	hasEmployerPlan: null,
	hasIra: null,
	hasLifeInsurance: null,
	hasVehicle: null,
	hasCrypto: null,
	hasBusiness: null,
	retirementOverThreshold: null,
	retirementBeneficiary: null,
	findYourStuffCompletedAt: null,
	isHomeowner: true,
	isMarried: true,
	pourOverWillIncluded: true,
};

describe('consult CTA gating', () => {
	const consultFor = (key: string, flags: FindYourStuffFlags) =>
		shouldShowConsult(getMilestoneContent(key)?.consultWhen, flags);

	it('always offers a consult on the crypto card', () => {
		expect(consultFor('crypto_digital', baseFlags)).toBe(true);
	});

	it('hides the retirement consult when the spouse is sole beneficiary and assets are modest', () => {
		const safe: FindYourStuffFlags = {
			...baseFlags,
			retirementBeneficiary: 'spouse_sole',
			retirementOverThreshold: 'no',
		};
		expect(consultFor('employer_retirement', safe)).toBe(false);
		expect(consultFor('forms_employer', safe)).toBe(false);
		expect(consultFor('ira', safe)).toBe(false);
		expect(consultFor('forms_ira', safe)).toBe(false);
	});

	it('offers the retirement consult when the beneficiary is not the spouse or is unknown', () => {
		for (const answer of ['other', 'not_sure'] as const) {
			const risky: FindYourStuffFlags = { ...baseFlags, retirementBeneficiary: answer };
			expect(consultFor('employer_retirement', risky)).toBe(true);
			expect(consultFor('ira', risky)).toBe(true);
		}
	});

	it('offers the IRA consult on substantial or unknown retirement assets alone', () => {
		for (const answer of ['yes', 'not_sure'] as const) {
			const flags: FindYourStuffFlags = {
				...baseFlags,
				retirementBeneficiary: 'spouse_sole',
				retirementOverThreshold: answer,
			};
			expect(consultFor('ira', flags)).toBe(true);
			// The spec ties the employer-plan consult to the beneficiary answer only.
			expect(consultFor('employer_retirement', flags)).toBe(false);
		}
	});

	it('offers no consult on cards that do not route to one', () => {
		expect(consultFor('bank_brokerage', baseFlags)).toBe(false);
		expect(consultFor('storage', baseFlags)).toBe(false);
	});
});

describe('Schedule A missing warning', () => {
	const assets: ListedAsset[] = [
		{ name: 'Chase checking', accountId: null, owner: null, categories: ['bank'] },
	];

	it('warns when the user claimed a category that is not on Schedule A', () => {
		expect(
			shouldWarnScheduleAMissing(['ira'], { ...baseFlags, hasIra: 'yes' }, assets),
		).toBe(true);
	});

	it('does not warn when a matching asset is listed', () => {
		expect(
			shouldWarnScheduleAMissing(
				['bank'],
				{ ...baseFlags, hasBankAccounts: 'yes' },
				assets,
			),
		).toBe(false);
	});

	it('does not warn when the user said they do not have the category', () => {
		expect(
			shouldWarnScheduleAMissing(['ira'], { ...baseFlags, hasIra: 'no' }, assets),
		).toBe(false);
	});

	it('checks each category on multi-category cards', () => {
		expect(
			shouldWarnScheduleAMissing(
				['bank', 'brokerage'],
				{ ...baseFlags, hasBankAccounts: 'yes', hasBrokerage: 'yes' },
				assets,
			),
		).toBe(true);
		expect(
			shouldWarnScheduleAMissing(
				['bank', 'brokerage'],
				{ ...baseFlags, hasBankAccounts: 'yes', hasBrokerage: 'no' },
				assets,
			),
		).toBe(false);
	});
});

describe('funding logic', () => {
	it('gates access from notarization-pending onward', () => {
		expect(isFundingAccessible(TrustStatus.RequiresReview)).toBe(false);
		expect(isFundingAccessible(TrustStatus.NotarizationPending)).toBe(true);
		expect(isFundingAccessible(TrustStatus.Completed)).toBe(true);
		expect(statusRank(TrustStatus.Completed)).toBeGreaterThan(statusRank(TrustStatus.NotarizationPending));
	});

	it('locks complete phase progress until fundingUnlockedAt', () => {
		const progress = computeFundingProgress(baseFlags, [], { fundingUnlockedAt: null });
		expect(progress.completePhaseLocked).toBe(true);
		expect(progress.complete.pct).toBe(0);
		expect(progress.modules.filter((m) => m.phase === 'complete').every((m) => m.status === 'locked')).toBe(
			true,
		);
	});

	it('next up starts at download_review', () => {
		const next = getNextUp(baseFlags, [], { fundingUnlockedAt: null });
		expect(next?.milestoneKey).toBe('download_review');
	});

	it('marks prepare progress when download checklist done', () => {
		const milestones: MilestoneRow[] = [
			{
				key: 'download_review',
				phase: 'prepare',
				status: 'complete',
				checklist: {
					downloaded: true,
					reviewed_names: true,
					reviewed_trustees: true,
					reviewed_signing: true,
					no_edit: true,
				},
				naReason: null,
				completedAt: new Date(),
			},
		];
		const progress = computeFundingProgress(baseFlags, milestones, { fundingUnlockedAt: null });
		expect(progress.prepare.done).toBeGreaterThanOrEqual(1);
		const next = getNextUp(baseFlags, milestones, { fundingUnlockedAt: null });
		expect(next?.milestoneKey).not.toBe('download_review');
	});

	it('hides the home cards only when the user says they do not own a home', () => {
		const homeKeys = ['home_deed_office', 'home_insurance', 'homestead'] as const;
		for (const key of homeKeys) {
			expect(isMilestoneApplicable(key, { ...baseFlags, isHomeowner: true }, true)).toBe(true);
			expect(isMilestoneApplicable(key, { ...baseFlags, isHomeowner: null }, true)).toBe(true);
			expect(isMilestoneApplicable(key, { ...baseFlags, isHomeowner: false }, true)).toBe(false);
		}
	});

	it('hides video-only cards that have no video configured', () => {
		expect(isMilestoneApplicable('funding_explainer', baseFlags, false)).toBe(false);
		expect(isMilestoneApplicable('webinar', baseFlags, false)).toBe(false);
	});

	it('never offers a card outside the denominator as next up', () => {
		// Walk the whole journey; Next Up must always be a card that can move the progress bar.
		const done: MilestoneRow[] = [];
		for (let i = 0; i < 40; i += 1) {
			const next = getNextUp(baseFlags, done, { fundingUnlockedAt: new Date() });
			if (!next) break;
			done.push({
				key: next.milestoneKey,
				phase: 'prepare',
				status: 'complete',
				checklist: {},
				naReason: null,
				completedAt: new Date(),
			});
		}
		const progress = computeFundingProgress(baseFlags, done, { fundingUnlockedAt: new Date() });
		expect(getNextUp(baseFlags, done, { fundingUnlockedAt: new Date() })).toBeNull();
		expect(progress.journey.done).toBe(progress.journey.total);
		expect(progress.implementationComplete).toBe(true);
	});
});
