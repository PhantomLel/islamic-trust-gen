import { db } from '$lib/server/db';
import {
	helpConversation,
	helpQuery,
	helpTemplate,
	type HelpRenderedResponse,
	type HelpSurface,
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redactSensitiveText } from '$lib/help/redact';
import { detectTriggers, mergeTriggerLists, highestTier } from '$lib/help/triggers';
import { ratchetTier } from '$lib/help/keywordNet';
import {
	isDraftingRequest,
	isFaraidCalculationRequest,
	isRecommendationQuestion,
} from '$lib/help/recommendationRules';
import { resolveResponsePolicy } from '$lib/help/responsePolicy';
import { HELP_RERANK_THRESHOLDS_VERSION } from '$lib/help/decisions';
import { getHelpSettings } from '$lib/server/help/settings';
import { listServableEntries } from '$lib/server/help/servability';
import { passesRerankGate, rerankCorpus, RerankProviderError } from '$lib/server/help/rerank';
import { verifyTopEntry } from '$lib/server/help/verify';
import { persistEscalationAndBlocks } from '$lib/server/help/escalate';
import { assertHelpProvidersReadyForProduction } from '$lib/server/help/contracts';
import { checkHelpRateLimit } from '$lib/server/help/rateLimit';

export type HelpQueryRequest = {
	userId: string;
	trustId?: number | null;
	surface: HelpSurface;
	stepKey?: string | null;
	conversationId?: number | null;
	question: string;
};

export type HelpQueryResponse = {
	conversationId: number;
	queryId: number;
	rendered: HelpRenderedResponse;
};

async function loadTemplateBody(templateId: string | undefined): Promise<string | null> {
	if (!templateId) return null;
	const row = await db.query.helpTemplate.findFirst({
		where: eq(helpTemplate.templateId, templateId),
	});
	if (!row || row.status !== 'approved') return null;
	return row.body;
}

export async function processHelpQuery(req: HelpQueryRequest): Promise<HelpQueryResponse> {
	assertHelpProvidersReadyForProduction();

	await checkHelpRateLimit(req.userId, 'query');

	const settings = await getHelpSettings();
	const redacted = redactSensitiveText(req.question.trim());
	const deterministicTriggers = detectTriggers(redacted.text);

	if (isRecommendationQuestion(redacted.text)) {
		deterministicTriggers.push({ code: 'best_choice', tier: '3', templateId: 'E-9' });
	}
	if (isDraftingRequest(redacted.text) || isFaraidCalculationRequest(redacted.text)) {
		deterministicTriggers.push({ code: 'drafting_request', tier: '2', blocksStep: true });
	}

	let conversationId = req.conversationId ?? null;
	if (conversationId) {
		const existing = await db.query.helpConversation.findFirst({
			where: eq(helpConversation.id, conversationId),
		});
		if (!existing || existing.userId !== req.userId) {
			throw new Error('Conversation not found');
		}
	} else {
		const [created] = await db
			.insert(helpConversation)
			.values({
				userId: req.userId,
				trustId: req.trustId ?? null,
				surface: req.surface,
				stepKey: req.stepKey ?? null,
				turnCount: 0,
			})
			.returning({ id: helpConversation.id });
		conversationId = created.id;
	}

	const convo = await db.query.helpConversation.findFirst({
		where: eq(helpConversation.id, conversationId!),
	});
	const turnIndex = convo?.turnCount ?? 0;

	let selectedEntry = null;
	let rerankScore: number | null = null;
	let runnerUpScore: number | null = null;
	let verifierAccepted = false;
	let providerFailure = false;
	let matchedIds: string[] = [];

	const templateFromTrigger = deterministicTriggers.find((t) => t.templateId)?.templateId;
	let templateBody = await loadTemplateBody(templateFromTrigger);

	if (!redacted.hadSensitiveData) {
		try {
			const corpus = await listServableEntries({ entryTypes: ['faq'] });
			const ranked = await rerankCorpus(redacted.text, corpus, req.stepKey ?? undefined);
			matchedIds = ranked.map((r) => r.sourceId);
			const gate = passesRerankGate(ranked);
			rerankScore = gate.top?.score ?? null;
			runnerUpScore = gate.runnerUp ?? null;

			if (gate.ok && gate.top) {
				selectedEntry = corpus.find((e) => e.sourceId === gate.top!.sourceId) ?? null;
				if (selectedEntry) {
					const verification = await verifyTopEntry(redacted.text, selectedEntry);
					verifierAccepted = verification.accept;
					const extra = verification.triggerCodes.map((code) => ({
						code,
						tier: '3' as const,
					}));
					deterministicTriggers.push(...extra);
				}
			}
		} catch (err) {
			if (err instanceof RerankProviderError) providerFailure = true;
			else throw err;
		}
	}

	const allTriggers = mergeTriggerLists(deterministicTriggers, []);
	const sessionTier = ratchetTier(
		(convo?.maxTier as import('$lib/server/db/help.schema').HelpEscalationTier | null) ?? null,
		highestTier(allTriggers),
	);
	const lowConfidence = providerFailure || !verifierAccepted || !selectedEntry;

	const rendered = resolveResponsePolicy({
		triggers: allTriggers,
		sensitiveData: redacted.hadSensitiveData,
		lowConfidence,
		verifierAccepted,
		entry: selectedEntry,
		templateBody,
		settings,
	});

	const [queryRow] = await db
		.insert(helpQuery)
		.values({
			conversationId: conversationId!,
			userId: req.userId,
			turnIndex,
			questionText: redacted.text,
			matchedEntryIds: matchedIds,
			selectedEntrySourceId: selectedEntry?.sourceId ?? null,
			resolvedTier: sessionTier,
			triggerCodes: allTriggers.map((t) => t.code),
			rerankScore: rerankScore?.toString() ?? null,
			runnerUpScore: runnerUpScore?.toString() ?? null,
			thresholdConfigVersion: HELP_RERANK_THRESHOLDS_VERSION,
			providerModelVersions: { rerank: 'rerank-2.5', verifier: 'gpt-4o-mini' },
			renderedResponse: rendered,
			ctaShown: rendered.cta?.key ?? null,
			unanswered: rendered.kind === 'fallback' || rendered.kind === 'do_not_answer',
			hasRedaction: redacted.hadSensitiveData,
		})
		.returning({ id: helpQuery.id });

	await db
		.update(helpConversation)
		.set({
			turnCount: turnIndex + 1,
			lastMessageAt: new Date(),
			hasRedaction: redacted.hadSensitiveData || convo?.hasRedaction,
			maxTier: sessionTier ?? convo?.maxTier ?? null,
			updatedAt: new Date(),
		})
		.where(eq(helpConversation.id, conversationId!));

	await persistEscalationAndBlocks({
		queryId: queryRow.id,
		conversationId: conversationId!,
		userId: req.userId,
		trustId: req.trustId ?? null,
		surface: req.surface,
		stepKey: req.stepKey ?? null,
		triggers: allTriggers,
		rendered,
		sensitiveData: redacted.hadSensitiveData,
	});

	return {
		conversationId: conversationId!,
		queryId: queryRow.id,
		rendered,
	};
}
