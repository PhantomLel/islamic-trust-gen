import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';

export const SUBJECT = 'If you have minor children, read this carefully';
export const PREVIEW = 'Minor children can make a basic will feel simpler than it really is.';

export function freeWillEmail3(opts: {
	firstName: string;
	quizUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, '')}
${dripSection({
	eyebrow: 'Planning for your children',
	title: 'When minor children are involved',
	bodyHtml: dripBody([
		'If you have minor children, your estate plan needs more care.',
		'The issue is not only "who inherits?" The issue is also "when and how?"',
		'Under Islamic inheritance, children may have fixed shares. But if a child is young, it may not be wise or practical for that child to receive assets outright. Someone may need to manage the property for the child until the child is mature enough.',
		'A basic will can name guardians and express your intentions, but it may not give your family the cleanest structure for managing inheritance over time.',
		'A trust can help by allowing a responsible trustee to manage assets for children while still respecting Islamic distribution principles.',
		'This is exactly the kind of question GoodTree Trust is designed to help straightforward families think through. And if your situation is more complex, the quiz can route you to a consult instead of leaving you guessing.',
	]),
})}
${dripCtaCard({
	primaryLabel: 'Take the Islamic Estate Planning Quiz',
	primaryUrl: opts.quizUrl,
	secondaryLinks: [{ label: 'Book a Consult', url: opts.consultUrl }],
})}
${dripClosing('May Allah protect your children and put barakah in your planning.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
