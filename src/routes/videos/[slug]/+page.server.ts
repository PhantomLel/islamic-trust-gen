import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublishedVideoBySlug, seriesNeighbours } from '$lib/server/content/videos';
import { buildVideoSeo, buildVideoView } from '$lib/server/content/videoView';

export const load: PageServerLoad = async ({ params }) => {
	const b = await getPublishedVideoBySlug(params.slug);
	if (!b) throw error(404, 'This video is not available.');
	const view = buildVideoView(b);
	const nav = b.video.series ? await seriesNeighbours(b.video.series, b.video.seriesOrder, b.video.id) : null;
	return {
		view,
		seo: buildVideoSeo(b),
		previous: nav?.previous ?? null,
		next: nav?.next ?? null,
	};
};
