import { env } from '$env/dynamic/private';
import { productNameMidSentence, siteName } from '$lib/config';
import { HELP_PROVIDER_MODELS, HELP_RERANK_DEFAULTS } from '$lib/help/decisions';
import type { ServableEntry } from '$lib/server/help/servability';

export type RerankResult = {
	entryId: number;
	score: number;
}[];

export class RerankProviderError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'RerankProviderError';
	}
}

export async function rerankCorpus(
	query: string,
	entries: ServableEntry[],
	stepHint?: string,
): Promise<RerankResult> {
	if (!env.VOYAGE_API_KEY?.trim()) {
		throw new RerankProviderError('VOYAGE_API_KEY is not configured');
	}
	if (entries.length === 0) return [];
	if (entries.length > 1000) {
		throw new RerankProviderError(`Corpus size ${entries.length} exceeds rerank-2.5 limit of 1000`);
	}

	const instruction = stepHint
		? `Represent the query for retrieving supporting documents about the ${productNameMidSentence()} step "${stepHint}": `
		: `Represent the query for retrieving supporting ${siteName} help documents: `;

	const documents = entries.map(
		(e) => e.rerankDocument ?? e.question ?? e.title ?? String(e.id),
	);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), HELP_RERANK_DEFAULTS.timeoutMs);

	try {
		const res = await fetch('https://api.voyageai.com/v1/rerank', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
			},
			body: JSON.stringify({
				model: HELP_PROVIDER_MODELS.voyageRerank,
				query: instruction + query,
				documents,
				top_k: documents.length,
				truncation: false,
			}),
			signal: controller.signal,
		});

		if (!res.ok) {
			throw new RerankProviderError(`Voyage rerank failed: ${res.status}`);
		}

		const data = (await res.json()) as {
			data?: Array<{ index: number; relevance_score: number }>;
		};

		const ranked = (data.data ?? [])
			.map((row) => ({
				entryId: entries[row.index]?.id,
				score: row.relevance_score ?? 0,
			}))
			.filter((r) => r.entryId != null);

		return ranked.sort((a, b) => b.score - a.score);
	} catch (err) {
		if (err instanceof RerankProviderError) throw err;
		throw new RerankProviderError(err instanceof Error ? err.message : 'Rerank request failed');
	} finally {
		clearTimeout(timeout);
	}
}

export function passesRerankGate(scores: RerankResult): { ok: boolean; top?: RerankResult[0]; runnerUp?: number } {
	if (scores.length === 0) return { ok: false };
	const top = scores[0];
	const runnerUp = scores[1]?.score ?? 0;
	const ok =
		top.score >= HELP_RERANK_DEFAULTS.scoreFloor &&
		top.score - runnerUp >= HELP_RERANK_DEFAULTS.ambiguityMargin;
	return { ok, top, runnerUp };
}
