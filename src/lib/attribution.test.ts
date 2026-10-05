import { describe, expect, it } from 'vitest';
import {
	ATTRIBUTION_CODES,
	resolveAttributionCode,
	validateAttributionCode,
	withAttributionParam
} from './attribution';

describe('attribution codes', () => {
	it('ships with an empty map, so no code is stored until Leonard supplies the list', () => {
		expect(Object.keys(ATTRIBUTION_CODES)).toHaveLength(0);
		expect(resolveAttributionCode('anything')).toBeNull();
		expect(validateAttributionCode('mq1')).toBeNull();
	});

	const codes = { 'masjid-hamza-qr': 'mh1', 'spring-radio': 'rd2' } as const;

	it('maps an incoming campaign value to its short code, case-insensitively', () => {
		expect(resolveAttributionCode('Masjid-Hamza-QR', codes)).toBe('mh1');
		expect(resolveAttributionCode(' spring-radio ', codes)).toBe('rd2');
	});

	it('returns null for unknown, empty, or prototype-key values and never echoes the raw string', () => {
		expect(resolveAttributionCode('utm_campaign=evil&email=a@b.c', codes)).toBeNull();
		expect(resolveAttributionCode('', codes)).toBeNull();
		expect(resolveAttributionCode(null, codes)).toBeNull();
		expect(resolveAttributionCode('constructor', codes)).toBeNull();
		expect(resolveAttributionCode('__proto__', codes)).toBeNull();
	});

	it('accepts a share link that carries the short code itself', () => {
		expect(resolveAttributionCode('mh1', codes)).toBe('mh1');
	});

	it('only honors a cookie value that is still a known code', () => {
		expect(validateAttributionCode('mh1', codes)).toBe('mh1');
		expect(validateAttributionCode('hand-edited', codes)).toBeNull();
	});

	it('appends the parameter to a share link only when a code exists', () => {
		expect(withAttributionParam('https://x.test/free-islamic-will', null)).toBe(
			'https://x.test/free-islamic-will'
		);
		expect(withAttributionParam('https://x.test/free-islamic-will', 'mh1')).toBe(
			'https://x.test/free-islamic-will?utm_campaign=mh1'
		);
	});
});
