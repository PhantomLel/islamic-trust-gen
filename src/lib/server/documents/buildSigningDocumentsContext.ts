import { type PersonalDataResponse } from '$lib/config';
import {
	FIRST_DEATH_ELECTION_DAYS_PHRASE,
	formatTrustTitleForm,
} from './trustDocumentConstants';

export type SigningDocumentsContext = {
	trustName: string;
	husbandFullName: string;
	wifeFullName: string;
	county: string;
	isHeba: boolean;
	firstDeathElectionDaysPhrase: string;
	trustTitleForm: string;
};

type ResponseEntry = { id: string; response: unknown };

type TrustLike = {
	responses: ResponseEntry[] | null;
};

function getResponse<T = unknown>(trust: TrustLike, id: string): T | undefined {
	const entry = (trust.responses ?? []).find((r) => r.id === id);
	return entry ? (entry.response as T) : undefined;
}

/** Context for T8 (ownership-election acknowledgment) and T9 (certification of trust). */
export function buildSigningDocumentsContext(trust: TrustLike): SigningDocumentsContext {
	const husband = getResponse<PersonalDataResponse>(trust, 'husband-data');
	const wife = getResponse<PersonalDataResponse>(trust, 'wife-data');
	const trustName = getResponse<string>(trust, 'trust-name') ?? '';
	const ownership = getResponse<string>(trust, 'ownership-allocation');

	const husbandFullName = husband?.name ?? '';
	const wifeFullName = wife?.name ?? '';

	return {
		trustName,
		husbandFullName,
		wifeFullName,
		county: husband?.county ?? '',
		isHeba: ownership === 'heba',
		firstDeathElectionDaysPhrase: FIRST_DEATH_ELECTION_DAYS_PHRASE,
		trustTitleForm: formatTrustTitleForm(husbandFullName, wifeFullName, trustName),
	};
}
