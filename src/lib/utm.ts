/**
 * First-touch UTM capture (ticket A7 groundwork). Reads `utm_*` off the URL on
 * first page load, stores it in `localStorage`, and is read back later so masjid
 * / campaign attribution survives across pages into the waitlist capture and the
 * free-will save actions, and ultimately into `marketing_lead` / `free_will`.
 * 
 * Now also tracks a "landing" event to the backend so we can measure the ratio
 * of QR scans / landing page hits to will completions.
 */

const STORAGE_KEY = 'mlp:first-touch-utm';
const SESSION_ID_KEY = 'mlp:session-id';

export type UtmParams = {
	utmSource: string | null;
	utmMedium: string | null;
	utmCampaign: string | null;
};

const EMPTY_UTM: UtmParams = { utmSource: null, utmMedium: null, utmCampaign: null };

/** Generate or retrieve a session ID for tracking purposes */
function getOrCreateSessionId(): string {
	if (typeof localStorage === 'undefined') return crypto.randomUUID();
	
	try {
		let sessionId = localStorage.getItem(SESSION_ID_KEY);
		if (!sessionId) {
			sessionId = crypto.randomUUID();
			localStorage.setItem(SESSION_ID_KEY, sessionId);
		}
		return sessionId;
	} catch {
		return crypto.randomUUID();
	}
}

/** Send a tracking event to the backend */
async function trackUtmEvent(
	eventType: 'landing' | 'will_completion',
	params: UtmParams,
	additionalData?: { willId?: number; email?: string }
): Promise<void> {
	try {
		await fetch('/api/utm-tracking', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				eventType,
				utmSource: params.utmSource,
				utmMedium: params.utmMedium,
				utmCampaign: params.utmCampaign,
				sessionId: getOrCreateSessionId(),
				...additionalData,
			}),
		});
	} catch (error) {
		// Silent fail - don't block user experience for tracking errors
		console.warn('[UTM Tracking] Failed to track event:', error);
	}
}

/** Reads `utm_*` from the current URL and persists it, unless a first touch is already stored. */
export function captureFirstTouchUtm(): void {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
	if (localStorage.getItem(STORAGE_KEY)) return;

	const params = new URLSearchParams(window.location.search);
	const utmSource = params.get('utm_source');
	const utmMedium = params.get('utm_medium');
	const utmCampaign = params.get('utm_campaign');
	if (!utmSource && !utmMedium && !utmCampaign) return;

	const utmParams = { utmSource, utmMedium, utmCampaign };

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(utmParams));
		
		// Track the landing event
		trackUtmEvent('landing', utmParams);
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

/** Track a will completion event with UTM parameters */
export function trackWillCompletion(willId?: number | null, email?: string): void {
	if (typeof window === 'undefined') return;
	
	const utmParams = getFirstTouchUtm();
	
	// Only track if there are UTM parameters
	if (!utmParams.utmSource && !utmParams.utmMedium && !utmParams.utmCampaign) return;
	
	trackUtmEvent('will_completion', utmParams, { 
		willId: willId ?? undefined, 
		email 
	});
}
