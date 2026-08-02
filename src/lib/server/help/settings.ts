import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { helpSetting } from '$lib/server/db/schema';
import {
	DEFAULT_HELP_SETTINGS,
	invalidateHelpSettingsCache,
	consumeHelpSettingsCacheInvalidation,
	type HelpSettings,
	settingsKeyToCamel,
} from './settingsDefaults';

let settingsCache: HelpSettings | null = null;
let settingsCacheAt = 0;
const SETTINGS_TTL_MS = 30_000;

export { invalidateHelpSettingsCache };

export async function getHelpSettings(): Promise<HelpSettings> {
	const now = Date.now();
	if (settingsCache && now - settingsCacheAt < SETTINGS_TTL_MS && !consumeHelpSettingsCacheInvalidation()) {
		return settingsCache;
	}

	const rows = await db.select().from(helpSetting);
	const merged = { ...DEFAULT_HELP_SETTINGS };
	for (const row of rows) {
		const camel = settingsKeyToCamel(row.key);
		if (!camel) continue;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(merged as any)[camel] = row.value;
	}
	settingsCache = merged;
	settingsCacheAt = now;
	return merged;
}

export async function upsertHelpSetting(
	key: string,
	value: unknown,
	updatedBy?: string,
): Promise<void> {
	await db
		.insert(helpSetting)
		.values({ key, value, updatedBy: updatedBy ?? null, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: helpSetting.key,
			set: { value, updatedBy: updatedBy ?? null, updatedAt: new Date() },
		});
	invalidateHelpSettingsCache();
}

export async function seedDefaultHelpSettingsIfEmpty(): Promise<void> {
	const rows = await db.select().from(helpSetting).limit(1);
	if (rows.length > 0) return;
	for (const [key, val] of Object.entries({
		consult_booking_url: DEFAULT_HELP_SETTINGS.consultBookingUrl,
		support_email: DEFAULT_HELP_SETTINGS.supportEmail,
		urgent_escalation_email_list: DEFAULT_HELP_SETTINGS.urgentEscalationEmailList,
		general_support_contact_label: DEFAULT_HELP_SETTINGS.generalSupportContactLabel,
		consult_cta_label: DEFAULT_HELP_SETTINGS.consultCtaLabel,
		urgent_cta_label: DEFAULT_HELP_SETTINGS.urgentCtaLabel,
		office_phone_if_used: DEFAULT_HELP_SETTINGS.officePhoneIfUsed,
	})) {
		await upsertHelpSetting(key, val);
	}
}

export async function getHelpSettingRow(key: string) {
	return db.query.helpSetting.findFirst({ where: eq(helpSetting.key, key) });
}

export function mergeSettingsFromRows(rows: Array<{ key: string; value: unknown }>): HelpSettings {
	const merged = { ...DEFAULT_HELP_SETTINGS };
	for (const row of rows) {
		const camel = settingsKeyToCamel(row.key);
		if (!camel) continue;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(merged as any)[camel] = row.value;
	}
	return merged;
}

export function providersVerifiedEnv(): boolean {
	return env.HELP_PROVIDERS_VERIFIED === 'true';
}
