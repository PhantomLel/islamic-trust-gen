import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: {
		// Lets the dev server answer for the law firm domain so host-based
		// rerouting (src/hooks.ts) can be tested locally.
		allowedHosts: [
			'mcdanielestateplanning.com',
			'www.mcdanielestateplanning.com',
			'freemuslimwill.org',
			'www.freemuslimwill.org',
			'localhost',
			'127.0.0.1',
			'muslimlegacyplanning.com',
			'www.muslimlegacyplanning.com',
		],
	},
	test: {
		include: ['src/**/*.test.ts'],
		alias: {
			'$lib': new URL('./src/lib', import.meta.url).pathname,
		},
	},
});
