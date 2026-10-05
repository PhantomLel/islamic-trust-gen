/**
 * Master switch for drip (marketing) sequences.
 *
 * Spec v3 §4.4 / plan Phase 3: the drip templates under
 * `src/lib/server/emails/drip/**` carry the old product name and "self-service"
 * language, and the marketing copy has to come from Leonard. Until he supplies
 * it, no new lead is enrolled and `processDueEmails` sends nothing.
 *
 * Template files stay in the repo. Existing `marketing_lead` rows are untouched.
 * Service mail (document delivery, payment, signing, booking reminders, funding
 * reminders) does not go through this module and is not affected.
 */
export const DRIP_SENDING_ENABLED = false;
