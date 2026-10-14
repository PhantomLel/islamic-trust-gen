/** How long a free will and its unfinished browser draft are kept. */
export const FREE_WILL_RETENTION_DAYS = 30;
export const FREE_WILL_RETENTION_MS = FREE_WILL_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** Rows are purged in small batches so one cron run cannot time out. */
export const FREE_WILL_PURGE_BATCH = 50;

/** Timestamp written on each successful free-will save. */
export function freeWillPurgeAfter(from: Date = new Date()): Date {
	return new Date(from.getTime() + FREE_WILL_RETENTION_MS);
}

/**
 * True when a browser draft's `savedAt` is at least 30 days old.
 * A missing or unreadable stamp is not expired; the next save starts the clock.
 */
export function isFreeWillDraftExpired(
	savedAt: string | null | undefined,
	now = Date.now(),
): boolean {
	if (!savedAt) return false;
	const saved = Date.parse(savedAt);
	if (!Number.isFinite(saved)) return false;
	return saved + FREE_WILL_RETENTION_MS <= now;
}

/**
 * Keep the previous stamp when the draft body is unchanged.
 * A new body, or a draft that has never been stamped, starts the clock at `now`.
 */
export function nextDraftSavedAt(
	previousBody: string,
	nextBody: string,
	previousSavedAt: string | null,
	now: Date = new Date(),
): string {
	if (previousSavedAt && nextBody === previousBody) return previousSavedAt;
	return now.toISOString();
}
