/**
 * Refuse to seed unless the operator opted in and the database is not production.
 * Host comparison ignores a Neon "-pooler" infix so the pooler URL still matches.
 */
export function databaseHost(databaseUrl) {
	try {
		return new URL(databaseUrl).hostname.toLowerCase().replace('-pooler.', '.');
	} catch {
		return null;
	}
}

export function demoSeedRefusal(env) {
	if (env.DEMO_SEED_ALLOWED !== 'true') {
		return 'Refusing to seed: set DEMO_SEED_ALLOWED=true. This script writes a fabricated client and must not run by accident.';
	}
	const prod = (env.PROD_DATABASE_HOST ?? '').trim().toLowerCase().replace('-pooler.', '.');
	if (!prod) {
		return 'Refusing to seed: set PROD_DATABASE_HOST to the production database hostname so this script can prove it is not pointed at production.';
	}
	const host = databaseHost(env.DATABASE_URL ?? '');
	if (!host) return 'Refusing to seed: DATABASE_URL is missing or not a URL.';
	if (host === prod) return `Refusing to seed: DATABASE_URL host ${host} is the production database.`;
	return null;
}
