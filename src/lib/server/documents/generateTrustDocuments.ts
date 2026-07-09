import { renderJointTrust, type RenderedDocument } from './renderJointTrust';
import { renderPourOverWill } from './renderPourOverWill';

type TrustLike = Parameters<typeof renderJointTrust>[0];

export type GeneratedTrustDocuments = {
	jointTrust: RenderedDocument;
	pourOverWillHusband: RenderedDocument;
	pourOverWillWife: RenderedDocument;
};

/** Render the joint trust and both spouse pour-over wills from the same responses. */
export async function renderAllTrustDocuments(trust: TrustLike): Promise<GeneratedTrustDocuments> {
	const [jointTrust, pourOverWillHusband, pourOverWillWife] = await Promise.all([
		renderJointTrust(trust),
		renderPourOverWill(trust, 'husband'),
		renderPourOverWill(trust, 'wife'),
	]);

	return { jointTrust, pourOverWillHusband, pourOverWillWife };
}
