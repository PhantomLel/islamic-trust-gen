import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recordWillWaitlistLead } from '$lib/server/waitlist';

type WillWaitlistBody = {
	email: string;
	name?: string;
	state: string;
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	lastStep?: string;
};

export const POST: RequestHandler = async ({ request }) => {
	let body: WillWaitlistBody;
	try {
		body = (await request.json()) as WillWaitlistBody;
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const { email, name, state, utmSource, utmMedium, utmCampaign, lastStep } = body;

	if (!email || typeof email !== 'string' || !email.includes('@')) {
		return json({ error: 'A valid email address is required.' }, { status: 400 });
	}
	if (!state || typeof state !== 'string') {
		return json({ error: 'A state is required.' }, { status: 400 });
	}

	try {
		await recordWillWaitlistLead({
			email,
			name: typeof name === 'string' ? name : null,
			state,
			utmSource: typeof utmSource === 'string' ? utmSource : null,
			utmMedium: typeof utmMedium === 'string' ? utmMedium : null,
			utmCampaign: typeof utmCampaign === 'string' ? utmCampaign : null,
			lastStep: typeof lastStep === 'string' ? lastStep : null,
		});
		return json({ success: true });
	} catch (err) {
		console.error('[will-waitlist] Failed to record lead:', err);
		return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
	}
};
