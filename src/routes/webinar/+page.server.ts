import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { mlpOrigin, siteName } from '$lib/config';
import { attributionCodeFromCookies } from '$lib/attribution';
import { getOpenWebinar, registrationStore } from '$lib/server/webinar/db';
import { deliverWebinarEmail } from '$lib/server/webinar/send';
import { webinarEventJsonLd } from '$lib/webinar/eventJsonLd';
import { toPublicWebinar } from '$lib/webinar/public';
import { registerForWebinar } from '$lib/webinar/register';
import type { PageSeo } from '$lib/seo';

const PAGE_URL = `${mlpOrigin}/webinar`;
const CLOSED_DESCRIPTION = "Educational webinar and demonstration of the firm's attorney-guided trust service.";

function closedSeo(): PageSeo {
	return {
		title: `Webinar | ${siteName}`,
		description: CLOSED_DESCRIPTION,
		jsonLd: [],
	};
}

export const load: PageServerLoad = async () => {
	const row = await getOpenWebinar();
	if (!row) return { webinar: null, seo: closedSeo() };
	const seo: PageSeo = {
		title: `${row.title} | ${siteName}`,
		description: CLOSED_DESCRIPTION,
		jsonLd: [
			webinarEventJsonLd({
				title: row.title,
				startsAt: row.startsAt,
				durationMinutes: row.durationMinutes,
				pageUrl: PAGE_URL,
			}),
		],
	};
	return { webinar: toPublicWebinar(row), seo };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const open = await getOpenWebinar();
		if (!open) return fail(400, { message: 'No webinar is scheduled right now.' });
		const form = await request.formData();
		const result = await registerForWebinar(registrationStore(), open.id, {
			name: String(form.get('name') ?? ''),
			email: String(form.get('email') ?? ''),
			state: String(form.get('state') ?? ''),
			marketingConsent: form.get('marketing_consent') === 'yes',
			honeypot: String(form.get('mlp_hp') ?? ''),
			attributionCode: attributionCodeFromCookies(cookies),
		});
		if (!result.ok) {
			if (result.reason === 'honeypot') return { registered: true };
			if (result.reason === 'duplicate') return fail(400, { message: 'That email is already registered for this webinar.' });
			return fail(400, { message: result.message });
		}
		await deliverWebinarEmail({ id: result.id, email: result.row.email }, open, 'confirmation');
		return { registered: true };
	},
};
