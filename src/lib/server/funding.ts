import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	fundingDashboard,
	fundingMilestone,
	fundingEvent,
	fundingAdminFlag,
	fundingReminderLog,
	trust,
	TrustStatus,
	type FundingChecklistState,
	type FundingMilestoneStatus,
	type FundingTriState,
} from '$lib/server/db/schema';
import { allMilestoneSeedRows, detectPourOverIncluded, computeFundingProgress, type FindYourStuffFlags } from '$lib/funding/logic';
import { getMilestoneContent } from '$lib/funding/content';

function flagsFromDashboard(d: typeof fundingDashboard.$inferSelect): FindYourStuffFlags {
	return {
		hasBankAccounts: d.hasBankAccounts,
		hasBrokerage: d.hasBrokerage,
		hasEmployerPlan: d.hasEmployerPlan,
		hasIra: d.hasIra,
		hasLifeInsurance: d.hasLifeInsurance,
		hasVehicle: d.hasVehicle,
		hasCrypto: d.hasCrypto,
		hasBusiness: d.hasBusiness,
		retirementOverThreshold: d.retirementOverThreshold,
		findYourStuffCompletedAt: d.findYourStuffCompletedAt,
		isHomeowner: d.isHomeowner,
		isMarried: d.isMarried,
		pourOverWillIncluded: d.pourOverWillIncluded,
	};
}

/** Idempotent: create funding dashboard + milestones when documents are approved. */
export async function seedFundingDashboardOnApprove(trustId: number, actorUserId?: string) {
	const existing = await db.query.fundingDashboard.findFirst({
		where: eq(fundingDashboard.trustId, trustId),
	});
	if (existing) {
		if (!existing.documentsReadyAt) {
			await db
				.update(fundingDashboard)
				.set({ documentsReadyAt: new Date(), updatedAt: new Date() })
				.where(eq(fundingDashboard.id, existing.id));
		}
		return existing.id;
	}

	const t = await db.query.trust.findFirst({
		where: eq(trust.id, trustId),
		columns: {
			id: true,
			userId: true,
			joint: true,
			house_deed_url: true,
			generated_files: true,
			user_files: true,
			screeningAnswers: true,
		},
	});
	if (!t) throw new Error(`Trust ${trustId} not found for funding seed`);

	const files = [...(t.generated_files ?? []), ...(t.user_files ?? [])];
	const pourOver = detectPourOverIncluded(files);
	// Product assumes primary residence for online trust; treat as homeowner unless screening says otherwise.
	const isHomeowner = true;
	const isMarried = t.joint === true;

	const [dash] = await db
		.insert(fundingDashboard)
		.values({
			trustId: t.id,
			userId: t.userId,
			documentsReadyAt: new Date(),
			pourOverWillIncluded: files.length > 0 ? pourOver : true,
			isHomeowner,
			isMarried,
			hasBusiness: t.screeningAnswers?.business_ownership ? 'yes' : null,
		})
		.returning();

	const seeds = allMilestoneSeedRows();
	if (seeds.length) {
		await db.insert(fundingMilestone).values(
			seeds.map((s) => ({
				dashboardId: dash.id,
				key: s.key,
				phase: s.phase,
				status: (s.phase === 'complete' ? 'locked' : 'not_started') as FundingMilestoneStatus,
				checklist: {} as FundingChecklistState,
			})),
		);
	}

	await db.insert(fundingEvent).values({
		dashboardId: dash.id,
		eventKey: 'dashboard_seeded',
		payload: { trustId },
		actorUserId: actorUserId ?? null,
	});

	return dash.id;
}

/** Unlock Complete phase after notarization finalize. */
export async function unlockFundingComplete(trustId: number, actorUserId?: string) {
	let dash = await db.query.fundingDashboard.findFirst({
		where: eq(fundingDashboard.trustId, trustId),
	});
	if (!dash) {
		await seedFundingDashboardOnApprove(trustId, actorUserId);
		dash = await db.query.fundingDashboard.findFirst({
			where: eq(fundingDashboard.trustId, trustId),
		});
	}
	if (!dash) return;

	const now = new Date();
	await db
		.update(fundingDashboard)
		.set({
			fundingUnlockedAt: dash.fundingUnlockedAt ?? now,
			documentsReadyAt: dash.documentsReadyAt ?? now,
			updatedAt: now,
		})
		.where(eq(fundingDashboard.id, dash.id));

	const locked = await db.query.fundingMilestone.findMany({
		where: and(eq(fundingMilestone.dashboardId, dash.id), eq(fundingMilestone.phase, 'complete')),
	});
	for (const m of locked) {
		if (m.status === 'locked') {
			const nextStatus: FundingMilestoneStatus =
				m.key === 'confirm_trust_signing' ? 'in_progress' : 'not_started';
			const checklist =
				m.key === 'confirm_trust_signing'
					? { signed_trust: true, signed_related: true }
					: m.checklist;
			await db
				.update(fundingMilestone)
				.set({
					status: nextStatus,
					checklist,
					updatedAt: now,
				})
				.where(eq(fundingMilestone.id, m.id));
		}
	}

	await db.insert(fundingEvent).values({
		dashboardId: dash.id,
		eventKey: 'complete_phase_unlocked',
		payload: { trustId },
		actorUserId: actorUserId ?? null,
	});

	await recomputeImplementationComplete(dash.id);
}

export async function recomputeImplementationComplete(dashboardId: number) {
	const dash = await db.query.fundingDashboard.findFirst({
		where: eq(fundingDashboard.id, dashboardId),
		with: { milestones: true },
	});
	if (!dash) return;

	const progress = computeFundingProgress(flagsFromDashboard(dash), dash.milestones, {
		fundingUnlockedAt: dash.fundingUnlockedAt,
	});

	const shouldSet = progress.implementationComplete;
	const currentlySet = dash.implementationCompletedAt != null;
	if (shouldSet && !currentlySet) {
		await db
			.update(fundingDashboard)
			.set({ implementationCompletedAt: new Date(), updatedAt: new Date() })
			.where(eq(fundingDashboard.id, dashboardId));
		await db.insert(fundingEvent).values({
			dashboardId,
			eventKey: 'implementation_complete',
			payload: {},
		});
	} else if (!shouldSet && currentlySet) {
		await db
			.update(fundingDashboard)
			.set({ implementationCompletedAt: null, updatedAt: new Date() })
			.where(eq(fundingDashboard.id, dashboardId));
	}
}

export async function logFundingEvent(
	dashboardId: number,
	eventKey: string,
	payload?: Record<string, unknown>,
	actorUserId?: string,
) {
	await db.insert(fundingEvent).values({
		dashboardId,
		eventKey,
		payload: payload ?? null,
		actorUserId: actorUserId ?? null,
	});
}

export async function createFundingFlag(
	dashboardId: number,
	flagKey: string,
	opts: { severity?: 'info' | 'attention' | 'risk'; reason?: string; payload?: Record<string, unknown> } = {},
) {
	const open = await db.query.fundingAdminFlag.findFirst({
		where: and(
			eq(fundingAdminFlag.dashboardId, dashboardId),
			eq(fundingAdminFlag.flagKey, flagKey),
		),
	});
	if (open && !open.resolvedAt) return open.id;

	const [row] = await db
		.insert(fundingAdminFlag)
		.values({
			dashboardId,
			flagKey,
			severity: opts.severity ?? 'attention',
			reason: opts.reason ?? null,
			payload: opts.payload ?? null,
		})
		.returning({ id: fundingAdminFlag.id });
	return row.id;
}

export async function updateMilestoneChecklist(
	dashboardId: number,
	milestoneKey: string,
	checklist: FundingChecklistState,
	status: FundingMilestoneStatus,
	actorUserId?: string,
) {
	const row = await db.query.fundingMilestone.findFirst({
		where: and(eq(fundingMilestone.dashboardId, dashboardId), eq(fundingMilestone.key, milestoneKey)),
	});
	if (!row) throw new Error('Milestone not found');

	const content = getMilestoneContent(milestoneKey);
	const allDone =
		content &&
		content.checklist.length > 0 &&
		content.checklist.every((item) => checklist[item.id] === true);

	const nextStatus: FundingMilestoneStatus =
		status === 'not_applicable' || status === 'action_needed'
			? status
			: allDone
				? 'complete'
				: Object.values(checklist).some(Boolean)
					? 'in_progress'
					: 'not_started';

	await db
		.update(fundingMilestone)
		.set({
			checklist,
			status: nextStatus,
			completedAt: nextStatus === 'complete' ? new Date() : null,
			naReason: nextStatus === 'not_applicable' ? row.naReason : null,
			updatedAt: new Date(),
		})
		.where(eq(fundingMilestone.id, row.id));

	await logFundingEvent(
		dashboardId,
		'checklist_updated',
		{ milestoneKey, status: nextStatus },
		actorUserId,
	);
	await recomputeImplementationComplete(dashboardId);
	return nextStatus;
}

export type FindYourStuffInput = {
	hasBankAccounts: FundingTriState;
	hasBrokerage: FundingTriState;
	hasEmployerPlan: FundingTriState;
	hasIra: FundingTriState;
	hasLifeInsurance: FundingTriState;
	hasVehicle: FundingTriState;
	hasCrypto: FundingTriState;
	hasBusiness: FundingTriState;
	retirementOverThreshold: FundingTriState;
};

export async function saveFindYourStuff(
	dashboardId: number,
	input: FindYourStuffInput,
	actorUserId?: string,
) {
	await db
		.update(fundingDashboard)
		.set({
			...input,
			findYourStuffCompletedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(fundingDashboard.id, dashboardId));

	// Mark find_your_stuff complete when questionnaire is saved (no user checklist — the form is the step).
	const fysRow = await db.query.fundingMilestone.findFirst({
		where: and(eq(fundingMilestone.dashboardId, dashboardId), eq(fundingMilestone.key, 'find_your_stuff')),
	});
	if (fysRow && fysRow.status !== 'complete') {
		await db
			.update(fundingMilestone)
			.set({
				status: 'complete',
				checklist: {},
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(fundingMilestone.id, fysRow.id));
	}

	if (input.hasCrypto === 'yes' || input.hasCrypto === 'not_sure') {
		await createFundingFlag(dashboardId, 'crypto_present', {
			severity: 'attention',
			reason: 'User indicated crypto or digital assets',
		});
	}
	if (input.hasBusiness === 'yes' || input.hasBusiness === 'not_sure') {
		await createFundingFlag(dashboardId, 'business_owner', {
			severity: 'attention',
			reason: 'User indicated business ownership',
		});
	}
	if (input.retirementOverThreshold === 'yes' || input.retirementOverThreshold === 'not_sure') {
		await createFundingFlag(dashboardId, 'high_retirement_assets', {
			severity: 'attention',
			reason: 'Retirement assets over threshold or not sure',
		});
	}

	await logFundingEvent(dashboardId, 'find_your_stuff_saved', { ...input }, actorUserId);
}

export async function setMilestoneNotApplicable(
	dashboardId: number,
	milestoneKey: string,
	reason: string | null,
	actorUserId?: string,
) {
	const row = await db.query.fundingMilestone.findFirst({
		where: and(eq(fundingMilestone.dashboardId, dashboardId), eq(fundingMilestone.key, milestoneKey)),
	});
	if (!row) throw new Error('Milestone not found');

	await db
		.update(fundingMilestone)
		.set({
			status: 'not_applicable',
			naReason: reason,
			completedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(fundingMilestone.id, row.id));

	await logFundingEvent(dashboardId, 'milestone_na', { milestoneKey, reason }, actorUserId);
	await recomputeImplementationComplete(dashboardId);
}

export async function setActionNeededNote(
	dashboardId: number,
	note: string | null,
	actorUserId?: string,
) {
	await db
		.update(fundingDashboard)
		.set({
			actionNeededNote: note,
			actionNeededAt: note ? new Date() : null,
			updatedAt: new Date(),
		})
		.where(eq(fundingDashboard.id, dashboardId));

	await logFundingEvent(
		dashboardId,
		note ? 'action_needed_set' : 'action_needed_cleared',
		{ note },
		actorUserId,
	);
}

export async function hasReminderBeenSent(dashboardId: number, reminderKey: string): Promise<boolean> {
	const row = await db.query.fundingReminderLog.findFirst({
		where: and(
			eq(fundingReminderLog.dashboardId, dashboardId),
			eq(fundingReminderLog.reminderKey, reminderKey),
		),
	});
	return !!row;
}

export async function recordReminderSent(
	dashboardId: number,
	reminderKey: string,
	resendId?: string | null,
) {
	await db.insert(fundingReminderLog).values({
		dashboardId,
		reminderKey,
		resendId: resendId ?? null,
	});
}

/** Insert reminder log before sending so duplicate cron runs skip even if email succeeds but DB write fails later. */
export async function claimReminderSend(
	dashboardId: number,
	reminderKey: string,
): Promise<number | null> {
	const [row] = await db
		.insert(fundingReminderLog)
		.values({
			dashboardId,
			reminderKey,
			resendId: null,
		})
		.onConflictDoNothing({
			target: [fundingReminderLog.dashboardId, fundingReminderLog.reminderKey],
		})
		.returning({ id: fundingReminderLog.id });
	return row?.id ?? null;
}

export async function setReminderResendId(logId: number, resendId: string | null) {
	await db
		.update(fundingReminderLog)
		.set({ resendId })
		.where(eq(fundingReminderLog.id, logId));
}

export async function releaseReminderClaim(logId: number) {
	await db.delete(fundingReminderLog).where(eq(fundingReminderLog.id, logId));
}

export { flagsFromDashboard };

export async function loadFundingForTrust(trustId: number) {
	return db.query.fundingDashboard.findFirst({
		where: eq(fundingDashboard.trustId, trustId),
		with: {
			milestones: true,
			adminFlags: true,
		},
	});
}

/** Ensure confirm_trust_signing reflects completed trust status. */
export async function syncConfirmSigningFromTrustStatus(dashboardId: number, trustStatus: string) {
	if (trustStatus !== TrustStatus.Completed) return;
	const row = await db.query.fundingMilestone.findFirst({
		where: and(
			eq(fundingMilestone.dashboardId, dashboardId),
			eq(fundingMilestone.key, 'confirm_trust_signing'),
		),
	});
	if (!row || row.status === 'complete') return;
	await updateMilestoneChecklist(
		dashboardId,
		'confirm_trust_signing',
		{ signed_trust: true, signed_related: true },
		'complete',
	);
}
