import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

import pkg from './package.json' with { type: 'json' };

import serve from 'rollup-plugin-serve';

const plugins = [
    resolve({
        browser: true
    }),
    commonjs(),
    json(),
    // globals(),
    // builtins(),
    serve({
        port: 9090,
        contentBase: './',
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Service-Worker-Allowed": "/",
        }
    }),
    babel({
        exclude: 'node_modules/**',
        babelHelpers: 'runtime',
        presets: [
            [
                '@babel/preset-env',
                {
                    modules: false,
                    targets: {
                        browsers: '> 1%, IE 11, not op_mini all, not dead',
                        node: 8
                    },
                    useBuiltIns: 'usage',
                    corejs: 3
                }
            ]
        ],
        plugins: ['@babel/plugin-transform-runtime']
    }),
];

export default [
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
        input: "./src/polyfill/polyfill.js",
        output: {
            name: 'PaperViewPolyfill',
            file: "./dist/paperview.polyfill.js",
            format: 'umd'
        },
        plugins: plugins
    }
];
