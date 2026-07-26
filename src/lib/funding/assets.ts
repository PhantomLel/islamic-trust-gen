/**
 * Surfaces the asset list the user typed during intake (the trust's Schedule A) next to the
 * funding cards, so they do not have to dig out their trust paperwork to remember which accounts
 * they own.
 *
 * Matching is a hint, never a classification. We match the user's own words against category
 * keywords to decide what to show first; we never hide an asset from them and never tell them an
 * asset legally belongs to a category. The cards ask the user to decide, which is also what the
 * developer brief requires — the app does not write institution-specific or asset-specific legal
 * conclusions.
 */
import type { AssetAllocationEntry, HebaAssetEntry } from '$lib/config';
import type { FundingAssetCategory } from './content';

export type ListedAsset = {
	name: string;
	accountId: string | null;
	/** Only meaningful for joint trusts that used the asset-by-asset ownership path. */
	owner: 'Husband' | 'Wife' | '50/50' | null;
	categories: FundingAssetCategory[];
};

const CATEGORIES: FundingAssetCategory[] = [
	'bank',
	'brokerage',
	'employer_plan',
	'ira',
	'life_insurance',
	'vehicle',
	'crypto',
	'real_property',
];

/**
 * Words that describe what kind of account something is. These win over brand names, so
 * "Fidelity IRA" is treated as an IRA rather than a brokerage account.
 */
const ACCOUNT_TYPE_KEYWORDS: Record<FundingAssetCategory, string[]> = {
	bank: [
		'bank',
		'banks',
		'checking',
		'chequing',
		'saving',
		'savings',
		'credit union',
		'money market',
		'certificate of deposit',
		'cd',
	],
	brokerage: [
		'brokerage',
		'taxable',
		'mutual fund',
		'mutual funds',
		'index fund',
		'index funds',
		'etf',
		'etfs',
		'stock',
		'stocks',
		'securities',
		'investment',
		'investments',
	],
	employer_plan: [
		// Spaced variants too — people really do type "401 K".
		'401k',
		'401(k)',
		'401 k',
		'401a',
		'401(a)',
		'401 a',
		'403b',
		'403(b)',
		'403 b',
		'457',
		'457(b)',
		'457 b',
		'tsp',
		'thrift savings',
		'pension',
		'profit sharing',
		'profit-sharing',
		'espp',
		'retirement',
		'retirement system',
	],
	ira: ['ira', 'iras', 'roth', 'sep ira', 'simple ira', 'rollover', 'retirement'],
	life_insurance: [
		'life insurance',
		'life policy',
		'term life',
		'whole life',
		'universal life',
		'group life',
	],
	vehicle: [
		'car',
		'cars',
		'truck',
		'trucks',
		'vehicle',
		'vehicles',
		'suv',
		'van',
		'minivan',
		'motorcycle',
		'boat',
		'rv',
	],
	crypto: [
		'crypto',
		'cryptocurrency',
		'bitcoin',
		'btc',
		'ethereum',
		'eth',
		'hardware wallet',
		'cold wallet',
		'seed phrase',
		'nft',
	],
	// Deliberately no bare "property": users write "Community Property" to mean marital ownership,
	// not real estate.
	real_property: [
		'home',
		'homes',
		'homestead',
		'house',
		'residence',
		'condo',
		'condominium',
		'townhouse',
		'townhome',
		'duplex',
		'apartment',
		'real estate',
		'rental',
		'rental property',
		'investment property',
		'land',
		'acreage',
		'farm',
		'lot',
	],
};

/**
 * Brand names, which only hint at a category. Deliberately conservative: a wrong hint is worse
 * than no hint, and anything unmatched still shows in the full list.
 */
const INSTITUTION_KEYWORDS: Record<FundingAssetCategory, string[]> = {
	bank: [
		'chase',
		'bank of america',
		'wells fargo',
		'citibank',
		'citi',
		'capital one',
		'ally',
		'usaa',
		'navy federal',
		'pnc',
		'truist',
		'td bank',
		'huntington',
		'regions bank',
		'fifth third',
		'synchrony',
		'marcus',
		'chime',
		'university federal',
		'amplify',
	],
	brokerage: [
		'schwab',
		'fidelity',
		'vanguard',
		'robinhood',
		'etrade',
		'e-trade',
		'e*trade',
		'ameritrade',
		'merrill',
		'webull',
		'sofi',
		'betterment',
		'wealthfront',
		'interactive brokers',
		'stash',
		'acorns',
	],
	employer_plan: ['netbenefits', 'empower retirement', 'voya', 'tiaa', 'alight'],
	life_insurance: [
		'metlife',
		'prudential',
		'northwestern mutual',
		'new york life',
		'massmutual',
		'mass mutual',
		'guardian life',
		'lincoln financial',
		'pacific life',
		'transamerica',
		'aflac',
		'globe life',
		'primerica',
	],
	ira: [],
	vehicle: [
		'toyota',
		'honda',
		'ford',
		'chevrolet',
		'chevy',
		'tesla',
		'nissan',
		'bmw',
		'mercedes',
		'lexus',
		'hyundai',
		'kia',
		'subaru',
		'jeep',
	],
	crypto: [
		'coinbase',
		'binance',
		'kraken',
		'gemini',
		'metamask',
		'ledger',
		'trezor',
		'blockfi',
		'crypto.com',
	],
	real_property: [],
};

/**
 * Word-ish boundaries rather than `\b`, because several keywords end in punctuation — `\b` after
 * the ")" in "401(k)" can never match.
 */
function buildPattern(words: string[]): RegExp | null {
	if (words.length === 0) return null;
	const alternation = words
		.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.sort((a, b) => b.length - a.length)
		.join('|');
	return new RegExp(`(?<![a-z0-9])(?:${alternation})(?![a-z0-9])`, 'i');
}

const ACCOUNT_TYPE_PATTERNS = new Map<FundingAssetCategory, RegExp | null>(
	CATEGORIES.map((c) => [c, buildPattern(ACCOUNT_TYPE_KEYWORDS[c])]),
);
const INSTITUTION_PATTERNS = new Map<FundingAssetCategory, RegExp | null>(
	CATEGORIES.map((c) => [c, buildPattern(INSTITUTION_KEYWORDS[c])]),
);

function matchAgainst(
	patterns: Map<FundingAssetCategory, RegExp | null>,
	text: string,
): FundingAssetCategory[] {
	return CATEGORIES.filter((c) => patterns.get(c)?.test(text));
}

/** Categories an asset description might belong to. Empty when nothing matches. */
export function categorizeAsset(name: string): FundingAssetCategory[] {
	const text = name.trim();
	if (!text) return [];
	const byAccountType = matchAgainst(ACCOUNT_TYPE_PATTERNS, text);
	if (byAccountType.length > 0) return byAccountType;
	return matchAgainst(INSTITUTION_PATTERNS, text);
}

function ownerLabel(spouse: string | undefined): ListedAsset['owner'] {
	if (spouse === 'husband') return 'Husband';
	if (spouse === 'wife') return 'Wife';
	if (spouse === '50-50') return '50/50';
	return null;
}

function isAssetRow(value: unknown): value is AssetAllocationEntry | HebaAssetEntry {
	return typeof value === 'object' && value !== null && 'assetName' in value;
}

/**
 * Read the intake asset list out of `trust.responses`. Users take one of two ownership paths, so
 * we prefer the list matching the path they chose and fall back to whichever list has entries —
 * a user who switched paths mid-intake can leave data behind in the other one.
 */
export function collectListedAssets(
	responseRows: { id: string; response: unknown }[] | null | undefined,
): ListedAsset[] {
	if (!responseRows?.length) return [];

	const byId = new Map(responseRows.map((r) => [r.id, r.response]));
	const asRows = (value: unknown) => (Array.isArray(value) ? value.filter(isAssetRow) : []);
	const allocation = asRows(byId.get('assets'));
	const heba = asRows(byId.get('heba-assets'));

	const ownership = byId.get('ownership-allocation');
	let rows = ownership === 'heba' ? heba : ownership === 'assets' ? allocation : [];
	if (rows.length === 0) rows = allocation.length > 0 ? allocation : heba;

	const seen = new Set<string>();
	const assets: ListedAsset[] = [];
	for (const row of rows) {
		const name = (row.assetName ?? '').trim();
		if (!name) continue;
		const accountId = (row.accountId ?? '').trim();
		const dedupeKey = `${name.toLowerCase()}|${accountId.toLowerCase()}`;
		if (seen.has(dedupeKey)) continue;
		seen.add(dedupeKey);
		assets.push({
			name,
			accountId: accountId || null,
			owner: ownerLabel((row as AssetAllocationEntry).spouse),
			categories: categorizeAsset(name),
		});
	}
	return assets;
}

/** Assets whose categories overlap the ones a card covers. */
export function assetsForCategories(
	assets: ListedAsset[],
	categories: FundingAssetCategory[] | undefined,
): ListedAsset[] {
	if (!categories?.length) return [];
	return assets.filter((a) => a.categories.some((c) => categories.includes(c)));
}
