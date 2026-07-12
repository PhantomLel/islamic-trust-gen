import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';

export const SUBJECT = 'You started your Islamic estate plan - continue here';
export const PREVIEW = 'You were in the middle of GoodTree Trust. Your progress is saved.';

export function appStartedEmail1(opts: {
	firstName: string;
	continueUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'You started your GoodTree Trust plan, but it looks like you did not finish.')}
${dripSection({
	eyebrow: 'Your progress is saved',
	title: 'Continue where you left off',
	bodyHtml: dripBody([
		'That is completely normal. Many people start, pause, talk to their spouse, gather information, or come back later.',
		'Your progress is saved.',
		'The important thing is not to let this become another unfinished task. Estate planning only protects your family if it is completed, signed correctly, and properly funded.',
		'You can continue where you left off here:',
	]),
})}
${dripCtaCard({
	primaryLabel: 'Continue My Plan',
	primaryUrl: opts.continueUrl,
	secondaryLinks: [{ label: 'Book a Consult Instead', url: opts.consultUrl }],
})}
${dripSection({
	eyebrow: '',
	bodyHtml: dripBody(['If you paused because you were unsure whether GoodTree is right for you, book a consult. It is better to ask before paying than to force a self-service option onto a situation that needs attorney guidance.']),
	borderTop: false,
})}
${dripClosing('May Allah make your planning easy and beneficial.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
