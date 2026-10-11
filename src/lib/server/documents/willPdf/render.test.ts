import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildWillPdfContext } from './context';
import { buildSheetsDefinition, buildWillDefinition } from './definition';
import { render, renderDefinition } from './render';

const caResponses = [
	{ id: 'state', response: 'CA' },
	{ id: 'county', response: 'Alameda' },
	{ id: 'full_legal_name', response: 'Amīné ʿAlī' },
	{ id: 'address', response: { street: '1 Oak St', unit: '', city: 'Oakland', zip: '94601' } },
	{ id: 'gender', response: 'Male' },
	{ id: 'marital_status', response: 'Single' },
	{ id: 'father_alive', response: true },
	{ id: 'father_name', response: 'Yusuf Khan' },
	{ id: 'mother_alive', response: true },
	{ id: 'mother_name', response: 'Amina Khan' },
	{
		id: 'heirs',
		response: {
			verified: true,
			namedHeirs: [
				{
					heirType: 'father',
					label: 'Father',
					count: 1,
					names: ['Yusuf Khan'],
					perPersonShare: { numerator: 2, denominator: 3 },
				},
				{
					heirType: 'mother',
					label: 'Mother',
					count: 1,
					names: ['Amina Khan'],
					perPersonShare: { numerator: 1, denominator: 3 },
				},
			],
		},
	},
	{ id: 'minor_children', response: false },
	{
		id: 'executors',
		response: [
			{ fullName: 'Sumayya Ahmed', relationship: 'sister', contact: '' },
			{ fullName: 'Azzahra Malik', relationship: 'sister', contact: '' },
		],
	},
	{ id: 'charity_interest', response: 'no' },
];

beforeEach(() => {
	vi.stubEnv('ORIGIN', 'http://localhost:5173');
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) => {
			const file = String(url).split('/').pop() ?? '';
			const buf = readFileSync(join(process.cwd(), 'static/fonts', file));
			return new Response(buf);
		}),
	);
});

describe('render will PDF', () => {
	it('returns a merged PDF whose page count is the will plus the sheets and whose metadata has a creation date', async () => {
		const will = { id: 42, responses: caResponses };
		const ctx = buildWillPdfContext(will);
		const willBuffer = await renderDefinition(buildWillDefinition(ctx));
		const sheetBuffer = await renderDefinition(buildSheetsDefinition(ctx));
		const { buffer } = await render(will);

		expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
		const [willDoc, sheetDoc, merged] = await Promise.all([
			PDFDocument.load(willBuffer),
			PDFDocument.load(sheetBuffer),
			PDFDocument.load(buffer),
		]);
		expect(merged.getPageCount()).toBe(willDoc.getPageCount() + sheetDoc.getPageCount());
		expect(merged.getCreationDate()).toBeInstanceOf(Date);
	});
});
