import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBullets, dripBody } from '../helpers';

export const SUBJECT = 'The plan you almost finished is not protecting anyone yet';
export const PREVIEW = 'Starting is good. Completing is what matters.';

export function appStartedEmail3(opts: {
	firstName: string;
	continueUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'Starting your estate plan was a good step. But an unfinished plan does not protect your family.')}
${dripSection({
	eyebrow: 'Why completion matters',
	title: 'An unfinished plan does not protect anyone',
	bodyHtml:
		dripBody(['It does not:']) +
		dripBullets([
			'Avoid probate',
			'Transfer your home',
			'Give your loved ones clear authority',
			'Give your trustee instructions',
			'Solve minor-child planning',
			'Make Islamic distribution easier',
		]) +
		dripBody([
			'Only a completed, properly signed, properly funded plan can do that work.',
			'This is why we send reminders. Not to pressure you, but because delay is the enemy of estate planning.',
			'You can continue from where you stopped:',
		]),
})}
${dripCtaCard({
	primaryLabel: 'Resume My Plan',
	primaryUrl: opts.continueUrl,
	secondaryLinks: [{ label: 'I Need Attorney Help', url: opts.consultUrl }],
})}
${dripClosing('May Allah make it easy for you to complete what benefits your family.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
