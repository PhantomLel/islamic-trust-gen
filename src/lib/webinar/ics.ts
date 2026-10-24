function icsUtc(date: Date): string {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function icsText(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/\r\n|\n|\r/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** Minimal VEVENT. No calendar library. `URL` is the Zoom join link, for the attachment only. */
export function buildWebinarIcs(opts: {
	uid: string;
	title: string;
	startsAt: Date;
	durationMinutes: number;
	joinUrl: string;
}): string {
	const end = new Date(opts.startsAt.getTime() + opts.durationMinutes * 60 * 1000);
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Muslim Legacy Planning//Webinar//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${icsText(opts.uid)}`,
		`DTSTAMP:${icsUtc(new Date())}`,
		`DTSTART:${icsUtc(opts.startsAt)}`,
		`DTEND:${icsUtc(end)}`,
		`SUMMARY:${icsText(opts.title)}`,
		`URL:${icsText(opts.joinUrl)}`,
		'END:VEVENT',
		'END:VCALENDAR',
	];
	return lines.join('\r\n') + '\r\n';
}
