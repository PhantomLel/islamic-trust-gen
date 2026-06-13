import { IslamicInheritanceCalculator } from '$lib/inheritance/calculator';
import {
	assetRangeLabel,
	assetRanges,
	stateName,
	type WillResponseValue,
} from '$lib/free-will/config';
import {
	appliesCommunityPropertyClauses,
	buildEstateInput,
	communityPropertyClauses,
	communityPropertyWarning,
	computeLeadTags,
	isCommunityPropertySituation,
	legalMode,
	legalModeDisclaimers,
	recommendPlan,
	type LeadTag,
	type PlanKey,
} from '$lib/free-will/logic';

/**
 * Shape that the free Islamic will document template will consume once the PDF
 * template is finalized (pending attorney sign-off — dev brief §12). This mirrors
 * the role of `JointTrustContext` in `buildContext.ts`: a single, fully-resolved
 * object that the renderer can drop straight into a template, with no business
 * logic left in the template layer.
 *
 * No document is generated yet — this is the data contract for that step.
 */
export type WillDocumentContext = {
	testatorName: string;
	stateName: string;
	stateCode: string;
	willDate: string;

	maritalStatus: string;
	gender: 'male' | 'female';

	/** Islamic distribution schedule rows derived from the family structure. */
	distributionSchedule: { heir: string; count: number; share: string; shareType: string }[];
	distributionNotes: string[];

	/** Legal mode + the exact disclaimer paragraph to print (dev brief §9). */
	legalMode: 'attorney' | 'self-help';
	legalDisclaimer: string;

	/** Community property handling (dev brief §5). */
	isCommunityProperty: boolean;
	communityPropertyWarning: string;
	includeCommunityPropertyClauses: boolean;
	communityPropertyClauses: { title: string; body: string }[];

	/** Estate snapshot (for the cover / summary section). */
	assetRange: string;
	ownsHome: boolean;
	homeStateName: string;

	/** CRM + routing metadata (not printed, but produced alongside the document). */
	leadTags: LeadTag[];
	recommendedPlan: PlanKey;
	attorneyReviewNote: boolean;
};

type ResponseEntry = { id: string; response: unknown };

type FreeWillLike = {
	id: number;
	responses: ResponseEntry[] | null;
};

function toRecord(rows: ResponseEntry[] | null | undefined): Record<string, WillResponseValue> {
	return Object.fromEntries((rows ?? []).map((r) => [r.id, r.response as WillResponseValue]));
}

function formatToday(): string {
	return new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

/**
 * Build the will document context from a stored free-will submission. Analogous
 * to `buildJointTrustContext` — read responses, run the inheritance calculator,
 * and resolve every field the template needs.
 */
export function buildWillDocumentContext(
	will: FreeWillLike,
	testatorName: string,
): WillDocumentContext {
	const responses = toRecord(will.responses);

	const result = new IslamicInheritanceCalculator(buildEstateInput(responses)).calculate();
	const distributionSchedule = result.heirs.map((h) => ({
		heir: h.label,
		count: h.count,
		share: h.totalShare.toString(),
		shareType: h.shareType,
	}));

	const stateCode = typeof responses['state'] === 'string' ? responses['state'] : '';
	const homeStateCode = typeof responses['home_state'] === 'string' ? responses['home_state'] : '';
	const mode = legalMode(responses);
	const rec = recommendPlan(responses);
	const rangeId = assetRanges.find((r) => r.label === responses['asset_range'])?.id;

	return {
		testatorName,
		stateName: stateName(stateCode),
		stateCode,
		willDate: formatToday(),

		maritalStatus: typeof responses['marital_status'] === 'string' ? responses['marital_status'] : '',
		gender: responses['gender'] === 'Female' ? 'female' : 'male',

		distributionSchedule,
		distributionNotes: result.notes,

		legalMode: mode,
		legalDisclaimer: legalModeDisclaimers[mode],

		isCommunityProperty: isCommunityPropertySituation(responses),
		communityPropertyWarning,
		includeCommunityPropertyClauses: appliesCommunityPropertyClauses(responses),
		communityPropertyClauses: appliesCommunityPropertyClauses(responses)
			? communityPropertyClauses
			: [],

		assetRange: assetRangeLabel(rangeId),
		ownsHome: responses['own_home'] === true,
		homeStateName: stateName(homeStateCode),

		leadTags: computeLeadTags(responses),
		recommendedPlan: rec.plan,
		attorneyReviewNote: rec.attorneyReviewNote,
	};
}
