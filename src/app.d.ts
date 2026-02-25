import type { Session } from 'better-auth/minimal';
import type { UserWithRole } from 'better-auth/client/plugins';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user?: UserWithRole;
			session?: Session;
		}
	}
}

export {};
