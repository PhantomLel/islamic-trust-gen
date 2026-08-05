/** Days a surviving grantor has to deliver an ownership election after first death (Article Three E.4). */
export const FIRST_DEATH_ELECTION_DAYS = 180;

/** Spelled-out phrase shared by Article Three E.4 and the ownership-election acknowledgment. */
export const FIRST_DEATH_ELECTION_DAYS_PHRASE = `one hundred eighty (${FIRST_DEATH_ELECTION_DAYS}) days`;

/**
 * Article One §A transfer/beneficiary designation form — must match byte-for-byte everywhere
 * it appears (joint trust Article One §A, Certification of Trust §8).
 */
export function formatTrustTitleForm(
	husbandFullName: string,
	wifeFullName: string,
	trustName: string,
): string {
	return `${husbandFullName} AND ${wifeFullName}, TRUSTEES OF THE ${trustName} JOINT REVOCABLE LIVING TRUST, AND ANY AMENDMENTS THERETO.`;
}
