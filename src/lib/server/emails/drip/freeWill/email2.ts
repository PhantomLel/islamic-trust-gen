import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';

export const SUBJECT = 'The part most families misunderstand about wills';
export const PREVIEW = 'A will can say who receives your assets. It does not necessarily keep your family out of court.';

export function freeWillEmail2(opts: {
	firstName: string;
	quizUrl: string;
	trustUrl: string;
	unsubscribeUrl: string;
}): string {
	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, '')}
${dripSection({
	eyebrow: 'Estate planning truth',
	title: 'What wills can and cannot do',
	bodyHtml: dripBody([
		'One of the biggest misunderstandings in estate planning is this: "I made a will, so my family will avoid court."',
		'Not necessarily.',
		'A will is often a court document. In many cases, the family still has to present it to probate court after death. That process can create delay, cost, paperwork, and stress at exactly the moment your spouse, children, or parents are grieving.',
		'This matters especially if you own a home.',
		'If the home is still in your individual name when you pass away, your family may need a legal process to transfer it — even if your will says who should receive everything.',
		'That is why many Muslim families use a trust-based plan. A properly funded trust can make administration smoother and can help avoid unnecessary court involvement.',
		'Your free will is a good first step. But if you own a home, have minor children, or want things to be easier for your family, the next step is to see whether a trust makes sense.',
	]),
})}
${dripCtaCard({
	primaryLabel: 'See Whether You Need a Trust',
	primaryUrl: opts.quizUrl,
	secondaryLinks: [{ label: 'Start GoodTree Trust', url: opts.trustUrl }],
})}
${dripClosing('May Allah make this easy for your family.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
