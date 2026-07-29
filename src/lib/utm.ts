/**
 * First-touch UTM capture (ticket A7 groundwork). Reads `utm_*` off the URL on
 * first page load, stores it in `localStorage`, and is read back later so masjid
 * / campaign attribution survives across pages into the waitlist capture and the
 * free-will save actions, and ultimately into `marketing_lead` / `free_will`.
 * No redirect endpoint or QR generation yet — that is the full A7 (deferred).
 */

const STORAGE_KEY = 'mlp:first-touch-utm';

export type UtmParams = {
	utmSource: string | null;
	utmMedium: string | null;
	utmCampaign: string | null;
};

const EMPTY_UTM: UtmParams = { utmSource: null, utmMedium: null, utmCampaign: null };

/** Reads `utm_*` from the current URL and persists it, unless a first touch is already stored. */
export function captureFirstTouchUtm(): void {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
	if (localStorage.getItem(STORAGE_KEY)) return;

	const params = new URLSearchParams(window.location.search);
	const utmSource = params.get('utm_source');
	const utmMedium = params.get('utm_medium');
	const utmCampaign = params.get('utm_campaign');
	if (!utmSource && !utmMedium && !utmCampaign) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ utmSource, utmMedium, utmCampaign }));
	} catch {
		// ignore quota / privacy-mode errors
	}
}

/** The visitor's stored first-touch UTM params, if any were ever captured. */
export function getFirstTouchUtm(): UtmParams {
	if (typeof localStorage === 'undefined') return EMPTY_UTM;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return EMPTY_UTM;
		const parsed = JSON.parse(raw);
		return {
			utmSource: typeof parsed.utmSource === 'string' ? parsed.utmSource : null,
			utmMedium: typeof parsed.utmMedium === 'string' ? parsed.utmMedium : null,
			utmCampaign: typeof parsed.utmCampaign === 'string' ? parsed.utmCampaign : null,
		};
	} catch {
		return EMPTY_UTM;
	}
}
