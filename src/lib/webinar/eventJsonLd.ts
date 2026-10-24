import { firmLegalServiceId } from '$lib/config';

/** Event JSON-LD. `pageUrl` is this site's page, never the Zoom link. */
export function webinarEventJsonLd(opts: {
	title: string;
	startsAt: Date;
	durationMinutes: number;
	pageUrl: string;
}): Record<string, unknown> {
	const end = new Date(opts.startsAt.getTime() + opts.durationMinutes * 60 * 1000);
	return {
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: opts.title,
		startDate: opts.startsAt.toISOString(),
		endDate: end.toISOString(),
		eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
		eventStatus: 'https://schema.org/EventScheduled',
		location: {
			'@type': 'VirtualLocation',
			url: opts.pageUrl,
		},
		organizer: { '@id': firmLegalServiceId },
	};
}
