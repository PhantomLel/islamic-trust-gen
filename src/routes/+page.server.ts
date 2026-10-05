import type { PageServerLoad } from './$types';
import { getFeaturedVideo } from '$lib/server/content/videos';

export const load: PageServerLoad = async () => {
	let featuredVideo: {
		title: string;
		slug: string;
		youtubeId: string;
		thumbnailSrc: string;
		description: string;
		isTestimonial: boolean;
	} | null = null;

	try {
		const b = await getFeaturedVideo();
		if (b) {
			const v = b.video;
			featuredVideo = {
				title: v.title,
				slug: v.slug,
				youtubeId: v.youtubeId,
				thumbnailSrc: `/videos/${v.slug}/thumbnail`,
				description: v.description,
				isTestimonial: v.isTestimonial,
			};
		}
	} catch {
		featuredVideo = null;
	}

	return { featuredVideo };
};
