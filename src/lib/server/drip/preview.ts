import { mlpOrigin } from '$lib/config';
import { SCHEDULES, type SequenceName } from './sequences';
import { buildLinks } from './links';
import { renderDripEmail } from './renderEmail';
import type { QuizResult } from '$lib/server/db/schema';

export type PreviewableEmail = {
	sequence: SequenceName;
	key: string;
	subject: string;
	label: string;
};

const SEQUENCE_LABELS: Record<SequenceName, string> = {
	free_will_lead: 'Free Will Lead',
	quiz_lead: 'Quiz Lead',
	app_started: 'App Started',
};

/** Flat list of every drip template for admin preview / test send. */
export function listPreviewableEmails(): PreviewableEmail[] {
	const out: PreviewableEmail[] = [];
	for (const [sequence, schedule] of Object.entries(SCHEDULES) as [SequenceName, (typeof SCHEDULES)[SequenceName]][]) {
		for (const meta of schedule) {
			out.push({
				sequence,
				key: meta.key,
				subject: meta.subject,
				label: `${SEQUENCE_LABELS[sequence]} · ${meta.key}`,
			});
		}
	}
	return out;
}

export function findPreviewableEmail(key: string): PreviewableEmail | null {
	return listPreviewableEmails().find((e) => e.key === key) ?? null;
}

export type PreviewRenderOpts = {
	origin: string;
	firstName?: string;
	quizResult?: QuizResult;
	emailKey: string;
};

/** Render a drip template with sample links for preview / test send. */
export function renderPreviewEmail(
	opts: PreviewRenderOpts,
): { html: string; subject: string; sequence: SequenceName; unsubscribeUrl: string } | null {
	const item = findPreviewableEmail(opts.emailKey);
	if (!item) return null;

	const links = buildLinks({
		origin: opts.origin || mlpOrigin,
		sequence: item.sequence,
		emailKey: item.key,
		unsubscribeToken: 'preview-token',
		trustId: 1,
	});

	const html = renderDripEmail({
		sequence: item.sequence,
		emailKey: item.key,
		lead: {
			firstName: opts.firstName?.trim() || 'Abdullah',
			quizResult: opts.quizResult ?? 'goodtree_fit',
		},
		links,
	});

	if (!html) return null;
	return { html, subject: item.subject, sequence: item.sequence, unsubscribeUrl: links.unsubscribeUrl };
}
