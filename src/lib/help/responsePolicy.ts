import { GENERAL_INFORMATION_FOOTER } from '$lib/help/decisions';
import type { HelpRenderedResponse } from '$lib/server/db/help.schema';
import type { ServableEntry } from '$lib/server/help/servability';
import type { HelpSettings } from '$lib/server/help/settingsDefaults';
import type { TriggerMatch } from '$lib/help/triggers';
import { highestTier } from '$lib/help/triggers';
import type { KbClassificationBase } from '$lib/server/db/help.schema';

export type ResponsePolicyInput = {
	triggers: TriggerMatch[];
	sensitiveData: boolean;
	lowConfidence: boolean;
	verifierAccepted: boolean;
	entry: ServableEntry | null;
	templateBody?: string | null;
	settings: HelpSettings;
};

export function resolveResponsePolicy(input: ResponsePolicyInput): HelpRenderedResponse {
	const footer = GENERAL_INFORMATION_FOOTER;
	const consultCta = {
		key: 'consult',
		label: input.settings.consultCtaLabel,
		target: input.settings.consultBookingUrl,
	};
	const supportCta = {
		key: 'support',
		label: input.settings.generalSupportContactLabel,
		target: `mailto:${input.settings.supportEmail}`,
	};
	const urgentCta = {
		key: 'urgent',
		label: input.settings.urgentCtaLabel,
		target: `mailto:${input.settings.supportEmail}`,
	};

	if (input.sensitiveData) {
		return {
			kind: 'sensitive_data',
			shortAnswer:
				'Please do not share passwords, seed phrases, private keys, SSNs, full account numbers, bank logins, or photos of IDs here. The Good Tree app will never ask for crypto seed phrases or private keys.',
			footer,
			cta: supportCta,
		};
	}

	const tier = highestTier(input.triggers);
	if (tier === '1') {
		return {
			kind: 'tier1',
			shortAnswer:
				input.templateBody ??
				'Please contact the office before continuing. The Help Assistant steps back for urgent matters like this.',
			footer,
			cta: urgentCta,
		};
	}

	if (!input.entry || !input.verifierAccepted || input.lowConfidence) {
		return {
			kind: 'fallback',
			shortAnswer:
				'I do not have an approved answer for that yet. Try rephrasing your question. If that doesn\'t work, please contact our team so we can give you a real answer instead of a guess.',
			footer,
			cta: supportCta,
		};
	}

	const classification: KbClassificationBase | null = input.entry.classificationBase;
	if (classification === 'do_not_answer') {
		return {
			kind: 'do_not_answer',
			shortAnswer: input.templateBody ?? input.entry.userFacingAnswer ?? '',
			entryId: input.entry.id,
			footer,
			cta: consultCta,
		};
	}

	if (tier === '2') {
		return {
			kind: 'tier2',
			shortAnswer: input.entry.userFacingAnswer ?? '',
			entryId: input.entry.id,
			learnMore: {
				appMeaning: input.entry.goodTreeAppMeaning ?? undefined,
				nextStep: input.entry.userNextStep ?? undefined,
			},
			footer,
			cta: consultCta,
			blockedStep: input.triggers.some((t) => t.blocksStep),
		};
	}

	if (classification === 'consult_trigger' || tier === '3') {
		return {
			kind: classification === 'consult_trigger' ? 'consult_trigger' : 'tier3',
			shortAnswer: input.entry.userFacingAnswer ?? '',
			entryId: input.entry.id,
			learnMore: {
				appMeaning: input.entry.goodTreeAppMeaning ?? undefined,
				nextStep: input.entry.userNextStep ?? undefined,
			},
			footer,
			cta: consultCta,
		};
	}

	return {
		kind: 'safe_answer',
		shortAnswer: input.entry.userFacingAnswer ?? '',
		entryId: input.entry.id,
		learnMore: {
			appMeaning: input.entry.goodTreeAppMeaning ?? undefined,
			nextStep: input.entry.userNextStep ?? undefined,
		},
		footer,
	};
}
