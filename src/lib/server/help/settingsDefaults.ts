import { consultationBookingUrl, replyToEmail, siteName } from '$lib/config';

export type HelpSettings = {
	consultBookingUrl: string;
	supportEmail: string;
	urgentEscalationEmailList: string[];
	generalSupportContactLabel: string;
	consultCtaLabel: string;
	urgentCtaLabel: string;
	officePhoneIfUsed: string | null;
};

export const DEFAULT_HELP_SETTINGS: HelpSettings = {
	consultBookingUrl: consultationBookingUrl,
	supportEmail: replyToEmail,
	urgentEscalationEmailList: [],
	generalSupportContactLabel: 'Contact the Good Tree team',
	consultCtaLabel: 'Book a consultation',
	urgentCtaLabel: 'Contact the office before continuing',
	officePhoneIfUsed: null,
};

export function validateHelpSettingKey(key: string, value: unknown): string | null {
	switch (key) {
		case 'consult_booking_url':
			if (typeof value !== 'string' || !value.startsWith('https://')) return 'Must be an HTTPS URL';
			return null;
		case 'support_email':
		case 'urgent_escalation_email_list':
		case 'general_support_contact_label':
		case 'consult_cta_label':
		case 'urgent_cta_label':
			if (typeof value !== 'string') return 'Must be a string';
			return null;
		case 'office_phone_if_used':
			if (value !== null && typeof value !== 'string') return 'Must be string or null';
			return null;
		default:
			return 'Unknown setting key';
	}
}

export function settingsKeyToCamel(key: string): keyof HelpSettings | null {
	const map: Record<string, keyof HelpSettings> = {
		consult_booking_url: 'consultBookingUrl',
		support_email: 'supportEmail',
		urgent_escalation_email_list: 'urgentEscalationEmailList',
		general_support_contact_label: 'generalSupportContactLabel',
		consult_cta_label: 'consultCtaLabel',
		urgent_cta_label: 'urgentCtaLabel',
		office_phone_if_used: 'officePhoneIfUsed',
	};
	return map[key] ?? null;
}

export const HELP_SETTING_DB_KEYS = [
	'consult_booking_url',
	'support_email',
	'urgent_escalation_email_list',
	'general_support_contact_label',
	'consult_cta_label',
	'urgent_cta_label',
	'office_phone_if_used',
] as const;

export function formatHelpSupportLabel(settings: HelpSettings): string {
	return `${settings.generalSupportContactLabel} — ${siteName}`;
}

let settingsCacheInvalidated = false;

export function invalidateHelpSettingsCache(): void {
	settingsCacheInvalidated = true;
}

export function consumeHelpSettingsCacheInvalidation(): boolean {
	if (!settingsCacheInvalidated) return false;
	settingsCacheInvalidated = false;
	return true;
}
