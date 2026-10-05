import type { PageServerLoad } from './$types';
import { listPublishedVideos } from '$lib/server/content/videos';
import { seriesSlugOf } from '$lib/server/content/videoView';
import { formatDuration } from '$lib/content/rules';

export const load: PageServerLoad = async () => {
	const videos = await listPublishedVideos();
	const series = new Map<string, { name: string; slug: string; count: number }>();
	for (const v of videos) {
		if (!v.series) continue;
		const slug = seriesSlugOf(v.series);
		if (!slug) continue;
		const cur = series.get(slug) ?? { name: v.series, slug, count: 0 };
		cur.count++;
		series.set(slug, cur);
	}
	return {
		videos: videos.map((v) => ({
			title: v.title,
			slug: v.slug,
			description: v.description,
			duration: v.durationSeconds ? formatDuration(v.durationSeconds) : null,
			hasThumbnail: !!v.hasThumbnail,
			series: v.series,
		})),
		series: [...series.values()],
	};
};
