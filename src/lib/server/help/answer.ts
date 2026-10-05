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
import { notifyHelpQuestion } from '$lib/server/help/notify';
import { getLatestEntryVersionId } from '$lib/server/help/governance';
import { entryDisplayTitle, hrefForEntry, publishedAnswerHref } from '$lib/server/help/contentLinks';
import { getPublishedPageBySlug } from '$lib/server/content/pages';
import type { HelpDidYouMeanItem } from '$lib/server/db/help.schema';

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
	let matchedIds: number[] = [];
	let corpusForDidYouMean: Awaited<ReturnType<typeof listServableEntries>> = [];
	let rankedForDidYouMean: Awaited<ReturnType<typeof rerankCorpus>> = [];

	const templateFromTrigger = deterministicTriggers.find((t) => t.templateId)?.templateId;
	let templateBody = await loadTemplateBody(templateFromTrigger);

	if (!redacted.hadSensitiveData) {
		try {
			const corpus = await listServableEntries({ entryTypes: ['faq'] });
			corpusForDidYouMean = corpus;
			const ranked = await rerankCorpus(redacted.text, corpus, req.stepKey ?? undefined);
			rankedForDidYouMean = ranked;
			matchedIds = ranked.map((r) => r.entryId);
			const gate = passesRerankGate(ranked);
			rerankScore = gate.top?.score ?? null;
			runnerUpScore = gate.runnerUp ?? null;

			if (gate.ok && gate.top) {
				selectedEntry = corpus.find((e) => e.id === gate.top!.entryId) ?? null;
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

	let didYouMean: HelpDidYouMeanItem[] | undefined;
	if (lowConfidence && rankedForDidYouMean.length && corpusForDidYouMean.length) {
		const byId = new Map(corpusForDidYouMean.map((e) => [e.id, e]));
		const items: HelpDidYouMeanItem[] = [];
		for (const r of rankedForDidYouMean) {
			if (items.length >= 5) break;
			const e = byId.get(r.entryId);
			if (!e) continue;
			items.push({ title: entryDisplayTitle(e), href: await hrefForEntry(e) });
		}
		if (items.length) didYouMean = items;
	}

	let relatedArticle: { title: string; href: string } | undefined;
	if (selectedEntry?.contentPageSlug) {
		const href = await publishedAnswerHref(selectedEntry.contentPageSlug);
		if (href) {
			const pub = await getPublishedPageBySlug(selectedEntry.contentPageSlug);
			relatedArticle = { title: pub?.page.title || selectedEntry.contentPageSlug, href };
		}
	}

	const rendered = resolveResponsePolicy({
		triggers: allTriggers,
		sensitiveData: redacted.hadSensitiveData,
		lowConfidence,
		verifierAccepted,
		entry: selectedEntry,
		templateBody,
		settings,
		didYouMean,
		relatedArticle,
	});

	const kbEntryVersionId =
		selectedEntry && !lowConfidence ? await getLatestEntryVersionId(selectedEntry.id) : null;

	const [queryRow] = await db
		.insert(helpQuery)
		.values({
			conversationId: conversationId!,
			userId: req.userId,
			turnIndex,
			questionText: redacted.text,
			matchedEntryIds: matchedIds,
			selectedEntryId: selectedEntry?.id ?? null,
			kbEntryVersionId,
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

	void notifyHelpQuestion({
		queryId: queryRow.id,
		conversationId: conversationId!,
		userId: req.userId,
		surface: req.surface,
		stepKey: req.stepKey ?? null,
		questionText: redacted.text,
		responseKind: rendered.kind,
	});

	return {
		conversationId: conversationId!,
		queryId: queryRow.id,
		rendered,
	};
}
