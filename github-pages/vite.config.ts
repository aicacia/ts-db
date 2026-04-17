import path from 'path';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const libraryRoot = new URL('..', import.meta.url).pathname;

const alias = [
	{
		find: /^@aicacia\/db\/svelte$/,
		replacement: path.resolve(libraryRoot, 'src/svelte/index.svelte.ts')
	},
	{ find: /^@aicacia\/db$/, replacement: path.resolve(libraryRoot, 'src/index.ts') }
];

console.log('vite alias config', alias);

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	resolve: {
		alias
	},
	server: {
		fs: {
			allow: [libraryRoot]
		}
	}
});
