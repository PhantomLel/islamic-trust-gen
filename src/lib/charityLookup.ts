import { regionalMasajid } from '$lib/data/regionalMasajid';
import { getMasjidById, isMasjidId } from '$lib/masajid';
import { getNationalCharityById, isNationalCharityId, nationalCharities } from '$lib/nationalCharities';

/** Resolve a masjid, national charity, or custom charity id to its display name. */
export function resolveCharityName(charityId: string, customName?: string): string {
	if (typeof customName === 'string' && customName.trim() !== '') {
		return customName.trim();
	}
	const masjid = getMasjidById(charityId);
	if (masjid) return masjid.name;
	const national = getNationalCharityById(charityId);
	if (national) return national.name;
	return charityId;
}

/** Whether this id refers to a catalog masjid or suggested national charity. */
export function isKnownCharityId(charityId: string): boolean {
	return isMasjidId(charityId) || isNationalCharityId(charityId);
}

/** Map of all masjid and national charity ids to display names (for will flows). */
export function buildCharityNameMap(): Map<string, string> {
	const map = new Map<string, string>();
	for (const list of Object.values(regionalMasajid)) {
		for (const masjid of list) {
			map.set(masjid.id, masjid.name);
		}
	}
	for (const charity of nationalCharities) {
		map.set(charity.id, charity.name);
	}
	return map;
}
