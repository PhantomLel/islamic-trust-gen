import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listPublishedVideos } from '$lib/server/content/videos';
import { seriesSlugOf } from '$lib/server/content/videoView';
import { formatDuration } from '$lib/content/rules';

export const load: PageServerLoad = async ({ params }) => {
	const all = await listPublishedVideos();
	const inSeries = all.filter((v) => seriesSlugOf(v.series) === params.series);
	if (!inSeries.length) throw error(404, 'This series is not available.');
	const name = inSeries[0].series as string;
	return {
		name,
		seo: { title: `${name} — Videos — Muslim Legacy Planning`, description: `Videos in the series “${name}”.` },
		videos: inSeries.map((v) => ({
			title: v.title,
			slug: v.slug,
			description: v.description,
			duration: v.durationSeconds ? formatDuration(v.durationSeconds) : null,
		})),
	};
};
