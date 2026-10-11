import type { PageLoad } from './$types';
import { attorneyJsonLd, staticRouteSeo } from '$lib/seo';

export const load: PageLoad = () => ({
	seo: { ...staticRouteSeo['/mcdaniel/attorney'], jsonLd: [attorneyJsonLd()] },
});
