import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';

export const SUBJECT = 'What happens after you finish GoodTree?';
export const PREVIEW = 'Here is the process after payment so you know exactly what you are buying.';

export function appStartedEmail2(opts: {
	firstName: string;
	continueUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'A common reason people pause before payment is simple: "What happens after I finish?"')}
${dripSection({
	eyebrow: 'The process explained',
	title: 'Here is what you are getting',
	bodyHtml: dripBody([
		'GoodTree is designed to guide straightforward Muslim families through a trust-based estate planning process. After you complete the information and payment, the process moves toward document preparation and review, instructions, signing, and funding steps such as coordinating the home with the trust when applicable.',
		'The goal is not just to generate papers. The goal is to help you complete a plan your family can actually use.',
		'If your facts show complexity — business ownership, blended family, special needs concerns, multiple properties, major tax concerns, or advanced charity planning — you should not force the app. You should book a consult.',
		'If your situation is straightforward, you can continue the app here:',
	]),
})}
${dripCtaCard({
	primaryLabel: 'Continue GoodTree Trust',
	primaryUrl: opts.continueUrl,
	secondaryLinks: [{ label: 'Book a Consult', url: opts.consultUrl }],
})}
${dripClosing('May Allah bless your family and your estate.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
