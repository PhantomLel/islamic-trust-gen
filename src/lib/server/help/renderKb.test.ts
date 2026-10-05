import { describe, expect, it } from 'vitest';
import { renderKbText } from './renderKb';
import { productName, productNameShort } from '$lib/config';

describe('renderKbText', () => {
	it('substitutes product tokens and legacy GoodTree naming', () => {
		expect(renderKbText('Use {{productName}} today.')).toBe(`Use ${productName} today.`);
		expect(renderKbText('Try GoodTree for funding.')).toContain(productNameShort);
	});
});
