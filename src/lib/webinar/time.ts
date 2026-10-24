const ZONE = 'America/Chicago';

function part(parts: Intl.DateTimeFormatPart[], type: string): string {
	return parts.find((p) => p.type === type)?.value ?? '';
}

/** UTC instant whose wall clock in America/Chicago matches `local` (`YYYY-MM-DDTHH:mm`). */
export function chicagoWallToUtc(local: string): Date | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	const day = Number(m[3]);
	const hour = Number(m[4]);
	const minute = Number(m[5]);
	if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

	const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
	const first = zoneOffsetMs(new Date(utcGuess));
	let result = new Date(utcGuess - first);
	const second = zoneOffsetMs(result);
	if (second !== first) result = new Date(utcGuess - second);
	if (Number.isNaN(result.getTime())) return null;
	if (toChicagoInputValue(result) !== local.trim()) return null;
	return result;
}

/** `datetime-local` value for an instant, shown in America/Chicago. */
export function toChicagoInputValue(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(date);
	let hour = part(parts, 'hour');
	if (hour === '24') hour = '00';
	return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}T${hour}:${part(parts, 'minute')}`;
}

/** Date and time with the timezone name, for the public page and emails. */
export function formatWebinarWhen(startsAt: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		timeZone: ZONE,
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short',
	}).format(startsAt);
}

function zoneOffsetMs(date: Date): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: ZONE,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).formatToParts(date);
	let hour = Number(part(parts, 'hour'));
	if (hour === 24) hour = 0;
	const asUtc = Date.UTC(
		Number(part(parts, 'year')),
		Number(part(parts, 'month')) - 1,
		Number(part(parts, 'day')),
		hour,
		Number(part(parts, 'minute')),
		Number(part(parts, 'second')),
	);
	return asUtc - date.getTime();
}
