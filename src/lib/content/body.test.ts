import { describe, expect, it } from 'vitest';
import { productName } from '$lib/config';
import {
	bodyHasContent,
	bodyLiteralText,
	bodyPlainText,
	literalProductNameWarnings,
	renderBodyHtml,
	safeHref,
	sanitizeDoc,
} from './body';

const doc = (content: unknown[]) => ({ type: 'doc', content });
const p = (...c: unknown[]) => ({ type: 'paragraph', content: c });
const t = (text: string, marks?: unknown[]) => ({ type: 'text', text, ...(marks ? { marks } : {}) });

describe('sanitizeDoc / renderBodyHtml', () => {
	it('renders allowed nodes and marks', () => {
		const html = renderBodyHtml(
			doc([
				{ type: 'heading', attrs: { level: 2 }, content: [t('Why it matters')] },
				p(t('Plain '), t('bold', [{ type: 'bold' }]), t(' and '), t('italic', [{ type: 'italic' }])),
				{ type: 'bulletList', content: [{ type: 'listItem', content: [p(t('one'))] }] },
				{ type: 'blockquote', content: [p(t('quoted'))] },
			]),
		);
		expect(html).toContain('<h2>Why it matters</h2>');
		expect(html).toContain('<strong>bold</strong>');
		expect(html).toContain('<em>italic</em>');
		expect(html).toContain('<ul><li><p>one</p></li></ul>');
		expect(html).toContain('<blockquote><p>quoted</p></blockquote>');
	});

	it('escapes text and drops raw HTML, scripts, iframes, styles and classes', () => {
		const html = renderBodyHtml(
			doc([
				p(t('<script>alert(1)</script>')),
				{ type: 'iframe', attrs: { src: 'https://evil.test' } },
				{ type: 'paragraph', attrs: { class: 'MsoNormal', style: 'color:red' }, content: [t('Word text')] },
				{ type: 'html', content: [t('<b>x</b>')] },
			]),
		);
		expect(html).not.toContain('<script');
		expect(html).toContain('&lt;script&gt;');
		expect(html).not.toContain('iframe');
		expect(html).not.toMatch(/class=|style=|MsoNormal/);
		expect(html).toContain('<p>Word text</p>');
	});

	it('keeps only safe link targets', () => {
		expect(safeHref('https://example.com/a')).toBe('https://example.com/a');
		expect(safeHref('/answers/x')).toBe('/answers/x');
		expect(safeHref('mailto:a@b.com')).toBe('mailto:a@b.com');
		expect(safeHref('javascript:alert(1)')).toBeNull();
		expect(safeHref('data:text/html,hi')).toBeNull();
		expect(safeHref('//evil.test')).toBeNull();
		const html = renderBodyHtml(
			doc([p(t('bad', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]), t('good', [{ type: 'link', attrs: { href: 'https://a.test' } }]))]),
		);
		expect(html).not.toContain('javascript:');
		expect(html).toContain('<a href="https://a.test" rel="noopener noreferrer">good</a>');
	});

	it('limits headings to H2 and H3 because the template owns the H1', () => {
		const html = renderBodyHtml(doc([{ type: 'heading', attrs: { level: 1 }, content: [t('A')] }, { type: 'heading', attrs: { level: 3 }, content: [t('B')] }]));
		expect(html).toContain('<h2>A</h2>');
		expect(html).toContain('<h3>B</h3>');
		expect(html).not.toContain('<h1');
	});

	it('survives garbage input', () => {
		expect(sanitizeDoc(null).type).toBe('doc');
		expect(sanitizeDoc('x').type).toBe('doc');
		expect(sanitizeDoc({ type: 'doc', content: 'nope' }).content?.length).toBe(1);
	});
});

describe('product-name token', () => {
	const withToken = doc([p(t('Start '), { type: 'productName', attrs: { stored: 'Old Name' } }, t(' today.'))]);

	it('substitutes the configured product name at render time and stores no string', () => {
		expect(JSON.stringify(sanitizeDoc(withToken))).not.toContain('Old Name');
		expect(renderBodyHtml(withToken)).toContain(`Start ${productName} today.`);
		expect(renderBodyHtml(withToken, 'Renamed Product')).toContain('Start Renamed Product today.');
		expect(bodyPlainText(withToken)).toContain(productName);
	});

	it('does not count the token as literal text', () => {
		expect(bodyLiteralText(withToken)).not.toContain(productName);
		expect(literalProductNameWarnings(bodyLiteralText(withToken))).toEqual([]);
	});

	it('warns on literal old or full names without rewriting them', () => {
		const typed = doc([p(t('Try the Muslim Legacy Planning Guided Trust or GoodTree or Good Tree.'))]);
		const warnings = literalProductNameWarnings(bodyLiteralText(typed));
		expect(warnings.length).toBe(2);
		expect(renderBodyHtml(typed)).toContain('GoodTree');
	});
});

describe('bodyHasContent', () => {
	it('is false for an empty document', () => {
		expect(bodyHasContent({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(false);
		expect(bodyHasContent(doc([p(t('x'))]))).toBe(true);
	});
});
