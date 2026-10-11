import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { checkVideo, getVideo, publishVideo, saveVideo, scheduleVideo, submitVideoForReview, unpublishVideo } from '$lib/server/content/videos';
import { listPagesForAdmin } from '$lib/server/content/pages';
import { listMedia } from '$lib/server/content/taxonomy';
import { FEATURED_VIDEO_KEY, getSetting, setSetting } from '$lib/server/settings';
import { parseScheduleAt, parseVideoForm } from '$lib/server/content/parse';
import { ContentPermissionError, can } from '$lib/content/permissions';
import { formatDuration } from '$lib/content/rules';

export const load: PageServerLoad = async ({ locals, params }) => {
	const actor = requireContentStaff(locals);
	const id = Number(params.id);
	const b = Number.isInteger(id) ? await getVideo(id) : null;
	if (!b) throw error(404, 'Not found');
	const [check, pages, media, featured] = await Promise.all([checkVideo(id), listPagesForAdmin(), listMedia(), getSetting(FEATURED_VIDEO_KEY)]);
	const v = b.video;
	return {
		video: {
			id: v.id,
			status: v.status,
			title: v.title,
			slug: v.slug,
			youtubeId: v.youtubeId,
			description: v.description,
			transcript: v.transcript,
			duration: v.durationSeconds ? formatDuration(v.durationSeconds) : '',
			jurisdiction: v.jurisdiction,
			series: v.series ?? '',
			seriesOrder: v.seriesOrder,
			relatedContentPageId: v.relatedContentPageId,
			isTestimonial: v.isTestimonial,
			releaseOnFile: v.releaseOnFile,
			isEndorsement: v.isEndorsement,
			speakerTitle: v.speakerTitle ?? '',
			speakerRelationship: v.speakerRelationship ?? '',
			metaDescription: v.metaDescription,
			thumbnailAssetId: v.thumbnailAssetId,
			uploadedOn: v.uploadedOn ?? '',
			scheduledPublishAt: v.scheduledPublishAt?.toISOString() ?? null,
		},
		check: { errors: check.errors, warnings: check.warnings },
		pages: pages.map((p) => ({ id: p.id, title: p.title || p.slug, status: p.status })),
		media: media.map((m) => ({ id: m.id, altText: m.altText })),
		isFeatured: featured === String(id),
		can: { publish: can(actor.role, 'publish'), unpublish: can(actor.role, 'unpublish'), schedule: can(actor.role, 'schedule'), taxonomy: can(actor.role, 'manage_taxonomy') },
	};
};

function guard<T>(fn: () => Promise<T>) {
	return fn().catch((e) => {
		if (e instanceof ContentPermissionError) return fail(403, { message: e.message }) as never;
		throw e;
	});
}

async function saveFromForm(event: { request: Request; params: { id: string }; locals: App.Locals }) {
	const actor = requireContentStaff(event.locals, { need: 'draft' });
	const form = await event.request.formData();
	const id = Number(event.params.id);
	const res = await saveVideo(id, parseVideoForm(form), actor, { insertRedirect: form.get('confirmRedirect') === 'on' });
	return { actor, form, id, res };
}

export const actions: Actions = {
	save: (event) =>
		guard(async () => {
			const { res } = await saveFromForm(event);
			if (!res.ok) return 'slugChangePrompt' in res ? fail(409, { slugChangePrompt: res.slugChangePrompt }) : fail(400, { message: res.error });
			return { saved: true };
		}),
	submit: (event) =>
		guard(async () => {
			const { actor, id, res } = await saveFromForm(event);
			if (!res.ok) return 'slugChangePrompt' in res ? fail(409, { slugChangePrompt: res.slugChangePrompt }) : fail(400, { message: res.error });
			await submitVideoForReview(id, actor);
			return { submitted: true };
		}),
	publish: (event) =>
		guard(async () => {
			const { actor, id, res } = await saveFromForm(event);
			if (!res.ok) return 'slugChangePrompt' in res ? fail(409, { slugChangePrompt: res.slugChangePrompt }) : fail(400, { message: res.error });
			const r = await publishVideo(id, actor);
			return r.ok ? { published: true } : fail(400, { publishErrors: r.errors ?? [] });
		}),
	schedule: (event) =>
		guard(async () => {
			const { actor, form, id, res } = await saveFromForm(event);
			if (!res.ok) return 'slugChangePrompt' in res ? fail(409, { slugChangePrompt: res.slugChangePrompt }) : fail(400, { message: res.error });
			const r = await scheduleVideo(id, parseScheduleAt(form), actor);
			return r.ok ? { scheduled: true } : fail(400, { publishErrors: r.errors ?? [] });
		}),
	unpublish: ({ locals, params }) =>
		guard(async () => {
			const actor = requireContentStaff(locals, { need: 'unpublish' });
			await unpublishVideo(Number(params.id), actor);
			return { unpublished: true };
		}),
	feature: ({ locals, params, request }) =>
		guard(async () => {
			const actor = requireContentStaff(locals, { need: 'manage_taxonomy' });
			const form = await request.formData();
			const id = Number(params.id);
			if (form.get('on') === '1') {
				const check = await checkVideo(id);
				const b = await getVideo(id);
				if (!b || b.video.status !== 'published' || !b.thumbnail || check.errors.length) {
					return fail(400, { message: 'Only a published video with a thumbnail can be featured on the homepage.' });
				}
				await setSetting(FEATURED_VIDEO_KEY, String(id), actor.id);
			} else {
				await setSetting(FEATURED_VIDEO_KEY, null, actor.id);
			}
			return { featuredChanged: true };
		}),
};
