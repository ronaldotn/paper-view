import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import minify from 'rollup-plugin-babel-minify';
import json from 'rollup-plugin-json';
import copy from 'rollup-plugin-copy';

import pkg from './package.json';

const plugins = [
    resolve(),
    commonjs({
        include: 'node_modules/**'
    }),
    json(),
    copy({
        targets: [
            {src: './examples/assets/styles/**/*', dest: './dist/css'}
        ]
    }),
    minify({
    	comments: false
    })
];

export default [
    // browser-friendly UMD build
    {
        input: pkg.moduleSrc,
        output: {
            name: 'PaperView',
            file: pkg.browser,
            format: 'umd'
        },
        plugins: plugins
    },
    {
        input: pkg.moduleSrc,
        output: {
            name: "PaperViewModule",
            file: "./dist/paperview.esm.js",
            format: 'es'
        },
        plugins: plugins
    },
    {
        input: "./src/polyfill/polyfill.js",
        output: {
            name: 'PaperViewPolyfill',
            file: "./dist/paperview.polyfill.js",
            format: 'umd'
        },
        plugins: plugins
    }
];
