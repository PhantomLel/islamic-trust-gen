/** Suggested national Islamic charities users can add to their wasiyyah, alongside local masajid. */
export type NationalCharity = {
	id: string;
	name: string;
	url: string;
};

// Kept alphabetical by name — no entry (including Jabal Foundation) gets a badge,
// star, default selection, or featured placement. Sort order is the only signal.
export const nationalCharities: NationalCharity[] = [
	{
		id: 'national-american-muslim-organization',
		name: 'American Muslim Organization (AMO)',
		url: 'https://www.amocommunity.com/',
	},
	{ id: 'national-an-nisa-hope-center', name: 'An-Nisa Hope Center', url: 'https://www.annisa.org/' },
	{ id: 'national-jabal-foundation', name: 'Jabal Foundation', url: 'https://www.jabalfoundation.org/' },
	{ id: 'national-risala-foundation', name: 'Risala Foundation', url: 'https://www.risala.org/' },
	{ id: 'national-sapience-institute', name: 'Sapience Institute', url: 'https://www.sapienceinstitute.org/' },
];

/** Jabal Foundation: the one entry where the attorney serves on the board (Appendix A §3.2). */
export const JABAL_CHARITY_ID = 'national-jabal-foundation';

export function isJabalCharityId(id: string): boolean {
	return id === JABAL_CHARITY_ID;
}

/** True when a stored Jabal selection lacks the explicit confirmation timestamp. */
export function jabalSelectionMissingConfirmation(
	entries: ReadonlyArray<{ charityId: string; jabalConfirmedAt?: string | null }>
): boolean {
	return entries.some((e) => isJabalCharityId(e.charityId) && !e.jabalConfirmedAt);
}

const nationalCharityById = new Map<string, NationalCharity>(nationalCharities.map((c) => [c.id, c]));

export const NATIONAL_CHARITY_ID_SET = new Set(nationalCharityById.keys());

export function getNationalCharityById(id: string): NationalCharity | undefined {
	return nationalCharityById.get(id);
}

export function isNationalCharityId(id: string): boolean {
	return NATIONAL_CHARITY_ID_SET.has(id);
}
