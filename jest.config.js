module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	roots: ['<rootDir>/ts'],
	testMatch: ['<rootDir>/ts/testing/**/*_test.ts'],
	collectCoverageFrom: ['<rootDir>/ts/**/*.ts'],
	coverageReporters: ['html'],
	silent: true,
}
