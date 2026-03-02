import type { Config } from 'tailwindcss';
import { withUt } from 'uploadthing/tw';

const config: Config = {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/@uploadthing/svelte/dist/**/*.{js,mjs,svelte}',
		'./node_modules/@uploadthing/react/dist/**/*.{js,mjs}'
	],
	theme: {
		extend: {},
	},
	plugins: [],
};

export default withUt(config);
