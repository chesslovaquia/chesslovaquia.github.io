import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		include: ['ts/testing/**/*_test.ts'],
		exclude: [
			'node_modules/**',
			'public/**',
			'js/**',
		],
	},
});
