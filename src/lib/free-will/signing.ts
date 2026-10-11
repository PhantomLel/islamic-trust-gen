/**
 * Will-signing copy for the trust funding pour-over card (Phase 2).
 * The free will no longer uses this module. Its signing steps are inside the PDF.
 *
 * Appendix A §4.2 (California steps) is marked DRAFT and needs Leonard's
 * verification, so it is deliberately NOT in this file. California gets the
 * wrapper only.
 */

/** Spec 3.4 wrapper. Shown for every delivered will. */
export const willSigningWrapper =
	'Downloading or completing this document does not make it an executed will. Follow the signing and witness instructions for the applicable state before relying on it. Notarization alone is not a substitute for required will witnesses. Ask an attorney about uncertainty or unusual signing circumstances.';

/** Appendix A §4.1 heading. Texas only. */
export const texasWillSigningHeading = 'How to sign your will in Texas';

/** Appendix A §4.1, verbatim. Eight steps, Texas only. */
export const texasWillSigningSteps: readonly string[] = [
	'Sign in person. Your will cannot be signed through an online notary or a video session.',
	'Have two witnesses with you at the same time. Each must be at least 14 years old.',
	'Choose witnesses who receive nothing under your will.',
	'Sign your will in front of both witnesses. Each witness then signs in front of you.',
	'Sign the self-proving affidavit at the end of your will in front of a notary who is physically present, with both witnesses also signing before the notary. This allows your will to be accepted without your witnesses having to appear in court.',
	'Notarization alone is not a substitute for the two witnesses.',
	'Do not write on or change your will after signing.',
	'Keep the signed original somewhere safe that your executor can reach. A copy is not a substitute for the original.'
];

export type WillSigningInstructions = {
	wrapper: string;
	/** Present only for Texas. */
	heading: string | null;
	steps: readonly string[];
};

export function willSigningInstructionsFor(
	stateCode: string | null | undefined
): WillSigningInstructions {
	if (stateCode === 'TX') {
		return {
			wrapper: willSigningWrapper,
			heading: texasWillSigningHeading,
			steps: texasWillSigningSteps
		};
	}
	return { wrapper: willSigningWrapper, heading: null, steps: [] };
}
