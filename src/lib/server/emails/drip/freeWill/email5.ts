import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';

export const SUBJECT = 'Do not leave this half-finished';
export const PREVIEW = 'You already took the first step. Now decide whether your family needs the next one.';

export function freeWillEmail5(opts: {
	firstName: string;
	quizUrl: string;
	trustUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'You already did something important: you started your Islamic estate planning.')}
${dripSection({
	eyebrow: 'Do not stop here',
	title: 'Leaving it half-finished is the danger',
	bodyHtml: dripBody([
		'Most families do not fail because they rejected estate planning. They fail because they meant to finish it later. Then later becomes months. Months become years. And if something happens, the family is left with confusion, court involvement, or a plan that does not actually work the way everyone assumed.',
		'You do not have to do everything today. But you should decide your next step.',
		'If you are unsure, take the quiz.',
		'If you know you want a trust-based plan and your estate is straightforward, start GoodTree Trust.',
		'If you want attorney guidance or have complexity, book a consult.',
	]),
})}
${dripCtaCard({
	primaryLabel: 'Choose Your Next Step',
	primaryUrl: opts.quizUrl,
	secondaryLinks: [
		{ label: 'Take the Quiz', url: opts.quizUrl },
		{ label: 'Start GoodTree Trust', url: opts.trustUrl },
		{ label: 'Book a Consult', url: opts.consultUrl },
	],
})}
${dripClosing('May Allah put barakah in your planning and make it a means of protection for your family.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
