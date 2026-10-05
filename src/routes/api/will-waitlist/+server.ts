import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Retired (spec v3 §3.1). The out-of-state "notify me when you launch" waitlist
 * enrolled a marketing lead; that behavior is gone. The out-of-state exit now
 * posts to `/api/referral-request`, which stores a `referral_request` lead with
 * no drip sequence and no marketing consent. Existing waitlist rows are untouched.
 * `recordWillWaitlistLead` stays in `$lib/server/waitlist` for historical reference.
 */
export const POST: RequestHandler = async () => {
	return json({ error: 'This endpoint has been retired.' }, { status: 410 });
};
