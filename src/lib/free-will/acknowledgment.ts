import { FLOW_NOTICE_VERSION } from './flow';

export { FLOW_NOTICE_VERSION as ACKNOWLEDGMENT_VERSION };

/** B6.1 counsel notice stored on the free_will row (replaces the old checkbox shape). */
export type NoticeRecord = {
	version: string;
	/** ISO timestamp when the user tapped I understand. */
	acceptedAt: string;
};

/** @deprecated Legacy checkbox payload; only read for old rows. */
export type AcknowledgmentCheckboxes = {
	selfHelp: boolean;
	communityProperty: boolean;
};

/** Stored in `free_will.acknowledgmentData`. */
export type AcknowledgmentData = NoticeRecord | LegacyAcknowledgmentData;

type LegacyAcknowledgmentData = {
	version: string;
	clientTimestamp: string;
	checkboxes: AcknowledgmentCheckboxes;
};

function isLegacyAcknowledgment(data: AcknowledgmentData): data is LegacyAcknowledgmentData {
	return 'checkboxes' in data;
}

export function noticeFromAcknowledgmentData(
	data: AcknowledgmentData | null | undefined,
): NoticeRecord | null {
	if (!data) return null;
	if (isLegacyAcknowledgment(data)) {
		if (!data.checkboxes.selfHelp) return null;
		return {
			version: FLOW_NOTICE_VERSION,
			acceptedAt: data.clientTimestamp,
		};
	}
	return data.version === FLOW_NOTICE_VERSION ? data : null;
}

export function isAcknowledgmentComplete(
	_data: import('./config').WillResponses,
	acknowledgmentData: AcknowledgmentData | null | undefined,
): boolean {
	const notice = noticeFromAcknowledgmentData(acknowledgmentData);
	return notice?.version === FLOW_NOTICE_VERSION && !!notice.acceptedAt;
}
