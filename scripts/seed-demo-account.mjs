#!/usr/bin/env node
/**
 * Create or reset the webinar demonstration client (V3 11.3).
 *
 * Refuses to run unless DEMO_SEED_ALLOWED=true and DATABASE_URL is not the
 * production host in PROD_DATABASE_HOST. See docs/webinar-demo.md.
 *
 *   DEMO_SEED_ALLOWED=true PROD_DATABASE_HOST=prod-host.example.net node scripts/seed-demo-account.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from 'better-auth/crypto';
import { demoSeedRefusal } from './demo-seed-guard.mjs';

const USER_ID = 'demo-webinar-client';
const EMAIL = 'demo.family@example.com';
const NAME = 'Ahmed Khan';
const PASSWORD = 'Demo-Webinar-1';

const RESPONSES = [
	{ id: 'husband-data', response: { name: 'Ahmed Khan', dob: '1980-01-01', county: 'Harris' } },
	{ id: 'wife-data', response: { name: 'Fatima Khan', dob: '1982-03-15', county: 'Harris' } },
	{ id: 'marriage-date', response: '2010-06-01' },
	{ id: 'trust-name', response: 'Khan Family Trust' },
];

function loadDotEnv() {
	const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
	if (!fs.existsSync(envPath)) return;
	for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let val = trimmed.slice(eq + 1).trim();
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
		if (process.env[key] === undefined) process.env[key] = val;
	}
}

export async function seedDemoAccount(databaseUrl) {
	const sql = neon(databaseUrl);
	const passwordHash = await hashPassword(PASSWORD);
	const now = new Date();

	await sql.query(
		`INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
		 VALUES ($1, $2, $3, true, 'client', $4, $4)
		 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = 'client', updated_at = EXCLUDED.updated_at`,
		[USER_ID, NAME, EMAIL, now],
	);
	await sql.query(`DELETE FROM session WHERE user_id = $1`, [USER_ID]);
	await sql.query(`DELETE FROM account WHERE user_id = $1 AND provider_id = 'credential'`, [USER_ID]);
	await sql.query(
		`INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
		 VALUES ($1, $2, 'credential', $2, $3, $4, $4)`,
		[crypto.randomUUID(), USER_ID, passwordHash, now],
	);
	await sql.query(`DELETE FROM trust WHERE user_id = $1`, [USER_ID]);
	await sql.query(
		`INSERT INTO trust (user_id, joint, is_eligible, complete, status, jurisdiction, responses, created_at, updated_at)
		 VALUES ($1, true, true, true, 'review', 'TX', $2::jsonb, $3, $3)`,
		[USER_ID, JSON.stringify(RESPONSES), now],
	);
	return { email: EMAIL, userId: USER_ID };
}

async function main() {
	loadDotEnv();
	const refusal = demoSeedRefusal(process.env);
	if (refusal) {
		console.error(refusal);
		process.exit(1);
	}
	const seeded = await seedDemoAccount(process.env.DATABASE_URL);
	console.log(`Reset demo client ${seeded.email} (${seeded.userId}). Password is in docs/webinar-demo.md. Do not show it on a shared screen.`);
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) {
	main().catch((err) => {
		console.error(err instanceof Error ? err.message : err);
		process.exit(1);
	});
}
