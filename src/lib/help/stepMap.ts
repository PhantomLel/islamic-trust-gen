import type { HelpSurface } from '$lib/server/db/help.schema';

/** Maps app step keys to KB categories for drawer card selection. */
export const STEP_TO_CATEGORIES: Record<string, string[]> = {
	// Screening
	business_ownership: ['C1'],
	blended_family: ['C1', 'C13'],
	special_needs: ['C1', 'C14'],
	taxable_estate: ['C1'],
	// Family / Islamic
	'husband-heirs': ['C12'],
	'wife-heirs': ['C12'],
	madhab: ['C12'],
	'heir-preview': ['C12'],
	// Trust
	'husband-successor-trustees': ['C14'],
	'wife-successor-trustees': ['C14'],
	'trustee-on-first-death': ['C14'],
	// Property
	'house-deed': ['C7'],
	heba: ['C13'],
	'ownership-allocation': ['C13'],
	// Funding milestones
	download_review: ['C4', 'C5'],
	prepare_sign_trust: ['C4'],
	will_signing: ['C4'],
	forms_bank: ['C6'],
	bank_brokerage: ['C6'],
	forms_employer: ['C8'],
	forms_ira: ['C8'],
	ira: ['C8'],
	forms_life: ['C9'],
	life_insurance: ['C9'],
	vehicles: ['C10'],
	crypto_digital: ['C11'],
	storage: ['C15'],
	trustee_notification: ['C15'],
	family_discussion: ['C15'],
};

export function categoriesForStep(surface: HelpSurface, stepKey: string | null | undefined): string[] {
	if (!stepKey) {
		if (surface === 'help_center') return [];
		return ['C1', 'C17'];
	}
	return STEP_TO_CATEGORIES[stepKey] ?? ['C1'];
}

export function normalizeSurface(raw: string): HelpSurface | null {
	if (raw === 'help_center' || raw === 'create_trust' || raw === 'funding' || raw === 'dashboard') {
		return raw;
	}
	return null;
}
