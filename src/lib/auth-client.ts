import { createAuthClient } from 'better-auth/svelte';
import { magicLinkClient, adminClient, twoFactorClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [
		magicLinkClient(),
		adminClient(),
		twoFactorClient({
			onTwoFactorRedirect() {
				window.location.href = '/login/two-factor';
			},
		}),
	],
});
