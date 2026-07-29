import { env } from '$env/dynamic/private';
import { replyToEmail as defaultReplyToEmail } from '$lib/config';

/**
 * Reply-to address for marketing emails (ticket A5). Wired from `REPLY_TO_EMAIL`
 * so it can be changed per environment without a deploy; falls back to the
 * repo default so local/dev setups without the env var still work.
 */
export const replyToEmail = env.REPLY_TO_EMAIL?.trim() || defaultReplyToEmail;
