import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import copy from 'rollup-plugin-copy';

import pkg from './package.json';

const plugins = [
	resolve(),
	commonjs(),
	json(),
	copy({
		targets: [
			{ src: './examples/assets/styles/**/*', dest: './dist/css' }
		]
	})
];

export default [
	// browser-friendly UMD build
	{
		input: pkg.main,
		output: {
			name: 'PaperView',
			file: pkg.browser.replace(".js", ".legacy.js"),
			format: 'umd'
		},
		plugins: plugins
	},
	{
		input: "./lib/polyfill/polyfill.js",
		output: {
			name: 'PagerViewPolyfill',
			file: "./dist/paperview.legacy.polyfill.js",
			format: 'umd'
		},
		plugins: plugins
	}
];
