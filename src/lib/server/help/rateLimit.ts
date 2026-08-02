import { db } from '$lib/server/db';
import { helpRateLimit } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { HELP_RATE_LIMITS } from '$lib/help/decisions';

export class HelpRateLimitError extends Error {
	constructor() {
		super('Rate limit exceeded');
		this.name = 'HelpRateLimitError';
	}
}

function windowStart(now = Date.now()): Date {
	const ms = HELP_RATE_LIMITS.windowMs;
	return new Date(Math.floor(now / ms) * ms);
}

export async function checkHelpRateLimit(userId: string, bucket: 'query' | 'cta'): Promise<void> {
	const started = windowStart();
	const limit = bucket === 'query' ? HELP_RATE_LIMITS.queryPerHour : HELP_RATE_LIMITS.ctaPerHour;

	const existing = await db.query.helpRateLimit.findFirst({
		where: and(
			eq(helpRateLimit.userId, userId),
			eq(helpRateLimit.bucket, bucket),
			eq(helpRateLimit.windowStartedAt, started),
		),
	});

	if (!existing) {
		await db.insert(helpRateLimit).values({
			userId,
			bucket,
			windowStartedAt: started,
			count: 1,
		});
		return;
	}

	if (existing.count >= limit) throw new HelpRateLimitError();

	await db
		.update(helpRateLimit)
		.set({ count: existing.count + 1 })
		.where(eq(helpRateLimit.id, existing.id));
}
