import type { SequenceName } from './sequences';
import type { DripLinks } from './links';
import type { QuizResult } from '$lib/server/db/schema';

import { freeWillEmail2 } from '$lib/server/emails/drip/freeWill/email2';
import { freeWillEmail3 } from '$lib/server/emails/drip/freeWill/email3';
import { freeWillEmail4 } from '$lib/server/emails/drip/freeWill/email4';
import { freeWillEmail5 } from '$lib/server/emails/drip/freeWill/email5';

import { quizEmail1 } from '$lib/server/emails/drip/quiz/email1';
import { quizEmail2 } from '$lib/server/emails/drip/quiz/email2';
import { quizEmail3 } from '$lib/server/emails/drip/quiz/email3';
import { quizEmail4 } from '$lib/server/emails/drip/quiz/email4';
import { quizEmail5 } from '$lib/server/emails/drip/quiz/email5';

import { appStartedEmail1 } from '$lib/server/emails/drip/appStarted/email1';
import { appStartedEmail2 } from '$lib/server/emails/drip/appStarted/email2';
import { appStartedEmail3 } from '$lib/server/emails/drip/appStarted/email3';
import { appStartedEmail4 } from '$lib/server/emails/drip/appStarted/email4';
import { appStartedEmail5 } from '$lib/server/emails/drip/appStarted/email5';

type LeadSnapshot = {
	firstName: string;
	quizResult: QuizResult | null | undefined;
};

export function renderDripEmail(opts: {
	sequence: SequenceName;
	emailKey: string;
	lead: LeadSnapshot;
	links: DripLinks;
}): string | null {
	const { sequence, emailKey, lead, links } = opts;
	const name = lead.firstName || 'friend';

	if (sequence === 'free_will_lead') {
		switch (emailKey) {
			case 'fw_email2': return freeWillEmail2({ firstName: name, quizUrl: links.quizUrl, trustUrl: links.trustUrl, unsubscribeUrl: links.unsubscribeUrl });
			case 'fw_email3': return freeWillEmail3({ firstName: name, quizUrl: links.quizUrl, consultUrl: links.consultUrl, unsubscribeUrl: links.unsubscribeUrl });
			case 'fw_email4': return freeWillEmail4({ firstName: name, quizUrl: links.quizUrl, trustUrl: links.trustUrl, consultUrl: links.consultUrl, unsubscribeUrl: links.unsubscribeUrl });
			case 'fw_email5': return freeWillEmail5({ firstName: name, quizUrl: links.quizUrl, trustUrl: links.trustUrl, consultUrl: links.consultUrl, unsubscribeUrl: links.unsubscribeUrl });
		}
	}

	if (sequence === 'quiz_lead') {
		const quizResult = lead.quizResult ?? 'goodtree_fit';
		const quizOpts = { firstName: name, quizResult, quizUrl: links.quizUrl, trustUrl: links.trustUrl, willUrl: links.willUrl, consultUrl: links.consultUrl, unsubscribeUrl: links.unsubscribeUrl };
		switch (emailKey) {
			case 'quiz_email1': return quizEmail1(quizOpts);
			case 'quiz_email2': return quizEmail2(quizOpts);
			case 'quiz_email3': return quizEmail3(quizOpts);
			case 'quiz_email4': return quizEmail4(quizOpts);
			case 'quiz_email5': return quizEmail5(quizOpts);
		}
	}

	if (sequence === 'app_started') {
		const appOpts = { firstName: name, continueUrl: links.continueUrl, consultUrl: links.consultUrl, unsubscribeUrl: links.unsubscribeUrl };
		switch (emailKey) {
			case 'app_email1': return appStartedEmail1(appOpts);
			case 'app_email2': return appStartedEmail2(appOpts);
			case 'app_email3': return appStartedEmail3(appOpts);
			case 'app_email4': return appStartedEmail4(appOpts);
			case 'app_email5': return appStartedEmail5(appOpts);
		}
	}

	console.warn(`[drip] No template found for ${sequence}/${emailKey}`);
	return null;
}
