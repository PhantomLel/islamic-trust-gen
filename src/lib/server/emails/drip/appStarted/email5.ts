import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';

export const SUBJECT = 'Last reminder for now: finish or get guidance';
export const PREVIEW = 'You can finish the app or book a consult if you need help deciding.';

export function appStartedEmail5(opts: {
	firstName: string;
	continueUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'This is the last reminder in this sequence.')}
${dripSection({
	eyebrow: 'Final reminder',
	title: 'Finish your plan or get guidance',
	bodyHtml: dripBody([
		'You started GoodTree because protecting your family and following Islamic inheritance matters to you. That was a good instinct.',
		'Now choose the next step.',
		'If your situation is straightforward, continue the app and finish your plan.',
		'If you are unsure or your situation is complex, book a consult and get guidance before moving forward.',
		'What you should not do is let the plan sit unfinished indefinitely.',
	]),
})}
${dripCtaCard({
	primaryLabel: 'Finish My GoodTree Plan',
	primaryUrl: opts.continueUrl,
	secondaryLinks: [{ label: 'Book a Consult', url: opts.consultUrl }],
})}
${dripClosing('May Allah make it easy for you to complete what benefits your family.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
