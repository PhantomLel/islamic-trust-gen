/**
 * Limited-Scope App Engagement text (the agreement the client accepts), as data.
 *
 * One source for what the client SEES in `ScreeningStep.svelte` and what the
 * acceptance-copy PDF RECORDS (`$lib/server/documents/loeAcceptancePdf.ts`), so
 * the PDF can never drift from the screen. Bump `LOE_AGREEMENT_VERSION` in
 * `$lib/loe.ts` whenever any string here changes.
 *
 * Verbatim sources (do not paraphrase):
 *  - Schedule A: Appendix A section 1.1 (Texas only).
 *  - California clause: Appendix A section 2.1 (California matters only).
 *  - Electronic-signature statement: Appendix A F2 requirement.
 */

import {
	deedRetrievalFeeUsd,
	formatUsd,
	productNames,
	productNameMidSentence,
	type ProductNames
} from '$lib/config';
import type { LoeCheckboxes } from '$lib/loe';

export type Jurisdiction = 'TX' | 'CA';

export function normalizeJurisdiction(value: string | null | undefined): Jurisdiction {
	return value === 'CA' ? 'CA' : 'TX';
}

/** A run of text inside a checkbox label. */
export type Segment =
	| string
	| { strong: string }
	| { link: 'consultation'; text: string };

export type AgreementSection = { heading: string; body: string };

export type LoeCheckboxItem = { key: keyof LoeCheckboxes; segments: Segment[] };

/** Plain text of a label (links and emphasis flattened) for the acceptance PDF. */
export function segmentsToText(segments: Segment[]): string {
	return segments
		.map((s) => (typeof s === 'string' ? s : 'strong' in s ? s.strong : s.text))
		.join('');
}

/** Spec: clicking the acceptance control constitutes the client's electronic signature (Appendix A F2). */
export const electronicSignatureStatement =
	'Clicking “I Agree & Continue” constitutes your electronic signature of this Agreement.';

/** The acceptance control's label. */
export const acceptanceControlLabel = 'I Agree & Continue';

export function agreementTitle(names: ProductNames = productNames): string {
	return `McDaniel Estate Planning, PLLC · ${names.productName}`;
}

/** The fee slot only: the amount actually charged on this matter. Counsel's fee clause text is not drafted here. */
export function flatFeeSection(flatFeeUsd: number): AgreementSection {
	return { heading: 'Flat Fee', body: formatUsd(flatFeeUsd) };
}

export function agreementIntro(names: ProductNames = productNames): string {
	return `By continuing, you are hiring McDaniel Estate Planning, PLLC for a limited-scope app-based estate planning service. ${names.productName} is designed to help eligible users create a basic Islamic revocable trust plan using the information they provide through the app.`;
}

export function agreementSections(names: ProductNames = productNames): AgreementSection[] {
	return [
		{
			heading: 'What the app includes',
			body: 'Your app plan includes a basic Islamic revocable living trust, a basic pour-over will, one deed for your primary personal residence if you own a home, recording of that deed with your county of residence, general signing/notarization/funding instructions, and limited attorney review for eligibility, consistency, and obvious input issues.'
		},
		{
			heading: 'What the app does not include',
			body: 'This is not full-service estate planning. Unless we separately agree in writing, the app does not include tax planning, financial advice, beneficiary-designation review, full trust funding, community-property or separate-property analysis, business succession planning, probate, post-death trust administration, or representation of heirs/family members.'
		},
		{
			heading: 'Trust funding',
			body: 'A trust only works for assets that are properly connected to it. We will assist with the deed for your primary personal residence only. For other assets, we may provide instructions, but you are responsible for completing the funding steps unless you hire us separately.'
		},
		{
			heading: 'Self-administered trust',
			body: `${names.productName} is designed to create a self-administered trust plan. Your chosen successor trustee should be able to use the documents and instructions to begin administering the trust after death. McDaniel Estate Planning will not administer the trust after death unless separately hired.`
		},
		{
			heading: 'Your documents',
			body: 'You must keep your signed originals safe. Do not rely on the app or our firm as your permanent document vault. You are responsible for downloading, printing, signing, and safely storing your final documents.'
		},
		{
			heading: 'Married couples',
			body: 'If you are using the app as a married couple, you are asking us to represent both spouses jointly for this limited app service. We cannot take sides. Information one spouse gives us may be shared with the other spouse. If a conflict develops, we may stop work and require separate counsel.'
		},
		{
			heading: 'When the engagement ends',
			body: 'Our limited app representation ends when the app service is complete, final documents are delivered via your portal on your account, any included deed service is completed, the file is closed for nonresponse, or we determine the app is not appropriate. After that, we have no ongoing duty to monitor changes in your family, assets, tax law, estate planning law, probate law, homestead law, or Islamic inheritance analysis.'
		}
	];
}

// ── Texas Schedule A (Appendix A section 1.1, verbatim) ──────────────────────

export const scheduleATitle = 'SCHEDULE A — SCOPE OF THE FLAT FEE';
export const scheduleAIntro = 'The Flat Fee stated in this Agreement covers the following services and no others.';

export const scheduleAIncluded: readonly string[] = [
	'Attorney-supervised preparation of a joint revocable living trust for both spouses, using the information you provide through the guided interview.',
	'A pour-over will for each spouse.',
	'A certification of trust.',
	'An acknowledgment recording your Islamic ownership election.',
	'Calculation of Islamic inheritance shares from the family information you provide, applied under the school of jurisprudence you select.',
	'Limited attorney review of your information and documents for eligibility, internal consistency, and obvious input errors.',
	'One deed conveying your primary residence to your trust, if you own a home in Texas.',
	'Recording of that deed with the county clerk. County recording fees for this one deed are paid by the Firm and included in the Flat Fee.',
	'Coordination of one notarization session for your trust, certification of trust, ownership acknowledgment and deed.',
	'Written instructions for signing your pour-over wills.',
	'Written guidance on applying for or preserving your Texas residence homestead exemption.',
	'Access to the Make Your Trust Work funding dashboard.',
	'A printed legacy binder shipped to the address you provide.',
	'A closing letter summarising your remaining action items.'
];

export const scheduleAExcludedHeading = 'Excluded unless separately agreed in writing';

export const scheduleAExcluded: readonly string[] = [
	'Tax planning, and any financial or investment advice.',
	'Review of beneficiary designations on retirement accounts, life insurance, annuities or payable-on-death accounts.',
	'Retitling or funding any asset other than the one primary residence deed in item 7. You are responsible for retitling accounts and updating designations.',
	'Analysis of whether specific property is community or separate property.',
	'Business, entity or succession planning.',
	'Any real property other than one primary residence in Texas.',
	'Filing the homestead exemption application on your behalf.',
	'Supplying witnesses or a notary for signing your pour-over wills. Your wills must be signed in person as described in the signing instructions.',
	'Probate, post-death trust administration, or representation of any trustee, executor, spouse, heir or beneficiary.',
	'Amendments or restatements after your documents are delivered.',
	'Storing your original signed documents.',
	'Monitoring changes in your family, assets or the law after this engagement ends.'
];

export const scheduleAOptionalHeading = 'Optional, at additional cost';

/** The $35 figure comes from `deedRetrievalFeeUsd` so it matches the payment screen. */
export function scheduleAOptional(): { service: string; fee: string } {
	return {
		service:
			'House deed retrieval — the Firm locates and obtains a copy of your existing deed from county records. Any county copy charge is paid by the Firm and included in this fee.',
		fee: formatUsd(deedRetrievalFeeUsd).replace(/\.00$/, '')
	};
}

// ── California clause (Appendix A section 2.1, verbatim) ─────────────────────

export const californiaClauseHeading = 'Advance Flat Fee; Deposit to Operating Account.';
export const californiaClauseBody =
	"The legal fee stated in this Agreement is a flat fee for the services described in this Agreement and may be paid before those services are completed. Client understands that Client has the right to require that an advance flat fee be deposited into a client trust account and remain there until earned. Client instead expressly agrees that the Firm may deposit the advance flat fee into the Firm's operating account upon receipt. Client further understands that, if the representation terminates or the services for which the fee was paid are not completed, Client remains entitled to a refund of any portion of the fee that has not been earned.";
export const californiaClauseClosing =
	'By electronically signing this Agreement, Client expressly agrees to the foregoing arrangement.';

// ── Checkboxes ────────────────────────────────────────────────────────────────

export function loeCheckboxItems(
	opts: { businessOwnerContinuing: boolean },
	names: ProductNames = productNames
): LoeCheckboxItem[] {
	const consult: Segment = { link: 'consultation', text: 'schedule a consultation' };
	const book: Segment = { link: 'consultation', text: 'book a consultation' };
	return [
		{
			key: 'limitedScope',
			segments: [
				'I understand this is a ',
				{ strong: 'limited-scope app engagement' },
				', not full-service estate planning.'
			]
		},
		{
			key: 'situationFits',
			segments: opts.businessOwnerContinuing
				? [
						'I own a business and confirm I may still use this online trust. I understand I should amend my bylaws and operating agreements so they work with my trust, and that Muslim Legacy Planning will email me about a free consultation regarding my corporate documents. I otherwise confirm this plan fits my situation (Texas resident, one primary residence, no blended-family or special needs planning beyond this trust). If my situation is more complex, I understand I should ',
						consult,
						' instead.'
					]
				: [
						'I confirm my situation fits this online plan (Texas resident, one primary residence, no business ownership, no blended-family or special needs planning). If my situation is more complex, I understand I should ',
						consult,
						' instead.'
					]
		},
		{
			key: 'islamicPrinciples',
			segments: [
				'I understand this trust is structured in accordance with established ',
				{ strong: 'Islamic inheritance principles' },
				'. The prescribed shares are not customizable.'
			]
		},
		{
			key: 'noTaxPlanning',
			segments: [
				'I understand the app does not include tax planning, financial advice, beneficiary-designation review, full trust funding, or post-death trust administration. For those, or for any other legal strategy or services beyond the app scope, I understand that I can ',
				book,
				'.'
			]
		},
		{
			key: 'noHeirRepresentation',
			segments: [
				'I understand McDaniel Estate Planning will not represent my heirs, beneficiaries, trustee, executor, spouse, children, or family members unless separately hired.'
			]
		},
		{
			key: 'keepOriginalsSafe',
			segments: [
				'I understand I must keep my ',
				{ strong: 'signed originals safe' },
				' and should not rely on the app or firm as my document vault.'
			]
		},
		{
			key: 'homesteadGuidanceOnly',
			segments: [
				`I understand ${productNameMidSentence(names)} provides detailed, attorney-prepared guidance for securing my Texas homestead exemption, but does not file the exemption application on my behalf.`
			]
		}
	];
}

/** Everything that makes up the agreement text for one matter, in display order. */
export type AgreementText = {
	title: string;
	intro: string;
	sections: AgreementSection[];
	flatFee: AgreementSection;
	/** Texas matters only. */
	scheduleA: {
		title: string;
		intro: string;
		included: readonly string[];
		excludedHeading: string;
		excluded: readonly string[];
		optionalHeading: string;
		optional: { service: string; fee: string };
	} | null;
	/** California matters only. */
	californiaClause: { heading: string; body: string; closing: string } | null;
	electronicSignature: string;
};

export function buildAgreementText(opts: {
	jurisdiction: Jurisdiction;
	flatFeeUsd: number;
	names?: ProductNames;
}): AgreementText {
	const names = opts.names ?? productNames;
	return {
		title: agreementTitle(names),
		intro: agreementIntro(names),
		sections: agreementSections(names),
		flatFee: flatFeeSection(opts.flatFeeUsd),
		scheduleA:
			opts.jurisdiction === 'TX'
				? {
						title: scheduleATitle,
						intro: scheduleAIntro,
						included: scheduleAIncluded,
						excludedHeading: scheduleAExcludedHeading,
						excluded: scheduleAExcluded,
						optionalHeading: scheduleAOptionalHeading,
						optional: scheduleAOptional()
					}
				: null,
		californiaClause:
			opts.jurisdiction === 'CA'
				? { heading: californiaClauseHeading, body: californiaClauseBody, closing: californiaClauseClosing }
				: null,
		electronicSignature: electronicSignatureStatement
	};
}
