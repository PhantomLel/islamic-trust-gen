/**
 * Lifecycle support resources surfaced before chat rollout (KB rollout phases).
 */
import { webinarRegistrationUrl, webinarReplayUrl, fundingBookingUrl } from '$lib/funding/content';
import { consultationBookingUrl } from '$lib/config';

export const HELP_LIFECYCLE_RESOURCES = [
	{
		id: 'webinar-live',
		title: 'Live funding webinar',
		description: 'Walkthrough of signing, funding, and next steps after your trust is approved.',
		url: webinarRegistrationUrl,
		phase: 'post_approval',
	},
	{
		id: 'webinar-replay',
		title: 'Webinar replay',
		description: 'On-demand replay if you missed the live session.',
		url: webinarReplayUrl,
		phase: 'post_approval',
	},
	{
		id: 'funding-consult',
		title: 'Funding consultation',
		description: 'Book time with the team for account-specific funding questions.',
		url: fundingBookingUrl,
		phase: 'funding',
	},
	{
		id: 'estate-consult',
		title: 'Estate planning consultation',
		description: 'For complex estate, tax, or blended-family situations before or during intake.',
		url: consultationBookingUrl,
		phase: 'intake',
	},
] as const;
