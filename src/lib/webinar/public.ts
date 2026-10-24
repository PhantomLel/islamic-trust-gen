import { formatWebinarWhen } from './time';

export type PublicWebinar = {
	id: number;
	title: string;
	whenLabel: string;
};

/** Fields the public page may render. `joinUrl` is dropped here. */
export function toPublicWebinar(row: { id: number; title: string; startsAt: Date }): PublicWebinar {
	return {
		id: row.id,
		title: row.title,
		whenLabel: formatWebinarWhen(row.startsAt),
	};
}
