import { and, eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { invoice, user } from '$lib/server/db/schema';

const resend = new Resend(env.RESEND_API_KEY);

type CreateInvoiceWithEmailInput = {
	userId: string;
	userEmail?: string;
	userName?: string | null;
	name: string;
	description: string;
	amount: number;
};

export async function createInvoiceWithEmail(input: CreateInvoiceWithEmailInput): Promise<{
	created: boolean;
	emailed: boolean;
	reason?: 'duplicate' | 'user not found';
}> {
	const existing = await db.query.invoice.findFirst({
		where: and(eq(invoice.userId, input.userId), eq(invoice.name, input.name)),
		columns: { id: true },
	});

	if (existing) {
		return { created: false, emailed: false, reason: 'duplicate' };
	}

	if (!input.userEmail || !input.userName) {
		const targetUser = await db.query.user.findFirst({
			where: eq(user.id, input.userId),
			columns: { email: true, name: true },
		});
		if (!targetUser) {
			return { created: false, emailed: false, reason: 'user not found' };
		}
		input.userEmail = targetUser.email;
		input.userName = targetUser.name;
	}

	await db.insert(invoice).values({
		userId: input.userId,
		name: input.name,
		description: input.description,
		amount: input.amount,
		createdAt: new Date(),
	});

	let emailed = false;
	try {
		await resend.emails.send({
			from: env.FROM_EMAIL,
			to: input.userEmail,
			subject: `New Invoice: ${input.name}`,
			html: `
				<p>As-salamu alaykum${input.userName},</p>
				<p>A new invoice has been created for your trust.</p>
				<ul>
					<li><strong>Invoice:</strong> ${input.name}</li>
					<li><strong>Description:</strong> ${input.description}</li>
					<li><strong>Amount:</strong> $${(input.amount * 100 / 100).toFixed(2)}</li>
				</ul>
				<p>Please click here to log in to your dashboard to complete payment: <a href="${env.ORIGIN}/dashboard">${env.ORIGIN}/dashboard</a></p>
			`,
		});
		emailed = true;
	} catch (err) {
		console.error('Failed to send invoice email', err);
	}

	return { created: true, emailed };
}
