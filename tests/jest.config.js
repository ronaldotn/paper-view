module.exports = {
	testMatch: ['**/*.test.js'],
	transform: {
		'^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.js' }],
	},
	testEnvironment: 'jsdom',
}
