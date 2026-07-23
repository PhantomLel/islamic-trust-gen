import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPourOverWillContext } from './buildPourOverWillContext';
import { preprocessPourOverXml, renderPourOverWill } from './renderPourOverWill';

const pourOverTemplate = readFileSync(
	join(process.cwd(), 'static', 'templates', 'pour_over_will_texas.docx'),
);

beforeEach(() => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) => {
			if (url.includes('pour_over_will_texas.docx')) {
				return new Response(pourOverTemplate, { status: 200 });
			}
			throw new Error(`Unexpected fetch: ${url}`);
		}),
	);
});

const sampleTrust = {
	id: 1,
	responses: [
		{
			id: 'husband-data',
			response: { name: 'Ahmed Khan', dob: '1985-01-01', county: 'Harris' },
		},
		{
			id: 'wife-data',
			response: { name: 'Sarah Khan', dob: '1987-02-02', county: 'Harris' },
		},
		{ id: 'trust-name', response: 'The Khan Family Trust' },
		{
			id: 'husband-heirs',
			response: {
				namedHeirs: [
					{
						heirType: 'son',
						label: 'Son',
						count: 2,
						names: ['Ali Khan', 'Omar Khan'],
						perPersonShare: { numerator: 1, denominator: 2 },
						totalShare: { numerator: 1, denominator: 1 },
					},
				],
			},
		},
		{
			id: 'wife-heirs',
			response: {
				namedHeirs: [
					{
						heirType: 'daughter',
						label: 'Daughter',
						count: 1,
						names: ['Layla Khan'],
						perPersonShare: { numerator: 1, denominator: 1 },
						totalShare: { numerator: 1, denominator: 1 },
					},
				],
			},
		},
		{
			id: 'husband-personal-representatives',
			response: [
				{ fullName: 'Yusuf Ali', relationship: 'Brother', contact: '' },
				{ fullName: 'Hassan Ali', relationship: 'Friend', contact: '' },
			],
		},
		{
			id: 'husband-guardians',
			response: [{ fullName: 'Fatima Ali', relationship: 'Sister', contact: '' }],
		},
		{
			id: 'wife-personal-representatives',
			response: [{ fullName: 'Maryam Noor', relationship: 'Sister', contact: '' }],
		},
		{
			id: 'wife-guardians',
			response: [
				{ fullName: 'Aisha Noor', relationship: 'Mother', contact: '' },
				{ fullName: 'Zainab Noor', relationship: 'Sister', contact: '' },
			],
		},
	],
};

describe('buildPourOverWillContext', () => {
	it('builds husband context from spouse-specific responses', () => {
		const ctx = buildPourOverWillContext(sampleTrust, 'husband');

		expect(ctx.fullName).toBe('Ahmed Khan');
		expect(ctx.spouse).toBe('Sarah Khan');
		expect(ctx.county).toBe('Harris');
		expect(ctx.isFemale).toBe(false);
		expect(ctx.hasChildren).toBe(true);
		expect(ctx.trustName).toBe('The Khan Family Trust');
		expect(ctx.children).toEqual(['Ali Khan', 'Omar Khan']);
		expect(ctx.childrenCount).toBe(2);
		expect(ctx.firstRepresentative).toBe('Yusuf Ali');
		expect(ctx.representatives).toEqual(['Hassan Ali']);
		expect(ctx.guardians).toEqual(['Fatima Ali']);
	});

	it('builds wife context from spouse-specific responses', () => {
		const ctx = buildPourOverWillContext(sampleTrust, 'wife');

		expect(ctx.fullName).toBe('Sarah Khan');
		expect(ctx.spouse).toBe('Ahmed Khan');
		expect(ctx.isFemale).toBe(true);
		expect(ctx.children).toEqual(['Layla Khan']);
		expect(ctx.firstRepresentative).toBe('Maryam Noor');
		expect(ctx.representatives).toEqual([]);
		expect(ctx.guardians).toEqual(['Aisha Noor', 'Zainab Noor']);
	});
});

describe('renderPourOverWill', () => {
	it('renders husband and wife pour-over wills without error', async () => {
		const husband = await renderPourOverWill(
			{ ...sampleTrust, user: { name: 'Khan Family' } },
			'husband',
		);
		const wife = await renderPourOverWill(
			{ ...sampleTrust, user: { name: 'Khan Family' } },
			'wife',
		);

		expect(husband.buffer.byteLength).toBeGreaterThan(1000);
		expect(wife.buffer.byteLength).toBeGreaterThan(1000);
		expect(husband.filename).toContain('pour-over-will-husband');
		expect(wife.filename).toContain('pour-over-will-wife');
	});

	it('merges split closing tags in the template XML', () => {
		const xml =
			'{#representatives}{.}{/</w:t></w:r><w:r><w:rPr><w:rtl w:val="0"/></w:rPr><w:t>representatives</w:t></w:r><w:r><w:rPr><w:rtl w:val="0"/></w:rPr><w:t>}';
		expect(preprocessPourOverXml(xml)).toContain('{/representatives}');
	});
});
