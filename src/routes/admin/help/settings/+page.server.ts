import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getHelpSettings, upsertHelpSetting, seedDefaultHelpSettingsIfEmpty } from '$lib/server/help/settings';
import { HELP_SETTING_DB_KEYS, validateHelpSettingKey } from '$lib/server/help/settingsDefaults';

export const load: PageServerLoad = async () => {
	await seedDefaultHelpSettingsIfEmpty();
	const settings = await getHelpSettings();
	return { settings, keys: HELP_SETTING_DB_KEYS };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const key = String(form.get('key') ?? '');
		const raw = String(form.get('value') ?? '');
		if (!HELP_SETTING_DB_KEYS.includes(key as (typeof HELP_SETTING_DB_KEYS)[number])) {
			return fail(400, { message: 'Invalid key' });
		}
		let value: unknown = raw;
		if (raw === 'true' || raw === 'false') value = raw === 'true';
		else if (key === 'urgent_escalation_email_list') {
			value = raw.split(',').map((s) => s.trim()).filter(Boolean);
		} else if (key === 'office_phone_if_used' && raw === '') value = null;

		const err = validateHelpSettingKey(key, value);
		if (err) return fail(400, { message: err });

		await upsertHelpSetting(key, value, locals.user!.id);
		return { success: true };
	},
};
