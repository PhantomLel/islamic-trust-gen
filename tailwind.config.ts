import type { Config } from 'tailwindcss';
import { withUt } from 'uploadthing/tw';

const config: Config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {},
	},
	plugins: [],
};

export default withUt(config);
