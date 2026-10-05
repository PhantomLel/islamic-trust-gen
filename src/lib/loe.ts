/**
 * Current version of the Limited-Scope App Engagement clickwrap agreement.
 *
 * 1.1 (spec v3 / Appendix A): product name, Texas Schedule A, flat-fee slot,
 * California advance-fee clause, electronic-signature statement.
 * Stored acceptance records keep the version they were accepted under; they are
 * never rewritten.
 */
export const LOE_AGREEMENT_VERSION = '1.1';

/** Current version of the Planning Warning clickwrap agreement. */
export const WARNING_AGREEMENT_VERSION = '1.0';

export type LoeCheckboxes = {
	limitedScope: boolean;
	situationFits: boolean;
	islamicPrinciples: boolean;
	noTaxPlanning: boolean;
	noHeirRepresentation: boolean;
	keepOriginalsSafe: boolean;
	homesteadGuidanceOnly: boolean;
};

export type LoeAgreementData = {
	version: string;
	/** ISO timestamp recorded on the client at the moment the user clicked "I Agree". */
	clientTimestamp: string;
	/** The date string the user typed into the date field (e.g. "07/07/2026"). */
	userEnteredDate: string;
	checkboxes: LoeCheckboxes;
};

export type WarningCheckboxes = {
	basicPlanningOnly: boolean;
	largeComplexEstateRisk: boolean;
	noAdvancedOptimization: boolean;
	heirDisagreementRisk: boolean;
	choseAppOverConsultation: boolean;
};

export type WarningAgreementData = {
	version: string;
	/** ISO timestamp recorded on the client at the moment the user clicked "I Agree". */
	clientTimestamp: string;
	/** The date string the user selected. */
	userEnteredDate: string;
	checkboxes: WarningCheckboxes;
};
