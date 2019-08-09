import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

import pkg from './package.json';

import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const plugins = [
    resolve(),
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
    livereload({
        watch: ['dist', 'examples']
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
