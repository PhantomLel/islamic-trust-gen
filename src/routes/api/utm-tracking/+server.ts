import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { utmTrackingEvent, type UtmEventType } from '$lib/server/db/schema';

type TrackingRequest = {
	eventType: UtmEventType;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
	sessionId?: string;
	willId?: number;
	email?: string;
	payload?: Record<string, unknown>;
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: TrackingRequest = await request.json();

		// Validate required fields
		if (!body.eventType || !['landing', 'will_completion'].includes(body.eventType)) {
			return json({ error: 'Invalid eventType' }, { status: 400 });
		}

		// Only track if there's at least one UTM parameter
		if (!body.utmSource && !body.utmMedium && !body.utmCampaign) {
			return json({ success: true, tracked: false, reason: 'No UTM parameters' });
		}

		// Insert the tracking event
		await db.insert(utmTrackingEvent).values({
			eventType: body.eventType,
			utmSource: body.utmSource ?? null,
			utmMedium: body.utmMedium ?? null,
			utmCampaign: body.utmCampaign ?? null,
			sessionId: body.sessionId ?? null,
			willId: body.willId ?? null,
			email: body.email ?? null,
			payload: body.payload ?? null,
		});

		return json({ success: true, tracked: true });
	} catch (error) {
		console.error('[UTM Tracking] Error tracking event:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
