module.exports = {
	testMatch: ['**/*.test.{js,ts}'],
	moduleFileExtensions: ['ts', 'js', 'json', 'node'],
	transform: {
		'^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.js' }],
	},
	testEnvironment: 'jsdom',
}
