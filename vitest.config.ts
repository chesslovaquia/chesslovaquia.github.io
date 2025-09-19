import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		setupFiles: 'ts/testing/testing-setup.ts',
		silent: true,
		include: ['ts/testing/**/*_test.ts'],
		exclude: [
			'node_modules/**',
			'public/**',
			'js/**',
		],
		coverage: {
			provider: 'v8',
			reporter: ['html'],
			reportOnFailuer: true,
			include: ['ts/**/*.ts'],
			exclude: [
				'node_modules/**',
				'public/**',
				'js/**',
				'ts/testing/**',
			],
		},
	},
});
