import { regionalMasajid, type RegionalMasjid } from '$lib/data/regionalMasajid';

export type { RegionalMasjid };

/** All masajid for a given state code (e.g. `TX`). */
export function getMasajidForState(stateCode: string): RegionalMasjid[] {
	if (!stateCode) return [];
	return regionalMasajid[stateCode] ?? [];
}

/** Whether the regional catalog includes masajid for this state. */
export function hasMasajidCatalog(stateCode: string | undefined | null): boolean {
	return getMasajidForState(stateCode ?? '').length > 0;
}

const MASJID_REGION_LABELS: Record<string, string> = {
	TX: 'Texas',
	CA: 'California',
};

/** Display label for masajid search UI (e.g. "Texas masajid"). */
export function masajidRegionLabel(stateCode: string): string {
	const code = stateCode.trim();
	return MASJID_REGION_LABELS[code] ? `${MASJID_REGION_LABELS[code]} Masajid` : 'Local masajid';
}

const masjidById = new Map<string, RegionalMasjid>(
	Object.values(regionalMasajid).flatMap((list) => list.map((m) => [m.id, m] as const)),
);

export const MASJID_ID_SET = new Set(masjidById.keys());

export function getMasjidById(id: string): RegionalMasjid | undefined {
	return masjidById.get(id);
}

export function isMasjidId(id: string): boolean {
	return MASJID_ID_SET.has(id);
}

/** Primary label for dropdowns and documents. */
export function formatMasjidLabel(m: RegionalMasjid): string {
	return `${m.name} · ${m.city}, ${m.state}`;
}

/** Secondary line (region + street address). */
export function formatMasjidSublabel(m: RegionalMasjid): string {
	return `${m.region} · ${m.address}`;
}

export function searchMasajid(query: string, stateCode = 'TX'): RegionalMasjid[] {
	const q = query.trim().toLowerCase();
	const list = getMasajidForState(stateCode);
	if (!q) return list;
	return list.filter(
		(m) =>
			m.name.toLowerCase().includes(q) ||
			m.city.toLowerCase().includes(q) ||
			m.region.toLowerCase().includes(q) ||
			m.address.toLowerCase().includes(q),
	);
}
