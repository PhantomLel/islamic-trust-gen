import type { ContentJurisdiction } from './types';

/** Default jurisdiction caveat, exact text from spec §7.4. */
export const DEFAULT_JURISDICTION_CAVEAT =
	'This example concerns Texas community-property law. California also has community property, but its rules are not identical, and other states may treat ownership and spousal rights differently.';

/**
 * The caveat shown under the body. TX uses the default (an override replaces it);
 * CA and BOTH use the override when present, otherwise the same default; GENERAL
 * pages render none.
 */
export function jurisdictionCaveat(
	jurisdiction: ContentJurisdiction | string | null | undefined,
	override: string | null | undefined,
): string | null {
	if (jurisdiction !== 'TX' && jurisdiction !== 'CA' && jurisdiction !== 'BOTH') return null;
	const o = (override ?? '').trim();
	return o || DEFAULT_JURISDICTION_CAVEAT;
}
