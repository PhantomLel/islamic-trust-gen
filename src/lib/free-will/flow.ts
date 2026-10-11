import { isWillAvailableState } from './config';
import type { WillResponses } from './config';
import { isEstateFullyDistributed, isMaritalStatusNotHandled } from './logic';
import type { NoticeRecord } from './acknowledgment';

export const FLOW_NOTICE_VERSION = 'fw-notice-2026-10-03';

export type FlowPhase =
	| 'welcome'
	| 'notice'
	| 'questions'
	| 'warning'
	| 'not_handled'
	| 'preview'
	| 'delivery'
	| 'complete';

export const B6_1_NOTICE_COPY =
	'This automated form tool is not a substitute for advice from an attorney. No attorney reviews your answers or resulting document. Using it does not, by itself, engage the firm to represent you. It does not determine that this form meets your needs.';

export const B6_6_WARNING_COPY =
	'A will may not control retirement accounts, life insurance, joint accounts, accounts with a payable-on-death or transfer-on-death beneficiary, trust assets, or property with survivorship rights. In Texas and California, your will controls only your own share of community property.';

export const FREE_WILL_PRIVACY_LINE =
	'We protect your information and use it as described in our Privacy Policy.';

export function isNoticeComplete(notice: NoticeRecord | null | undefined): boolean {
	return notice?.version === FLOW_NOTICE_VERSION && !!notice.acceptedAt;
}

export function maritalStatusOptions(stateCode: string | undefined | null): string[] {
	const base = [
		'Married',
		'Married, separated but not divorced',
		'Single',
		'Widowed',
		'Divorced',
	];
	if (stateCode === 'CA') {
		return [
			'Married',
			'Married, separated but not divorced',
			'Registered domestic partnership',
			'Single',
			'Widowed',
			'Divorced',
		];
	}
	return base;
}

export function shouldShowWarningAfterState(responses: WillResponses): boolean {
	return isWillAvailableState(responses['state'] as string | undefined);
}

export function nextPhaseAfterStateAnswer(responses: WillResponses): FlowPhase {
	return shouldShowWarningAfterState(responses) ? 'warning' : 'questions';
}

export function resolvesToNotHandled(responses: WillResponses): boolean {
	if (isMaritalStatusNotHandled(responses)) return true;
	const heirs = responses['heirs'];
	if (heirs && typeof heirs === 'object' && 'verified' in heirs && (heirs as { verified?: boolean }).verified) {
		return !isEstateFullyDistributed(heirs as import('$lib/config').HeirsCalculatorResponse);
	}
	return false;
}

/** High-level phases the user passes through (excluding welcome/complete). */
export function flowPhaseOrder(responses: WillResponses, noticeAccepted: boolean): FlowPhase[] {
	const phases: FlowPhase[] = ['welcome', 'notice'];
	if (!noticeAccepted) return phases;
	phases.push('questions');
	if (shouldShowWarningAfterState(responses)) phases.push('warning');
	if (resolvesToNotHandled(responses)) phases.push('not_handled');
	phases.push('preview', 'delivery');
	return phases;
}
