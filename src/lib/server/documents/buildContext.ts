import {
	charities as charityCatalog,
	type AssetAllocationEntry,
	type CharitiesResponse,
	type CharityResponse,
	type HebaAssetEntry,
	type HeirsCalculatorResponse,
	type MinorDistributionResponse,
	type NamedHeir,
	type NonCharitableBequestEntry,
	type NonCharitableBequestsResponse,
	type PersonalDataResponse,
	type PersonalPropertyEntry,
	type SeparatePropertyEntry,
	type SeparatePropertyResponse,
	type SuccessorTrusteeEntry,
} from '$lib/config';

/**
 * Shape that the joint trust .docx template consumes. Every key referenced in
 * `joint_template.docx` must be present here (including text fallbacks for
 * `{:table xxx}` tags, which the renderer rewrites to `{xxxText}`).
 */
export type JointTrustContext = {
	trustName: string;
	trustDate: string;
	husbandFullName: string;
	county: string;
	wifeFullName: string;
	dateOfMarriage: string;
	childrenCount: number;

	isHeba: boolean;
	isAssetAllocation: boolean;

	husbandHeirs: { heirName: string; heirRelationship: string; heirShare: string }[];
	wifeHeirs: { heirName: string; heirRelationship: string; heirShare: string }[];
	trustees: string[];

	husbandCharitable: boolean;
	wifeCharitable: boolean;

	distribution: {
		mode: 'staggered' | 'single-age' | 'age-of-majority' | '';
		firstPercent: number | '';
		firstAge: number | '';
		secondPercent: number | '';
		secondAge: number | '';
		remainderAge: number | '';
		singleDistributionAge: number | '';
	};

	/**
	 * Asset allocation table — only populated when `isAssetAllocation` is true.
	 * Wrap in `{#isAssetAllocation}...{/isAssetAllocation}` in the template.
	 */
	assetAllocation: { assetName: string; accountId: string; owner: string }[];

	/**
	 * Heba asset list — only populated when `isHeba` is true. All assets are
	 * jointly owned, so there is no per-spouse owner column.
	 * Wrap in `{#isHeba}...{/isHeba}` in the template.
	 */
	hebaAssets: { assetName: string; accountId: string }[];

	/** Loop-ready arrays — use these once you convert the template to {#...} loops. */
	husbandSeparateProperty: { assetName: string; accountId: string; approximateValue: string }[];
	wifeSeparateProperty: { assetName: string; accountId: string; approximateValue: string }[];
	highValueItems: { itemDescription: string; owner: string }[];

	/** Text fallbacks — used by the {xxxText} scalars that the :table preprocessor emits. */
	husbandCharitableText: string;
	husbandNonCharitableText: string;
	wifeCharitableText: string;
	wifeNonCharitableText: string;
	heirsTableText: string;
	hebaAssetsText: string;
	husbandSeparatePropertyText: string;
	wifeSeparatePropertyText: string;
	highValueItemsText: string;
};

type ResponseEntry = { id: string; response: unknown };

type TrustLike = {
	id: number;
	responses: ResponseEntry[] | null;
};

function getResponse<T = unknown>(trust: TrustLike, id: string): T | undefined {
	const entry = (trust.responses ?? []).find((r) => r.id === id);
	return entry ? (entry.response as T) : undefined;
}

function formatToday(): string {
	return new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

function formatDate(iso: string | undefined): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fractionLabel(f: { numerator: number; denominator: number } | unknown): string {
	if (f && typeof f === 'object' && 'numerator' in f && 'denominator' in f) {
		const { numerator, denominator } = f as { numerator: number; denominator: number };
		if (denominator === 1) return `${numerator}`;
		// Convert to percentage for readability, keep fraction alongside.
		const pct = Math.round((numerator / denominator) * 100 * 100) / 100;
		return `${numerator}/${denominator} (~${pct}%)`;
	}
	return String(f ?? '');
}

function flattenNamedHeirs(named: NamedHeir[] | undefined): { heirName: string; heirRelationship: string; heirShare: string }[] {
	if (!named) return [];
	const rows: { heirName: string; heirRelationship: string; heirShare: string }[] = [];
	for (const h of named) {
		const names = h.names && h.names.length > 0 ? h.names : Array.from({ length: h.count }, () => '');
		const perPersonLabel = fractionLabel(h.perPersonShare);
		for (const name of names) {
			rows.push({ heirName: name, heirRelationship: h.label, heirShare: perPersonLabel });
		}
	}
	return rows;
}

function countChildren(named: NamedHeir[] | undefined): number {
	if (!named) return 0;
	return named
		.filter((h) => h.heirType === 'son' || h.heirType === 'daughter')
		.reduce((sum, h) => sum + (h.count || 0), 0);
}

function charityName(c: CharityResponse): string {
	if (c.customName) return c.customName;
	return charityCatalog.find((x) => x.id === c.charityId)?.name ?? c.charityId;
}

function bulletList(lines: string[]): string {
	const filtered = lines.filter((l) => l && l.trim().length > 0);
	if (filtered.length === 0) return '';
	return filtered.map((l) => `\u2022 ${l}`).join('\n');
}

function formatCharities(list: CharityResponse[] | undefined): string {
	if (!list || list.length === 0) return 'No charitable bequests';
	return bulletList(list.map((c) => `${charityName(c)} \u2014 ${c.percentage}%`));
}

function formatBequests(list: NonCharitableBequestEntry[] | undefined): string {
	if (!list || list.length === 0) return 'No non-charitable bequests';
	return bulletList(
		list.map((b) => `${b.recipientName} (${b.relationship}) \u2014 ${b.percentage}%`),
	);
}

function formatHebaAssets(list: HebaAssetEntry[] | undefined): string {
	if (!list || list.length === 0) return 'No assets listed';
	return bulletList(
		list
			.filter((a) => a.assetName && a.assetName.trim().length > 0)
			.map((a) => (a.accountId ? `${a.assetName} \u2014 acct ${a.accountId}` : a.assetName)),
	);
}

function formatSeparateProperty(list: SeparatePropertyEntry[] | undefined): string {
	if (!list || list.length === 0) return 'No separate property';
	return bulletList(
		list.map((p) => {
			const pieces = [p.assetName];
			if (p.accountId) pieces.push(`acct ${p.accountId}`);
			if (p.approximateValue) pieces.push(`~${p.approximateValue}`);
			return pieces.join(' \u2014 ');
		}),
	);
}

function formatPersonalProperty(list: PersonalPropertyEntry[] | undefined): string {
	if (!list || list.length === 0) return 'No personal property';
	return bulletList(list.map((p) => `${p.itemDescription} (${p.spouse})`));
}

function formatHeirsTable(named: NamedHeir[] | undefined): string {
	if (!named || named.length === 0) return 'No heirs';
	const lines: string[] = [];
	for (const h of named) {
		const perLabel = fractionLabel(h.perPersonShare);
		const totalLabel = fractionLabel(h.totalShare);
		const names = h.names && h.names.length > 0 ? h.names : Array.from({ length: h.count }, () => '');
		for (const name of names) {
			const display = name?.trim() ? name : `[${h.label}]`;
			lines.push(`${display} \u2014 ${h.label} \u2014 share: ${perLabel} (group total: ${totalLabel})`);
		}
	}
	return bulletList(lines);
}

export function buildJointTrustContext(trust: TrustLike): JointTrustContext {
	const husband = getResponse<PersonalDataResponse>(trust, 'husband-data');
	const wife = getResponse<PersonalDataResponse>(trust, 'wife-data');
	const marriageDate = getResponse<string>(trust, 'marriage-date');
	const husbandHeirs = getResponse<HeirsCalculatorResponse>(trust, 'husband-heirs');
	const wifeHeirs = getResponse<HeirsCalculatorResponse>(trust, 'wife-heirs');
	const ownership = getResponse<string>(trust, 'ownership-allocation');
	const assetAllocationEntries = getResponse<AssetAllocationEntry[]>(trust, 'assets') ?? [];
	const hebaAssetEntries = getResponse<HebaAssetEntry[]>(trust, 'heba-assets') ?? [];
	const successors = getResponse<SuccessorTrusteeEntry[]>(trust, 'successor-trustees') ?? [];
	const charitiesResp = getResponse<CharitiesResponse>(trust, 'charities');
	const bequestsResp = getResponse<NonCharitableBequestsResponse>(trust, 'non-charitable-bequests');
	const sepProp = getResponse<SeparatePropertyResponse>(trust, 'separate-property');
	const personalProp = getResponse<PersonalPropertyEntry[]>(trust, 'personal-property') ?? [];
	const minor = getResponse<MinorDistributionResponse>(trust, 'minor-distribution');
	const trustName = getResponse<string>(trust, 'trust-name') ?? '';

	const husbandHasCharities = !!(charitiesResp?.husbandInterested && charitiesResp.husbandCharities?.length);
	const husbandHasBequests = !!(bequestsResp?.husbandInterested && bequestsResp.husbandBequests?.length);
	const wifeHasCharities = !!(charitiesResp?.wifeInterested && charitiesResp.wifeCharities?.length);
	const wifeHasBequests = !!(bequestsResp?.wifeInterested && bequestsResp.wifeBequests?.length);

	const distribution: JointTrustContext['distribution'] = {
		mode: minor?.mode ?? '',
		firstPercent: minor?.mode === 'staggered' ? minor.firstPercent : '',
		firstAge: minor?.mode === 'staggered' ? minor.firstAge : '',
		secondPercent: minor?.mode === 'staggered' ? minor.secondPercent : '',
		secondAge: minor?.mode === 'staggered' ? minor.secondAge : '',
		remainderAge: minor?.mode === 'staggered' ? minor.remainderAge : '',
		singleDistributionAge: minor?.mode === 'single-age' ? minor.age : '',
	};

	return {
		trustName,
		trustDate: formatToday(),
		husbandFullName: husband?.name ?? '',
		county: husband?.county ?? '',
		wifeFullName: wife?.name ?? '',
		dateOfMarriage: formatDate(marriageDate),
		childrenCount: countChildren(husbandHeirs?.namedHeirs),

		isHeba: ownership === 'heba',
		isAssetAllocation: ownership === 'assets',

		husbandHeirs: flattenNamedHeirs(husbandHeirs?.namedHeirs),
		wifeHeirs: flattenNamedHeirs(wifeHeirs?.namedHeirs),
		trustees: successors.map((s) => s.fullName).filter(Boolean),

		husbandCharitable: husbandHasCharities || husbandHasBequests,
		wifeCharitable: wifeHasCharities || wifeHasBequests,

		distribution,

		assetAllocation: assetAllocationEntries.map((a) => ({
			assetName: a.assetName ?? '',
			accountId: a.accountId ?? '',
			owner: a.spouse ?? '',
		})),

		hebaAssets: hebaAssetEntries
			.filter((a) => (a.assetName ?? '').trim().length > 0)
			.map((a) => ({
				assetName: a.assetName ?? '',
				accountId: a.accountId ?? '',
			})),

		husbandSeparateProperty: (sepProp?.husband ?? []).map((p) => ({
			assetName: p.assetName ?? '',
			accountId: p.accountId ?? '',
			approximateValue: p.approximateValue ?? '',
		})),
		wifeSeparateProperty: (sepProp?.wife ?? []).map((p) => ({
			assetName: p.assetName ?? '',
			accountId: p.accountId ?? '',
			approximateValue: p.approximateValue ?? '',
		})),
		highValueItems: personalProp.map((p) => ({
			itemDescription: p.itemDescription ?? '',
			owner: p.spouse ?? '',
		})),

		husbandCharitableText: formatCharities(charitiesResp?.husbandCharities),
		husbandNonCharitableText: formatBequests(bequestsResp?.husbandBequests),
		wifeCharitableText: formatCharities(charitiesResp?.wifeCharities),
		wifeNonCharitableText: formatBequests(bequestsResp?.wifeBequests),
		heirsTableText: formatHeirsTable(husbandHeirs?.namedHeirs ?? wifeHeirs?.namedHeirs),
		hebaAssetsText: formatHebaAssets(hebaAssetEntries),
		husbandSeparatePropertyText: formatSeparateProperty(sepProp?.husband),
		wifeSeparatePropertyText: formatSeparateProperty(sepProp?.wife),
		highValueItemsText: formatPersonalProperty(personalProp),
	};
}
