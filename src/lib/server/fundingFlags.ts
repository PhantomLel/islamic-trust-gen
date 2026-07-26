/**
 * Admin flag generation for the funding journey — invoked from the drip cron (no separate
 * endpoint). Self-reported flags (help clicks, consult clicks, crypto, business, retirement
 * answers) are raised inline where the user acts; this pass covers the time-based ones that
 * nobody is around to trigger.
 *
 * Every flag here is raised at most once per dashboard so resolving one in the admin UI does not
 * bring it straight back on the next run.
 */
import { and, gte, inArray, isNotNull, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { fundingDashboard, fundingEvent, TrustStatus } from '$lib/server/db/schema';
import type { FundingMilestoneStatus } from '$lib/server/db/schema';
import { createFundingFlag, flagsFromDashboard } from '$lib/server/funding';
import { computeFundingProgress } from '$lib/funding/logic';

const DAY_MS = 86_400_000;

function daysAgo(n: number): Date {
	return new Date(Date.now() - n * DAY_MS);
}

/** Event keys that represent the user doing something, as opposed to system/admin writes. */
const USER_ACTIVITY_EVENTS = [
	'checklist_updated',
	'find_your_stuff_saved',
	'milestone_na',
	'help_clicked',
	'consult_clicked',
];

function isDone(status: FundingMilestoneStatus | undefined): boolean {
	return status === 'complete' || status === 'not_applicable';
}

export async function processFundingFlags(): Promise<number> {
	let raised = 0;

	const dashboards = await db.query.fundingDashboard.findMany({
		where: and(
			isNotNull(fundingDashboard.documentsReadyAt),
			isNull(fundingDashboard.implementationCompletedAt),
		),
		with: {
			milestones: true,
			trust: { columns: { id: true, status: true } },
		},
		limit: 200,
	});
	if (dashboards.length === 0) return 0;

	// One query for recent user activity instead of one per dashboard.
	const recentEvents = await db
		.select({ dashboardId: fundingEvent.dashboardId })
		.from(fundingEvent)
		.where(
			and(
				inArray(fundingEvent.dashboardId, dashboards.map((d) => d.id)),
				inArray(fundingEvent.eventKey, USER_ACTIVITY_EVENTS),
				gte(fundingEvent.createdAt, daysAgo(7)),
			),
		);
	const activeDashboardIds = new Set(recentEvents.map((e) => e.dashboardId));

	for (const dash of dashboards) {
		const readyAt = dash.documentsReadyAt;
		if (!readyAt) continue;

		const statusOf = (key: string) => dash.milestones.find((m) => m.key === key)?.status;
		const checklistOf = (key: string) => dash.milestones.find((m) => m.key === key)?.checklist ?? {};
		const trustSigned = dash.trust?.status === TrustStatus.Completed;
		const isHomeowner = dash.isHomeowner !== false;

		const raise = async (
			flagKey: string,
			severity: 'info' | 'attention' | 'risk',
			reason: string,
		) => {
			const { created } = await createFundingFlag(dash.id, flagKey, {
				severity,
				reason,
				once: true,
			});
			if (created) raised += 1;
		};

		if (readyAt <= daysAgo(7) && !activeDashboardIds.has(dash.id)) {
			await raise(
				'no_activity_7d',
				'attention',
				'Documents ready but no funding dashboard activity in the last 7 days',
			);
		}

		if (readyAt <= daysAgo(5) && checklistOf('download_review').downloaded !== true) {
			await raise(
				'docs_not_downloaded',
				'attention',
				'Documents ready more than 5 days ago and still not marked downloaded',
			);
		}

		if (readyAt <= daysAgo(14) && !trustSigned) {
			await raise(
				'signing_unconfirmed_14d',
				'risk',
				'Documents ready more than 14 days ago and the trust is still not signed',
			);
		}

		if (readyAt <= daysAgo(21) && dash.pourOverWillIncluded && !isDone(statusOf('will_signing'))) {
			await raise(
				'will_signing_incomplete',
				'risk',
				'Pour-over will included and will signing still incomplete after 21 days',
			);
		}

		// The office prepares and records the deed around the notarization session, so an unsigned
		// trust after three weeks is our proxy for a stalled deed.
		if (readyAt <= daysAgo(21) && isHomeowner && !trustSigned) {
			await raise(
				'homeowner_deed_incomplete',
				'risk',
				'Homeowner has not completed signing, so the deed cannot be recorded',
			);
		}

		// Deed recording is complete once the case is finalized, which is when funding unlocks.
		const unlockedAt = dash.fundingUnlockedAt;
		if (unlockedAt && unlockedAt <= daysAgo(14) && isHomeowner && !isDone(statusOf('homestead'))) {
			await raise(
				'homestead_followup_incomplete',
				'attention',
				'Deed recorded more than 14 days ago and homestead follow-up is still incomplete',
			);
		}

		if (readyAt <= daysAgo(30)) {
			const progress = computeFundingProgress(flagsFromDashboard(dash), dash.milestones, {
				fundingUnlockedAt: dash.fundingUnlockedAt,
			});
			const stalled =
				!progress.prepareComplete ||
				(!progress.completePhaseLocked && progress.complete.done < progress.complete.total);
			if (stalled) {
				await raise(
					'stalled_30d',
					'attention',
					'Key applicable milestones still incomplete 30 days after documents were ready',
				);
			}
		}
	}

	return raised;
}
