import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBullets, dripBody } from '../helpers';

export const SUBJECT = 'Still deciding? Here is the honest GoodTree vs consult test';
export const PREVIEW = 'GoodTree is not for every family. Here is how to decide.';

export function appStartedEmail4(opts: {
	firstName: string;
	continueUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'If you are still deciding whether to finish GoodTree, use this simple test.')}
${dripSection({
	eyebrow: 'GoodTree vs Consult',
	title: 'The honest test',
	bodyHtml:
		dripBody(['GoodTree may be a good fit if:']) +
		dripBullets([
			'Your estate is relatively straightforward',
			'You want a trust-based plan',
			'You are comfortable using a guided online process',
			'You mainly need a clear structure with attorney-backed documents and instructions',
		]) +
		dripBody(['A consult is likely better if:']) +
		dripBullets([
			'You have a business',
			'You own multiple properties',
			'You have a blended family',
			'You have a special needs beneficiary',
			'You have major community property questions',
			'You have advanced charitable goals',
			'You have a large taxable estate',
			'You have significant anxiety about choosing the wrong structure',
		]) +
		dripBody([
			'The wrong move is not choosing the consult.',
			'The wrong move is doing nothing.',
		]),
})}
${dripCtaCard({
	primaryLabel: 'Continue GoodTree',
	primaryUrl: opts.continueUrl,
	secondaryLinks: [{ label: 'Book a Consult', url: opts.consultUrl }],
})}
${dripClosing('May Allah make the right path clear to you.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
