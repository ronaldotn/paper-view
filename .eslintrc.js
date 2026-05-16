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
	plugins: ["@typescript-eslint", "security"],
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
		"security/detect-possible-timing-attacks": "warn",
		"security/detect-eval-with-expression": "error",
		"security/detect-no-csrf-before-method-override": "warn",
		"security/detect-non-literal-fs-filename": "warn",
		"security/detect-non-literal-regexp": "warn",
		"security/detect-non-literal-require": "warn",
		"security/detect-object-injection": "warn",
		"security/detect-pseudoRandomBytes": "warn",
		"security/detect-unsafe-regex": "warn",
		"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
		"no-undef": "off",
		"no-redeclare": "off",
		"no-dupe-keys": "off",
		"no-empty": "off"
	},
	ignorePatterns: ["dist/", "lib/", "node_modules/", "*.d.ts"]
};
