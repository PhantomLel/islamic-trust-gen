import { env } from '$env/dynamic/private';
import { HELP_PROVIDER_MODELS } from '$lib/help/decisions';
import type { ServableEntry } from '$lib/server/help/servability';

export type VerifierResult = {
	accept: boolean;
	triggerCodes: string[];
};

const ALLOWED_TRIGGERS = new Set([
	'death_actual',
	'signed_error',
	'litigation',
	'sensitive_data',
	'best_choice',
	'tax_question',
	'fatwa',
	'outside_state',
	'blended_family',
	'special_needs',
]);

export async function verifyTopEntry(
	question: string,
	entry: ServableEntry,
): Promise<VerifierResult> {
	if (!env.OPENAI_API_KEY?.trim()) {
		return { accept: true, triggerCodes: [] };
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 12_000);

	try {
		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: HELP_PROVIDER_MODELS.openaiVerifier,
				temperature: 0,
				response_format: {
					type: 'json_schema',
					json_schema: {
						name: 'help_verifier',
						strict: true,
						schema: {
							type: 'object',
							properties: {
								accept: { type: 'boolean' },
								triggerCodes: { type: 'array', items: { type: 'string' } },
							},
							required: ['accept', 'triggerCodes'],
							additionalProperties: false,
						},
					},
				},
				messages: [
					{
						role: 'system',
						content:
							'You verify whether an approved Good Tree KB entry answers the user question. Return accept=true only if the entry directly answers the question. Return trigger codes from the provided taxonomy when detected. Never write prose.',
					},
					{
						role: 'user',
						content: JSON.stringify({
							question,
							entryId: entry.id,
							entryQuestion: entry.question,
							alsoAnswers: entry.alsoAnswers ?? [],
							approvedAnswer: entry.userFacingAnswer,
							triggerTaxonomy: [...ALLOWED_TRIGGERS],
						}),
					},
				],
			}),
			signal: controller.signal,
		});

		if (!res.ok) return { accept: false, triggerCodes: [] };
		const data = (await res.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		const content = data.choices?.[0]?.message?.content;
		if (!content) return { accept: false, triggerCodes: [] };
		const parsed = JSON.parse(content) as VerifierResult;
		return {
			accept: Boolean(parsed.accept),
			triggerCodes: (parsed.triggerCodes ?? []).filter((c) => ALLOWED_TRIGGERS.has(c)),
		};
	} catch {
		return { accept: false, triggerCodes: [] };
	} finally {
		clearTimeout(timeout);
	}
}
