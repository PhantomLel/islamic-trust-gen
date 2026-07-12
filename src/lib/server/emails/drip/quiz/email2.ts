import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody, dripBullets } from '../helpers';
import type { QuizResult } from '$lib/server/db/schema';

export const SUBJECT = 'Why the right estate plan depends on your facts';
export const PREVIEW = 'The same document is not right for every Muslim family.';

function getPrimaryAction(result: QuizResult, urls: { quizUrl: string; trustUrl: string; willUrl: string; consultUrl: string }) {
	switch (result) {
		case 'free_will_only': return { label: 'Start Your Free Islamic Will', url: urls.willUrl };
		case 'goodtree_fit': return { label: 'Start GoodTree Trust', url: urls.trustUrl };
		case 'legacy_consult':
		case 'advanced_consult': return { label: 'Book a Consult', url: urls.consultUrl };
	}
}

export function quizEmail2(opts: {
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
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'Islamic estate planning is not just about inserting Shariah fractions into a document.')}
${dripSection({
	eyebrow: 'Facts determine fit',
	title: 'The right plan depends on your situation',
	bodyHtml:
		dripBody(['The right plan depends on practical facts:']) +
		dripBullets([
			'Do you own a home?',
			'Do you have minor children?',
			'Do you own a business?',
			'Is there a blended family issue?',
			'Are there special needs concerns?',
			'Do you want to avoid probate?',
			'Are there community property questions?',
			'Do you want charitable giving or waqf planning?',
		]) +
		dripBody([
			'That is why the quiz routes people differently.',
			'A simple user should not be forced into a full attorney process if a guided app can work. But a complex user should not be pushed into self-service just because it is easier to buy.',
			'The goal is fit.',
			'Based on your quiz result, your recommended next step is still here:',
		]),
})}
${dripCtaCard({
	primaryLabel: primary.label,
	primaryUrl: primary.url,
	secondaryLinks: [{ label: 'Book a Consult', url: opts.consultUrl }],
})}
${dripClosing('May Allah guide you to the right path for your family.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
