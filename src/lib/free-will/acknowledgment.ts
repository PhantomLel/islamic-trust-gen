/**
 * Free Islamic Will — pre-generation acknowledgment gate (ticket A6, which
 * carries B6's self-help disclaimer checkbox on the same screen). Modeled on
 * the clickwrap pattern in `$lib/loe.ts`: a version constant plus the exact
 * checkbox copy, so an accepted agreement can always be reconstructed from a
 * stored version number and checkbox states.
 */

import { requiresCommunityPropertyAcknowledgment } from './logic';
import type { WillResponses } from './config';

export { requiresCommunityPropertyAcknowledgment };

export const ACKNOWLEDGMENT_VERSION = '1.0';

/**
 * Whether the optional heba (mutual gift between spouses) mention renders on
 * the acknowledgment screen. Packet §3.3 flags this line "[LEONARD: KEEP OR
 * CUT]" — flip this one boolean once he decides; no markup changes needed.
 */
export const SHOW_HEBA_MENTION = true;

export type AcknowledgmentCheckboxes = {
	/** B6 — self-help disclaimer, required for every user before generation. */
	selfHelp: boolean;
	/** A6 — community-property/shariah acknowledgment, required for married users in `communityPropertyAckStates`. */
	communityProperty: boolean;
};

export type AcknowledgmentData = {
	version: string;
	/** ISO timestamp recorded on the client at the moment the required boxes were checked. */
	clientTimestamp: string;
	checkboxes: AcknowledgmentCheckboxes;
};

/**
 * True when the stored (or in-progress) acknowledgment satisfies every
 * checkbox this user's situation requires. Used both to gate the "continue"
 * button client-side and to enforce the gate server-side before generation.
 */
export function isAcknowledgmentComplete(
	responses: WillResponses,
	data: AcknowledgmentData | null | undefined,
): boolean {
	if (!data || data.version !== ACKNOWLEDGMENT_VERSION) return false;
	if (!data.checkboxes.selfHelp) return false;
	if (requiresCommunityPropertyAcknowledgment(responses) && !data.checkboxes.communityProperty) return false;
	return true;
}

/** B6 — self-help disclaimer copy, required for every user. */
export const selfHelpDisclaimerCopy =
	'I understand this is a self-help document generated from my answers, that using it does not create an attorney-client relationship, and that it is not a substitute for personalized legal advice.';

export const communityPropertyHeading = 'An honest note about Texas law and the shariah';

/** Packet §3.3 body copy, in order. */
export const communityPropertyBodyParagraphs = [
	"Texas is a community property state. By law, half of what either spouse earns during the marriage already belongs to the other spouse \u2014 and no will can change that. That is usually more than the Islamic share: a husband's Qur'anic share is typically one-quarter (25%), and a wife's is typically one-eighth (12.5%).",
	'This will does the most Texas law allows. But no will made in Texas \u2014 this one or any other \u2014 is strictly shariah-compliant on its own. Full shariah compliance requires both spouses to knowingly make a mutual gift (heba) of their wealth, dividing it 50/50, or additional planning with an attorney.',
];

/** Optional heba mention, gated by `SHOW_HEBA_MENTION`. */
export const communityPropertyHebaMention =
	'A mutual gift (heba) between spouses is one path toward full compliance. Scholars generally discourage it and it is irrevocable, but you are welcome to ask us about it at a consultation.';

/** Exact required-checkbox text (packet §3.3) — must match verbatim. */
export const communityPropertyCheckboxCopy =
	'I understand that NO will in Texas can follow shariah unless a gift of half of the property is made between spouses, and I choose to proceed.';
