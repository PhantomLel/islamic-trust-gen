import { describe, expect, it } from 'vitest';
import {
	computeFundingProgress,
	getNextUp,
	isFundingAccessible,
	statusRank,
} from './logic';
import type { FindYourStuffFlags, MilestoneRow } from './logic';
import { TrustStatus } from '$lib/server/db/schema';

const baseFlags: FindYourStuffFlags = {
	hasBankAccounts: null,
	hasBrokerage: null,
	hasEmployerPlan: null,
	hasIra: null,
	hasLifeInsurance: null,
	hasVehicle: null,
	hasCrypto: null,
	hasBusiness: null,
	retirementOverThreshold: null,
	findYourStuffCompletedAt: null,
	isHomeowner: true,
	isMarried: true,
	pourOverWillIncluded: true,
};

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
});
