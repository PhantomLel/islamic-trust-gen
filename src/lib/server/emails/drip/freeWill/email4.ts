import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody, dripBullets } from '../helpers';

export const SUBJECT = 'Will, trust, or attorney consult - which path fits you?';
export const PREVIEW = 'The right next step depends on your family, assets, and comfort level.';

export function freeWillEmail4(opts: {
	firstName: string;
	quizUrl: string;
	trustUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'You do not need to become an estate planning expert. You just need the right next step.')}
${dripSection({
	eyebrow: 'Your options, clearly',
	title: 'Which path fits your family?',
	bodyHtml:
		dripBody(['For some people, the free Islamic will is a good starting point. For others — especially homeowners and parents of young children — a trust may be a better fit. And for more complex families, self-service may not be wise at all.']) +
		dripBullets([
			'Free Islamic Will: good first step if you are early, simple, or not ready for a trust.',
			'GoodTree Trust: may fit if you have a straightforward estate, want a trust-based plan, and are comfortable with guided self-service plus attorney review.',
			'Legacy Plan Consult: better if you have a business, multiple properties, blended family, special needs concerns, community property questions, large estate issues, or simply want attorney-guided strategy.',
		]) +
		dripBody(['The quiz is built to route you. It is not there to pressure you. It is there to help you avoid choosing the wrong path.']),
})}
${dripCtaCard({
	primaryLabel: 'Take the Quiz and Get Your Recommendation',
	primaryUrl: opts.quizUrl,
	secondaryLinks: [
		{ label: 'Start GoodTree Trust', url: opts.trustUrl },
		{ label: 'Book a Consult', url: opts.consultUrl },
	],
})}
${dripClosing('May Allah make your path clear.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
