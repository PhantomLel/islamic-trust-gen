import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { contentRedirect } from '$lib/server/db/schema';

export async function findRedirectForPath(path: string): Promise<{ toPath: string; statusCode: 301 | 302 | 307 | 308 } | null> {
	const [row] = await db.select().from(contentRedirect).where(eq(contentRedirect.fromPath, path)).limit(1);
	if (!row) return null;
	const code = [301, 302, 307, 308].includes(row.statusCode) ? (row.statusCode as 301 | 302 | 307 | 308) : 301;
	return { toPath: row.toPath, statusCode: code };
}

/** Only site-relative targets are allowed so a redirect can never send visitors off-site. */
export function isSafeRedirectPath(p: string): boolean {
	return /^\/[^\s]*$/.test(p) && !p.startsWith('//') && p.length <= 300;
}
