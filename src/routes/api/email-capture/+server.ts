import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { email, source } = body;

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return json({ error: 'A valid email address is required.' }, { status: 400 });
		}

		const sanitizedEmail = email.trim().toLowerCase();
		const captureSource = typeof source === 'string' ? source : 'homepage';

		// TODO: Connect to CRM / email platform (Resend, ConvertKit, etc.) when configured.
		// For now, log the capture and return success so the UI flow is complete.
		console.log('[email-capture]', { email: sanitizedEmail, source: captureSource, timestamp: new Date().toISOString() });

		return json({ success: true });
	} catch {
		return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
	}
};
