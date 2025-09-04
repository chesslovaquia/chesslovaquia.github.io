import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		silent: true,
		include: ['ts/testing/**/*_test.ts'],
		exclude: [
			'node_modules/**',
			'public/**',
			'js/**',
		],
	},
});
