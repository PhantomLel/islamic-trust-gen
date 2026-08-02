/**
 * Controlling product decisions for the Good Tree Help Assistant (plan §1).
 * Source of truth for runtime defaults; do not infer behavior beyond this file and the KB.
 */

export const HELP_PRODUCT_DECISIONS = {
	/** KB Section E controls exact script wording; Implementation doc controls routing behavior. */
	scriptAuthority: 'kb_section_e' as const,
	/** Tier 2 triggers block the affected app step until consultation path is followed. */
	tier2BlocksStep: true,
	/** Authenticated users who started but have not paid may use help on create-trust. */
	prepaymentAccess: true,
	/** Only users with role `admin` may view chat transcripts. */
	transcriptAccessRole: 'admin' as const,
	/** Measured error rates must stay below this fraction at launch. */
	maxLaunchErrorRate: 0.05,
	/** Any missed Tier 1 case blocks release regardless of aggregate rate. */
	tier1FalseNegativeBlocker: true,
	/** Low-confidence retrieval must not show "possibly related" cards. */
	noPossiblyRelatedOnLowConfidence: true,
	/** Models route only; server renders approved text verbatim. */
	modelsNeverWriteProse: true,
} as const;

/** Scholar-flagged cards requiring publication gate before servability (KB I-5). Used by import script only. */
export const SCHOLAR_REVIEW_DOC_IDS = [
	'C9.6',
	'C12.3',
	'C12.4',
	'C12.6',
	'C12.8',
	'C12.9',
	'C12.10',
	'C16.5',
] as const;

/** Cards blocked until policy text exists. Used by import script only. */
export const POLICY_BLOCKED_DOC_IDS = ['C17.11', 'C15.4'] as const;

export const GENERAL_INFORMATION_FOOTER =
	'This is general information for using the app, not individualized legal or tax advice.';

export const HELP_PROVIDER_MODELS = {
	voyageRerank: 'rerank-2.5',
	openaiVerifier: 'gpt-4o-mini',
} as const;

export const HELP_RERANK_THRESHOLDS_VERSION = '1.0.0';

/** Default rerank gates — tune via labelled eval set before production enablement. */
export const HELP_RERANK_DEFAULTS = {
	scoreFloor: 0.35,
	ambiguityMargin: 0.05,
	timeoutMs: 15_000,
	maxQuestionLength: 2_000,
	maxBodyBytes: 8_192,
} as const;

export const HELP_RATE_LIMITS = {
	queryPerHour: 60,
	ctaPerHour: 120,
	windowMs: 60 * 60 * 1000,
} as const;
