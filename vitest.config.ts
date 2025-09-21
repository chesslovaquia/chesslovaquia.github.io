import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		setupFiles: 'ts/testing/testing-setup.ts',
		silent: 'passed-only',
		pool: 'vmThreads',
		include: ['ts/testing/**/*_test.ts'],
		exclude: [
			'node_modules/**',
			'public/**',
			'js/**',
		],
		coverage: {
			provider: 'istanbul',
			clean: true,
			reporter: ['html'],
			reportOnFailure: true,
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
