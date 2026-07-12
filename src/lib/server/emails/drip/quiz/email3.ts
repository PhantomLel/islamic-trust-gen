import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';
import type { QuizResult } from '$lib/server/db/schema';

export const SUBJECT = 'The biggest mistake is choosing based only on price';
export const PREVIEW = 'A cheaper plan is not cheaper if it leaves your family with court, confusion, or conflict.';

function getPrimaryAction(result: QuizResult, urls: { quizUrl: string; trustUrl: string; willUrl: string; consultUrl: string }) {
	switch (result) {
		case 'free_will_only': return { label: 'Start Your Free Islamic Will', url: urls.willUrl };
		case 'goodtree_fit': return { label: 'Start GoodTree Trust', url: urls.trustUrl };
		case 'legacy_consult':
		case 'advanced_consult': return { label: 'Book a Consult', url: urls.consultUrl };
	}
}

export function quizEmail3(opts: {
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
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'It is natural to compare estate planning options by price. But price is not the only question.')}
${dripSection({
	eyebrow: 'Choosing wisely',
	title: 'The risk of choosing based only on cost',
	bodyHtml: dripBody([
		'A plan that is too simple for your situation can leave your family with problems later: probate, unclear trustee authority, minor-child complications, business disputes, or assets that were never properly coordinated with the plan.',
		'At the same time, not everyone needs full-service attorney planning. If your facts are straightforward, a guided app may be the right balance.',
		'That is why your quiz result matters. It is meant to point you toward the level of help that fits your risk.',
		'If your result was GoodTree, you can start the app and move at your own pace.',
		'If your result was Legacy or Advanced, the wise next step is a consult.',
	]),
})}
${dripCtaCard({
	primaryLabel: primary.label,
	primaryUrl: primary.url,
	secondaryLinks: [{ label: 'Ask for Attorney Help', url: opts.consultUrl }],
})}
${dripClosing('May Allah give you clarity and make this easy.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
