import { describe, expect, it } from 'vitest';
import { assetsForCategories, categorizeAsset, collectListedAssets } from './assets';

describe('funding asset reference', () => {
	it('reads the asset-allocation list with owners and account ids', () => {
		const assets = collectListedAssets([
			{ id: 'ownership-allocation', response: 'assets' },
			{
				id: 'assets',
				response: [
					{ assetName: 'Primary home', accountId: '', spouse: '50-50' },
					{ assetName: 'Chase checking', accountId: '4821', spouse: 'husband' },
					{ assetName: '', accountId: '999', spouse: 'wife' },
				],
			},
		]);

		expect(assets).toHaveLength(2);
		expect(assets[0]).toMatchObject({ name: 'Primary home', accountId: null, owner: '50/50' });
		expect(assets[1]).toMatchObject({ name: 'Chase checking', accountId: '4821', owner: 'Husband' });
	});

	it('reads the heba list and leaves owner unset', () => {
		const assets = collectListedAssets([
			{ id: 'ownership-allocation', response: 'heba' },
			{
				id: 'heba-assets',
				response: [{ assetName: 'Fidelity IRA', accountId: '0093' }],
			},
		]);
		expect(assets).toEqual([
			{ name: 'Fidelity IRA', accountId: '0093', owner: null, categories: ['ira'] },
		]);
	});

	it('falls back to whichever list has entries when the path is unclear', () => {
		const assets = collectListedAssets([
			{ id: 'heba-assets', response: [{ assetName: 'Ally savings' }] },
		]);
		expect(assets.map((a) => a.name)).toEqual(['Ally savings']);
	});

	it('drops duplicates and tolerates missing or malformed responses', () => {
		expect(collectListedAssets(null)).toEqual([]);
		expect(collectListedAssets([])).toEqual([]);
		expect(collectListedAssets([{ id: 'assets', response: 'not an array' }])).toEqual([]);
		expect(collectListedAssets([{ id: 'assets', response: [{ nope: true }] }])).toEqual([]);

		const deduped = collectListedAssets([
			{
				id: 'heba-assets',
				response: [
					{ assetName: 'Chase checking', accountId: '4821' },
					{ assetName: 'chase checking', accountId: '4821' },
				],
			},
		]);
		expect(deduped).toHaveLength(1);
	});

	it('lets account type beat brand name', () => {
		expect(categorizeAsset('Fidelity IRA')).toEqual(['ira']);
		expect(categorizeAsset('Fidelity 401(k)')).toEqual(['employer_plan']);
		expect(categorizeAsset('Fidelity brokerage')).toEqual(['brokerage']);
		expect(categorizeAsset('Fidelity')).toEqual(['brokerage']);
	});

	it('categorizes the account types users actually type', () => {
		expect(categorizeAsset('Chase checking')).toEqual(['bank']);
		expect(categorizeAsset('Navy Federal credit union savings')).toEqual(['bank']);
		expect(categorizeAsset('Ahmed 403b through work')).toEqual(['employer_plan']);
		expect(categorizeAsset('TSP')).toEqual(['employer_plan']);
		expect(categorizeAsset('Roth')).toEqual(['ira']);
		expect(categorizeAsset('Term life policy')).toEqual(['life_insurance']);
		expect(categorizeAsset('Coinbase')).toEqual(['crypto']);
		expect(categorizeAsset('2019 Toyota Camry')).toEqual(['vehicle']);
		expect(categorizeAsset('Primary home')).toEqual(['real_property']);
		expect(categorizeAsset('Rental property in Dallas')).toEqual(['real_property']);
	});

	it('handles the phrasings real users typed', () => {
		expect(categorizeAsset('Bank Accounts')).toEqual(['bank']);
		expect(categorizeAsset('Saving Account - Asma')).toEqual(['bank']);
		expect(categorizeAsset('Investment - Asma')).toEqual(['brokerage']);
		expect(categorizeAsset('Investor Checking')).toEqual(['bank']);
		expect(categorizeAsset('17138 N. Eldridge Checking Acct')).toEqual(['bank']);
		expect(categorizeAsset('Deema 401(a)')).toEqual(['employer_plan']);
		expect(categorizeAsset('401 K')).toEqual(['employer_plan']);
		expect(categorizeAsset('Deema 457')).toEqual(['employer_plan']);
		expect(categorizeAsset('Vehicles')).toEqual(['vehicle']);
		expect(categorizeAsset('Rollver IRA')).toEqual(['ira']);
	});

	it('shows a generic retirement account under both retirement steps', () => {
		expect(categorizeAsset('Retirement accounts')).toEqual(['employer_plan', 'ira']);
		expect(categorizeAsset('Teacher Retirement System (TRS) Retirement Account')).toEqual([
			'employer_plan',
			'ira',
		]);
		expect(categorizeAsset('Stocks/ Crypto')).toEqual(['brokerage', 'crypto']);
	});

	it('does not read marital ownership wording as real estate', () => {
		expect(categorizeAsset('Community Property')).toEqual([]);
		expect(categorizeAsset('Primary Home')).toEqual(['real_property']);
	});

	it('does not match keywords buried inside other words', () => {
		expect(categorizeAsset('Amira college fund')).toEqual([]);
		expect(categorizeAsset('Bethany trust gift')).toEqual([]);
		expect(categorizeAsset('Scarborough holdings')).toEqual([]);
	});

	it('returns nothing rather than guessing on opaque descriptions', () => {
		expect(categorizeAsset('Account ending 4821')).toEqual([]);
		expect(categorizeAsset('Dad’s gift')).toEqual([]);
		expect(categorizeAsset('   ')).toEqual([]);
	});

	it('matches a card covering several categories', () => {
		const assets = collectListedAssets([
			{
				id: 'heba-assets',
				response: [
					{ assetName: 'Chase checking' },
					{ assetName: 'Schwab brokerage' },
					{ assetName: 'Fidelity IRA' },
					{ assetName: 'Unlabeled account' },
				],
			},
		]);

		expect(assetsForCategories(assets, ['bank', 'brokerage']).map((a) => a.name)).toEqual([
			'Chase checking',
			'Schwab brokerage',
		]);
		expect(assetsForCategories(assets, ['ira']).map((a) => a.name)).toEqual(['Fidelity IRA']);
		expect(assetsForCategories(assets, [])).toEqual([]);
		expect(assetsForCategories(assets, undefined)).toEqual([]);
	});
});
