import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';
import type { QuizResult } from '$lib/server/db/schema';

export const SUBJECT = 'What happens if you move forward?';
export const PREVIEW = 'Here is what the next step actually looks like.';

function getPrimaryAction(result: QuizResult, urls: { quizUrl: string; trustUrl: string; willUrl: string; consultUrl: string }) {
	switch (result) {
		case 'free_will_only': return { label: 'Start Your Free Islamic Will', url: urls.willUrl };
		case 'goodtree_fit': return { label: 'Start GoodTree Trust', url: urls.trustUrl };
		case 'legacy_consult':
		case 'advanced_consult': return { label: 'Book a Consult', url: urls.consultUrl };
	}
}

export function quizEmail4(opts: {
	firstName: string;
	quizResult: QuizResult;
	quizUrl: string;
	trustUrl: string;
	willUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const primary = getPrimaryAction(opts.quizResult, opts);

	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'Sometimes people delay because the next step feels vague. Here is what happens if you move forward.')}
${dripSection({
	eyebrow: 'What to expect',
	title: 'Here is what the process looks like',
	bodyHtml: dripBody([
		'If you start GoodTree Trust, you will be guided through the information needed for a trust-based plan. The process is designed to explain each step, identify complexity, and move you toward documents and signing instructions.',
		'If you book a consult, the purpose is to diagnose your family and asset situation and recommend a clear path. You are not expected to know all the legal answers before the call. That is the point of the consult.',
		'Either way, the goal is the same: make your plan clear, Islamic, and easier for your family to administer.',
	]),
})}
${dripCtaCard({
	primaryLabel: primary.label,
	primaryUrl: primary.url,
	secondaryLinks: [{ label: 'Book a Consult', url: opts.consultUrl }],
})}
${dripClosing('May Allah put barakah in whatever step you take next.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
