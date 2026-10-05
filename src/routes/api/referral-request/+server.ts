import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recordReferralRequest } from '$lib/server/waitlist';
import { isWillAvailableState } from '$lib/free-will/config';

export const POST: RequestHandler = async ({ request }) => {
	let body: { email?: unknown; name?: unknown; state?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const state = typeof body.state === 'string' ? body.state.trim().toUpperCase() : '';
	if (!email || !email.includes('@')) {
		return json({ error: 'A valid email address is required.' }, { status: 400 });
	}
	if (!/^[A-Z]{2}$/.test(state) || isWillAvailableState(state)) {
		return json({ error: 'A state outside Texas and California is required.' }, { status: 400 });
	}

	try {
		await recordReferralRequest({
			email,
			name: typeof body.name === 'string' ? body.name : null,
			state
		});
		return json({ success: true });
	} catch (err) {
		console.error('[referral-request] Failed to record request:', err);
		return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
	}
};
