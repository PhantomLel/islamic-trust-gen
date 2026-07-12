import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { enrollLead } from '$lib/server/drip/enroll';
import type { QuizResult } from '$lib/server/db/schema';

type QuizLeadBody = {
	email: string;
	firstName: string;
	/** Quiz tier: 'free-will' | 'goodtree' | 'legacy' */
	tier: string;
	waqf: boolean;
	/** Complexity flags from quiz answers. */
	complexityFlags: string[];
	source?: string;
};

function tierToQuizResult(tier: string, waqf: boolean): QuizResult {
	switch (tier) {
		case 'free-will': return 'free_will_only';
		case 'goodtree': return 'goodtree_fit';
		case 'legacy': return waqf ? 'advanced_consult' : 'legacy_consult';
		default: return 'goodtree_fit';
	}
}

export const POST: RequestHandler = async ({ request }) => {
	let body: QuizLeadBody;
	try {
		body = await request.json() as QuizLeadBody;
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const { email, firstName, tier, waqf, complexityFlags, source } = body;

	if (!email || typeof email !== 'string' || !email.includes('@')) {
		return json({ error: 'A valid email address is required.' }, { status: 400 });
	}
	if (!firstName || typeof firstName !== 'string') {
		return json({ error: 'A first name is required.' }, { status: 400 });
	}

	const quizResult = tierToQuizResult(tier ?? 'goodtree', !!waqf);

	try {
		const result = await enrollLead({
			email: email.trim(),
			firstName: firstName.trim(),
			sequence: 'quiz_lead',
			leadType: 'quiz',
			quizResult,
			quizWaqf: !!waqf,
			complexityFlags: Array.isArray(complexityFlags) ? complexityFlags : [],
			source: typeof source === 'string' ? source : 'quiz',
			sendFirstEmailNow: true,
		});

		if (!result.enrolled) {
			if (result.reason === 'terminal') {
				return json(
					{ success: false, error: 'This email is unsubscribed or no longer eligible for these emails.' },
					{ status: 409 },
				);
			}
			if (result.reason === 'lower_priority') {
				return json(
					{ success: false, error: 'You are already receiving emails from us. Check your inbox for next steps.' },
					{ status: 409 },
				);
			}
			return json({ success: false, error: 'Unable to enroll. Please try again.' }, { status: 500 });
		}

		return json({ success: true });
	} catch (err) {
		console.error('[quiz-lead] Enroll failed:', err);
		return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
	}
};
