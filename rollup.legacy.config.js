import babel from 'rollup-plugin-babel';
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
	}),
	babel({
		exclude: 'node_modules/**',
		runtimeHelpers: true,
		presets: [
			[
				'@babel/env',
				{
					modules: 'false',
					targets: {
						browsers: '> 1%, IE 11, not op_mini all, not dead',
						node: 8
					},
					useBuiltIns: 'usage',
					corejs: 2
				}
			]
		]
	}),
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
