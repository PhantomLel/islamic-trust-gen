import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust, invoice, TrustStatus } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const trusts = await db.query.trust.findMany({
		with: { user: { with: { invoices: true } } },
		orderBy: [desc(trust.createdAt)],
	});

	return {
		trusts: trusts.map((t: (typeof trusts)[number]) => {
			const hasPaid = t.selectedPlan !== null;

			return {
				id: t.id,
				createdAt: t.createdAt.toISOString(),
				updatedAt: t.updatedAt.toISOString(),
				joint: t.joint,
				complete: t.complete,
				isEligible: t.isEligible,
				status: t.status,
				awaitingPayment: t.status === TrustStatus.AwaitingPayment && !hasPaid,
				responses: (t.responses ?? []) as { id: string; response: string | string[] | boolean | number | null }[],
				invoices: t.user.invoices.map((i) => ({
					id: i.id,
					name: i.name,
					amount: i.amount,
				})),
				user: {
					id: t.user.id,
					name: t.user.name,
					email: t.user.email,
					requestedConsultation: t.user.requestedConsultationAt != null,
					paid: hasPaid,
				},
			};
		}),
	};
};

export const actions: Actions = {
	updateInvoiceAmount: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const invoiceId = parseInt(formData.get('invoiceId') as string, 10);
		const amount = parseInt(formData.get('amount') as string, 10);

		if (isNaN(invoiceId) || isNaN(amount) || amount < 0) {
			throw error(400, 'Invalid invoice ID or amount');
		}

		const existing = await db.query.invoice.findFirst({
			where: eq(invoice.id, invoiceId),
			columns: { id: true },
		});

		if (!existing) throw error(404, 'Invoice not found');

		await db
			.update(invoice)
			.set({ amount })
			.where(eq(invoice.id, invoiceId));

		return { updated: true };
	},
};
