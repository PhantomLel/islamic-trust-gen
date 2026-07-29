import { error, fail, redirect } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { siteName } from '$lib/config';
import { replyToEmail } from '$lib/server/config';
import { listPreviewableEmails, renderPreviewEmail, findPreviewableEmail } from '$lib/server/drip/preview';
import type { QuizResult } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

const QUIZ_RESULTS: QuizResult[] = [
	'free_will_only',
	'goodtree_fit',
	'legacy_consult',
	'advanced_consult',
];

function parseQuizResult(raw: string | null): QuizResult {
	if (raw && (QUIZ_RESULTS as string[]).includes(raw)) return raw as QuizResult;
	return 'goodtree_fit';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const emails = listPreviewableEmails();
	const key = url.searchParams.get('key') ?? emails[0]?.key ?? 'fw_email2';
	const firstName = url.searchParams.get('name')?.trim() || locals.user.name?.split(/\s+/)[0] || 'Abdullah';
	const quizResult = parseQuizResult(url.searchParams.get('quizResult'));
	const origin = (env.ORIGIN ?? url.origin).replace(/\/$/, '');

	const rendered = renderPreviewEmail({ origin, firstName, quizResult, emailKey: key });
	if (!rendered) throw error(404, `Unknown email key: ${key}`);

	return {
		emails,
		selectedKey: key,
		firstName,
		quizResult,
		quizResults: QUIZ_RESULTS,
		subject: rendered.subject,
		sequence: rendered.sequence,
		html: rendered.html,
		adminEmail: locals.user.email,
		canSend: Boolean(env.RESEND_API_KEY && env.FROM_EMAIL),
	};
};

export const actions: Actions = {
	sendTest: async ({ request, locals, url }) => {
		if (!locals.user) throw redirect(302, '/login');
		if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

		if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
			return fail(400, { message: 'RESEND_API_KEY or FROM_EMAIL is not configured.' });
		}

		const form = await request.formData();
		const emailKey = String(form.get('emailKey') ?? '');
		const firstName = String(form.get('firstName') ?? '').trim() || 'Abdullah';
		const quizResult = parseQuizResult(String(form.get('quizResult') ?? ''));
		const toRaw = String(form.get('to') ?? '').trim().toLowerCase();
		const to = toRaw.includes('@') ? toRaw : locals.user.email;

		const item = findPreviewableEmail(emailKey);
		if (!item) return fail(400, { message: `Unknown email key: ${emailKey}` });

		const origin = (env.ORIGIN ?? url.origin).replace(/\/$/, '');
		const rendered = renderPreviewEmail({ origin, firstName, quizResult, emailKey });
		if (!rendered) return fail(400, { message: 'Failed to render template.' });

		try {
			const resend = new Resend(env.RESEND_API_KEY);
			await resend.emails.send({
				from: env.FROM_EMAIL,
				to,
				replyTo: replyToEmail,
				subject: `[TEST] ${rendered.subject} — ${siteName}`,
				html: rendered.html,
			});
		} catch (err) {
			console.error('[email-preview] Test send failed:', err);
			return fail(500, { message: 'Resend failed. Check server logs and API key.' });
		}

		return { sent: true, to, emailKey };
	},
};
