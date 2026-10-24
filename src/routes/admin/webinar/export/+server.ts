import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getNextWebinar, listRegistrants } from '$lib/server/webinar/db';

function csvCell(value: string): string {
	if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
	return value;
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');
	const row = await getNextWebinar();
	const people = row ? await listRegistrants(row.id) : [];
	const lines = [
		['name', 'email', 'state', 'marketing_consent', 'attribution_code', 'created_at'].join(','),
		...people.map((p) =>
			[p.name, p.email, p.state, p.marketingConsent ? 'yes' : 'no', p.attributionCode ?? '', p.createdAt.toISOString()]
				.map(csvCell)
				.join(','),
		),
	];
	return new Response(lines.join('\n') + '\n', {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'attachment; filename="webinar-registrants.csv"',
		},
	});
};
