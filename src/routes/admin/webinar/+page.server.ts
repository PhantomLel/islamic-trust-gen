import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getNextWebinar, listRegistrants, saveWebinar } from '$lib/server/webinar/db';
import { WEBINAR_STATUSES } from '$lib/server/db/schema';
import { chicagoWallToUtc, toChicagoInputValue } from '$lib/webinar/time';

function requireAdmin(locals: App.Locals) {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');
	return locals.user;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	requireAdmin(locals);
	const row = url.searchParams.get('new') === '1' ? null : await getNextWebinar();
	const registrants = row ? await listRegistrants(row.id) : [];
	return {
		webinar: row
			? {
					id: row.id,
					title: row.title,
					startsLocal: toChicagoInputValue(row.startsAt),
					durationMinutes: row.durationMinutes,
					joinUrl: row.joinUrl,
					status: row.status,
				}
			: null,
		registrants: registrants.map((r) => ({
			id: r.id,
			name: r.name,
			email: r.email,
			state: r.state,
			marketingConsent: r.marketingConsent,
			attributionCode: r.attributionCode,
			createdAt: r.createdAt.toISOString(),
		})),
		statuses: WEBINAR_STATUSES,
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const actor = requireAdmin(locals);
		const form = await request.formData();
		const idRaw = String(form.get('id') ?? '').trim();
		const id = idRaw ? Number(idRaw) : null;
		if (idRaw && !Number.isInteger(id)) return fail(400, { message: 'That webinar was not found.' });
		const startsAt = chicagoWallToUtc(String(form.get('startsLocal') ?? ''));
		if (!startsAt) return fail(400, { message: 'Enter a date and time in Central Time.' });
		const saved = await saveWebinar(actor.id, {
			id,
			title: String(form.get('title') ?? ''),
			startsAt,
			durationMinutes: Number(form.get('durationMinutes')),
			joinUrl: String(form.get('joinUrl') ?? ''),
			status: String(form.get('status') ?? '') as 'draft' | 'open' | 'closed',
		});
		if (!saved.ok) return fail(400, { message: saved.message });
		return { saved: true };
	},
};
