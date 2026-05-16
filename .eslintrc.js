module.exports = {
	root: true,
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		node: true
	},
	parser: "@typescript-eslint/parser",
	parserOptions: {
		sourceType: "module",
		ecmaVersion: 9
	},
	plugins: ["@typescript-eslint"],
	extends: [
		"eslint:recommended"
	],
	rules: {
		indent: [
			"error",
			"tab",
			{
				VariableDeclarator: { var: 2, let: 2, const: 3 },
				SwitchCase: 1
			}
		],
		"linebreak-style": "off",
		quotes: [
			"warn",
			"double"
		],
		semi: [
			"error",
			"always"
		],
		"no-console": ["error", { allow: ["warn", "error"] }],
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{ vars: "all", args: "none", ignoreRestSiblings: true }
		],
		"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
		"no-undef": "off",
		"no-redeclare": "off",
		"no-dupe-keys": "off",
		"no-empty": "off"
	},
	ignorePatterns: ["dist/", "lib/", "node_modules/", "*.d.ts"]
};
