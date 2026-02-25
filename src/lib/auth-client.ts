import { createAuthClient } from 'better-auth/svelte';
import { magicLinkClient, adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [magicLinkClient(), adminClient()],
});
