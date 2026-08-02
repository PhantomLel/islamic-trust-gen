import { db } from '$lib/server/db';
import {
	helpEscalation,
	helpStepBlock,
	type HelpRenderedResponse,
	type HelpSurface,
} from '$lib/server/db/schema';
import type { TriggerMatch } from '$lib/help/triggers';
import { highestTier } from '$lib/help/triggers';
import { notifyHelpEscalation } from '$lib/server/help/notify';
import { eq, and } from 'drizzle-orm';

export type EscalationPersistInput = {
	queryId: number;
	conversationId: number;
	userId: string;
	trustId: number | null;
	surface: HelpSurface;
	stepKey: string | null;
	triggers: TriggerMatch[];
	rendered: HelpRenderedResponse;
	sensitiveData: boolean;
};

export async function persistEscalationAndBlocks(input: EscalationPersistInput): Promise<void> {
	const tier = input.sensitiveData ? '1' : highestTier(input.triggers);
	if (!tier || (tier !== '1' && tier !== '2')) return;

	const triggerCode =
		input.triggers[0]?.code ?? (input.sensitiveData ? 'sensitive_data' : 'unknown');

	const [esc] = await db
		.insert(helpEscalation)
		.values({
			queryId: input.queryId,
			conversationId: input.conversationId,
			userId: input.userId,
			trustId: input.trustId,
			surface: input.surface,
			stepKey: input.stepKey,
			tier,
			triggerCode,
			responsePolicy: input.rendered.kind,
			status: 'open',
		})
		.returning({ id: helpEscalation.id });

	if (tier === '2' && input.stepKey && input.triggers.some((t) => t.blocksStep)) {
		await db.insert(helpStepBlock).values({
			userId: input.userId,
			trustId: input.trustId,
			surface: input.surface,
			stepKey: input.stepKey,
			escalationId: esc.id,
			active: true,
		});
	}

	if (tier === '1') {
		await notifyHelpEscalation({
			escalationId: esc.id,
			tier,
			triggerCode,
			userId: input.userId,
			surface: input.surface,
			stepKey: input.stepKey,
		});
	}
}

export async function isStepBlocked(
	userId: string,
	surface: HelpSurface,
	stepKey: string,
): Promise<boolean> {
	const rows = await db
		.select({ id: helpStepBlock.id })
		.from(helpStepBlock)
		.where(
			and(
				eq(helpStepBlock.userId, userId),
				eq(helpStepBlock.surface, surface),
				eq(helpStepBlock.stepKey, stepKey),
				eq(helpStepBlock.active, true),
			),
		)
		.limit(1);
	return rows.length > 0;
}

export async function loadHelpBlockedStepsForUser(
	userId: string,
	surface: HelpSurface,
): Promise<string[]> {
	const blocks = await db
		.select({ stepKey: helpStepBlock.stepKey })
		.from(helpStepBlock)
		.where(
			and(
				eq(helpStepBlock.userId, userId),
				eq(helpStepBlock.surface, surface),
				eq(helpStepBlock.active, true),
			),
		);
	return blocks.map((b) => b.stepKey);
}

export async function resolveStepBlock(
	escalationId: number,
	adminUserId: string,
	note?: string,
): Promise<void> {
	await db
		.update(helpEscalation)
		.set({
			status: 'resolved',
			resolvedAt: new Date(),
			resolvedBy: adminUserId,
			resolutionNote: note ?? null,
			updatedAt: new Date(),
		})
		.where(eq(helpEscalation.id, escalationId));

	const esc = await db.query.helpEscalation.findFirst({
		where: eq(helpEscalation.id, escalationId),
	});
	if (esc?.stepKey) {
		await db
			.update(helpStepBlock)
			.set({ active: false, resolvedAt: new Date() })
			.where(
				and(
					eq(helpStepBlock.userId, esc.userId),
					eq(helpStepBlock.surface, esc.surface ?? 'create_trust'),
					eq(helpStepBlock.stepKey, esc.stepKey),
					eq(helpStepBlock.active, true),
				),
			);
	}
}
