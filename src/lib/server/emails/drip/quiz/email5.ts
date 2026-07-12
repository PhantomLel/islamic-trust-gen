import { amanaMarketingEmailDocument } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';
import type { QuizResult } from '$lib/server/db/schema';

export const SUBJECT = 'Your quiz result is still waiting';
export const PREVIEW = 'Do not let a good intention turn into another unfinished task.';

function getPrimaryAction(result: QuizResult, urls: { quizUrl: string; trustUrl: string; willUrl: string; consultUrl: string }) {
	switch (result) {
		case 'free_will_only': return { label: 'Start Your Free Islamic Will', url: urls.willUrl };
		case 'goodtree_fit': return { label: 'Start GoodTree Trust', url: urls.trustUrl };
		case 'legacy_consult':
		case 'advanced_consult': return { label: 'Book a Consult', url: urls.consultUrl };
	}
}

export function quizEmail5(opts: {
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
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'You took the quiz because some part of you knew this issue matters. That concern was correct.')}
${dripSection({
	eyebrow: 'One last reminder',
	title: 'Your quiz result is still waiting',
	bodyHtml: dripBody([
		'Estate planning is easy to postpone because it rarely feels urgent today. But when it becomes urgent, it is often too late for the person who needed to plan.',
		'You do not need to solve everything in one sitting. But you should take the next step your quiz recommended.',
		'If your recommendation was GoodTree, start the app.',
		'If your recommendation was Legacy or Advanced, book a consult.',
		'If your recommendation was a free will, complete it and then revisit whether a trust is needed when your family or assets change.',
	]),
})}
${dripCtaCard({
	primaryLabel: primary.label,
	primaryUrl: primary.url,
	secondaryLinks: [{ label: 'Book a Consult', url: opts.consultUrl }],
})}
${dripClosing('May Allah make this easy and put barakah in your effort.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
