import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { marketingLead } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { unsubscribeMarketingLeadByToken } from '$lib/server/drip/unsubscribeMarketingLead';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	if (!token) return { valid: false, email: null };

	const lead = await db.query.marketingLead.findFirst({
		where: eq(marketingLead.unsubscribeToken, token),
		columns: { email: true, unsubscribed: true },
	});

	if (!lead) return { valid: false, email: null };
	return { valid: true, email: lead.email, alreadyUnsubscribed: lead.unsubscribed, token };
};

export const actions: Actions = {
	unsubscribe: async ({ request }) => {
		const data = await request.formData();
		const token = data.get('token');
		if (typeof token !== 'string' || !token) return { done: false };

		await unsubscribeMarketingLeadByToken(token);

		return { done: true };
	},
};
