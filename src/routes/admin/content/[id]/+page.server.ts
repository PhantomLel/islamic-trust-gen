import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import {
	cancelSchedule,
	checkPage,
	getPage,
	listPagesForAdmin,
	listRevisions,
	publishPage,
	revertToRevision,
	savePage,
	schedulePage,
	submitForReview,
	unpublishPage,
} from '$lib/server/content/pages';
import { listCategories, listMedia } from '$lib/server/content/taxonomy';
import { parsePageForm, parseScheduleAt } from '$lib/server/content/parse';
import { ContentPermissionError, can } from '$lib/content/permissions';
import { allowedCtaKeys, countWords } from '$lib/content/rules';
import { MAX_RELATED } from '$lib/content/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const actor = requireContentStaff(locals);
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(404, 'Not found');
	const bundle = await getPage(id);
	if (!bundle) throw error(404, 'Not found');

	const [check, categories, media, others, revisions] = await Promise.all([
		checkPage(id),
		listCategories(),
		listMedia(),
		listPagesForAdmin(),
		listRevisions(id),
	]);
	const { page } = bundle;
	return {
		page: {
			id: page.id,
			status: page.status,
			title: page.title,
			slug: page.slug,
			answerSummary: page.answerSummary,
			body: page.body,
			metaDescription: page.metaDescription,
			jurisdiction: page.jurisdiction,
			categoryId: page.categoryId,
			lastReviewedOn: page.lastReviewedOn,
			ctaKey: page.ctaKey,
			caveatOverride: page.caveatOverride ?? '',
			socialImageId: page.socialImageId,
			scheduledPublishAt: page.scheduledPublishAt?.toISOString() ?? null,
			publishedAt: page.publishedAt?.toISOString() ?? null,
		},
		faqs: bundle.faqs.map((f) => ({ question: f.question, answer: f.answer })),
		relatedIds: bundle.related.map((r) => r.id),
		linkedVideos: bundle.videos,
		categories,
		media: media.map((m) => ({ id: m.id, url: m.url, altText: m.altText })),
		otherPages: others.filter((p) => p.id !== id).map((p) => ({ id: p.id, title: p.title || p.slug, status: p.status })),
		revisions: revisions.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), title: r.title })),
		check: { errors: check.errors, warnings: check.warnings },
		wordCount: countWords(page.answerSummary),
		allowedCtas: allowedCtaKeys(page.jurisdiction),
		maxRelated: MAX_RELATED,
		can: {
			publish: can(actor.role, 'publish'),
			unpublish: can(actor.role, 'unpublish'),
			schedule: can(actor.role, 'schedule'),
		},
	};
};

function guard<T>(fn: () => Promise<T>) {
	return fn().catch((e) => {
		if (e instanceof ContentPermissionError) return fail(403, { message: e.message }) as never;
		throw e;
	});
}

/** Save the posted fields first, so every action works on exactly what the editor sees. */
async function saveFromForm(event: { request: Request; params: { id: string }; locals: App.Locals }) {
	const actor = requireContentStaff(event.locals, { need: 'draft' });
	const form = await event.request.formData();
	const id = Number(event.params.id);
	const res = await savePage(id, parsePageForm(form), actor, { insertRedirect: form.get('confirmRedirect') === 'on' });
	return { actor, form, id, res };
}

export const actions: Actions = {
	save: (event) =>
		guard(async () => {
			const { res } = await saveFromForm(event);
			if (!res.ok) {
				if ('slugChangePrompt' in res) return fail(409, { slugChangePrompt: res.slugChangePrompt });
				return fail(400, { message: res.error });
			}
			return { saved: true };
		}),

	submit: (event) =>
		guard(async () => {
			const { actor, id, res } = await saveFromForm(event);
			if (!res.ok) return 'slugChangePrompt' in res ? fail(409, { slugChangePrompt: res.slugChangePrompt }) : fail(400, { message: res.error });
			const r = await submitForReview(id, actor);
			return r.ok ? { submitted: true } : fail(400, { message: r.error });
		}),

	publish: (event) =>
		guard(async () => {
			const { actor, id, res } = await saveFromForm(event);
			if (!res.ok) return 'slugChangePrompt' in res ? fail(409, { slugChangePrompt: res.slugChangePrompt }) : fail(400, { message: res.error });
			const r = await publishPage(id, actor);
			return r.ok ? { published: true } : fail(400, { publishErrors: r.errors ?? [] });
		}),

	schedule: (event) =>
		guard(async () => {
			const { actor, form, id, res } = await saveFromForm(event);
			if (!res.ok) return 'slugChangePrompt' in res ? fail(409, { slugChangePrompt: res.slugChangePrompt }) : fail(400, { message: res.error });
			const r = await schedulePage(id, parseScheduleAt(form), actor);
			return r.ok ? { scheduled: true } : fail(400, { publishErrors: r.errors ?? [] });
		}),

	cancelSchedule: ({ locals, params }) =>
		guard(async () => {
			const actor = requireContentStaff(locals, { need: 'schedule' });
			await cancelSchedule(Number(params.id), actor);
			return { scheduleCancelled: true };
		}),

	unpublish: ({ locals, params }) =>
		guard(async () => {
			const actor = requireContentStaff(locals, { need: 'unpublish' });
			await unpublishPage(Number(params.id), actor);
			return { unpublished: true };
		}),

	revert: ({ locals, params, request }) =>
		guard(async () => {
			const actor = requireContentStaff(locals, { need: 'draft' });
			const form = await request.formData();
			const r = await revertToRevision(Number(params.id), Number(form.get('revisionId')), actor);
			return r.ok ? { reverted: true } : fail(400, { message: r.error });
		}),
};
