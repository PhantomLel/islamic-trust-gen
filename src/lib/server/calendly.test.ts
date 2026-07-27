import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import { verifyCalendlyWebhookSignature } from './calendly';

describe('verifyCalendlyWebhookSignature', () => {
	it('accepts a valid signature', () => {
		const signingKey = 'test-signing-key';
		const rawBody = JSON.stringify({ event: 'invitee.created', payload: { email: 'a@b.com' } });
		const ts = Math.floor(Date.now() / 1000);
		const sig = createHmac('sha256', signingKey).update(`${ts}.${rawBody}`).digest('hex');

		expect(
			verifyCalendlyWebhookSignature({
				signatureHeader: `t=${ts},v1=${sig}`,
				rawBody,
				signingKey,
			})
		).toBe(true);
	});

	it('rejects an invalid signature', () => {
		expect(
			verifyCalendlyWebhookSignature({
				signatureHeader: 't=123,v1=deadbeef',
				rawBody: '{}',
				signingKey: 'test-signing-key',
			})
		).toBe(false);
	});
});
