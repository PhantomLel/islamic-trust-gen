import { renderAcknowledgmentOfOwnershipElection } from './renderAcknowledgmentOfOwnershipElection';
import { renderCertificationOfTrust } from './renderCertificationOfTrust';
import { renderJointTrust, type RenderedDocument } from './renderJointTrust';
import { renderPourOverWill } from './renderPourOverWill';

type TrustLike = Parameters<typeof renderJointTrust>[0];

export type GeneratedTrustDocuments = {
	jointTrust: RenderedDocument;
	pourOverWillHusband: RenderedDocument;
	pourOverWillWife: RenderedDocument;
	acknowledgmentOfOwnershipElection: RenderedDocument;
	certificationOfTrust: RenderedDocument;
};

/** Render all trust-package documents from the same questionnaire responses. */
export async function renderAllTrustDocuments(trust: TrustLike): Promise<GeneratedTrustDocuments> {
	const [
		jointTrust,
		pourOverWillHusband,
		pourOverWillWife,
		acknowledgmentOfOwnershipElection,
		certificationOfTrust,
	] = await Promise.all([
		renderJointTrust(trust),
		renderPourOverWill(trust, 'husband'),
		renderPourOverWill(trust, 'wife'),
		renderAcknowledgmentOfOwnershipElection(trust),
		renderCertificationOfTrust(trust),
	]);

	return {
		jointTrust,
		pourOverWillHusband,
		pourOverWillWife,
		acknowledgmentOfOwnershipElection,
		certificationOfTrust,
	};
}
