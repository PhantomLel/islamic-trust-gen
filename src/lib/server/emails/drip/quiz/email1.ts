import { amanaMarketingEmailDocument, escapeHtmlText } from '../../layout';
import { dripHero, dripSection, dripCtaCard, dripClosing, dripBody } from '../helpers';
import type { QuizResult } from '$lib/server/db/schema';

export const SUBJECT = 'Your Islamic estate planning recommendation';
export const PREVIEW = 'Here is the path that appears to fit your answers.';

type ResultConfig = {
	label: string;
	explanation: string;
	primaryLabel: string;
	primaryUrl: string;
};

function resultConfig(result: QuizResult, urls: { quizUrl: string; trustUrl: string; willUrl: string; consultUrl: string }): ResultConfig {
	switch (result) {
		case 'free_will_only':
			return {
				label: 'Free Will Only',
				explanation:
					'Your answers suggest that you may be in an early or relatively simple planning stage. A free Islamic will may be a reasonable first step. It is not a full estate plan and may not avoid probate, but it helps you begin documenting your wishes in a Shariah-conscious way.',
				primaryLabel: 'Start / Finish Free Islamic Will',
				primaryUrl: urls.willUrl,
			};
		case 'goodtree_fit':
			return {
				label: 'GoodTree App Fit',
				explanation:
					'Your answers suggest that GoodTree Trust may be a good fit. This generally means your situation appears straightforward enough for a guided trust process, while still benefiting from attorney-backed structure and review.',
				primaryLabel: 'Start GoodTree Trust',
				primaryUrl: urls.trustUrl,
			};
		case 'legacy_consult':
			return {
				label: 'Legacy Plan Consult Recommended',
				explanation:
					'Your answers suggest that attorney-guided planning is likely better than self-service. This may be because of home ownership, minor children, family dynamics, comfort level, or other facts that deserve direct review.',
				primaryLabel: 'Book a Legacy Plan Consult',
				primaryUrl: urls.consultUrl,
			};
		case 'advanced_consult':
			return {
				label: 'Advanced / Business Consult Recommended',
				explanation:
					'Your answers suggest complexity that should not be handled casually through a self-service flow. Business ownership, multiple properties, special needs concerns, advanced charitable planning, large estates, or community property allocation issues should be reviewed directly.',
				primaryLabel: 'Book an Advanced Planning Consult',
				primaryUrl: urls.consultUrl,
			};
	}
}

export function quizEmail1(opts: {
	firstName: string;
	quizResult: QuizResult;
	quizUrl: string;
	trustUrl: string;
	willUrl: string;
	consultUrl: string;
	unsubscribeUrl: string;
}): string {
	const cfg = resultConfig(opts.quizResult, opts);

	const resultBlock = `
          <tr>
            <td style="padding:20px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a3a;border-radius:10px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:3px;color:#7fbfae;text-transform:uppercase;font-weight:600;">Your recommendation</p>
                    <p style="margin:0 0 12px 0;font-family:'Lora',Georgia,serif;font-size:20px;font-weight:500;color:#f5f0eb;">${escapeHtmlText(cfg.label)}</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#d4e0db;">${escapeHtmlText(cfg.explanation)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

	const mainRows = `
${dripHero(`Assalamu alaykum, ${opts.firstName}`, 'Thank you for completing the Islamic estate planning quiz.')}
${dripSection({
	eyebrow: 'Based on your answers',
	title: 'Your recommendation is ready',
	bodyHtml: dripBody(['The purpose of this quiz is not to pressure you into the most expensive option. It is to help you avoid the wrong path.']),
	borderTop: true,
})}
${resultBlock}
${dripSection({
	eyebrow: '',
	bodyHtml: dripBody(['Some families are fine starting with a free Islamic will. Some are good candidates for GoodTree Trust. Others should not rely on self-service because their situation needs attorney strategy. Your next step is below.']),
	borderTop: false,
})}
${dripCtaCard({
	primaryLabel: cfg.primaryLabel,
	primaryUrl: cfg.primaryUrl,
	secondaryLinks: [{ label: 'Book a Consult', url: opts.consultUrl }],
})}
${dripClosing('If you are unsure, the safer step is to book a consult so your facts can be reviewed directly.')}`;

	return amanaMarketingEmailDocument(SUBJECT, mainRows, {
		previewText: PREVIEW,
		unsubscribeUrl: opts.unsubscribeUrl,
	});
}
