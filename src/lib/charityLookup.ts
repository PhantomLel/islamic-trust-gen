import { regionalMasajid } from '$lib/data/regionalMasajid';
import { getMasjidById, isMasjidId } from '$lib/masajid';

/** Resolve a masjid or custom charity id to its display name. */
export function resolveCharityName(charityId: string, customName?: string): string {
	if (typeof customName === 'string' && customName.trim() !== '') {
		return customName.trim();
	}
	const masjid = getMasjidById(charityId);
	if (masjid) return masjid.name;
	return charityId;
}

/** Whether this id refers to a catalog masjid. */
export function isKnownCharityId(charityId: string): boolean {
	return isMasjidId(charityId);
}

/** Map of all masjid ids to display names (for will flows). */
export function buildCharityNameMap(): Map<string, string> {
	const map = new Map<string, string>();
	for (const list of Object.values(regionalMasajid)) {
		for (const masjid of list) {
			map.set(masjid.id, masjid.name);
		}
	}
	return map;
}
